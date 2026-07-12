import { UserSettings } from '../types/auth.types';
import { SETTINGS_LIMITS } from '../types/timer.types';

export const defaultSettings: UserSettings = {
  focusTime: SETTINGS_LIMITS.focusTime.default,
  shortBreakTime: SETTINGS_LIMITS.shortBreakTime.default,
  longBreakTime: SETTINGS_LIMITS.longBreakTime.default,
  cycles: SETTINGS_LIMITS.cycles.default,
  theme: "dark",
  soundType: "digital_watch",
  soundVolume: 0.8,
  browserNotifications: true,
  autoStartBreaks: false,
  autoStartTimers: false,
  hasCompletedOnboarding: false,
  timerSoundEnabled: true,
  backgroundMusic: "None",
  language: "English",
  notifications: true,
};
