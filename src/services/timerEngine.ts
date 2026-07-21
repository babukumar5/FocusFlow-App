import { TimerMode, FocusSession, SessionMode } from '../types/timer.types';
import { useSettingsStore } from '../store/settingsStore';
import { haptics } from '../utils/haptics';
import {
  beginNotificationOperation,
  cancelAllNotifications,
  isNotificationOperationCurrent,
  NotificationType,
  scheduleExactNotification,
} from './notificationService';
import { getLocalDateString, getISOWeekNumber, getDayName, getMonthName } from '../utils/dateUtils';
import { insertSession, getCompletedSessions } from './db';
import { useActivityStore } from '../store/activityStore';

export interface StoreProxy {
  get: () => any;
  set: (partial: any) => void;
}

export class TimerEngine {
  private store: StoreProxy | null = null;
  private timeoutId: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    // No custom sound initialization — all sounds come from OS notifications
  }

  bindStore(store: StoreProxy) {
    this.store = store;
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────────

  private getDurationForMode(mode: TimerMode): number {
    const settings = useSettingsStore.getState().settings;
    switch (mode) {
      case 'FOCUS': return settings.focusTime * 60;
      case 'BREAK': return settings.shortBreakTime * 60;
      case 'LONG_BREAK': return settings.longBreakTime * 60;
      default: return settings.focusTime * 60;
    }
  }

  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  }

  // ─── Timeout management ───────────────────────────────────────────────────────

  private startTimeout(remainingMs: number) {
    this.stopTimeout();
    this.timeoutId = setTimeout(() => {
      this.handleComplete();
    }, remainingMs);
  }

  private stopTimeout() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  // ─── Notification management ─────────────────────────────────────────────────
  //
  // This is the only timer-side scheduling boundary. It maps the current timer
  // phase to the next meaningful milestone: session start, cycle completion,
  // or final completion. The notification service serializes native calls.

  private async replaceNotifications(
    targetEndTimeMs: number,
    immediate?: NotificationType
  ) {
    const operation = beginNotificationOperation();

    // Cancel first, then validate both the operation and the absolute timer
    // target. A pause, reset, resume, or newer sync invalidates this request.
    await cancelAllNotifications(operation);

    if (!isNotificationOperationCurrent(operation) || !this.store) return;
    const state = this.store.get();

    if (
      state.status !== 'running' ||
      state.targetEndTime !== targetEndTimeMs
    ) return;

    const settings = useSettingsStore.getState().settings;
    if (!settings.browserNotifications) return;

    // A new Focus session announces its start once. Resume and automatic phase
    // transitions omit this argument and therefore remain silent.
    if (immediate) {
      await scheduleExactNotification(immediate, 0, undefined, operation);
      if (!isNotificationOperationCurrent(operation)) return;
    }

    // The next milestone is always the end of the current cycle. During Focus,
    // include its following Break so an OS notification can still fire when JS
    // is suspended. Once Focus transitions to Break in the foreground, this is
    // replaced with the exact Break end time.
    const milestoneTime = state.mode === 'FOCUS'
      ? targetEndTimeMs + this.getDurationForMode('BREAK') * 1000
      : targetEndTimeMs;
    const nextCompleted = state.completedPomodoros + 1;

    if (nextCompleted >= settings.cycles) {
      await scheduleExactNotification('ALL_COMPLETED', milestoneTime, undefined, operation);
    } else {
      await scheduleExactNotification('CYCLE_COMPLETE', milestoneTime, {
        completed: nextCompleted,
      }, operation);
    }
  }

  // ─── State transition handler ─────────────────────────────────────────────────
  //
  // Called when a timer phase reaches 00:00.
  // This is where ALL auto-transitions happen.
  //
  // Rule: State transition FIRST, then notification scheduling.
  //

  private handleComplete(historicalCompletionTimeMs?: number, isCatchUp: boolean = false) {
    if (!this.store) return;
    const state = this.store.get();
    if (state.status !== 'running') return;

    const {
      mode,
      completedPomodoros,
      sessionStartTime,
    } = state;

    const settings = useSettingsStore.getState().settings;

    if (!isCatchUp) {
      haptics.success();
    }

    // ── Build session record ──────────────────────────────────────────────────

    const sessionId = this.generateSessionId();
    const actualCompletionTime = historicalCompletionTimeMs ?? Date.now();
    const now = new Date(actualCompletionTime);
    const durationSecs = this.getDurationForMode(mode);
    const startTime = sessionStartTime
      ? new Date(sessionStartTime)
      : new Date(now.getTime() - durationSecs * 1000);

    const newSession: FocusSession = {
      _id: sessionId,
      user: 'local-user',
      duration: Math.round(durationSecs / 60),
      actualCompletedMinutes: Math.round(durationSecs / 60),
      startTime: startTime.toISOString(),
      endTime: now.toISOString(),
      date: getLocalDateString(startTime),
      day: getDayName(startTime),
      week: getISOWeekNumber(startTime),
      month: getMonthName(startTime),
      year: startTime.getFullYear(),
      mode: mode === 'LONG_BREAK' ? 'long break' : (mode.toLowerCase() as SessionMode),
      completionStatus: 'completed',
      interrupted: false,
      task: null,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    // ── Determine next state ──────────────────────────────────────────────────

    let nextMode: TimerMode = mode;
    let nextCompletedPomodoros = completedPomodoros;
    let autoStart = false;

    if (mode === 'FOCUS') {
      // Focus finished → always auto-start Break
      nextMode = 'BREAK';
      autoStart = true;
    } else {
      // Break finished → increment cycle count
      nextCompletedPomodoros = completedPomodoros + 1;

      if (nextCompletedPomodoros < settings.cycles) {
        // More cycles to go → auto-start next Focus
        nextMode = 'FOCUS';
        autoStart = true;
      } else {
        // All cycles complete → stop
        nextMode = 'FOCUS';
        autoStart = false;
      }
    }

    const nextDuration = this.getDurationForMode(nextMode);

    // ── Persist session ───────────────────────────────────────────────────────

    if (mode === 'FOCUS') {
      insertSession(newSession);
    }

    const updatedSessions = getCompletedSessions();

    // ── STATE TRANSITION (the single source of truth) ─────────────────────────

    this.store.set({
      mode: nextMode,
      status: autoStart ? 'running' : 'idle',
      remainingTime: nextDuration,
      sessionStartTime: autoStart ? actualCompletionTime : null,
      pauseTime: null,
      targetEndTime: autoStart ? actualCompletionTime + nextDuration * 1000 : null,
      completedPomodoros: nextCompletedPomodoros,
      sessions: updatedSessions,
      lastCompletedSessionId: newSession._id,
    });

    // Update Activity system
    useActivityStore.getState().refresh();

    // ── AFTER transition: schedule timer + notification for next phase ────────

    if (autoStart && !isCatchUp) {
      const nowTime = Date.now();
      const nextTarget = actualCompletionTime + nextDuration * 1000;
      const remainingForNext = Math.max(0, nextTarget - nowTime);
      this.startTimeout(remainingForNext);
      // Automatic phase transitions are silent. The notification boundary
      // replaces only the pending cycle milestone for the new phase.
      this.replaceNotifications(nextTarget);
    }
  }

  // ─── Public API ───────────────────────────────────────────────────────────────

  start() {
    if (!this.store) return;
    const { remainingTime, mode, completedPomodoros } = this.store.get();
    const settings = useSettingsStore.getState().settings;

    let nextCompleted = completedPomodoros;
    if (mode === 'FOCUS' && completedPomodoros >= settings.cycles) {
      nextCompleted = 0;
    }

    const freshDuration = this.getDurationForMode(mode);
    const durationToUse = remainingTime > 0 ? remainingTime : freshDuration;
    const now = Date.now();
    const targetEndTime = now + durationToUse * 1000;

    // ── STATE TRANSITION ──────────────────────────────────────────────────────

    this.store.set({
      status: 'running',
      sessionStartTime: now,
      pauseTime: null,
      remainingTime: durationToUse,
      targetEndTime,
      completedPomodoros: nextCompleted,
    });

    haptics.lightTap();
    this.startTimeout(durationToUse * 1000);

    // ── AFTER transition: schedule notification milestones ────────────────────
    // Focus begins with one immediate start message plus one pending cycle-end
    // milestone. Break starts do not announce themselves.
    this.replaceNotifications(
      targetEndTime,
      mode === 'FOCUS' ? 'START_FOCUS' : undefined
    );
  }

  pause() {
    if (!this.store) return;
    const { status, targetEndTime } = this.store.get();
    if (status !== 'running' || targetEndTime === null) return;

    // Stop everything — no notifications, no sounds
    this.stopTimeout();
    cancelAllNotifications();

    const now = Date.now();
    const remainingMs = Math.max(0, targetEndTime - now);
    const remainingSeconds = Math.ceil(remainingMs / 1000);

    this.store.set({
      status: 'paused',
      pauseTime: now,
      remainingTime: remainingSeconds,
      targetEndTime: null,
    });

    haptics.lightTap();
  }

  resume() {
    if (!this.store) return;
    const { status, remainingTime } = this.store.get();
    if (status !== 'paused') return;

    const now = Date.now();
    const remainingMs = remainingTime * 1000;
    const targetEndTime = now + remainingMs;

    // ── STATE TRANSITION ──────────────────────────────────────────────────────

    this.store.set({
      status: 'running',
      pauseTime: null,
      targetEndTime,
    });

    haptics.lightTap();
    this.startTimeout(remainingMs);

    // ── AFTER transition: reschedule for remaining time ────────────────────────
    // No immediate notification — resume is silent
    this.replaceNotifications(targetEndTime);
  }

  reset() {
    if (!this.store) return;
    const { mode } = this.store.get();

    // Cancel everything
    this.stopTimeout();
    cancelAllNotifications();

    const duration = this.getDurationForMode(mode);

    this.store.set({
      status: 'idle',
      remainingTime: duration,
      sessionStartTime: null,
      pauseTime: null,
      targetEndTime: null,
      completedPomodoros: 0,
    });

    haptics.mediumTap();
  }

  skip() {
    if (!this.store) return;
    const { mode, completedPomodoros } = this.store.get();

    // Cancel everything
    this.stopTimeout();
    cancelAllNotifications();

    const settings = useSettingsStore.getState().settings;

    let nextMode: TimerMode;
    let nextPomodoros = completedPomodoros;

    if (mode === 'FOCUS') {
      nextMode = 'BREAK';
    } else {
      nextPomodoros = completedPomodoros + 1;
      nextMode = 'FOCUS';
    }

    const nextDuration = this.getDurationForMode(nextMode);

    this.store.set({
      mode: nextMode,
      status: 'idle',
      remainingTime: nextDuration,
      sessionStartTime: null,
      pauseTime: null,
      targetEndTime: null,
      completedPomodoros: nextPomodoros,
    });

    haptics.mediumTap();
  }

  switchMode(newMode: TimerMode) {
    if (!this.store) return;
    const { status } = this.store.get();

    if (status !== 'idle') return;

    this.stopTimeout();
    cancelAllNotifications();
    const duration = this.getDurationForMode(newMode);

    this.store.set({
      mode: newMode,
      status: 'idle',
      remainingTime: duration,
      sessionStartTime: null,
      pauseTime: null,
      targetEndTime: null,
    });
  }

  setDurations(focus: number, shortBreak: number, longBreak: number) {
    if (!this.store) return;
    const { status, mode } = this.store.get();

    if (status === 'idle') {
      let currentDuration: number;
      switch (mode) {
        case 'FOCUS': currentDuration = focus * 60; break;
        case 'BREAK': currentDuration = shortBreak * 60; break;
        case 'LONG_BREAK': currentDuration = longBreak * 60; break;
        default: currentDuration = focus * 60;
      }
      this.store.set({
        remainingTime: currentDuration,
      });
    }
  }

  // ─── Background sync ─────────────────────────────────────────────────────────
  //
  // When the app returns from background, this method catches up on any
  // phases that completed while the JS thread was suspended.
  //

  syncBackgroundTime() {
    if (!this.store) return;

    let state = this.store.get();

    if (state.status !== 'running' || state.targetEndTime === null) return;

    let now = Date.now();
    let remainingMs = state.targetEndTime - now;

    if (remainingMs > 0) {
      // Timer hasn't expired yet — restart the timeout and ensure notification
      this.startTimeout(remainingMs);
      this.replaceNotifications(state.targetEndTime);
      return;
    }

    // Timer expired while in background — catch up
    this.stopTimeout();

    while (remainingMs <= 0) {
      const historicalCompletionTime = state.targetEndTime;

      // isCatchUp=true: no haptics, no notification scheduling (OS already delivered)
      this.handleComplete(historicalCompletionTime, true);

      state = this.store.get();

      if (state.status !== 'running' || state.targetEndTime === null) {
        break;
      }

      now = Date.now();
      remainingMs = state.targetEndTime - now;
    }

    // After catch-up, if the timer is still running, set up the current phase
    if (state.status === 'running' && state.targetEndTime !== null) {
      const remaining = Math.max(0, state.targetEndTime - Date.now());
      this.startTimeout(remaining);
      // Schedule the notification for the CURRENT phase after catching up
      this.replaceNotifications(state.targetEndTime);
    }
  }

  handleHydration(state: any) {
    if (!this.store) return;

    if (state.status === 'running' && state.targetEndTime !== null) {
      // Defer sync to after Zustand finishes its rehydration cycle
      setTimeout(() => {
        this.syncBackgroundTime();
      }, 0);
    } else if (state.status === 'paused' && state.pauseTime !== null) {
      // Retain paused state exactly as is.
    } else {
      const duration = this.getDurationForMode(state.mode);
      this.store.set({
        status: 'idle',
        remainingTime: duration,
        targetEndTime: null,
        sessionStartTime: null,
      });
    }
  }
}

export const timerEngine = new TimerEngine();
