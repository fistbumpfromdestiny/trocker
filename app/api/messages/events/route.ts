import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { messageEvents } from "@/lib/message-events";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  // Check authentication
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
      cookieName: '__Secure-authjs.session-token',
  });

  if (!token || !token.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection message
      const connectMessage = `data: ${JSON.stringify({ type: "connected", userId: token.id })}\n\n`;
      controller.enqueue(encoder.encode(connectMessage));

      // Subscribe to message events
      const unsubscribe = messageEvents.subscribe((data) => {
        const message = `data: ${JSON.stringify({ type: "message", ...data })}\n\n`;
        try {
          controller.enqueue(encoder.encode(message));
        } catch (error) {
          console.error("Error sending SSE message:", error);
        }
      });

      // Keep-alive interval
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
      "X-Accel-Buffering": "no",
    },
  });
}
