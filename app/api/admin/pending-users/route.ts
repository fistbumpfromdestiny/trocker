import { NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/db";

// GET - List all pending user applications
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const pendingUsers = await prisma.pendingUser.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(pendingUsers);
  } catch (error) {
    console.error("Error fetching pending users:", error);
    return NextResponse.json(
      { error: "Failed to fetch pending users" },
      { status: 500 }
    );
  }
}
