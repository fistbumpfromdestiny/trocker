import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/app/api/auth/[...nextauth]/route";

// GET single apartment
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || !session.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const apartment = await prisma.apartment.findUnique({
      where: { id },
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

    if (!apartment) {
      return NextResponse.json({ error: "Apartment not found" }, { status: 404 });
    }

    return NextResponse.json(apartment);
  } catch (error) {
    console.error("Failed to fetch apartment:", error);
    return NextResponse.json(
      { error: "Failed to fetch apartment" },
      { status: 500 }
    );
  }
}

// PUT update apartment
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || !session.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const data = await request.json();
    const { userId, name, description, locationId, displayOrder } = data;

    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    // Verify user exists if userId is provided
    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return NextResponse.json(
          { error: "User not found" },
          { status: 404 }
        );
      }
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

    const apartment = await prisma.apartment.update({
      where: { id },
      data: {
        userId: userId || null,
        name,
        description: description || null,
        locationId: locationId || null,
        displayOrder: displayOrder !== undefined ? displayOrder : undefined,
        updatedAt: new Date(),
      },
      include: {
        user: userId ? {
          select: {
            id: true,
            email: true,
            name: true,
          },
        } : false,
      },
    });

    return NextResponse.json(apartment);
  } catch (error) {
    console.error("Failed to update apartment:", error);
    return NextResponse.json(
      { error: "Failed to update apartment" },
      { status: 500 }
    );
  }
}

// DELETE apartment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || !session.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    await prisma.apartment.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Apartment deleted successfully" });
  } catch (error) {
    console.error("Failed to delete apartment:", error);
    return NextResponse.json(
      { error: "Failed to delete apartment" },
      { status: 500 }
    );
  }
}
