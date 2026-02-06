import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  validateWebhookSecret,
  handleArrival,
  handleDeparture,
} from "@/lib/services/webhook";

const arrivalSchema = z.object({
  event: z.literal("rocky_arrived"),
  visit_id: z.string().min(1),
  timestamp: z.string().datetime(),
  snapshot_base64: z.string().optional(),
});

const departureSchema = z.object({
  event: z.literal("rocky_departed"),
  visit_id: z.string().min(1),
  arrival_time: z.string().datetime(),
  departure_time: z.string().datetime(),
  duration_seconds: z.number().int().nonnegative(),
  duration_human: z.string(),
  detection_count: z.number().int().nonnegative(),
  snapshot_base64: z.string().optional(),
});

const webhookPayloadSchema = z.discriminatedUnion("event", [
  arrivalSchema,
  departureSchema,
]);

function logWebhook(level: "info" | "warn" | "error", message: string, data?: object) {
  const timestamp = new Date().toISOString();
  const logData = data ? ` ${JSON.stringify(data)}` : "";
  console[level](`[${timestamp}] [webhook] ${message}${logData}`);
}

export async function POST(request: NextRequest) {
  try {
    // Validate webhook secret
    const authHeader = request.headers.get("authorization");
    if (!validateWebhookSecret(authHeader)) {
      logWebhook("warn", "Authentication failed - invalid or missing webhook secret");
      return NextResponse.json(
        { error: "Unauthorized - invalid webhook secret" },
        { status: 401 }
      );
    }

    // Parse and validate webhook payload
    const body = await request.json();
    const parseResult = webhookPayloadSchema.safeParse(body);

    if (!parseResult.success) {
      logWebhook("warn", "Invalid webhook payload", { errors: parseResult.error.flatten() });
      return NextResponse.json(
        { error: "Invalid webhook payload" },
        { status: 400 }
      );
    }

    const payload = parseResult.data;
    logWebhook("info", `Received ${payload.event}`, { visit_id: payload.visit_id });

    // Route to appropriate handler based on event type
    if (payload.event === "rocky_arrived") {
      await handleArrival(payload);
      logWebhook("info", `Successfully processed ${payload.event}`, { visit_id: payload.visit_id });
      return NextResponse.json({
        success: true,
        message: "Arrival event processed",
      });
    } else {
      await handleDeparture(payload);
      logWebhook("info", `Successfully processed ${payload.event}`, { visit_id: payload.visit_id });
      return NextResponse.json({
        success: true,
        message: "Departure event processed",
      });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logWebhook("error", `Failed to process webhook: ${errorMessage}`, {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
