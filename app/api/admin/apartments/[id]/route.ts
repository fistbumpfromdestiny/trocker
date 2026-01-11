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
    const { userId, name, description } = data;

    if (!userId || !name) {
      return NextResponse.json(
        { error: "User ID and name are required" },
        { status: 400 }
      );
    }

    // Verify user exists if changing owner
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const apartment = await prisma.apartment.update({
      where: { id },
      data: {
        userId,
        name,
        description: description || null,
        updatedAt: new Date(),
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
