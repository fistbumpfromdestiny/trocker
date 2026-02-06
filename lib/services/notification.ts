import webpush from "web-push";
import { prisma } from "@/lib/db";

// Configure web-push with VAPID keys
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:admin@trocker.app",
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

export interface NotificationPayload {
  title: string;
  body: string;
  url?: string;
  type: "message" | "arrival" | "departure" | "system";
  tag?: string;
  renotify?: boolean;
  requireInteraction?: boolean;
  actions?: Array<{ action: string; title: string }>;
}

// Parse time string "HH:MM" to minutes since midnight, returns null if invalid
function parseTimeToMinutes(timeStr: string): number | null {
  const match = timeStr.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;

  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);

  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;

  return hours * 60 + minutes;
}

// Check if user is in quiet hours
function isInQuietHours(preferences: {
  quietHoursEnabled: boolean;
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
}): boolean {
  if (!preferences.quietHoursEnabled) return false;
  if (!preferences.quietHoursStart || !preferences.quietHoursEnd) return false;

  const startTime = parseTimeToMinutes(preferences.quietHoursStart);
  const endTime = parseTimeToMinutes(preferences.quietHoursEnd);

  // If parsing fails, don't enforce quiet hours
  if (startTime === null || endTime === null) return false;

  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();

  // Handle overnight quiet hours (e.g., 22:00 to 07:00)
  if (startTime > endTime) {
    return currentTime >= startTime || currentTime < endTime;
  }

  return currentTime >= startTime && currentTime < endTime;
}

// Send notification to a specific user
export async function sendNotificationToUser(
  userId: string,
  payload: NotificationPayload,
  options?: { skipPreferenceCheck?: boolean }
): Promise<{ sent: number; failed: number }> {
  // Get user preferences
  const preferences = await prisma.notificationPreference.findUnique({
    where: { userId },
  });

  // Check preferences unless skipped
  if (!options?.skipPreferenceCheck && preferences) {
    // Check quiet hours
    if (isInQuietHours(preferences)) {
      return { sent: 0, failed: 0 };
    }

    // Check notification type preference
    switch (payload.type) {
      case "message":
        if (!preferences.enableMessages) return { sent: 0, failed: 0 };
        break;
      case "arrival":
        if (!preferences.enableArrival) return { sent: 0, failed: 0 };
        break;
      case "departure":
        if (!preferences.enableDeparture) return { sent: 0, failed: 0 };
        break;
      case "system":
        // System notifications always sent unless quiet hours
        break;
    }
  }

  // Get all push subscriptions for user
  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId },
  });

  if (subscriptions.length === 0) {
    return { sent: 0, failed: 0 };
  }

  let sent = 0;
  let failed = 0;
  const failedEndpoints: string[] = [];

  // Send to all subscribed devices
  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        },
        JSON.stringify(payload)
      );
      sent++;
    } catch (error: unknown) {
      failed++;
      // If subscription is expired or invalid, mark for deletion
      const statusCode = (error as { statusCode?: number }).statusCode;
      if (statusCode === 404 || statusCode === 410) {
        failedEndpoints.push(sub.endpoint);
      }
      console.error(
        `Failed to send notification to ${sub.endpoint}:`,
        error instanceof Error ? error.message : error
      );
    }
  }

  // Clean up expired subscriptions
  if (failedEndpoints.length > 0) {
    await prisma.pushSubscription.deleteMany({
      where: { endpoint: { in: failedEndpoints } },
    });
  }

  return { sent, failed };
}

// Send notification to multiple users
export async function sendNotificationToUsers(
  userIds: string[],
  payload: NotificationPayload
): Promise<{ total: number; sent: number; failed: number }> {
  const results = await Promise.all(
    userIds.map((userId) => sendNotificationToUser(userId, payload))
  );

  const totalSent = results.reduce((sum, r) => sum + r.sent, 0);
  const totalFailed = results.reduce((sum, r) => sum + r.failed, 0);

  return { total: userIds.length, sent: totalSent, failed: totalFailed };
}

// Send notification to all users except specified ones
export async function broadcastNotification(
  payload: NotificationPayload,
  excludeUserIds: string[] = []
): Promise<{ total: number; sent: number; failed: number }> {
  const users = await prisma.user.findMany({
    where: {
      id: { notIn: excludeUserIds },
    },
    select: { id: true },
  });

  return sendNotificationToUsers(
    users.map((u) => u.id),
    payload
  );
}

// Notification helpers for common scenarios
export const notifications = {
  // New chat message
  async newMessage(
    message: { content: string; userName: string | null },
    senderId: string
  ) {
    const truncatedContent =
      message.content.length > 100
        ? message.content.substring(0, 100) + "..."
        : message.content;

    return broadcastNotification(
      {
        title: message.userName || "New Message",
        body: truncatedContent,
        type: "message",
        url: "/messages",
        tag: "chat-message",
        renotify: true,
      },
      [senderId] // Don't notify the sender
    );
  },

  // Rocky arrived at apartment
  async rockyArrived(
    apartmentOwnerId: string,
    locationName: string,
    apartmentName?: string
  ) {
    const fullLocation = apartmentName
      ? `${locationName} - ${apartmentName}`
      : locationName;

    return sendNotificationToUser(apartmentOwnerId, {
      title: "Rocky has arrived!",
      body: `Rocky just arrived at ${fullLocation}`,
      type: "arrival",
      url: "/",
      tag: "rocky-arrival",
      requireInteraction: true,
    });
  },

  // Rocky departed from apartment
  async rockyDeparted(
    apartmentOwnerId: string,
    locationName: string,
    apartmentName?: string
  ) {
    const fullLocation = apartmentName
      ? `${locationName} - ${apartmentName}`
      : locationName;

    return sendNotificationToUser(apartmentOwnerId, {
      title: "Rocky has left",
      body: `Rocky just left ${fullLocation}`,
      type: "departure",
      url: "/",
      tag: "rocky-departure",
    });
  },
};
