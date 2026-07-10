import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TimerMode, TimerStatus, FocusSession } from '../types/timer.types';
import { useSettingsStore } from './settingsStore';
import { haptics } from '../utils/haptics';
import { getLocalDateString, getISOWeekNumber, getDayName, getMonthName } from '../utils/dateUtils';
import { computeActivitySummary, computeTodayStats } from '../services/statisticsService';
import { showCompletionNotification, initNotifications } from '../services/notificationService';

// ─── Store Interface ──────────────────────────────────────────────────────────

interface ExtendedTimerState {
  // Timer state
  mode: TimerMode;
  status: TimerStatus;
  remainingTime: number;         // display seconds
  totalDuration: number;         // total seconds for current mode
  sessionStartTime: number | null;
  pauseTime: number | null;
  elapsedTime: number;
  completedPomodoros: number;
  targetEndTime: number | null;

  // Sessions
  sessions: FocusSession[];
  lastCompletedSessionId: string | null; // Dedup guard

  // Stats (derived)
  todayFocusTime: number;
  todayFocusCount: number;
  totalFocusTime: number;
  totalSessions: number;
  avgSessionDuration: number;
  bestDayTime: number;

  // Actions
  start: () => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  skip: () => void;
  switchMode: (mode: TimerMode) => void;
  setDurations: (focus: number, shortBreak: number, longBreak: number) => void;
  addSession: (session: FocusSession) => void;
  syncBackgroundTime: () => void;
  recalculateStats: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getDurationForMode = (mode: TimerMode): number => {
  const settings = useSettingsStore.getState().settings;
  switch (mode) {
    case 'FOCUS': return settings.focusTime * 60;
    case 'SHORT_BREAK': return settings.shortBreakTime * 60;
    case 'LONG_BREAK': return settings.longBreakTime * 60;
  }
};

const getNextMode = (currentMode: TimerMode, completedPomodoros: number): TimerMode => {
  const settings = useSettingsStore.getState().settings;
  if (currentMode === 'FOCUS') {
    return completedPomodoros % settings.cycles === 0 ? 'LONG_BREAK' : 'SHORT_BREAK';
  }
  return 'FOCUS';
};

const generateSessionId = (): string => {
  return `session-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
};

initNotifications();

// ─── Module-Level Interval ────────────────────────────────────────────────────
let intervalId: ReturnType<typeof setInterval> | null = null;
const TICK_RATE_MS = 200;

const startEngineInterval = (storeGet: () => ExtendedTimerState, handleComplete: () => void, storeSet: any) => {
  if (intervalId) clearInterval(intervalId);
  
  intervalId = setInterval(() => {
    const state = storeGet();
    if (state.status !== 'running' || !state.targetEndTime) {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
      return;
    }

    const now = Date.now();
    const remainingMs = state.targetEndTime - now;

    if (remainingMs <= 0) {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
      storeSet({ remainingTime: 0, elapsedTime: state.totalDuration });
      handleComplete();
    } else {
      const remainingSeconds = Math.round(remainingMs / 1000);
      const elapsedSeconds = state.totalDuration - remainingSeconds;
      storeSet({
        remainingTime: remainingSeconds,
        elapsedTime: elapsedSeconds,
      });
    }
  }, TICK_RATE_MS);
};

const stopEngineInterval = () => {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
};

// ─── Store ────────────────────────────────────────────────────────────────────

export const useTimerStore = create<ExtendedTimerState>()(
  persist(
    (set, get) => {
      
      const handleTimerComplete = () => {
        const state = get();
        if (state.status !== 'running') return; // Double guard
        
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
          const sessionId = generateSessionId();
          
          if (sessionId !== lastCompletedSessionId) {
            const now = new Date();
            const startTime = sessionStartTime
              ? new Date(sessionStartTime)
              : new Date(now.getTime() - totalDuration * 1000);
            
            const durationMins = Math.round(totalDuration / 60);
            
            newSession = {
              _id: sessionId,
              user: 'local-user',
              duration: durationMins,
              actualCompletedMinutes: durationMins,
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
        
        const nextMode = getNextMode(mode, nextCompletedPomodoros);
        const nextDuration = getDurationForMode(nextMode);
        const autoStart = mode === 'FOCUS' ? settings.autoStartBreaks : settings.autoStartTimers;
        
        const updatedSessions = newSession ? [newSession, ...sessions] : sessions;
        const summary = computeActivitySummary(updatedSessions);
        const todayStats = computeTodayStats(updatedSessions);
        
        set({
          mode: nextMode,
          status: autoStart ? 'running' : 'idle',
          remainingTime: nextDuration,
          totalDuration: nextDuration,
          elapsedTime: 0,
          sessionStartTime: autoStart ? Date.now() : null,
          pauseTime: null,
          targetEndTime: autoStart ? Date.now() + nextDuration * 1000 : null,
          completedPomodoros: nextCompletedPomodoros,
          sessions: updatedSessions,
          lastCompletedSessionId: newSession ? newSession._id : lastCompletedSessionId,
          ...summary,
          ...todayStats,
        });
        
        if (autoStart) {
          startEngineInterval(get, handleTimerComplete, set);
        } else {
          stopEngineInterval();
        }
      };

      return {
        mode: 'FOCUS' as TimerMode,
        status: 'idle' as TimerStatus,
        remainingTime: 25 * 60,
        totalDuration: 25 * 60,
        sessionStartTime: null,
        pauseTime: null,
        elapsedTime: 0,
        completedPomodoros: 0,
        targetEndTime: null,
        sessions: [],
        lastCompletedSessionId: null,
        todayFocusTime: 0,
        todayFocusCount: 0,
        totalFocusTime: 0,
        totalSessions: 0,
        avgSessionDuration: 0,
        bestDayTime: 0,

        start: () => {
          const { remainingTime, mode } = get();
          const duration = remainingTime > 0 ? remainingTime : getDurationForMode(mode);
          const now = Date.now();
          
          set({
            status: 'running',
            sessionStartTime: now,
            pauseTime: null,
            elapsedTime: 0,
            remainingTime: duration,
            totalDuration: duration,
            targetEndTime: now + duration * 1000,
          });
          
          haptics.lightTap();
          startEngineInterval(get, handleTimerComplete, set);
        },

        pause: () => {
          const { status, targetEndTime } = get();
          if (status !== 'running' || !targetEndTime) return;
          
          stopEngineInterval();
          
          const now = Date.now();
          const remainingMs = Math.max(0, targetEndTime - now);
          const remainingSeconds = Math.round(remainingMs / 1000);
          
          set({
            status: 'paused',
            pauseTime: now,
            remainingTime: remainingSeconds,
            targetEndTime: null,
          });
          
          haptics.lightTap();
        },

        resume: () => {
          const { status, remainingTime } = get();
          if (status !== 'paused') return;
          
          const now = Date.now();
          
          set({
            status: 'running',
            pauseTime: null,
            targetEndTime: now + remainingTime * 1000,
          });
          
          haptics.lightTap();
          startEngineInterval(get, handleTimerComplete, set);
        },

        reset: () => {
          const { mode } = get();
          stopEngineInterval();
          
          const duration = getDurationForMode(mode);
          
          set({
            status: 'idle',
            remainingTime: duration,
            totalDuration: duration,
            sessionStartTime: null,
            pauseTime: null,
            elapsedTime: 0,
            targetEndTime: null,
          });
          
          haptics.mediumTap();
        },

        skip: () => {
          const { mode, completedPomodoros } = get();
          stopEngineInterval();
          
          const nextPomodoros = mode === 'FOCUS' ? completedPomodoros + 1 : completedPomodoros;
          const nextMode = getNextMode(mode, nextPomodoros);
          const nextDuration = getDurationForMode(nextMode);
          
          set({
            mode: nextMode,
            status: 'idle',
            remainingTime: nextDuration,
            totalDuration: nextDuration,
            sessionStartTime: null,
            pauseTime: null,
            elapsedTime: 0,
            targetEndTime: null,
            completedPomodoros: nextPomodoros,
          });
          
          haptics.mediumTap();
        },

        switchMode: (newMode: TimerMode) => {
          stopEngineInterval();
          const duration = getDurationForMode(newMode);
          
          set({
            mode: newMode,
            status: 'idle',
            remainingTime: duration,
            totalDuration: duration,
            sessionStartTime: null,
            pauseTime: null,
            elapsedTime: 0,
            targetEndTime: null,
          });
        },

        setDurations: (focus: number, shortBreak: number, longBreak: number) => {
          const { status, mode } = get();
          if (status === 'idle') {
            let currentDuration: number;
            switch (mode) {
              case 'FOCUS': currentDuration = focus * 60; break;
              case 'SHORT_BREAK': currentDuration = shortBreak * 60; break;
              case 'LONG_BREAK': currentDuration = longBreak * 60; break;
            }
            set({
              totalDuration: currentDuration,
              remainingTime: currentDuration,
            });
          }
        },

        addSession: (session: FocusSession) => {
          const currentSessions = get().sessions;
          if (currentSessions.some(s => s._id === session._id)) return;
          
          const updatedSessions = [session, ...currentSessions];
          const summary = computeActivitySummary(updatedSessions);
          const todayStats = computeTodayStats(updatedSessions);
          
          set({
            sessions: updatedSessions,
            lastCompletedSessionId: session._id,
            ...summary,
            ...todayStats,
          });
        },

        recalculateStats: () => {
          const { sessions } = get();
          const summary = computeActivitySummary(sessions);
          const todayStats = computeTodayStats(sessions);
          set({ ...summary, ...todayStats });
        },

        syncBackgroundTime: () => {
          const { status, targetEndTime, totalDuration } = get();
          get().recalculateStats();
          
          if (status !== 'running' || !targetEndTime) return;
          
          const now = Date.now();
          const remainingMs = targetEndTime - now;
          
          if (remainingMs <= 0) {
            stopEngineInterval();
            set({ remainingTime: 0, elapsedTime: totalDuration });
            handleTimerComplete();
          } else {
            const remainingSeconds = Math.round(remainingMs / 1000);
            set({
              remainingTime: remainingSeconds,
              elapsedTime: totalDuration - remainingSeconds,
            });
            startEngineInterval(get, handleTimerComplete, set);
          }
        },
      };
    },
    {
      name: 'focusflow-timer',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        mode: state.mode,
        status: state.status,
        remainingTime: state.remainingTime,
        totalDuration: state.totalDuration,
        sessionStartTime: state.sessionStartTime,
        pauseTime: state.pauseTime,
        elapsedTime: state.elapsedTime,
        completedPomodoros: state.completedPomodoros,
        targetEndTime: state.targetEndTime,
        sessions: state.sessions,
        lastCompletedSessionId: state.lastCompletedSessionId,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        
        state.recalculateStats();
        
        if (state.status === 'running' && state.targetEndTime) {
          const now = Date.now();
          const remainingMs = state.targetEndTime - now;
          
          if (remainingMs <= 0) {
            state.status = 'idle' as TimerStatus;
            state.remainingTime = getDurationForMode(state.mode);
            state.totalDuration = state.remainingTime;
            state.targetEndTime = null;
            state.sessionStartTime = null;
            state.elapsedTime = 0;
          } else {
            setTimeout(() => {
               state.syncBackgroundTime();
            }, 0);
          }
        } else if (state.status === 'idle') {
          const duration = getDurationForMode(state.mode);
          state.remainingTime = duration;
          state.totalDuration = duration;
        }
      },
    }
  )
);
