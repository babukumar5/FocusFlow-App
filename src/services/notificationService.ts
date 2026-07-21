/**
 * FocusFlow — Notification Service
 *
 * Architecture:
 * - The timer engine is the single source of truth for notification events.
 * - This module serializes native scheduling and rejects obsolete requests.
 * - It never decides which timer milestone should be announced.
 *
 * Safety:
 * - Detects Expo Go and silently disables notifications.
 * - Never throws errors — all failures are silently handled.
 * - Supports Expo SDK 57.
 */

import Constants from 'expo-constants';

// Lazy-loaded notification module
let Notifications: typeof import('expo-notifications') | null = null;
let notificationsAvailable = false;

// Channel ID — v2 uses the user's system default notification sound
const CHANNEL_ID = 'focusflow-alerts-v2';

export type NotificationType = 'START_FOCUS' | 'CYCLE_COMPLETE' | 'ALL_COMPLETED';
export type NotificationOperation = number;

// Every replacement or cancellation advances this value. Work queued by an
// older operation becomes a no-op, preventing stale async calls from adding a
// notification after a newer timer action has replaced or cancelled it.
let currentOperation = 0;
let pendingNotificationId: string | null = null;
let nativeQueue: Promise<void> = Promise.resolve();

export const beginNotificationOperation = (): NotificationOperation => {
  currentOperation += 1;
  return currentOperation;
};

export const isNotificationOperationCurrent = (
  operation: NotificationOperation,
): boolean => operation === currentOperation;

const enqueueNativeOperation = (
  operation: NotificationOperation,
  work: () => Promise<void>,
): Promise<void> => {
  const queued = nativeQueue.then(async () => {
    if (!isNotificationOperationCurrent(operation)) return;
    await work();
  });

  // Keep the queue usable after a native failure. Individual operations remain
  // intentionally best-effort and never surface errors to timer callers.
  nativeQueue = queued.catch(() => {});
  return queued.catch(() => {});
};

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

/**
 * Schedule one timer milestone notification.
 *
 * @param type        — The notification event type.
 * @param timestampMs — 0 = fire immediately. >0 = schedule for that exact UNIX timestamp.
 * @param cycleData   — Required for CYCLE_COMPLETE.
 * @param operation   — The active timer notification operation.
 */
export const scheduleExactNotification = async (
  type: NotificationType,
  timestampMs: number,
  cycleData?: { completed: number },
  operation: NotificationOperation = beginNotificationOperation(),
): Promise<void> => {
  await enqueueNativeOperation(operation, async () => {
    if (!notificationsAvailable || !Notifications) return;

    let title = '';
    let body = '';

    switch (type) {
      case 'START_FOCUS':
        title = "🚀 Let's Begin!";
        body = 'Your focus session has started.\nStay focused!';
        break;
      case 'CYCLE_COMPLETE':
        title = `✅ Cycle ${cycleData?.completed} Completed!`;
        body = 'Great job!\nKeep going.';
        break;
      case 'ALL_COMPLETED':
        title = '🎉 Well Done!';
        body = 'All your focus cycles are completed.\nTake a longer break and recharge.';
        break;
    }

    try {
      if (timestampMs <= 0) {
        // Session start is delivered immediately and is not tracked as a
        // future pending milestone.
        const identifier = await Notifications.scheduleNotificationAsync({
          content: { title, body, sound: 'default' },
          trigger: { channelId: CHANNEL_ID },
        });

        if (!isNotificationOperationCurrent(operation)) {
          await Notifications.cancelScheduledNotificationAsync(identifier);
        }
        return;
      }

      // The service maintains at most one future timer milestone. Replacing a
      // future notification within the same operation is safe and targeted.
      if (pendingNotificationId) {
        await Notifications.cancelScheduledNotificationAsync(pendingNotificationId);
        pendingNotificationId = null;
      }

      if (!isNotificationOperationCurrent(operation)) return;

      const identifier = await Notifications.scheduleNotificationAsync({
        content: { title, body, sound: 'default' },
        trigger: {
          type: 'date',
          date: new Date(Math.max(Date.now() + 1000, timestampMs)),
          channelId: CHANNEL_ID,
        } as any,
      });

      if (!isNotificationOperationCurrent(operation)) {
        await Notifications.cancelScheduledNotificationAsync(identifier);
        return;
      }

      pendingNotificationId = identifier;
    } catch {
      // Silently fail. The timer remains authoritative when notifications are
      // unavailable or rejected by the operating system.
      pendingNotificationId = null;
    }
  });
};

/**
 * Invalidate every pending timer notification. Calls without an operation are
 * external cancellations (pause/reset/etc.) and therefore start a new one.
 */
export const cancelAllNotifications = async (
  operation: NotificationOperation = beginNotificationOperation(),
): Promise<void> => {
  await enqueueNativeOperation(operation, async () => {
    pendingNotificationId = null;

    if (!notificationsAvailable || !Notifications) return;

    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch {
      // Silently fail. A future replacement will still use its current token.
    }
  });
};

/**
 * Check if notifications are available and enabled.
 */
export const areNotificationsAvailable = (): boolean => {
  return notificationsAvailable;
};
