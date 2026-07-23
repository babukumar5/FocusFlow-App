/**
 * FocusFlow Types — Authentication
 */

export interface UserSettings {
  focusTime: number;
  shortBreakTime: number;
  longBreakTime: number;
  theme: 'light' | 'dark';
  autoStartBreaks: boolean;
  hasCompletedOnboarding: boolean;
  cycles: number;
  backgroundMusic: string;
  language: string;
}

export interface UserStreak {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  avatar: string;
  settings: UserSettings;
  streak: UserStreak;
  token: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface SignupPayload {
  name: string;
  email: string;
  password: string;
}

export interface UpdateProfilePayload {
  name?: string;
  email?: string;
  password?: string;
  avatar?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isHydrated: boolean;
  updateProfile: (payload: UpdateProfilePayload) => Promise<void>;
  updateSettings: (payload: Partial<UserSettings>) => Promise<void>;
  hydrate: () => Promise<void>;
}
