import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const locations = await prisma.location.findMany({
      where: {
        isActive: true,
      },
      include: {
        rooms: {
          orderBy: {
            displayOrder: "asc",
          },
        },
      },
      orderBy: {
        displayOrder: "asc",
      },
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
