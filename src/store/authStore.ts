import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthState, User, LoginPayload, SignupPayload, UpdateProfilePayload } from '../types/auth.types';
import { useSettingsStore } from './settingsStore';

const MOCK_USER: User = {
  _id: 'mock-user-id',
  name: 'Achiever',
  email: 'achiever@focusflow.com',
  avatar: '🧘',
  settings: {
    focusTime: 25,
    shortBreakTime: 5,
    longBreakTime: 15,
    theme: 'dark',
    soundType: 'digital_watch',
    soundVolume: 0.8,
    browserNotifications: true,
    autoStartBreaks: false,
    autoStartTimers: false,
    hasCompletedOnboarding: true,
    cycles: 4,
    timerSoundEnabled: true,
    backgroundMusic: 'None',
    language: 'English',
    notifications: true,
  },
  streak: {
    currentStreak: 12,
    longestStreak: 15,
    lastActiveDate: new Date().toISOString().split('T')[0],
  },
  token: 'mock-jwt-token-12345',
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: MOCK_USER,
      isAuthenticated: true,
      isLoading: false,
      isHydrated: false,


      updateProfile: async (payload: UpdateProfilePayload) => {
        const currentUser = get().user;
        if (!currentUser) return;

        set({ isLoading: true });
        await new Promise((resolve) => setTimeout(resolve, 500));

        const updatedUser: User = {
          ...currentUser,
          name: payload.name ?? currentUser.name,
          email: payload.email ?? currentUser.email,
          avatar: payload.avatar ?? currentUser.avatar,
        };
        set({ user: updatedUser, isLoading: false });
      },

      updateSettings: async (payload: Partial<typeof MOCK_USER.settings>) => {
        const currentUser = get().user;
        if (!currentUser) return;

        // Sync with settings store first
        useSettingsStore.getState().updateSettings(payload);

        const updatedSettings = { ...currentUser.settings, ...payload };
        
        set({
          user: {
            ...currentUser,
            settings: updatedSettings,
          },
        });
      },

      hydrate: async () => {
        set({ isHydrated: true });
      },
    }),
    {
      name: 'focusflow-auth',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.hydrate();
        }
      },
    }
  )
);
