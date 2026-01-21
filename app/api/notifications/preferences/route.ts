import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/db";
import { notificationPreferencesSchema } from "@/lib/validations/notification";

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
      cookieName: "__Secure-authjs.session-token",
    });

    if (!token?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const preferences = await prisma.notificationPreference.findUnique({
      where: { userId: String(token.id) },
    });

    // Return defaults if no preferences exist
    if (!preferences) {
      return NextResponse.json({
        enableMessages: true,
        enableArrival: true,
        enableDeparture: true,
        enableAllLocations: false,
        quietHoursEnabled: false,
        quietHoursStart: "22:00",
        quietHoursEnd: "07:00",
      });
    }

    return NextResponse.json(preferences);
  } catch (error: unknown) {
    console.error("Error fetching notification preferences:", error);
    return NextResponse.json(
      { error: "Failed to fetch preferences" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
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
    const data = notificationPreferencesSchema.parse(body);

    const preferences = await prisma.notificationPreference.upsert({
      where: { userId: String(token.id) },
      update: data,
      create: { userId: String(token.id), ...data },
    });

    return NextResponse.json(preferences);
  } catch (error: unknown) {
    console.error("Error updating notification preferences:", error);

    if (
      error instanceof Error &&
      "name" in error &&
      error.name === "ZodError"
    ) {
      return NextResponse.json(
        { error: "Invalid preferences data" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update preferences" },
      { status: 500 }
    );
  }
}
