import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/db";
import { sendMessageSchema } from "@/lib/validations/message";
import { messageEvents } from "@/lib/message-events";

// PUT - Edit message
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token || !token.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = sendMessageSchema.parse(body);

    // Check if message exists and belongs to user
    const existingMessage = await prisma.message.findUnique({
      where: { id },
    });

    if (!existingMessage) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    if (existingMessage.userId !== token.id) {
      return NextResponse.json(
        { error: "You can only edit your own messages" },
        { status: 403 }
      );
    }

    // Update message
    const message = await prisma.message.update({
      where: { id },
      data: {
        content: validatedData.content,
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
    });

    return NextResponse.json(message);
  } catch (error: unknown) {
    console.error("Error updating message:", error);

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
      { error: "Failed to update message" },
      { status: 500 }
    );
  }
}

// DELETE - Delete message
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token || !token.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Check if message exists and belongs to user
    const existingMessage = await prisma.message.findUnique({
      where: { id },
    });

    if (!existingMessage) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    if (existingMessage.userId !== token.id) {
      return NextResponse.json(
        { error: "You can only delete your own messages" },
        { status: 403 }
      );
    }

    // Soft delete message
    const deletedMessage = await prisma.message.update({
      where: { id },
      data: {
        deletedAt: new Date(),
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
      messageId: deletedMessage.id,
      content: deletedMessage.content,
      userId: deletedMessage.userId,
      userName: deletedMessage.user.name,
      userEmail: deletedMessage.user.email,
      createdAt: deletedMessage.createdAt,
      updatedAt: deletedMessage.updatedAt,
      deletedAt: deletedMessage.deletedAt,
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Error deleting message:", error);
    return NextResponse.json(
      { error: "Failed to delete message" },
      { status: 500 }
    );
  }
}
