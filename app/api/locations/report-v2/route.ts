import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { locationEvents } from "@/lib/location-events";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { catId, locationId, apartmentId } = await request.json();

    if (!catId || !locationId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Set exit time for previous location
    await prisma.locationReportV2.updateMany({
      where: {
        catId,
        exitTime: null,
      },
      data: {
        exitTime: new Date(),
      },
    });

    // Create new location report
    const report = await prisma.locationReportV2.create({
      data: {
        catId,
        userId: session.user.id,
        locationId,
        apartmentId: apartmentId || null,
        entryTime: new Date(),
      },
      include: {
        location: true,
        apartment: {
          include: {
            user: true,
          },
        },
      },
    });

    // Broadcast location update to all connected clients
    locationEvents.emit({
      catId,
      locationId,
      apartmentId: apartmentId || null,
      entryTime: report.entryTime,
      locationName: report.location.name,
      apartmentName: report.apartment?.name,
    });

    return NextResponse.json(report);
  } catch (error) {
    console.error("Failed to report location:", error);
    return NextResponse.json(
      { error: "Failed to report location" },
      { status: 500 }
    );
  }
}
