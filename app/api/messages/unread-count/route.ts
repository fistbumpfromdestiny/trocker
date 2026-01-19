import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
      cookieName: '__Secure-authjs.session-token',
    });

    if (!token || !token.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's last read timestamp
    const messageRead = await prisma.messageRead.findUnique({
      where: {
        userId: token.id,
      },
    });

    // If no record exists, count all messages as unread
    const lastReadAt = messageRead?.lastReadAt || new Date(0);

    // Count messages created after lastReadAt
    const count = await prisma.message.count({
      where: {
        createdAt: {
          gt: lastReadAt,
        },
        userId: {
          not: token.id, // Exclude own messages
        },
        deletedAt: null, // Exclude deleted messages
      },
    });

    return NextResponse.json({
      hasUnread: count > 0,
      count,
    });
  } catch (error: unknown) {
    console.error("Error getting unread count:", error);
    return NextResponse.json(
      { error: "Failed to get unread count" },
      { status: 500 }
    );
  }
}
