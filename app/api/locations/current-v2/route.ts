import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const catId = searchParams.get("catId") || "rocky";

    const currentLocation = await prisma.locationReportV2.findFirst({
      where: {
        catId,
        exitTime: null,
      },
      include: {
        location: true,
        room: true,
      },
      orderBy: {
        entryTime: "desc",
      },
    });

    if (!currentLocation) {
      return NextResponse.json({
        locationId: null,
        exitTime: null,
        message: "Rocky has not been spotted yet"
      });
    }

    return NextResponse.json({
      locationId: currentLocation.locationId,
      roomId: currentLocation.roomId,
      locationType: currentLocation.location.type,
      exitTime: currentLocation.exitTime,
      entryTime: currentLocation.entryTime,
    });
  } catch (error) {
    console.error("Error getting current location:", error);
    return NextResponse.json(
      { error: "Failed to get current location" },
      { status: 500 }
    );
  }
}
