import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { locationEvents } from "@/lib/location-events";
import { notifications } from "@/lib/services/notification";

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

    // Validate apartment ownership if apartmentId is provided
    if (apartmentId) {
      const apartment = await prisma.apartment.findUnique({
        where: { id: apartmentId },
      });

      if (!apartment) {
        return NextResponse.json(
          { error: "Apartment not found" },
          { status: 404 }
        );
      }

      if (apartment.userId && apartment.userId !== session.user.id) {
        return NextResponse.json(
          { error: "You can only report Rocky at your own apartment" },
          { status: 403 }
        );
      }
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

    // Send push notification to apartment owner if Rocky arrives at their apartment
    if (
      report.apartment?.userId &&
      report.apartment.userId !== session.user.id
    ) {
      notifications
        .rockyArrived(
          report.apartment.userId,
          report.location.name,
          report.apartment.name
        )
        .catch((err) => console.error("Push notification failed:", err));
    }

    return NextResponse.json(report);
  } catch (error) {
    console.error("Failed to report location:", error);
    return NextResponse.json(
      { error: "Failed to report location" },
      { status: 500 }
    );
  }
}
