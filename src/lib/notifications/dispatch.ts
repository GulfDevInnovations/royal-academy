// src/lib/notifications/dispatch.ts

/**
 * Call this on the CLIENT after any action that creates a notification.
 * The NotificationBell listens for this event and refetches immediately.
 *
 * Usage (in any client component after a confirmed enrollment/reschedule):
 *   import { dispatchNotificationNew } from "@/lib/notifications/dispatch";
 *   dispatchNotificationNew();
 */
export function dispatchNotificationNew() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("notification:new"));
  }
}