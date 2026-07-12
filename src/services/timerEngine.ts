import { TimerMode, TimerStatus, FocusSession } from '../types/timer.types';
import { useSettingsStore } from '../store/settingsStore';
import { haptics } from '../utils/haptics';
import { showCompletionNotification } from './notificationService';
import { getLocalDateString, getISOWeekNumber, getDayName, getMonthName } from '../utils/dateUtils';
import { computeActivitySummary, computeTodayStats } from './statisticsService';
import { insertSession, getCompletedSessions } from './db';

export interface StoreProxy {
  get: () => any;
  set: (partial: any) => void;
}

export class TimerEngine {
  private store: StoreProxy | null = null;
  private timeoutId: NodeJS.Timeout | null = null;

  bindStore(store: StoreProxy) {
    this.store = store;
  }

  private getDurationForMode(mode: TimerMode): number {
    const settings = useSettingsStore.getState().settings;
    switch (mode) {
      case 'FOCUS': return settings.focusTime * 60;
      case 'BREAK': return settings.shortBreakTime * 60;
      case 'LONG_BREAK': return settings.longBreakTime * 60;
      default: return settings.focusTime * 60;
    }
  }

  private getNextMode(currentMode: TimerMode, completedPomodoros: number): TimerMode {
    if (currentMode === 'FOCUS') {
      return 'BREAK';
    }
    return 'FOCUS';
  }

  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  }

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

  private handleComplete() {
    if (!this.store) return;
    const state = this.store.get();
    if (state.status !== 'running') return;

    const {
      mode,
      completedPomodoros,
      sessionStartTime,
      totalDuration,
      lastCompletedSessionId,
      sessions,
    } = state;

    const settings = useSettingsStore.getState().settings;
    haptics.success();

    if (settings.notifications || settings.browserNotifications) {
      showCompletionNotification(mode === 'FOCUS');
    }

    let newSession: FocusSession | null = null;
    let nextCompletedPomodoros = completedPomodoros;

    if (mode === 'FOCUS') {
      nextCompletedPomodoros = completedPomodoros + 1;
      const sessionId = this.generateSessionId();

      if (sessionId !== lastCompletedSessionId) {
        const now = new Date();
        const durationSecs = this.getDurationForMode('FOCUS');
        const startTime = sessionStartTime
          ? new Date(sessionStartTime)
          : new Date(now.getTime() - durationSecs * 1000);

        newSession = {
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
          mode: 'focus',
          completionStatus: 'completed',
          interrupted: false,
          task: null,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        };
      }
    }

    const nextMode = this.getNextMode(mode, nextCompletedPomodoros);
    const nextDuration = this.getDurationForMode(nextMode);
    const autoStart = mode === 'FOCUS' ? settings.autoStartBreaks : settings.autoStartTimers;

    if (newSession) {
      insertSession(newSession);
    }
    
    // Always use accurate SQLite sessions
    const updatedSessions = getCompletedSessions();
    const summary = computeActivitySummary(updatedSessions);
    const todayStats = computeTodayStats(updatedSessions);

    const now = Date.now();

    this.store.set({
      mode: nextMode,
      status: autoStart ? 'running' : 'idle',
      remainingTime: nextDuration,
      sessionStartTime: autoStart ? now : null,
      pauseTime: null,
      targetEndTime: autoStart ? now + nextDuration * 1000 : null,
      completedPomodoros: nextCompletedPomodoros,
      sessions: updatedSessions,
      lastCompletedSessionId: newSession ? newSession._id : lastCompletedSessionId,
      ...summary,
      ...todayStats,
    });

    if (autoStart) {
      this.startTimeout(nextDuration * 1000);
    }
  }

  start() {
    if (!this.store) return;
    const { remainingTime, mode } = this.store.get();
    
    // Always fetch fresh duration from settings just in case remainingTime was stale
    const freshDuration = this.getDurationForMode(mode);
    const durationToUse = remainingTime > 0 ? remainingTime : freshDuration;
    const now = Date.now();
    const targetEndTime = now + durationToUse * 1000;

    this.store.set({
      status: 'running',
      sessionStartTime: now,
      pauseTime: null,
      remainingTime: durationToUse,
      targetEndTime,
    });

    haptics.lightTap();
    this.startTimeout(durationToUse * 1000);
  }

  pause() {
    if (!this.store) return;
    const { status, targetEndTime } = this.store.get();
    if (status !== 'running' || targetEndTime === null) return;

    this.stopTimeout();

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

    this.store.set({
      status: 'running',
      pauseTime: null,
      targetEndTime: now + remainingMs,
    });

    haptics.lightTap();
    this.startTimeout(remainingMs);
  }

  reset() {
    if (!this.store) return;
    const { mode } = this.store.get();
    this.stopTimeout();

    const duration = this.getDurationForMode(mode);

    this.store.set({
      status: 'idle',
      remainingTime: duration,
      sessionStartTime: null,
      pauseTime: null,
      targetEndTime: null,
    });

    haptics.mediumTap();
  }

  skip() {
    if (!this.store) return;
    const { mode, completedPomodoros } = this.store.get();
    this.stopTimeout();

    const nextPomodoros = mode === 'FOCUS' ? completedPomodoros + 1 : completedPomodoros;
    const nextMode = this.getNextMode(mode, nextPomodoros);
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
    this.stopTimeout();
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

  syncBackgroundTime() {
    if (!this.store) return;
    
    const state = this.store.get();
    if (state.recalculateStats) {
      state.recalculateStats();
    }

    const refreshedState = this.store.get();
    const { status, targetEndTime } = refreshedState;

    if (status !== 'running' || targetEndTime === null) return;

    const now = Date.now();
    const remainingMs = targetEndTime - now;

    if (remainingMs <= 0) {
      this.stopTimeout();
      this.handleComplete();
    } else {
      this.startTimeout(remainingMs);
    }
  }

  handleHydration(state: any) {
    if (!this.store) return;

    if (state.status === 'running' && state.targetEndTime !== null) {
      const now = Date.now();
      const remainingMs = state.targetEndTime - now;

      if (remainingMs <= 0) {
        this.store.set({
          status: 'idle',
          remainingTime: this.getDurationForMode(state.mode),
          targetEndTime: null,
          sessionStartTime: null,
        });
      } else {
        const remainingSeconds = Math.ceil(remainingMs / 1000);
        this.store.set({
          remainingTime: remainingSeconds,
        });
        setTimeout(() => {
          this.syncBackgroundTime();
        }, 0);
      }
    } else if (state.status === 'paused' && state.pauseTime !== null) {
      // Nothing needed.
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
