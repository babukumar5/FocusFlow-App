import { create } from "zustand";
import { FocusSession, TimerMode, TimerStatus } from "../types/timer.types";
import { useSettingsStore } from "./settingsStore";
import { timerEngine } from "../services/timerEngine";
import { getCompletedSessions } from "../services/db";

// ─── Store Interface ──────────────────────────────────────────────────────────

export interface ExtendedTimerState {
  // Timer state
  mode: TimerMode;
  status: TimerStatus;
  remainingTime: number; // display seconds when idle/paused
  sessionStartTime: number | null;
  pauseTime: number | null;
  completedPomodoros: number;
  targetEndTime: number | null;

  // Sessions
  sessions: FocusSession[];
  lastCompletedSessionId: string | null;

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

  /** @internal Called once after store creation to wire the settings subscription. */
  _subscribeToSettings: () => () => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useTimerStore = create<ExtendedTimerState>((set, get) => {
  // Bind the external TimerEngine to this store instance
  timerEngine.bindStore({ get, set });
  
  const initialSessions = getCompletedSessions();

  return {
    // ── Initial state ─────────────────────────────────────────────────
    mode: "FOCUS" as TimerMode,
    status: "idle" as TimerStatus,
    remainingTime: 25 * 60,
    sessionStartTime: null,
    pauseTime: null,
    completedPomodoros: 0,
    targetEndTime: null,
    sessions: initialSessions,
    lastCompletedSessionId: initialSessions.length > 0 ? initialSessions[0]._id : null,

    // ── Actions (Delegated to pure TimerEngine) ───────────────────────
    start: () => timerEngine.start(),
        pause: () => timerEngine.pause(),
        resume: () => timerEngine.resume(),
        reset: () => timerEngine.reset(),
        skip: () => timerEngine.skip(),
        switchMode: (newMode: TimerMode) => timerEngine.switchMode(newMode),
        setDurations: (focus: number, shortBreak: number, longBreak: number) => 
          timerEngine.setDurations(focus, shortBreak, longBreak),
        syncBackgroundTime: () => timerEngine.syncBackgroundTime(),

        // ── Local Actions ─────────────────────────────────────────────────
        addSession: (session: FocusSession) => {
          // This is generally not used since timerEngine handles insertion,
          // but just in case, we can refresh from DB.
          const sessions = getCompletedSessions();
          set({ sessions });
        },

        _subscribeToSettings: () => {
          return useSettingsStore.subscribe(
            (newSettingsState, prevSettingsState) => {
              const n = newSettingsState.settings;
              const p = prevSettingsState.settings;
              const durationsChanged =
                n.focusTime !== p.focusTime ||
                n.shortBreakTime !== p.shortBreakTime ||
                n.longBreakTime !== p.longBreakTime;

              if (!durationsChanged) return;
              useTimerStore.getState().setDurations(n.focusTime, n.shortBreakTime, n.longBreakTime);
            },
          );
        },
      };
    }
);

useTimerStore.getState()._subscribeToSettings();
// Initialize durations from loaded settings
useTimerStore.getState().setDurations(
  useSettingsStore.getState().settings.focusTime,
  useSettingsStore.getState().settings.shortBreakTime,
  useSettingsStore.getState().settings.longBreakTime
);
