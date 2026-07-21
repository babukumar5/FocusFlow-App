/**
 * FocusFlow — Notification Service
 *
 * Architecture:
 * - The timer engine is the single source of truth for notifications.
 * - This module is a thin wrapper around expo-notifications.
 * - It never decides WHEN to fire — the timer engine tells it.
 *
 * Safety:
 * - Detects Expo Go and silently disables notifications.
 * - Never throws errors — all failures are silently handled.
 * - Supports Expo SDK 53.
 */

import Constants from 'expo-constants';

// Lazy-loaded notification module
let Notifications: typeof import('expo-notifications') | null = null;
let notificationsAvailable = false;

// Channel ID — v2 uses the user's system default notification sound
const CHANNEL_ID = 'focusflow-alerts-v2';

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

    if (Notifications) {
      // Foreground notification handler
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

      // Android notification channel — NO custom sound.
      // Uses the user's selected notification ringtone.
      if (typeof Notifications.setNotificationChannelAsync === 'function') {
        Notifications.setNotificationChannelAsync(CHANNEL_ID, {
          name: 'FocusFlow Alerts',
          importance: (Notifications as any).AndroidImportance?.HIGH,
          // Intentionally omitting `sound` — Android uses the user's default
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

export type NotificationType = 'START_FOCUS' | 'FOCUS_END' | 'CYCLE_COMPLETE' | 'ALL_COMPLETED';

/**
 * Schedule a notification.
 *
 * @param type        — The notification event type.
 * @param timestampMs — 0 = fire immediately. >0 = schedule for that exact UNIX timestamp.
 * @param cycleData   — Required for CYCLE_COMPLETE.
 */
export const scheduleExactNotification = async (
  type: NotificationType,
  timestampMs: number,
  cycleData?: { completed: number; total: number }
): Promise<void> => {
  if (!notificationsAvailable || !Notifications) return;

  try {
    let title = '';
    let body = '';

    switch (type) {
      case 'START_FOCUS':
        title = "🚀 Let's Begin!";
        body = 'Stay focused. Your session has started.';
        break;
      case 'FOCUS_END':
        title = '⏰ Focus Complete!';
        body = 'Time for a break.';
        break;
      case 'CYCLE_COMPLETE':
        if (cycleData?.completed === 1) {
          title = '✅ 1 Cycle Completed!';
          body = "Great job! Let's begin the next focus session.";
        } else if (cycleData?.completed === 2) {
          title = '🏆 2 Cycles Completed!';
          body = "Amazing! Let's begin the next focus session.";
        } else if (cycleData?.completed === 3) {
          title = '🔥 3 Cycles Completed!';
          body = "Excellent! Let's begin the next focus session.";
        } else {
          title = `✅ ${cycleData?.completed} Cycles Completed!`;
          body = "Great job! Let's begin the next focus session.";
        }
        break;
      case 'ALL_COMPLETED':
        title = '🎉 All Cycles Completed!';
        body = 'Amazing work! You completed every focus cycle.';
        break;
    }

    let triggerObj: any = null;

    if (timestampMs > 0) {
      // Schedule for an exact future time. Clamp to at least 1s from now.
      const triggerDate = new Date(Math.max(Date.now() + 1000, timestampMs));
      triggerObj = {
        type: 'date',
        date: triggerDate,
        channelId: CHANNEL_ID,
      };
    } else {
      // Fire immediately
      triggerObj = { channelId: CHANNEL_ID };
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: 'default', // OS-managed notification sound
      },
      trigger: triggerObj,
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
