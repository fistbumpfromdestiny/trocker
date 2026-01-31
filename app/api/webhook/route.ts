import { NextRequest, NextResponse } from "next/server";
import {
  validateWebhookSecret,
  handleArrival,
  handleDeparture,
  type WebhookPayload,
} from "@/lib/services/webhook";

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

    // Parse webhook payload
    const payload: WebhookPayload = await request.json();
    logWebhook("info", `Received ${payload.event}`, { visit_id: payload.visit_id });

    // Route to appropriate handler based on event type
    switch (payload.event) {
      case "rocky_arrived":
        await handleArrival(payload);
        logWebhook("info", `Successfully processed ${payload.event}`, { visit_id: payload.visit_id });
        return NextResponse.json({
          success: true,
          message: "Arrival event processed",
        });

      case "rocky_departed":
        await handleDeparture(payload);
        logWebhook("info", `Successfully processed ${payload.event}`, { visit_id: payload.visit_id });
        return NextResponse.json({
          success: true,
          message: "Departure event processed",
        });

      default:
        logWebhook("warn", `Unknown event type: ${(payload as any).event}`, { payload });
        return NextResponse.json(
          { error: `Unknown event type: ${(payload as any).event}` },
          { status: 400 }
        );
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logWebhook("error", `Failed to process webhook: ${errorMessage}`, {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      {
        error: "Internal server error",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
