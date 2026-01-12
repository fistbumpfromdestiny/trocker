"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { MessagesDialog } from "./messages-dialog";

export function MessageNotificationBadge() {
  const { data: session } = useSession();
  const [hasUnread, setHasUnread] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    if (!session?.user?.id) return;

    // Check for unread messages on mount
    const checkUnread = async () => {
      try {
        const res = await fetch("/api/messages/unread-count");
        if (res.ok) {
          const data = await res.json();
          setHasUnread(data.hasUnread);
        }
      } catch (error) {
        console.error("Failed to check unread messages:", error);
      }
    };

    checkUnread();

    // Subscribe to SSE for real-time message notifications
    const eventSource = new EventSource("/api/messages/events");

    eventSource.addEventListener("message", (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "message") {
          // Only show notification for messages from other users
          if (data.userId !== session.user.id) {
            setHasUnread(true);
          }
        }
      } catch (error) {
        console.error("Error parsing message SSE:", error);
      }
    });

    eventSource.addEventListener("error", (error) => {
      console.error("Message SSE error:", error);
      eventSource.close();
    });

    return () => {
      eventSource.close();
    };
  }, [session?.user?.id]);

  const handleOpenDialog = () => {
    setIsDialogOpen(true);
  };

  const handleMarkRead = async () => {
    try {
      await fetch("/api/messages/mark-read", {
        method: "POST",
      });
      setHasUnread(false);
    } catch (error) {
      console.error("Failed to mark messages as read:", error);
    }
  };

  if (!session) return null;

  return (
    <>
      <button
        onClick={handleOpenDialog}
        className={`${
          hasUnread
            ? "text-terminal-yellow"
            : "text-terminal-green/50"
        } text-2xl font-black cursor-pointer hover:scale-125 transition-transform pixel-exclamation`}
        aria-label={hasUnread ? "Unread messages" : "Messages"}
        style={{
          fontFamily: "'Press Start 2P', 'Courier New', monospace",
          textShadow: hasUnread
            ? "2px 2px 0px rgba(0, 0, 0, 0.3)"
            : "none",
          imageRendering: "pixelated",
        }}
      >
        !
      </button>

      <MessagesDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onMarkRead={handleMarkRead}
      />
    </>
  );
}
