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

      // Set up custom sound channel for Android
      if (typeof Notifications.setNotificationChannelAsync === 'function') {
        Notifications.setNotificationChannelAsync('focusflow-timer-alerts', {
          name: 'Timer Alerts',
          importance: (Notifications as any).AndroidImportance?.HIGH,
          sound: 'notification.wav',
        }).catch(() => {});
      }
    }
  } catch {
    notificationsAvailable = false;
  }
};

export const requestNotificationPermissions = async (): Promise<boolean> => {
  if (!notificationsAvailable || !Notifications) return false;
  
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    return finalStatus === 'granted';
  } catch (error) {
    console.warn('[NotificationService] Failed to request permissions:', error);
    return false;
  }
};

/**
 * Show a completion notification immediately.
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
        sound: 'notification.wav',
      },
      trigger: {
        channelId: 'focusflow-timer-alerts',
      } as any, // Immediate
    });
  } catch {
    // Silently fail
  }
};

/**
 * Schedule a notification for a specific future exact time.
 */
export const scheduleExactNotification = async (
  isFocusSession: boolean,
  timestampMs: number,
  isFinalCompletion: boolean = false
): Promise<void> => {
  if (!notificationsAvailable || !Notifications) return;
  
  try {
    let title = isFocusSession ? 'Focus Session Complete! 🎯' : 'Break Over! ⏰';
    let body = isFocusSession
      ? 'Great work! Time for a well-deserved break.'
      : 'Refreshed? Let\'s get back to focusing!';

    if (isFinalCompletion) {
      title = 'All Cycles Completed! 🎉';
      body = 'Incredible focus! You finished all your cycles.';
    }

    const secondsFromNow = Math.max(1, Math.round((timestampMs - Date.now()) / 1000));

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: 'notification.wav',
      },
      trigger: { 
        seconds: secondsFromNow,
        channelId: 'focusflow-timer-alerts',
      } as any,
    });
  } catch {
    // Silently fail
  }
};

/**
 * Cancel all previously scheduled notifications.
 */
export const cancelAllNotifications = async (): Promise<void> => {
  if (!notificationsAvailable || !Notifications) return;
  
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {
    // Silently fail
  }
};

/**
 * Check if notifications are available and enabled.
 */
export const areNotificationsAvailable = (): boolean => {
  return notificationsAvailable;
};
