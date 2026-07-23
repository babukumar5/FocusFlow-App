import { useActivityStore } from "../store/activityStore";
import { useSettingsStore } from "../store/settingsStore";
import { FocusSession, SessionMode, TimerMode } from "../types/timer.types";
import {
  getDayName,
  getISOWeekNumber,
  getLocalDateString,
  getMonthName,
} from "../utils/dateUtils";
import { haptics } from "../utils/haptics";
import { getCompletedSessions, insertSession } from "./db";


export interface StoreProxy {
  get: () => any;
  set: (partial: any) => void;
}

export class TimerEngine {
  private store: StoreProxy | null = null;
  private timeoutId: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    // No custom sound initialisation — all sounds come from OS notifications.
  }

  bindStore(store: StoreProxy) {
    this.store = store;
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────────

  private getDurationForMode(mode: TimerMode): number {
    const settings = useSettingsStore.getState().settings;
    switch (mode) {
      case "FOCUS":
        return settings.focusTime * 60;
      case "BREAK":
        return settings.shortBreakTime * 60;
      case "LONG_BREAK":
        return settings.longBreakTime * 60;
      default:
        return settings.focusTime * 60;
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

  

  // ─── State transition handler ─────────────────────────────────────────────────
  //
  // Called when a timer phase reaches 00:00 (via setTimeout in the foreground,
  // or by syncBackgroundTime catch-up when the app returns from background).
  //
  // Rule: state transition FIRST, then schedule the JS timeout for the next
  // phase. Notification scheduling is NOT done here — all alarms were already
  // registered at start() or resume() time and Android fires them on its own.

  private handleComplete(
    historicalCompletionTimeMs?: number,
    isCatchUp: boolean = false,
  ) {
    if (!this.store) return;
    const state = this.store.get();
    if (state.status !== "running") return;

    const { mode, completedPomodoros, sessionStartTime } = state;
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
      : new Date(now.getTime() - durationSecs * 1_000);

    const newSession: FocusSession = {
      _id: sessionId,
      user: "local-user",
      duration: Math.round(durationSecs / 60),
      actualCompletedMinutes: Math.round(durationSecs / 60),
      startTime: startTime.toISOString(),
      endTime: now.toISOString(),
      date: getLocalDateString(startTime),
      day: getDayName(startTime),
      week: getISOWeekNumber(startTime),
      month: getMonthName(startTime),
      year: startTime.getFullYear(),
      mode:
        mode === "LONG_BREAK"
          ? "long break"
          : (mode.toLowerCase() as SessionMode),
      completionStatus: "completed",
      interrupted: false,
      task: null,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    // ── Determine next state ──────────────────────────────────────────────────

    let nextMode: TimerMode = mode;
    let nextCompletedPomodoros = completedPomodoros;
    let autoStart = false;

    if (mode === "FOCUS") {
      // Focus finished → always auto-start Break.
      nextMode = "BREAK";
      autoStart = true;
    } else {
      // Break finished → increment cycle count.
      nextCompletedPomodoros = completedPomodoros + 1;

      if (nextCompletedPomodoros < settings.cycles) {
        // More cycles remaining → auto-start next Focus.
        nextMode = "FOCUS";
        autoStart = true;
      } else {
        // All cycles complete → stop.
        nextMode = "FOCUS";
        autoStart = false;
      }
    }

    const nextDuration = this.getDurationForMode(nextMode);

    // ── Persist session ───────────────────────────────────────────────────────

    if (mode === "FOCUS") {
      insertSession(newSession);
    }

    const updatedSessions = getCompletedSessions();

    // ── State transition ──────────────────────────────────────────────────────

    this.store.set({
      mode: nextMode,
      status: autoStart ? "running" : "idle",
      remainingTime: nextDuration,
      sessionStartTime: autoStart ? actualCompletionTime : null,
      pauseTime: null,
      targetEndTime: autoStart
        ? actualCompletionTime + nextDuration * 1_000
        : null,
      completedPomodoros: nextCompletedPomodoros,
      sessions: updatedSessions,
      lastCompletedSessionId: newSession._id,
    });

    useActivityStore.getState().refresh();

    // ── JS timeout for next phase ─────────────────────────────────────────────
    //
    // The JS timeout is still needed to keep foreground state in sync
    // (updating the display, persisting sessions, driving the next
    // handleComplete call).
    //
    // isCatchUp=true means we are replaying completed phases after returning
    // from the background. The loop in syncBackgroundTime drives this, so we
    // do not set a new timeout here.

    if (autoStart && !isCatchUp) {
      const nextTarget = actualCompletionTime + nextDuration * 1_000;
      const remainingForNext = Math.max(0, nextTarget - Date.now());
      this.startTimeout(remainingForNext);

    }
  }

  // ─── Public API ───────────────────────────────────────────────────────────────

  start() {
    if (!this.store) return;
    const { remainingTime, mode, completedPomodoros } = this.store.get();
    const settings = useSettingsStore.getState().settings;

    let nextCompleted = completedPomodoros;
    if (mode === "FOCUS" && completedPomodoros >= settings.cycles) {
      nextCompleted = 0;
    }

    const freshDuration = this.getDurationForMode(mode);
    const durationToUse = remainingTime > 0 ? remainingTime : freshDuration;
    const now = Date.now();
    const targetEndTime = now + durationToUse * 1_000;

    // ── State transition ──────────────────────────────────────────────────────

    this.store.set({
      status: "running",
      sessionStartTime: now,
      pauseTime: null,
      remainingTime: durationToUse,
      targetEndTime,
      completedPomodoros: nextCompleted,
    });

    haptics.lightTap();
    this.startTimeout(durationToUse * 1_000);



  }

  pause() {
    if (!this.store) return;
    const { status, targetEndTime } = this.store.get();
    if (status !== "running" || targetEndTime === null) return;

    // Stop the JS timeout and cancel every pending native alarm.

    this.stopTimeout();

    const now = Date.now();
    const remainingMs = Math.max(0, targetEndTime - now);
    const remainingSeconds = Math.ceil(remainingMs / 1_000);

    this.store.set({
      status: "paused",
      pauseTime: now,
      remainingTime: remainingSeconds,
      targetEndTime: null,
    });

    haptics.lightTap();
  }

  resume() {
    if (!this.store) return;
    const { status, remainingTime } = this.store.get();
    if (status !== "paused") return;

    const now = Date.now();
    const remainingMs = remainingTime * 1_000;
    const targetEndTime = now + remainingMs;

    // ── State transition ──────────────────────────────────────────────────────

    this.store.set({
      status: "running",
      pauseTime: null,
      targetEndTime,
    });

    haptics.lightTap();
    this.startTimeout(remainingMs);



  }

  reset() {
    if (!this.store) return;
    const { mode } = this.store.get();

    // Stop the JS timeout.
    this.stopTimeout();

    const duration = this.getDurationForMode(mode);

    this.store.set({
      status: "idle",
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

    // Stop the JS timeout.
    this.stopTimeout();

    const settings = useSettingsStore.getState().settings;

    let nextMode: TimerMode;
    let nextPomodoros = completedPomodoros;

    if (mode === "FOCUS") {
      nextMode = "BREAK";
    } else {
      nextPomodoros = completedPomodoros + 1;
      nextMode = "FOCUS";
    }

    const nextDuration = this.getDurationForMode(nextMode);

    this.store.set({
      mode: nextMode,
      status: "idle",
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

    if (status !== "idle") return;

    this.stopTimeout();

    const duration = this.getDurationForMode(newMode);

    this.store.set({
      mode: newMode,
      status: "idle",
      remainingTime: duration,
      sessionStartTime: null,
      pauseTime: null,
      targetEndTime: null,
    });
  }

  setDurations(focus: number, shortBreak: number, longBreak: number) {
    if (!this.store) return;
    const { status, mode } = this.store.get();

    if (status === "idle") {
      let currentDuration: number;
      switch (mode) {
        case "FOCUS":
          currentDuration = focus * 60;
          break;
        case "BREAK":
          currentDuration = shortBreak * 60;
          break;
        case "LONG_BREAK":
          currentDuration = longBreak * 60;
          break;
        default:
          currentDuration = focus * 60;
      }
      this.store.set({ remainingTime: currentDuration });
    }
  }

  // ─── Background sync ──────────────────────────────────────────────────────────
  //
  // Called when the app returns from the background. Catches up on any phases
  // that completed while the JS thread was suspended.
  //
  // When the app was backgrounded, some phases may have completed.
  // The catch-up loop here updates JS state and the database.
  //
  // After catch-up, if the timer is still running, the JS timeout is restarted.

  syncBackgroundTime() {
    if (!this.store) return;

    let state = this.store.get();
    if (state.status !== "running" || state.targetEndTime === null) return;

    let now = Date.now();
    let remainingMs = state.targetEndTime - now;

    if (remainingMs > 0) {
      // Current phase has not ended yet. Restart the JS timeout.
      this.startTimeout(remainingMs);

      return;
    }

    // One or more phases completed while the app was backgrounded.
    // Replay them in order so state and the DB are consistent.
    this.stopTimeout();

    while (remainingMs <= 0) {
      const historicalCompletionTime = state.targetEndTime;

      // isCatchUp=true suppresses haptics and skips the startTimeout call
      // inside handleComplete (the loop drives iteration instead).

      this.handleComplete(historicalCompletionTime, true);

      state = this.store.get();
      if (state.status !== "running" || state.targetEndTime === null) break;

      now = Date.now();
      remainingMs = state.targetEndTime - now;
    }

    // After catch-up, restart the JS timeout for the current phase.
    if (state.status === "running" && state.targetEndTime !== null) {
      const remaining = Math.max(0, state.targetEndTime - Date.now());
      this.startTimeout(remaining);

    }
  }

  handleHydration(state: any) {
    if (!this.store) return;

    if (state.status === "running" && state.targetEndTime !== null) {
      // Defer sync until after Zustand finishes its rehydration cycle.

      setTimeout(() => {
        this.syncBackgroundTime();
      }, 0);
    } else if (state.status === "paused" && state.pauseTime !== null) {
      // Retain paused state exactly as persisted.
    } else {
      const duration = this.getDurationForMode(state.mode);
      this.store.set({
        status: "idle",
        remainingTime: duration,
        targetEndTime: null,
        sessionStartTime: null,
      });
    }
  }
}

export const timerEngine = new TimerEngine();
