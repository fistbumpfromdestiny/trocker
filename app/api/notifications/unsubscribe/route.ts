import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/db";

export async function DELETE(request: NextRequest) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
      cookieName: "__Secure-authjs.session-token",
    });

    if (!token?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get("endpoint");

    // Validate endpoint if provided
    if (endpoint) {
      if (endpoint.length > 2000) {
        return NextResponse.json({ error: "Invalid endpoint" }, { status: 400 });
      }
      try {
        new URL(endpoint);
      } catch {
        return NextResponse.json({ error: "Invalid endpoint URL" }, { status: 400 });
      }
    }

    if (endpoint) {
      // Delete specific subscription
      await prisma.pushSubscription.deleteMany({
        where: { userId: String(token.id), endpoint },
      });
    } else {
      // Delete all subscriptions for user
      await prisma.pushSubscription.deleteMany({
        where: { userId: String(token.id) },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Error unsubscribing from push notifications:", error);
    return NextResponse.json(
      { error: "Failed to unsubscribe from notifications" },
      { status: 500 }
    );
  }
}
