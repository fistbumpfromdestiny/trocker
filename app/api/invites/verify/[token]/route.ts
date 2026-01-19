import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const invite = await prisma.userInvite.findUnique({
      where: { token },
    });

    if (!invite) {
      return NextResponse.json(
        { error: "Invitation not found", valid: false },
        { status: 404 }
      );
    }

    // Check if expired
    if (new Date() > invite.expiresAt) {
      return NextResponse.json(
        {
          email: invite.email,
          valid: false,
          expired: true,
          used: false
        },
        { status: 400 }
      );
    }

    // Check if already used
    if (invite.status !== "PENDING") {
      return NextResponse.json(
        {
          email: invite.email,
          valid: false,
          expired: false,
          used: true
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      email: invite.email,
      valid: true,
      expired: false,
      used: false
    });
  } catch (error) {
    console.error("Error verifying invite:", error);
    return NextResponse.json(
      { error: "Failed to verify invitation", valid: false },
      { status: 500 }
    );
  }
}
