import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/db";
import { subscribeSchema } from "@/lib/validations/notification";

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
      cookieName: "__Secure-authjs.session-token",
    });

    if (!token?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { subscription, userAgent } = subscribeSchema.parse(body);

    // Check if endpoint is already registered to a different user
    const existingSubscription = await prisma.pushSubscription.findUnique({
      where: { endpoint: subscription.endpoint },
    });

    if (existingSubscription && existingSubscription.userId !== String(token.id)) {
      // Delete the old subscription - the new user is now using this device
      await prisma.pushSubscription.delete({
        where: { endpoint: subscription.endpoint },
      });
    }

    // Upsert subscription for current user
    const pushSubscription = await prisma.pushSubscription.upsert({
      where: { endpoint: subscription.endpoint },
      update: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        userAgent,
      },
      create: {
        userId: String(token.id),
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        userAgent,
      },
    });

    // Ensure user has notification preferences (create defaults if not)
    await prisma.notificationPreference.upsert({
      where: { userId: String(token.id) },
      update: {},
      create: { userId: String(token.id) },
    });

    return NextResponse.json({ success: true, id: pushSubscription.id });
  } catch (error: unknown) {
    console.error("Error subscribing to push notifications:", error);

    if (
      error instanceof Error &&
      "name" in error &&
      error.name === "ZodError"
    ) {
      return NextResponse.json(
        { error: "Invalid subscription data" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to subscribe to notifications" },
      { status: 500 }
    );
  }
}
