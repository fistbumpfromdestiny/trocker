"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { Loader2, Pencil, Trash2, Check, X } from "lucide-react";

interface Message {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
}

export function MessageList() {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await fetch("/api/messages?limit=50");
        if (res.ok) {
          const data = await res.json();
          setMessages(data);
          setHasMore(data.length === 50);
        }
      } catch (error) {
        console.error("Failed to fetch messages:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();

    // Subscribe to SSE for new messages
    const eventSource = new EventSource("/api/messages/events");

    eventSource.addEventListener("message", (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "message") {
          // If message is deleted, remove it from the list
          if (data.deletedAt) {
            setMessages((prev) => prev.filter((m) => m.id !== data.messageId));
            return;
          }

          const newMessage = {
            id: data.messageId,
            content: data.content,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt || data.createdAt,
            deletedAt: data.deletedAt,
            user: {
              id: data.userId,
              name: data.userName,
              email: data.userEmail,
            },
          };

          setMessages((prev) => {
            // Check if message already exists (edited message)
            const existingIndex = prev.findIndex((m) => m.id === data.messageId);

            if (existingIndex !== -1) {
              // Update existing message
              const updated = [...prev];
              updated[existingIndex] = newMessage;
              return updated;
            } else {
              // Add new message to the top
              return [newMessage, ...prev];
            }
          });
        }
      } catch (error) {
        console.error("Error parsing message SSE:", error);
      }
    });

    return () => {
      eventSource.close();
    };
  }, []);

  const handleLoadMore = async () => {
    setLoadingMore(true);
    try {
      const res = await fetch(
        `/api/messages?limit=50&offset=${messages.length}`
      );
      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [...prev, ...data]);
        setHasMore(data.length === 50);
      }
    } catch (error) {
      console.error("Failed to load more messages:", error);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleStartEdit = (message: Message) => {
    setEditingId(message.id);
    setEditContent(message.content);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditContent("");
  };

  const handleSaveEdit = async (messageId: string) => {
    if (!editContent.trim()) return;

    console.log("Saving edit for message:", messageId);
    console.log("Session user ID:", session?.user?.id);

    // Exit edit mode immediately
    setEditingId(null);
    setEditContent("");

    try {
      const res = await fetch(`/api/messages/${messageId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editContent.trim() }),
      });

      console.log("Edit response status:", res.status);

      if (res.ok) {
        const updated = await res.json();
        console.log("Updated message:", updated);
        // Update the message immediately with the response
        setMessages((prev) =>
          prev.map((m) => (m.id === messageId ? {
            ...updated,
            createdAt: updated.createdAt,
            updatedAt: updated.updatedAt,
            deletedAt: updated.deletedAt || null,
          } : m))
        );
        toast.success("Message updated!");
      } else {
        const error = await res.json();
        console.error("Edit error response:", error);
        toast.error(error.error || "Failed to update message");
      }
    } catch (error) {
      console.error("Failed to update message:", error);
      toast.error("Failed to update message");
    }
  };

  const handleDelete = async (messageId: string) => {
    if (!confirm("Delete this message?")) return;

    try {
      const res = await fetch(`/api/messages/${messageId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setMessages((prev) => prev.filter((m) => m.id !== messageId));
        toast.success("Message deleted!");
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to delete message");
      }
    } catch (error) {
      console.error("Failed to delete message:", error);
      toast.error("Failed to delete message");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-terminal-cyan" />
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="text-center py-8 text-terminal-green/70 font-mono">
        <p>No messages yet. Be the first to post!</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 overflow-y-auto max-h-96 pr-2">
      {messages.map((message) => {
        const isOwnMessage = session?.user?.id === message.user.id;
        const isEditing = editingId === message.id;

        return (
          <div
            key={message.id}
            className="p-3 rounded border border-terminal-green/20 bg-gradient-to-br from-muted/30 to-muted/10 hover:border-terminal-green/40 transition-colors"
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-terminal-cyan font-mono text-sm">
                  {message.user.name || message.user.email}
                </span>
                <span className="text-xs text-terminal-green/70 font-mono">
                  {formatDistanceToNow(new Date(message.createdAt), {
                    addSuffix: true,
                  })}
                </span>
                {message.updatedAt &&
                  new Date(message.updatedAt).getTime() >
                    new Date(message.createdAt).getTime() + 1000 && (
                    <span className="text-xs text-terminal-yellow/70 font-mono italic">
                      (edited)
                    </span>
                  )}
              </div>

              {isOwnMessage && !isEditing && (
                <div className="flex gap-1">
                  <Button
                    onClick={() => handleStartEdit(message)}
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-terminal-yellow hover:bg-terminal-yellow/10"
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button
                    onClick={() => handleDelete(message.id)}
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-terminal-red hover:bg-terminal-red/10"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>

            {isEditing ? (
              <div className="flex flex-col gap-2">
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="font-mono text-sm resize-none border-terminal-cyan/50 focus:border-terminal-cyan bg-background/50 block-cursor"
                  maxLength={1000}
                  rows={3}
                  autoFocus
                />
                <div className="flex gap-2 justify-end">
                  <Button
                    onClick={handleCancelEdit}
                    variant="outline"
                    size="sm"
                    className="border-terminal-red/30 text-terminal-red hover:bg-terminal-red/10"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Cancel
                  </Button>
                  <Button
                    onClick={() => handleSaveEdit(message.id)}
                    disabled={!editContent.trim()}
                    size="sm"
                    className="bg-terminal-green hover:bg-terminal-green/80 text-background"
                  >
                    <Check className="h-3 w-3 mr-1" />
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-foreground text-sm whitespace-pre-wrap break-words">
                {message.content}
              </p>
            )}
          </div>
        );
      })}

      {hasMore && (
        <div className="flex justify-center pt-2">
          <Button
            onClick={handleLoadMore}
            disabled={loadingMore}
            variant="outline"
            size="sm"
            className="border-terminal-cyan/30 hover:border-terminal-cyan hover:bg-terminal-cyan/10 text-terminal-cyan font-mono"
          >
            {loadingMore ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Loading...
              </>
            ) : (
              `Load More (${messages.length} shown)`
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
