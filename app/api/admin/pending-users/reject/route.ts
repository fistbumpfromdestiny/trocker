import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/db";
import { rejectApplicationSchema } from "@/lib/validations/invite";

// POST - Reject a pending user application
export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const validatedData = rejectApplicationSchema.parse(body);

    // Get pending user
    const pendingUser = await prisma.pendingUser.findUnique({
      where: { id: validatedData.pendingUserId },
    });

    if (!pendingUser) {
      return NextResponse.json(
        { error: "Pending user not found" },
        { status: 404 }
      );
    }

    if (pendingUser.status !== "PENDING") {
      return NextResponse.json(
        { error: "Application already processed" },
        { status: 400 }
      );
    }

    // Update pending user status
    await prisma.pendingUser.update({
      where: { id: validatedData.pendingUserId },
      data: {
        status: "REJECTED",
        reviewedAt: new Date(),
        reviewedBy: session.user.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error rejecting user:", error);
    return NextResponse.json(
      { error: "Failed to reject user" },
      { status: 500 }
    );
  }
}
