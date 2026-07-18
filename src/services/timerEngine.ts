import { TimerMode, TimerStatus, FocusSession, SessionMode } from '../types/timer.types';
import { useSettingsStore } from '../store/settingsStore';
import { haptics } from '../utils/haptics';
import { soundService } from './soundService';
import { showCompletionNotification } from './notificationService';
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
    // Pre-load sounds to prevent any delay on first playback
    soundService.init();
  }

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

  private handleComplete(historicalCompletionTimeMs?: number, isCatchUp: boolean = false) {
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
    
    if (!isCatchUp) {
      haptics.success();
      if (settings.browserNotifications) {
        showCompletionNotification(mode === 'FOCUS');
      }
    }

    let newSession: FocusSession | null = null;
    let nextCompletedPomodoros = completedPomodoros;

    const sessionId = this.generateSessionId();

      const actualCompletionTime = historicalCompletionTimeMs ?? Date.now();
      const now = new Date(actualCompletionTime);
      const durationSecs = this.getDurationForMode(mode);
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
        mode: mode === 'LONG_BREAK' ? 'long break' : (mode.toLowerCase() as SessionMode),
        completionStatus: 'completed',
        interrupted: false,
        task: null,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      };

    let nextMode: TimerMode = mode;
    let autoStart = false;

    if (mode === 'FOCUS') {
      // 1. Focus Completion
      nextMode = 'BREAK';
      autoStart = true;
      if (!isCatchUp) soundService.play('break');
    } else {
      // 2. Break Completion
      nextCompletedPomodoros = completedPomodoros + 1;
      
      if (nextCompletedPomodoros < settings.cycles) {
        nextMode = 'FOCUS';
        autoStart = true;
        if (!isCatchUp) soundService.play('cycle');
      } else {
        // Pomodoro Finished
        nextMode = 'FOCUS';
        autoStart = false;
        if (!isCatchUp) soundService.play('completed');
      }
    }

    const nextDuration = this.getDurationForMode(nextMode);

    if (newSession && mode === 'FOCUS') {
      insertSession(newSession);
    }
    
    // Always use accurate SQLite sessions
    const updatedSessions = getCompletedSessions();

    this.store.set({
      mode: nextMode,
      status: autoStart ? 'running' : 'idle',
      remainingTime: nextDuration,
      sessionStartTime: autoStart ? actualCompletionTime : null,
      pauseTime: null,
      targetEndTime: autoStart ? actualCompletionTime + nextDuration * 1000 : null,
      completedPomodoros: nextCompletedPomodoros,
      sessions: updatedSessions,
      lastCompletedSessionId: newSession ? newSession._id : lastCompletedSessionId,
    });

    // Update Activity system automatically
    useActivityStore.getState().refresh();

    if (autoStart && !isCatchUp) {
      const nowTime = Date.now();
      const nextTarget = actualCompletionTime + nextDuration * 1000;
      this.startTimeout(Math.max(0, nextTarget - nowTime));
    }
  }

  start() {
    if (!this.store) return;
    const { remainingTime, mode, completedPomodoros } = this.store.get();
    const settings = useSettingsStore.getState().settings;
    
    let nextCompleted = completedPomodoros;
    if (mode === 'FOCUS' && completedPomodoros >= settings.cycles) {
      nextCompleted = 0;
    }
    
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
      completedPomodoros: nextCompleted,
    });

    haptics.lightTap();
    soundService.play('start');
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
      completedPomodoros: 0,
    });

    haptics.mediumTap();
  }

  skip() {
    if (!this.store) return;
    const { mode, completedPomodoros } = this.store.get();
    this.stopTimeout();
    
    const settings = useSettingsStore.getState().settings;

    let nextMode: TimerMode;
    let nextPomodoros = completedPomodoros;

    if (mode === 'FOCUS') {
      nextMode = 'BREAK';
    } else {
      nextPomodoros = completedPomodoros + 1;
      if (nextPomodoros < settings.cycles) {
        nextMode = 'FOCUS';
      } else {
        nextMode = 'FOCUS';
      }
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
    
    let state = this.store.get();
    
    if (state.status !== 'running' || state.targetEndTime === null) return;

    let now = Date.now();
    let remainingMs = state.targetEndTime - now;

    if (remainingMs > 0) {
      this.startTimeout(remainingMs);
      return;
    }

    this.stopTimeout();

    while (remainingMs <= 0) {
      const historicalCompletionTime = state.targetEndTime;
      
      this.handleComplete(historicalCompletionTime, true);
      
      state = this.store.get();
      
      if (state.status !== 'running' || state.targetEndTime === null) {
        break;
      }

      now = Date.now();
      remainingMs = state.targetEndTime - now;
    }

    if (state.status === 'running' && state.targetEndTime !== null) {
      this.startTimeout(remainingMs);
    }
  }

  handleHydration(state: any) {
    if (!this.store) return;

    if (state.status === 'running' && state.targetEndTime !== null) {
      // setTimeout is used here so that handleHydration finishes, Zustand finishes 
      // its rehydration cycle, and then we sync.
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
