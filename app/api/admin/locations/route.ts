import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { auth } from "@/app/api/auth/[...nextauth]/route";

const createLocationSchema = z.object({
  externalId: z.string().min(1),
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  type: z.enum(["APARTMENT", "OUTDOOR", "BUILDING_COMMON"]),
  gridTop: z.string(),
  gridLeft: z.string(),
  gridWidth: z.string(),
  gridHeight: z.string(),
  displayOrder: z.number().int().optional(),
});

// GET all locations (admin only)
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const locations = await prisma.location.findMany({
      include: {
        apartments: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
          },
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

    const body = await request.json();
    const parseResult = createLocationSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const data = parseResult.data;

    const location = await prisma.location.create({
      data: {
        externalId: data.externalId,
        name: data.name,
        description: data.description || null,
        type: data.type,
        gridTop: data.gridTop,
        gridLeft: data.gridLeft,
        gridWidth: data.gridWidth,
        gridHeight: data.gridHeight,
        displayOrder: data.displayOrder || 0,
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
