import { NextRequest } from "next/server";
import { locationEvents } from "@/lib/location-events";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const catId = searchParams.get("catId") || "rocky";

  // Create a readable stream for SSE
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection message
      const connectMessage = `data: ${JSON.stringify({ type: "connected", catId })}\n\n`;
      controller.enqueue(encoder.encode(connectMessage));

      // Subscribe to location updates
      const unsubscribe = locationEvents.subscribe((data) => {
        // Only send updates for the requested cat
        if (data.catId === catId) {
          const message = `data: ${JSON.stringify({ type: "location-update", ...data })}\n\n`;
          try {
            controller.enqueue(encoder.encode(message));
          } catch (error) {
            console.error("Error sending SSE message:", error);
          }
        }
      });

      // Send keepalive every 30 seconds
      const keepaliveInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": keepalive\n\n"));
        } catch (error) {
          clearInterval(keepaliveInterval);
        }
      }, 30000);

      // Cleanup on client disconnect
      request.signal.addEventListener("abort", () => {
        clearInterval(keepaliveInterval);
        unsubscribe();
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no", // Disable buffering in nginx
    },
  });
}
