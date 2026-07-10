/**
 * FocusFlow — Notification Service
 * 
 * Safe notification handling that:
 * - Detects Expo Go and silently disables notifications
 * - Uses dynamic import to avoid crashes
 * - Never throws errors — all failures are silently handled
 * - Supports Expo SDK 53
 */

import Constants from 'expo-constants';

// Lazy-loaded notification module
let Notifications: typeof import('expo-notifications') | null = null;
let notificationsAvailable = false;

/**
 * Initialize notification service.
 * Call once at app startup. Safe to call multiple times.
 */
export const initNotifications = async (): Promise<void> => {
  // Don't use notifications in Expo Go — they crash
  if (Constants.appOwnership === 'expo') {
    notificationsAvailable = false;
    return;
  }
  
  try {
    Notifications = require('expo-notifications');
    notificationsAvailable = true;
    
    // Set up notification handler for foreground notifications
    if (Notifications) {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
          shouldShowBanner: true,
          shouldShowList: true,
          priority: Notifications
            ? (Notifications as any).AndroidNotificationPriority?.HIGH
            : undefined,
        }),
      });
    }
  } catch {
    notificationsAvailable = false;
  }
};

/**
 * Show a completion notification.
 * Silently fails if notifications are unavailable.
 */
export const showCompletionNotification = async (
  isFocusSession: boolean
): Promise<void> => {
  if (!notificationsAvailable || !Notifications) return;
  
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: isFocusSession ? 'Focus Session Complete! 🎯' : 'Break Over! ⏰',
        body: isFocusSession
          ? 'Great work! Time for a well-deserved break.'
          : 'Refreshed? Let\'s get back to focusing!',
        sound: true,
      },
      trigger: null, // Immediate
    });
  } catch {
    // Silently fail — notification is a nice-to-have, not critical
  }
};

/**
 * Check if notifications are available and enabled.
 */
export const areNotificationsAvailable = (): boolean => {
  return notificationsAvailable;
};
