/**
 * FocusFlow — Settings Store
 * 
 * Manages user settings with validation, persistence, and safe limits.
 * Settings changes apply immediately to idle timers but do NOT disrupt running timers.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserSettings } from '../types/auth.types';
import { SETTINGS_LIMITS } from '../types/timer.types';

interface SettingsState {
  settings: UserSettings;
  updateSettings: (newSettings: Partial<UserSettings>) => void;
  resetSettings: () => void;
}

const defaultSettings: UserSettings = {
  focusTime: SETTINGS_LIMITS.focusTime.default,
  shortBreakTime: SETTINGS_LIMITS.shortBreakTime.default,
  longBreakTime: SETTINGS_LIMITS.longBreakTime.default,
  cycles: SETTINGS_LIMITS.cycles.default,
  theme: 'dark',
  soundType: 'digital_watch',
  soundVolume: 0.8,
  browserNotifications: true,
  autoStartBreaks: false,
  autoStartTimers: false,
  hasCompletedOnboarding: false,
  timerSoundEnabled: true,
  backgroundMusic: 'None',
  language: 'English',
  notifications: true,
};

/**
 * Clamp a number between min and max, then snap to nearest step.
 */
const clampAndStep = (value: number, min: number, max: number, step: number): number => {
  const clamped = Math.max(min, Math.min(max, value));
  return Math.round(clamped / step) * step;
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      settings: defaultSettings,
      
      updateSettings: (newSettings) =>
        set((state) => {
          const updated = { ...state.settings, ...newSettings };
          
          // Enforce limits with clamping and step snapping
          if (newSettings.focusTime !== undefined) {
            const { min, max, step } = SETTINGS_LIMITS.focusTime;
            updated.focusTime = clampAndStep(updated.focusTime, min, max, step);
          }
          if (newSettings.shortBreakTime !== undefined) {
            const { min, max, step } = SETTINGS_LIMITS.shortBreakTime;
            updated.shortBreakTime = clampAndStep(updated.shortBreakTime, min, max, step);
          }
          if (newSettings.longBreakTime !== undefined) {
            const { min, max, step } = SETTINGS_LIMITS.longBreakTime;
            updated.longBreakTime = clampAndStep(updated.longBreakTime, min, max, step);
          }
          if (newSettings.cycles !== undefined) {
            const { min, max, step } = SETTINGS_LIMITS.cycles;
            updated.cycles = clampAndStep(updated.cycles, min, max, step);
          }
          
          // Ensure sound volume is 0-1
          if (newSettings.soundVolume !== undefined) {
            updated.soundVolume = Math.max(0, Math.min(1, updated.soundVolume));
          }
          
          return { settings: updated };
        }),
        
      resetSettings: () => set({ settings: defaultSettings }),
    }),
    {
      name: 'focusflow-settings',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
