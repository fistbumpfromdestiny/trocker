import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/app/api/auth/[...nextauth]/route";

// GET all locations (admin only)
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const locations = await prisma.location.findMany({
      include: {
        rooms: {
          orderBy: { displayOrder: "asc" },
        },
      },
      orderBy: { displayOrder: "asc" },
    });

    return NextResponse.json(locations);
  } catch (error) {
    console.error("Failed to fetch locations:", error);
    return NextResponse.json(
      { error: "Failed to fetch locations" },
      { status: 500 }
    );
  }
}

// POST create new location (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    const { externalId, name, description, type, gridTop, gridLeft, gridWidth, gridHeight, displayOrder } = data;

    if (!externalId || !name || !type || !gridTop || !gridLeft || !gridWidth || !gridHeight) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const location = await prisma.location.create({
      data: {
        externalId,
        name,
        description: description || null,
        type,
        gridTop,
        gridLeft,
        gridWidth,
        gridHeight,
        displayOrder: displayOrder || 0,
        isActive: true,
      },
    });

    return NextResponse.json(location);
  } catch (error) {
    console.error("Failed to create location:", error);
    return NextResponse.json(
      { error: "Failed to create location" },
      { status: 500 }
    );
  }
}
