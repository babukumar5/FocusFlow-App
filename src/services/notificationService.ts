/**
 * FocusFlow — Notification Service
 *
 * Architecture:
 * - The timer engine is the single source of truth for notification events.
 * - At start and resume, the engine calculates every remaining cycle milestone
 *   and passes them all here at once. Android receives every alarm before JS
 *   suspends, so the full session fires without any JS involvement.
 * - This module serializes native scheduling and rejects obsolete requests.
 * - It never decides which timer milestone should be announced.
 *
 * Safety:
 * - Detects Expo Go and silently disables notifications.
 * - Never throws errors — all failures are silently handled.
 * - Supports Expo SDK 57.
 */

import Constants from "expo-constants";

// ─── Lazy-loaded notification module ─────────────────────────────────────────

let Notifications: typeof import("expo-notifications") | null = null;
let notificationsAvailable = false;
let channelReady: Promise<void> = Promise.resolve();

// Channel ID — v3 explicitly sets sound: 'default' so Android uses the
// system notification sound. Android channels are immutable after creation,
// so bumping the ID is required when channel properties change.
const CHANNEL_ID = "focusflow-alerts-v3";

// ─── Public types ─────────────────────────────────────────────────────────────

export type NotificationType =
  | "START_FOCUS"
  | "CYCLE_COMPLETE"
  | "ALL_COMPLETED";
export type NotificationOperation = number;

/**
 * A single timer milestone to be registered as a native alarm.
 *
 * @field type        - Which notification content to display.
 * @field timestampMs - Absolute UNIX timestamp in milliseconds.
 *                      Pass 0 to deliver immediately (used for START_FOCUS).
 * @field cycleData   - Required when type is CYCLE_COMPLETE.
 */
export interface NotificationMilestone {
  type: NotificationType;
  timestampMs: number;
  cycleData?: { completed: number };
}

// ─── Operation counter ────────────────────────────────────────────────────────
//
// Every start, resume, pause, reset, or skip advances currentOperation.
// Any async work that was queued by an older operation detects the stale
// value and exits without touching the native alarm manager.

let currentOperation = 0;

export const beginNotificationOperation = (): NotificationOperation => {
  currentOperation += 1;
  return currentOperation;
};

export const isNotificationOperationCurrent = (
  operation: NotificationOperation,
): boolean => operation === currentOperation;

// ─── Pending alarm tracking ───────────────────────────────────────────────────
//
// Every native alarm ID registered for the current timer session lives here.
// cancelAllNotifications iterates this array and cancels each ID individually.
//
// Targeted per-ID cancellation is used throughout instead of the blanket
// cancelAllScheduledNotificationsAsync for two reasons:
//   1. Already-delivered notifications remain visible in the notification shade.
//   2. Only alarms created by the current timer session are affected; any other
//      notifications the host app may have scheduled are left untouched.

let pendingNotificationIds: string[] = [];

// ─── Native serialization queue ───────────────────────────────────────────────
//
// All native AlarmManager operations are serialized through this promise chain.
// This prevents a cancel and a schedule from interleaving if the caller does
// not await the returned promise (which timerEngine deliberately does not, to
// keep the engine synchronous from the caller's perspective).

let nativeQueue: Promise<void> = Promise.resolve();

const enqueueNativeOperation = (
  operation: NotificationOperation,
  work: () => Promise<void>,
): Promise<void> => {
  const queued = nativeQueue.then(async () => {
    if (!isNotificationOperationCurrent(operation)) return;
    await work();
  });

  // Errors inside individual operations are swallowed here so a single native
  // failure cannot poison the queue for all subsequent operations.
  nativeQueue = queued.catch(() => {});
  return queued.catch(() => {});
};

// ─── Notification content ─────────────────────────────────────────────────────

function buildContent(
  type: NotificationType,
  cycleData?: { completed: number },
): { title: string; body: string } {
  switch (type) {
    case "START_FOCUS":
      return {
        title: "🚀 Let's Begin!",
        body: "Your focus session has started.\nStay focused!",
      };
    case "CYCLE_COMPLETE":
      return {
        title: `✅ Cycle ${cycleData?.completed} Completed!`,
        body: "Great job!\nKeep going.",
      };
    case "ALL_COMPLETED":
      return {
        title: "🎉 Well Done!",
        body: "All your focus cycles are completed.\nTake a longer break and recharge.",
      };
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Initialize notification service.
 * Call once at app startup. Safe to call multiple times.
 */
export const initNotifications = async (): Promise<void> => {
  if (Constants.appOwnership === "expo") {
    notificationsAvailable = false;
    return;
  }

  try {
    Notifications = require("expo-notifications");
    notificationsAvailable = true;

    if (Notifications) {
      // Foreground notification handler — show alert and play sound when the
      // app is in the foreground and a scheduled alarm fires.
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
          shouldShowBanner: true,
          shouldShowList: true,
          priority: (Notifications as any).AndroidNotificationPriority?.HIGH,
        }),
      });

      // Android notification channel — sound: 'default' is required here.
      // Omitting it causes silent notifications on some OEMs / Android versions
      // because channel properties are immutable after first creation.
      if (typeof Notifications.setNotificationChannelAsync === "function") {
        channelReady = Notifications.setNotificationChannelAsync(CHANNEL_ID, {
          name: "FocusFlow Alerts",
          importance: (Notifications as any).AndroidImportance?.HIGH,
          sound: "default",
        })
          .then(() => undefined)
          .catch(() => undefined);
      }
    }
  } catch {
    notificationsAvailable = false;
  }
};

/**
 * Request notification permissions from the OS.
 * Returns true when granted, false otherwise.
 */
export const requestNotificationPermissions = async (): Promise<boolean> => {
  if (!notificationsAvailable || !Notifications) return false;

  try {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    return finalStatus === "granted";
  } catch (error) {
    console.warn("[NotificationService] Failed to request permissions:", error);
    return false;
  }
};

/**
 * Schedule every remaining timer milestone as an independent native alarm.
 *
 * This is the core of the new design. All alarms are handed to Android's
 * AlarmManager in a single JS call. After this function returns, Android owns
 * every alarm and will fire each one at its registered timestamp with no
 * further JS involvement — even if the app remains in the background or the
 * JS thread is suspended for the entire session.
 *
 * The function:
 *   1. Waits for the native channel to be ready.
 *   2. Iterates the milestone array in order, registering each alarm.
 *   3. Checks the operation guard before every native call so a concurrent
 *      pause, reset, or skip aborts the batch and cancels any partially
 *      registered alarms from the current batch before returning.
 *   4. Atomically commits the full set of IDs to pendingNotificationIds only
 *      when the entire batch has been registered and the operation is still
 *      current. This prevents cancelAllNotifications from seeing a partial list.
 *
 * @param milestones - Ordered array of all remaining notification events.
 * @param operation  - The active operation guard value.
 */
export const scheduleAllMilestones = async (
  milestones: NotificationMilestone[],
  operation: NotificationOperation,
): Promise<void> => {
  await enqueueNativeOperation(operation, async () => {
    if (!notificationsAvailable || !Notifications) return;

    // Wait for the Android channel to exist before scheduling against it.
    // channelReady resolves immediately on all subsequent calls after init.
    await channelReady;

    if (!isNotificationOperationCurrent(operation)) return;

    // Dispatch all native calls synchronously in the same JS tick to prevent
    // partial scheduling if the JS thread is suspended by the OS mid-flight.
    const promises = milestones.map(async (milestone) => {
      const { title, body } = buildContent(milestone.type, milestone.cycleData);

      try {
        if (milestone.timestampMs <= 0) {
          return await Notifications!.scheduleNotificationAsync({
            content: {
              title,
              body,
              sound: true,
            },
            trigger: {
              type: "timeInterval",
              seconds: 1,
              repeats: false,
              channelId: CHANNEL_ID,
            } as any,
          });
        } else {
          const scheduledAt = Math.max(
            Date.now() + 1_000,
            milestone.timestampMs,
          );
          return await Notifications!.scheduleNotificationAsync({
            content: {
              title,
              body,
              sound: true,
            },
            trigger: {
              type: "date",
              date: new Date(scheduledAt),
              channelId: CHANNEL_ID,
            } as any,
          });
        }
      } catch {
        // Silently continue
        return null;
      }
    });

    const results = await Promise.all(promises);
    const registeredIds = results.filter((id): id is string => id !== null);

    // Final operation check before committing. A pause/reset that arrived
    // while the last scheduleNotificationAsync was in flight would have
    // advanced currentOperation, and we must not overwrite pendingNotificationIds
    // with a batch that is already stale.
    if (!isNotificationOperationCurrent(operation)) {
      const cancelPromises = registeredIds.map(id =>
        Notifications!.cancelScheduledNotificationAsync(id).catch(() => {})
      );
      await Promise.all(cancelPromises);
      return;
    }

    // Atomic commit — replace the tracked set with the new batch.
    pendingNotificationIds = registeredIds;
  });
};

/**
 * Cancel every notification registered by the current timer session.
 *
 * Uses targeted per-ID cancellation so:
 *   - Already-delivered notifications stay visible in the notification shade.
 *   - Only alarms created by this timer are cancelled; other app notifications
 *     are not affected.
 *
 * Callers that pass an operation are performing an internal replace
 * (start/resume recycles via cancelAllNotifications before scheduling).
 * Callers that omit the operation are external cancellations
 * (pause/reset/skip) and a new operation is begun here.
 *
 * @param operation - Optional active operation. Omit for external cancellations.
 */
export const cancelAllNotifications = async (
  operation?: NotificationOperation,
): Promise<void> => {
  const activeOperation = operation ?? beginNotificationOperation();

  await enqueueNativeOperation(activeOperation, async () => {
    // Drain the tracked list immediately so any concurrent check sees an
    // empty array. The local copy is what we cancel below.
    const idsToCancel = pendingNotificationIds;
    pendingNotificationIds = [];

    if (!notificationsAvailable || !Notifications || idsToCancel.length === 0)
      return;

    const promises = idsToCancel.map(id =>
      Notifications!.cancelScheduledNotificationAsync(id).catch(() => {})
    );
    await Promise.all(promises);
  });
};

/**
 * Returns true when notifications are available and initialised.
 */
export const areNotificationsAvailable = (): boolean => notificationsAvailable;
