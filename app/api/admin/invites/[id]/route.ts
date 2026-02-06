import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/db";
import { sendInviteEmail } from "@/lib/email";

// POST - Resend invite email
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    const invite = await prisma.userInvite.findUnique({
      where: { id },
    });

    if (!invite) {
      return NextResponse.json(
        { error: "Invite not found" },
        { status: 404 }
      );
    }

    if (invite.status !== "PENDING") {
      return NextResponse.json(
        { error: "Can only resend pending invites" },
        { status: 400 }
      );
    }

    if (new Date() > invite.expiresAt) {
      return NextResponse.json(
        { error: "Invite has expired. Please create a new invite." },
        { status: 400 }
      );
    }

    // Resend the invite email
    const inviteUrl = `${process.env.NEXTAUTH_URL}/invite/${invite.token}`;
    await sendInviteEmail(invite.email, inviteUrl);

    return NextResponse.json({ success: true, message: "Invite resent successfully" });
  } catch (error) {
    console.error("Error resending invite:", error);
    return NextResponse.json(
      { error: "Failed to resend invite" },
      { status: 500 }
    );
  }
}

// DELETE - Revoke an invite
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    await prisma.userInvite.update({
      where: { id },
      data: { status: "REVOKED" },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error revoking invite:", error);
    return NextResponse.json(
      { error: "Failed to revoke invite" },
      { status: 500 }
    );
  }
}
