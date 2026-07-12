/**
 * FocusFlow — Auth Store
 *
 * Manages user identity (name, email, avatar, streak).
 *
 * Architecture notes:
 * ─────────────────────────────────────────────────────────────────────────────
 * • Settings are NO LONGER stored or persisted here. All reads/writes go
 *   through settingsStore. This eliminates the dual-AsyncStorage-key conflict
 *   where focusflow-auth and focusflow-settings could hold diverging copies
 *   of the same setting values.
 *
 * • user.settings in the User type still exists (for API compatibility) but
 *   it is populated at read-time from settingsStore, not persisted here.
 *
 * • MOCK_USER uses defaultSettings from settingsStore so there is exactly one
 *   definition of the initial values.
 *
 * • updateSettings() is a thin delegation to settingsStore.updateSettings().
 *   The timer's subscription to settingsStore handles the rest automatically.
 *
 * • onRehydrateStorage uses useAuthStore.setState() — not direct object
 *   mutation — to correctly trigger Zustand's reactive update cycle.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { create } from "zustand";
import { AuthState, UpdateProfilePayload, User } from "../types/auth.types";
import { useSettingsStore } from "./settingsStore";
import { defaultSettings } from "../constants/defaultSettings";
import { getUser as getDBUser } from "../services/db";

// ─── Store ────────────────────────────────────────────────────────────────────

export const useAuthStore = create<AuthState>((set, get) => {
  const initUser = (): User | null => {
    const dbUser = getDBUser();
    if (!dbUser) return null;
    return {
      _id: String(dbUser.id),
      name: dbUser.username,
      email: `${dbUser.username.toLowerCase()}@focusflow.com`,
      avatar: "🧘",
      settings: defaultSettings,
      streak: {
        currentStreak: 0,
        longestStreak: 0,
        lastActiveDate: new Date().toISOString().split("T")[0],
      },
      token: "offline-token",
    };
  };

  return {
    user: initUser(),
    isAuthenticated: !!getDBUser(),
    isLoading: false,
    isHydrated: true,

    updateProfile: async (payload: UpdateProfilePayload) => {
      const currentUser = get().user;
      if (!currentUser) return;
      
      const updatedUser: User = {
        ...currentUser,
        name: payload.name ?? currentUser.name,
        email: payload.email ?? currentUser.email,
        avatar: payload.avatar ?? currentUser.avatar,
      };
      set({ user: updatedUser });
    },

    updateSettings: async (payload: Partial<typeof defaultSettings>) => {
      useSettingsStore.getState().updateSettings(payload);
    },

    hydrate: async () => {
      const u = initUser();
      set({ user: u, isAuthenticated: !!u, isHydrated: true });
    },
  };
});
