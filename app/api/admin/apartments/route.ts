import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/app/api/auth/[...nextauth]/route";

// GET all apartments (admin only)
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const apartments = await prisma.apartment.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        _count: {
          select: {
            locationReports: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(apartments);
  } catch (error) {
    console.error("Failed to fetch apartments:", error);
    return NextResponse.json(
      { error: "Failed to fetch apartments" },
      { status: 500 }
    );
  }
}

// POST create new apartment (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    const { userId, name, description, locationId, displayOrder } = data;

    if (!userId || !name) {
      return NextResponse.json(
        { error: "User ID and name are required" },
        { status: 400 }
      );
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Verify location exists if provided
    if (locationId) {
      const location = await prisma.location.findUnique({
        where: { id: locationId },
      });

      if (!location) {
        return NextResponse.json(
          { error: "Location not found" },
          { status: 404 }
        );
      }
    }

    const apartment = await prisma.apartment.create({
      data: {
        userId,
        name,
        description: description || null,
        locationId: locationId || null,
        displayOrder: displayOrder || 0,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(apartment);
  } catch (error) {
    console.error("Failed to create apartment:", error);
    return NextResponse.json(
      { error: "Failed to create apartment" },
      { status: 500 }
    );
  }
}
