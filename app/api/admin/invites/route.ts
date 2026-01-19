import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/db";
import { sendInviteSchema } from "@/lib/validations/invite";
import { randomBytes } from "crypto";
import { sendInviteEmail } from "@/lib/email";

// GET - List all invites
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const invites = await prisma.userInvite.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(invites);
  } catch (error) {
    console.error("Error fetching invites:", error);
    return NextResponse.json(
      { error: "Failed to fetch invites" },
      { status: 500 }
    );
  }
}

// POST - Send new invite
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
    const validatedData = sendInviteSchema.parse(body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    // Delete any existing invites for this email (pending, expired, or used)
    await prisma.userInvite.deleteMany({
      where: {
        email: validatedData.email,
      },
    });

    // Generate secure token
    const token = randomBytes(32).toString("hex");

    // Calculate expiry date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + validatedData.expiresInDays);

    // Create invite
    const invite = await prisma.userInvite.create({
      data: {
        email: validatedData.email,
        token,
        createdBy: session.user.id,
        expiresAt,
        status: "PENDING",
      },
    });

    // Send invite email
    try {
      const inviteUrl = `${process.env.NEXTAUTH_URL}/invite/${token}`;
      await sendInviteEmail(validatedData.email, inviteUrl);
    } catch (emailError) {
      console.error("Failed to send invite email:", emailError);
      // Don't fail the whole request if email fails
      // The invite is still created and can be resent
    }

    return NextResponse.json(invite);
  } catch (error) {
    console.error("Error creating invite:", error);
    return NextResponse.json(
      { error: "Failed to create invite" },
      { status: 500 }
    );
  }
}
