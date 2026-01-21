import { NextRequest, NextResponse } from "next/server";
import {
  validateWebhookSecret,
  handleArrival,
  handleDeparture,
  type WebhookPayload,
} from "@/lib/services/webhook";

export async function POST(request: NextRequest) {
  try {
    // Validate webhook secret
    const authHeader = request.headers.get("authorization");
    if (!validateWebhookSecret(authHeader)) {
      return NextResponse.json(
        { error: "Unauthorized - invalid webhook secret" },
        { status: 401 }
      );
    }

    // Parse webhook payload
    const payload: WebhookPayload = await request.json();

    // Route to appropriate handler based on event type
    switch (payload.event) {
      case "rocky_arrived":
        await handleArrival(payload);
        return NextResponse.json({
          success: true,
          message: "Arrival event processed",
        });

      case "rocky_departed":
        await handleDeparture(payload);
        return NextResponse.json({
          success: true,
          message: "Departure event processed",
        });

      default:
        return NextResponse.json(
          { error: `Unknown event type: ${(payload as any).event}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
