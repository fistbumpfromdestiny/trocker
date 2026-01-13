"use client";

import { useEffect, useState, useRef } from "react";
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
  const scrollRef = useRef<HTMLDivElement>(null);
  const shouldScrollToBottom = useRef(true);

  // Scroll to bottom helper
  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  // Initial load
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await fetch("/api/messages?limit=30");
        if (res.ok) {
          const data = await res.json();
          // API returns newest first, reverse to show oldest first
          setMessages(data.reverse());
          setHasMore(data.length === 30);
        }
      } catch (error) {
        console.error("Failed to fetch messages:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, []);

  // Scroll to bottom after initial load and when new messages arrive
  useEffect(() => {
    if (!loading && shouldScrollToBottom.current) {
      scrollToBottom();
    }
  }, [messages.length, loading]);

  // SSE subscription
  useEffect(() => {
    const eventSource = new EventSource("/api/messages/events");

    eventSource.addEventListener("message", (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "message") {
          // If message is deleted, remove it
          if (data.deletedAt) {
            setMessages((prev) => prev.filter((m) => m.id !== data.messageId));
            return;
          }

          const newMessage: Message = {
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
            // Check if message exists (for edits)
            const existingIndex = prev.findIndex((m) => m.id === data.messageId);
            if (existingIndex !== -1) {
              // Update existing
              const updated = [...prev];
              updated[existingIndex] = newMessage;
              return updated;
            } else {
              // Add new message to bottom
              shouldScrollToBottom.current = true;
              return [...prev, newMessage];
            }
          });
        }
      } catch (error) {
        console.error("Error parsing message SSE:", error);
      }
    });

    eventSource.onerror = (error) => {
      console.error("SSE error:", error);
    };

    return () => {
      eventSource.close();
    };
  }, []);

  // Handle scroll to load older messages
  const handleScroll = () => {
    if (!scrollRef.current || loadingMore || !hasMore) return;

    // Check if scrolled to top (within 50px)
    if (scrollRef.current.scrollTop < 50) {
      handleLoadMore();
    }

    // User manually scrolled, don't auto-scroll on new messages
    const isAtBottom =
      scrollRef.current.scrollHeight - scrollRef.current.scrollTop <=
      scrollRef.current.clientHeight + 100;
    shouldScrollToBottom.current = isAtBottom;
  };

  const handleLoadMore = async () => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    const scrollContainer = scrollRef.current;
    const previousScrollHeight = scrollContainer?.scrollHeight || 0;

    try {
      // Get oldest message date to fetch older ones
      const oldestMessage = messages[0];
      const res = await fetch(
        `/api/messages?limit=30&before=${oldestMessage.createdAt}`
      );
      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [...data.reverse(), ...prev]);
        setHasMore(data.length === 30);

        // Maintain scroll position after prepending
        setTimeout(() => {
          if (scrollContainer) {
            const newScrollHeight = scrollContainer.scrollHeight;
            scrollContainer.scrollTop = newScrollHeight - previousScrollHeight;
          }
        }, 0);
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

    setEditingId(null);
    setEditContent("");

    try {
      const res = await fetch(`/api/messages/${messageId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editContent.trim() }),
      });

      if (res.ok) {
        toast.success("Message updated!");
      } else {
        const error = await res.json();
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
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      className="flex flex-col gap-2 overflow-y-auto h-full pr-2"
    >
      {/* Load More indicator at top */}
      {loadingMore && (
        <div className="flex justify-center py-2">
          <Loader2 className="h-5 w-5 animate-spin text-terminal-cyan" />
        </div>
      )}
      {hasMore && !loadingMore && (
        <div className="text-center py-2 text-xs text-terminal-green/50 font-mono">
          Scroll up to load older messages
        </div>
      )}

      {/* Messages */}
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
    </div>
  );
}
