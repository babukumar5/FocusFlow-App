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
import {
  beginNotificationOperation,
  cancelAllNotifications,
  isNotificationOperationCurrent,
  NotificationMilestone,
  scheduleAllMilestones,
} from "./notificationService";

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

  // ─── Notification scheduling ──────────────────────────────────────────────────
  //
  // scheduleRemainingMilestones is the single scheduling boundary.
  //
  // It reads the current timer state, calculates the absolute timestamp of
  // every remaining focus-end milestone for the full session, builds a
  // NotificationMilestone array, and calls scheduleAllMilestones once.
  //
  // After that call returns, Android's AlarmManager holds every alarm.
  // JavaScript does not need to run again for any notification to fire.
  //
  // Called by: start(), resume(), syncBackgroundTime()
  // NOT called by: handleComplete() — the alarms are already registered.
  //
  // Invariant maintained throughout this function:
  //   cyclesCompleted = the number of FOCUS phases that will have fully
  //   ended by the time `cursor` is reached.
  //
  // This invariant is what allows `cycleData.completed` to equal the correct
  // cycle number at every milestone: the label matches the cursor.

  private async scheduleRemainingMilestones(
    immediate?: "START_FOCUS",
  ): Promise<void> {
    const operation = beginNotificationOperation();

    // Cancel whatever is currently pending before building the new schedule.
    // Passing the operation means the cancellation and the subsequent
    // scheduling share the same operation token, so they are treated as one
    // atomic replace inside the native queue.
    await cancelAllNotifications(operation);

    if (!isNotificationOperationCurrent(operation) || !this.store) return;

    const state = this.store.get();

    // Guard: only schedule when the timer is actually running.
    if (state.status !== "running" || state.targetEndTime === null) return;

    const settings = useSettingsStore.getState().settings;
    if (!settings.browserNotifications) return;

    const milestones: NotificationMilestone[] = [];

    // ── Optional immediate notification ──────────────────────────────────────
    // START_FOCUS fires once when the user presses Start on a FOCUS phase.
    // Resume and automatic phase transitions are silent.
    if (immediate) {
      milestones.push({ type: "START_FOCUS", timestampMs: 0 });
    }

    // ── Calculate all remaining cycle milestones ──────────────────────────────
    //
    // A "cycle" in the UI means one FOCUS session. The notification fires at
    // the end of each FOCUS phase. The engine auto-starts a BREAK after each
    // FOCUS, so the timeline from any given point is:
    //
    //   ... [current phase end] → [optional breaks] → [FOCUS end = milestone] → ...
    //
    // We walk cursor forward from state.targetEndTime through every remaining
    // phase, emitting a milestone each time a FOCUS phase would end.
    //
    // State at call time:
    //   state.mode             — FOCUS or BREAK (current phase)
    //   state.targetEndTime    — absolute ms when the current phase ends
    //   state.completedPomodoros — number of full focus+break pairs done so far
    //
    // completedPomodoros semantics (set by handleComplete):
    //   - Incremented only when a BREAK phase ends (i.e. a full cycle pair is done).
    //   - NOT incremented when a FOCUS phase ends (the break hasn't happened yet).
    //
    // Consequence for the BREAK branch:
    //   When mode=BREAK after Focus K, completedPomodoros = K-1, not K.
    //   (The break that will increment it to K has not yet ended.)
    //   The invariant below corrects for this.

    const focusDurationMs = this.getDurationForMode("FOCUS") * 1_000;
    const breakDurationMs = this.getDurationForMode("BREAK") * 1_000;
    const totalCycles = settings.cycles;

    // cursor tracks the absolute timestamp of the end of each upcoming phase.
    let cursor = state.targetEndTime;

    // cyclesCompleted tracks how many FOCUS sessions will have finished by
    // the time cursor reaches a given point.
    //
    // Invariant: cyclesCompleted always equals the number of FOCUS phases
    // that have ended at or before `cursor`. This is what we use as the
    // notification label, so it must stay in sync with cursor at all times.
    let cyclesCompleted = state.completedPomodoros;

    if (state.mode === "FOCUS") {
      // ── Current phase is FOCUS ──────────────────────────────────────────────
      //
      // cursor is already at the end of the current FOCUS phase.
      // completedPomodoros = number of full focus+break pairs done so far.
      // The focus currently running will be the (completedPomodoros + 1)th focus.
      //
      // Invariant holds on entry: cyclesCompleted = completedPomodoros.
      // After this focus ends, cyclesCompleted will be completedPomodoros + 1.
      //
      // Example (fresh start, completedPomodoros=0, totalCycles=10):
      //
      //   cursor=focusEnd_1  → nextCompleted=1  → milestone "Cycle 1 Completed"
      //   cursor+=break      → breakEnd_1
      //   cursor+=focus      → focusEnd_2, cyclesCompleted=2 → "Cycle 2 Completed"
      //   ...
      //   cyclesCompleted=10 → "Well Done!"

      const nextCompleted = cyclesCompleted + 1;

      if (nextCompleted >= totalCycles) {
        // This is the final FOCUS of the session.
        milestones.push({ type: "ALL_COMPLETED", timestampMs: cursor });
      } else {
        milestones.push({
          type: "CYCLE_COMPLETE",
          timestampMs: cursor,
          cycleData: { completed: nextCompleted },
        });

        // Advance past the break that follows this FOCUS, then iterate the
        // remaining cycles.
        cursor += breakDurationMs;
        cyclesCompleted = nextCompleted;

        while (cyclesCompleted < totalCycles) {
          cursor += focusDurationMs;
          cyclesCompleted += 1;

          if (cyclesCompleted >= totalCycles) {
            milestones.push({ type: "ALL_COMPLETED", timestampMs: cursor });
          } else {
            milestones.push({
              type: "CYCLE_COMPLETE",
              timestampMs: cursor,
              cycleData: { completed: cyclesCompleted },
            });
            cursor += breakDurationMs;
          }
        }
      }
    } else {
      // ── Current phase is BREAK ──────────────────────────────────────────────
      //
      // cursor is at the end of the current BREAK phase.
      // No milestone fires at break end — only at the subsequent FOCUS end.
      //
      // completedPomodoros semantics: it is incremented only when a BREAK ends
      // (inside handleComplete). Right now we are *in* a break, so it has NOT
      // yet been incremented for the FOCUS that triggered this break.
      //
      // Concretely: if this is the break after Focus 1, completedPomodoros=0.
      // If this is the break after Focus 3, completedPomodoros=2.
      // In general: completedPomodoros = (number of focuses done) - 1.
      //
      // We are about to advance cursor past the *next* FOCUS phase. That focus
      // will be the (completedPomodoros + 2)th focus overall:
      //   +1 because completedPomodoros lags one focus behind
      //   +1 because we are advancing past one more focus
      //
      // FIX: the original code did `cyclesCompleted += 1` after the cursor
      // advance, which produced labels that were one behind the cursor position.
      // The correct accounting requires two increments:
      //
      //   cyclesCompleted += 1  — catch up for the focus that started this break
      //                           (the one completedPomodoros hasn't counted yet)
      //   cursor += focusDurationMs
      //   cyclesCompleted += 1  — count the focus we just advanced past
      //
      // After these two lines, the invariant holds:
      //   cyclesCompleted = completedPomodoros + 2
      //   cursor          = end of Focus (completedPomodoros + 2)
      //   label           = completedPomodoros + 2  ✓
      //
      // Example (break after Focus 1, completedPomodoros=0, totalCycles=10):
      //
      //   cyclesCompleted = 0 + 1 = 1   (catch-up for Focus 1)
      //   cursor += focus               → focusEnd_2
      //   cyclesCompleted = 1 + 1 = 2   → label "Cycle 2 Completed"  ✓
      //
      //   iter: cursor += break+focus → focusEnd_3, cyclesCompleted=3 → label 3 ✓
      //   iter: cursor += break+focus → focusEnd_4, cyclesCompleted=4 → label 4 ✓
      //   ...
      //   cyclesCompleted=10 → "Well Done!"  ✓
      //
      // Example (break after Focus 3, completedPomodoros=2, totalCycles=10):
      //
      //   cyclesCompleted = 2 + 1 = 3   (catch-up for Focus 3)
      //   cursor += focus               → focusEnd_4
      //   cyclesCompleted = 3 + 1 = 4   → label "Cycle 4 Completed"  ✓
      //
      //   iter: cursor += break+focus → focusEnd_5, cyclesCompleted=5 → label 5 ✓
      //   ...

      // Step 1: catch up for the focus phase that triggered this break.
      // completedPomodoros has not yet been incremented for that focus,
      // so we do it here to restore the invariant before advancing cursor.
      cyclesCompleted += 1;

      // Step 2: advance cursor past the next focus phase and count it.
      cursor += focusDurationMs;
      cyclesCompleted += 1;

      while (cyclesCompleted <= totalCycles) {
        if (cyclesCompleted >= totalCycles) {
          milestones.push({ type: "ALL_COMPLETED", timestampMs: cursor });
          break;
        } else {
          milestones.push({
            type: "CYCLE_COMPLETE",
            timestampMs: cursor,
            cycleData: { completed: cyclesCompleted },
          });
          cursor += breakDurationMs + focusDurationMs;
          cyclesCompleted += 1;
        }
      }
    }

    if (!isNotificationOperationCurrent(operation)) return;

    // Hand the complete alarm set to the service. Android registers each one
    // independently. No further JS call is needed for any of them to fire.
    await scheduleAllMilestones(milestones, operation);
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
    // handleComplete call). It does NOT trigger notification scheduling —
    // all alarms are already registered in Android's queue.
    //
    // isCatchUp=true means we are replaying completed phases after returning
    // from the background. The loop in syncBackgroundTime drives this, so we
    // do not set a new timeout here.

    if (autoStart && !isCatchUp) {
      const nextTarget = actualCompletionTime + nextDuration * 1_000;
      const remainingForNext = Math.max(0, nextTarget - Date.now());
      this.startTimeout(remainingForNext);
      // No scheduleRemainingMilestones call here. Android already has every
      // alarm that was registered at start() or resume().
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

    // Schedule every remaining cycle alarm at once.
    // START_FOCUS fires immediately for Focus phases; Break phases are silent.
    this.scheduleRemainingMilestones(
      mode === "FOCUS" ? "START_FOCUS" : undefined,
    );
  }

  pause() {
    if (!this.store) return;
    const { status, targetEndTime } = this.store.get();
    if (status !== "running" || targetEndTime === null) return;

    // Stop the JS timeout and cancel every pending native alarm.
    // cancelAllNotifications begins a new operation, which invalidates any
    // in-flight scheduleRemainingMilestones call from start() or resume().
    this.stopTimeout();
    cancelAllNotifications();

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

    // Recalculate every remaining milestone from the new targetEndTime and
    // register them all with Android. Resume is silent (no START_FOCUS).
    this.scheduleRemainingMilestones();
  }

  reset() {
    if (!this.store) return;
    const { mode } = this.store.get();

    // Cancel every pending native alarm and stop the JS timeout.
    this.stopTimeout();
    cancelAllNotifications();

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

    // Cancel every pending native alarm and stop the JS timeout.
    this.stopTimeout();
    cancelAllNotifications();

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
    cancelAllNotifications();
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
  // When Android fired alarms while the app was backgrounded, those
  // notifications have already been delivered. The catch-up loop here updates
  // JS state and the database to match what Android already did natively.
  //
  // After catch-up, if the timer is still running, scheduleRemainingMilestones
  // is called to re-register any alarms that are still in the future. This
  // handles the edge case where the OS killed the app process (clearing the
  // native alarm queue) before all alarms fired — in that scenario, Zustand
  // rehydrates the running state and handleHydration calls syncBackgroundTime,
  // which rebuilds the alarm schedule for whatever remains.

  syncBackgroundTime() {
    if (!this.store) return;

    let state = this.store.get();
    if (state.status !== "running" || state.targetEndTime === null) return;

    let now = Date.now();
    let remainingMs = state.targetEndTime - now;

    if (remainingMs > 0) {
      // Current phase has not ended yet. Restart the JS timeout and
      // re-register any alarms that are still outstanding.
      this.startTimeout(remainingMs);
      this.scheduleRemainingMilestones();
      return;
    }

    // One or more phases completed while the app was backgrounded.
    // Replay them in order so state and the DB are consistent.
    this.stopTimeout();

    while (remainingMs <= 0) {
      const historicalCompletionTime = state.targetEndTime;

      // isCatchUp=true suppresses haptics and skips the startTimeout call
      // inside handleComplete (the loop drives iteration instead).
      // Notification scheduling inside handleComplete was already removed,
      // so isCatchUp has no effect on notifications.
      this.handleComplete(historicalCompletionTime, true);

      state = this.store.get();
      if (state.status !== "running" || state.targetEndTime === null) break;

      now = Date.now();
      remainingMs = state.targetEndTime - now;
    }

    // After catch-up, re-register alarms for any phases that are still in
    // the future and restart the JS timeout for the current phase.
    if (state.status === "running" && state.targetEndTime !== null) {
      const remaining = Math.max(0, state.targetEndTime - Date.now());
      this.startTimeout(remaining);
      this.scheduleRemainingMilestones();
    }
  }

  handleHydration(state: any) {
    if (!this.store) return;

    if (state.status === "running" && state.targetEndTime !== null) {
      // Defer sync until after Zustand finishes its rehydration cycle.
      // syncBackgroundTime will call scheduleRemainingMilestones if needed.
      setTimeout(() => {
        this.syncBackgroundTime();
      }, 0);
    } else if (state.status === "paused" && state.pauseTime !== null) {
      // Retain paused state exactly as persisted. No alarms to register.
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
