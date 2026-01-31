import { prisma } from "@/lib/db";
import { locationEvents } from "@/lib/location-events";
import { messageEvents } from "@/lib/message-events";

const ROCKEYE_USER_ID = "rockeye-system";

interface ArrivalWebhook {
  event: "rocky_arrived";
  visit_id: string;
  timestamp: string; // ISO8601
  snapshot_base64?: string;
}

interface DepartureWebhook {
  event: "rocky_departed";
  visit_id: string;
  arrival_time: string; // ISO8601
  departure_time: string; // ISO8601
  duration_seconds: number;
  duration_human: string;
  detection_count: number;
  snapshot_base64?: string;
}

export type WebhookPayload = ArrivalWebhook | DepartureWebhook;

/**
 * Validates webhook secret from Authorization header
 */
export function validateWebhookSecret(authHeader: string | null): boolean {
  const expectedSecret = process.env.WEBHOOK_SECRET;

  if (!expectedSecret) {
    console.error("WEBHOOK_SECRET not configured");
    return false;
  }

  if (!authHeader) {
    return false;
  }

  // Support both "Bearer <token>" and raw token
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : authHeader;

  return token === expectedSecret;
}

/**
 * Handles rocky_arrived webhook event
 * Creates a new location report and posts a message to chat
 */
export async function handleArrival(payload: ArrivalWebhook) {
  const entryTime = new Date(payload.timestamp);

  // Get Rocky's cat ID
  const rocky = await prisma.cat.findFirst({
    where: { name: "Rocky" },
  });

  if (!rocky) {
    throw new Error("Rocky not found in database");
  }

  // Get The Castle location
  const castleLocation = await prisma.location.findFirst({
    where: { externalId: "building-10" }, // The Castle
  });

  if (!castleLocation) {
    throw new Error("The Castle location not found");
  }

  // Get The Balcony apartment
  const balconyApartment = await prisma.apartment.findFirst({
    where: {
      locationId: castleLocation.id,
      name: "The Balcony",
    },
  });

  if (!balconyApartment) {
    throw new Error("The Balcony apartment not found");
  }

  // Set exit time for any current location
  await prisma.locationReportV2.updateMany({
    where: {
      catId: rocky.id,
      exitTime: null,
    },
    data: {
      exitTime: entryTime,
    },
  });

  // Create new location report
  const report = await prisma.locationReportV2.create({
    data: {
      catId: rocky.id,
      userId: ROCKEYE_USER_ID,
      locationId: castleLocation.id,
      apartmentId: balconyApartment.id,
      entryTime,
      notes: `Detected by camera (visit ${payload.visit_id})`,
    },
    include: {
      location: true,
      apartment: true,
    },
  });

  // Broadcast location update
  locationEvents.emit({
    catId: rocky.id,
    locationId: castleLocation.id,
    apartmentId: balconyApartment.id,
    entryTime: report.entryTime,
    locationName: report.location.name,
    apartmentName: report.apartment?.name,
  });

  // Post message to chat
  const locationName = report.apartment
    ? `${report.location.name} - ${report.apartment.name}`
    : report.location.name;

  const timeStr = entryTime.toLocaleTimeString("sv-SE", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const message = await prisma.message.create({
    data: {
      userId: ROCKEYE_USER_ID,
      content: `🚨 Rocky detected at ${locationName}! Spotted at ${timeStr} 🐱`,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  // Emit event for real-time SSE broadcast
  messageEvents.emit({
    messageId: message.id,
    content: message.content,
    userId: message.userId,
    userName: message.user.name,
    userEmail: message.user.email,
    createdAt: message.createdAt,
    updatedAt: message.updatedAt,
    deletedAt: null,
  });

  return report;
}

/**
 * Handles rocky_departed webhook event
 * Updates the location report with exit time and posts a message to chat
 */
export async function handleDeparture(payload: DepartureWebhook) {
  const exitTime = new Date(payload.departure_time);
  const entryTime = new Date(payload.arrival_time);

  // Get Rocky's cat ID
  const rocky = await prisma.cat.findFirst({
    where: { name: "Rocky" },
  });

  if (!rocky) {
    throw new Error("Rocky not found in database");
  }

  // Find the most recent location report matching this visit
  // We look for reports around the entry time
  const report = await prisma.locationReportV2.findFirst({
    where: {
      catId: rocky.id,
      entryTime: {
        gte: new Date(entryTime.getTime() - 5000), // 5 second tolerance
        lte: new Date(entryTime.getTime() + 5000),
      },
      exitTime: null,
    },
    orderBy: {
      entryTime: "desc",
    },
  });

  if (report) {
    // Update exit time for this report
    await prisma.locationReportV2.update({
      where: { id: report.id },
      data: {
        exitTime,
        notes: report.notes
          ? `${report.notes} | Duration: ${payload.duration_human}, Detections: ${payload.detection_count}`
          : `Duration: ${payload.duration_human}, Detections: ${payload.detection_count}`,
      },
    });
  }

  return report;
}
