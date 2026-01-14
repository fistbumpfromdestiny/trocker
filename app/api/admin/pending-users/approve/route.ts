import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/db";
import { approveApplicationSchema } from "@/lib/validations/invite";

// POST - Approve a pending user and create their account
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
    const validatedData = approveApplicationSchema.parse(body);

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

    // Check if user already exists (shouldn't happen, but safety check)
    const existingUser = await prisma.user.findUnique({
      where: { email: pendingUser.email },
    });

    if (existingUser) {
      // Mark as approved but don't create duplicate
      await prisma.pendingUser.update({
        where: { id: validatedData.pendingUserId },
        data: {
          status: "APPROVED",
          reviewedAt: new Date(),
          reviewedBy: session.user.id,
        },
      });

      return NextResponse.json({ user: existingUser });
    }

    // Create the user account
    const user = await prisma.user.create({
      data: {
        email: pendingUser.email,
        name: pendingUser.name,
        image: pendingUser.image,
        role: "USER",
      },
    });

    // Create the OAuth account link
    await prisma.account.create({
      data: {
        userId: user.id,
        type: "oauth",
        provider: pendingUser.provider,
        providerAccountId: pendingUser.providerAccountId,
      },
    });

    // Update pending user status
    await prisma.pendingUser.update({
      where: { id: validatedData.pendingUserId },
      data: {
        status: "APPROVED",
        reviewedAt: new Date(),
        reviewedBy: session.user.id,
      },
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Error approving user:", error);
    return NextResponse.json(
      { error: "Failed to approve user" },
      { status: 500 }
    );
  }
}
