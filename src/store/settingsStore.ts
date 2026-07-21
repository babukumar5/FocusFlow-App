/**
 * FocusFlow — Settings Store
 *
 * THE single source of truth for all user settings.
 *
 * Architecture notes:
 * ─────────────────────────────────────────────────────────────────────────────
 * • authStore does NOT persist its own copy of settings. It delegates all
 *   reads and writes here. This eliminates the dual-persistence conflict where
 *   AsyncStorage held two diverging copies of the same data.
 *
 * • timerStore subscribes to this store (see _subscribeToSettings() in
 *   timerStore). When settings change and the timer is idle, timerStore calls
 *   its own setDurations() automatically. No UI coordination required.
 *
 * • Validation (clamp + step-snap) is applied on every write, so downstream
 *   consumers can trust that values are always within legal bounds.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { create } from "zustand";
import { UserSettings } from "../types/auth.types";
import { SETTINGS_LIMITS } from "../types/timer.types";
import { getSettings as getDBSettings, updateSettings as updateDBSettings } from "../services/db";
import { defaultSettings } from "../constants/defaultSettings";

// ─── Public interface ─────────────────────────────────────────────────────────

export interface SettingsState {
  settings: UserSettings;
  updateSettings: (newSettings: Partial<UserSettings>) => void;
  resetSettings: () => void;
  hydrate: () => void;
}



/**
 * Clamp a number between [min, max] then snap to the nearest multiple of step.
 */
const clampAndStep = (
  value: number,
  min: number,
  max: number,
  step: number,
): number => {
  const clamped = Math.max(min, Math.min(max, value));
  return Math.round(clamped / step) * step;
};

/**
 * Apply all validation rules to an incoming settings patch and return a
 * fully-validated settings object ready to be stored.
 */
const validateSettings = (
  base: UserSettings,
  patch: Partial<UserSettings>,
): UserSettings => {
  const merged = { ...base, ...patch };

  if (patch.focusTime !== undefined) {
    const { min, max, step } = SETTINGS_LIMITS.focusTime;
    merged.focusTime = clampAndStep(merged.focusTime, min, max, step);
  }
  if (patch.shortBreakTime !== undefined) {
    const { min, max, step } = SETTINGS_LIMITS.shortBreakTime;
    merged.shortBreakTime = clampAndStep(merged.shortBreakTime, min, max, step);
  }
  if (patch.longBreakTime !== undefined) {
    const { min, max, step } = SETTINGS_LIMITS.longBreakTime;
    merged.longBreakTime = clampAndStep(merged.longBreakTime, min, max, step);
  }
  if (patch.cycles !== undefined) {
    const { min, max, step } = SETTINGS_LIMITS.cycles;
    merged.cycles = clampAndStep(merged.cycles, min, max, step);
  }

  return merged;
};

// ─── Store ────────────────────────────────────────────────────────────────────

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: defaultSettings, // Will be hydrated later

  hydrate: () => {
    set({ settings: getDBSettings() });
  },

  updateSettings: (patch: Partial<UserSettings>) => {
    set((state) => {
      const newSettings = validateSettings(state.settings, patch);
      updateDBSettings(newSettings);
      return { settings: newSettings };
    });
  },

  resetSettings: () => {
    updateDBSettings(defaultSettings);
    set({ settings: defaultSettings });
  },
}));
