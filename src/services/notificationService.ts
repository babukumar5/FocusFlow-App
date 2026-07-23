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
let channelReady: Promise<void> = Promise.resolve();

// Channel ID — v3 explicitly sets sound: 'default' so Android uses the
// system notification sound. v2 was created without an explicit sound
// property, which led to inconsistent audio on some devices. Android
// channels are immutable after creation, so bumping the ID is required.
const CHANNEL_ID = 'focusflow-alerts-v3';

export type NotificationType = 'START_FOCUS' | 'CYCLE_COMPLETE' | 'ALL_COMPLETED';
export type NotificationOperation = number;

// Every replacement or cancellation advances this value. Work queued by an
// older operation becomes a no-op, preventing stale async calls from adding a
// notification after a newer timer action has replaced or cancelled it.
let currentOperation = 0;
let pendingNotificationId: string | null = null;
let pendingNotificationTimestampMs: number | null = null;
let nativeQueue: Promise<void> = Promise.resolve();

const NOTIFICATION_DELIVERY_GRACE_MS = 2_000;

const delay = (milliseconds: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

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

      // Android notification channel — uses the system default notification
      // sound. The explicit `sound: 'default'` is required; omitting it can
      // cause silent notifications on some OEMs / Android versions.
      if (typeof Notifications.setNotificationChannelAsync === 'function') {
        channelReady = Notifications.setNotificationChannelAsync(CHANNEL_ID, {
          name: 'FocusFlow Alerts',
          importance: (Notifications as any).AndroidImportance?.HIGH,
          sound: 'default',
        }).then(() => undefined).catch(() => undefined);
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

    // Do not schedule against the channel before Android has created it.
    await channelReady;

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

      const scheduledTimestampMs = Math.max(Date.now() + 1000, timestampMs);

      // The service maintains at most one future timer milestone. Replacing a
      // future notification within the same operation is safe and targeted.
      if (pendingNotificationId) {
        await waitForDueNotificationDelivery(operation);
        if (!isNotificationOperationCurrent(operation)) return;

        await Notifications.cancelScheduledNotificationAsync(pendingNotificationId);
        pendingNotificationId = null;
        pendingNotificationTimestampMs = null;
      }

      if (!isNotificationOperationCurrent(operation)) return;

      const identifier = await Notifications.scheduleNotificationAsync({
        content: { title, body, sound: 'default' },
        trigger: {
          type: 'date',
          date: new Date(scheduledTimestampMs),
          channelId: CHANNEL_ID,
        } as any,
      });

      if (!isNotificationOperationCurrent(operation)) {
        await Notifications.cancelScheduledNotificationAsync(identifier);
        return;
      }

      pendingNotificationId = identifier;
      pendingNotificationTimestampMs = scheduledTimestampMs;
    } catch {
      // Silently fail. The timer remains authoritative when notifications are
      // unavailable or rejected by the operating system.
      pendingNotificationId = null;
      pendingNotificationTimestampMs = null;
    }
  });
};

/**
 * A Break-end notification and the JS timer callback have the same deadline.
 * Do not cancel a notification that is already due (or due within the small
 * delivery grace window); wait until Android removes it from its scheduled
 * queue instead. This lets the native alarm win the boundary race. A newer
 * operation (pause/reset/etc.) invalidates the wait immediately.
 */
const waitForDueNotificationDelivery = async (
  operation: NotificationOperation,
): Promise<void> => {
  if (
    !Notifications ||
    typeof Notifications.getAllScheduledNotificationsAsync !== 'function' ||
    pendingNotificationId === null ||
    pendingNotificationTimestampMs === null ||
    pendingNotificationTimestampMs - Date.now() > NOTIFICATION_DELIVERY_GRACE_MS
  ) {
    return;
  }

  const notificationId = pendingNotificationId;

  while (isNotificationOperationCurrent(operation)) {
    const millisecondsUntilDue = pendingNotificationTimestampMs - Date.now();
    if (millisecondsUntilDue > 0) {
      await delay(millisecondsUntilDue);
    }

    if (!isNotificationOperationCurrent(operation)) return;

    try {
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      if (!scheduled.some(({ identifier }) => identifier === notificationId)) {
        return;
      }
    } catch {
      // If the native queue cannot be inspected, leave the notification in
      // place. It is safer to let the due alarm fire than to cancel it blindly.
      await delay(100);
      continue;
    }

    await delay(100);
  }
};

/**
 * Invalidate the pending timer notification. Calls without an operation are
 * external cancellations (pause/reset/etc.) and therefore start a new one.
 *
 * Uses targeted cancellation (cancelScheduledNotificationAsync) instead of
 * the blanket cancelAllScheduledNotificationsAsync. This is critical because:
 *   1. Already-delivered notifications remain in the notification shade.
 *   2. Cycle notifications that Android's alarm has already fired are not
 *      wiped during catch-up or phase transitions.
 */
export const cancelAllNotifications = async (
  operation?: NotificationOperation,
): Promise<void> => {
  const activeOperation = operation ?? beginNotificationOperation();
  const isReplacement = operation !== undefined;

  await enqueueNativeOperation(activeOperation, async () => {
    if (isReplacement) {
      await waitForDueNotificationDelivery(activeOperation);
      if (!isNotificationOperationCurrent(activeOperation)) return;
    }

    const idToCancel = pendingNotificationId;
    pendingNotificationId = null;
    pendingNotificationTimestampMs = null;

    if (!notificationsAvailable || !Notifications || !idToCancel) return;

    try {
      await Notifications.cancelScheduledNotificationAsync(idToCancel);
    } catch {
      // Silently fail. The notification may have already been delivered by
      // Android's alarm — that is the desired outcome.
    }
  });
};

/**
 * Check if notifications are available and enabled.
 */
export const areNotificationsAvailable = (): boolean => {
  return notificationsAvailable;
};
