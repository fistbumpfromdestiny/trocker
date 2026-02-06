import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/db";
import { sendMessageSchema } from "@/lib/validations/message";
import { messageEvents } from "@/lib/message-events";
import { notifications } from "@/lib/services/notification";

// GET - Fetch messages with pagination
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

    const { searchParams } = new URL(request.url);
    const limitParam = parseInt(searchParams.get("limit") || "50", 10);
    const offsetParam = parseInt(searchParams.get("offset") || "0", 10);
    const limit = Math.min(Math.max(isNaN(limitParam) ? 50 : limitParam, 1), 100);
    const offset = Math.max(isNaN(offsetParam) ? 0 : offsetParam, 0);
    const before = searchParams.get("before"); // Timestamp to fetch messages before

    // Validate before timestamp if provided
    let beforeDate: Date | undefined;
    if (before) {
      beforeDate = new Date(before);
      if (isNaN(beforeDate.getTime())) {
        return NextResponse.json(
          { error: "Invalid 'before' timestamp" },
          { status: 400 }
        );
      }
    }

    const messages = await prisma.message.findMany({
      where: {
        deletedAt: null, // Only show non-deleted messages
        ...(beforeDate && {
          createdAt: {
            lt: beforeDate,
          },
        }),
      },
      take: limit,
      skip: offset,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(messages);
  } catch (error: unknown) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

// POST - Send new message
export async function POST(request: NextRequest) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
      cookieName: '__Secure-authjs.session-token',
    });

    if (!token || !token.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = sendMessageSchema.parse(body);

    const message = await prisma.message.create({
      data: {
        content: validatedData.content,
        userId: token.id,
        replyToId: validatedData.replyToId,
        replyToContent: validatedData.replyToContent,
        replyToUserName: validatedData.replyToUserName,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Emit event for real-time broadcast
    messageEvents.emit({
      messageId: message.id,
      content: message.content,
      userId: message.userId,
      userName: message.user.name,
      userEmail: message.user.email,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
      deletedAt: null,
      replyToId: message.replyToId,
      replyToContent: message.replyToContent,
      replyToUserName: message.replyToUserName,
    });

    // Send push notifications (non-blocking)
    notifications
      .newMessage(
        { content: message.content, userName: message.user.name },
        message.userId
      )
      .catch((err) => console.error("Push notification failed:", err));

    return NextResponse.json(message, { status: 201 });
  } catch (error: unknown) {
    console.error("Error creating message:", error);

    if (
      error instanceof Error &&
      "name" in error &&
      error.name === "ZodError" &&
      "errors" in error
    ) {
      return NextResponse.json(
        {
          error: "Invalid data",
          details: (error as { errors: unknown }).errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create message" },
      { status: 500 }
    );
  }
}
