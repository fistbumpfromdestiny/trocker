"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { Loader2 } from "lucide-react";

interface Message {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
}

export function MessageList() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);

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
          // Add new message to the top of the list
          setMessages((prev) => [
            {
              id: data.messageId,
              content: data.content,
              createdAt: data.createdAt,
              user: {
                id: data.userId,
                name: data.userName,
                email: data.userEmail,
              },
            },
            ...prev,
          ]);
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
      {messages.map((message) => (
        <div
          key={message.id}
          className="p-3 rounded border border-terminal-green/20 bg-gradient-to-br from-muted/30 to-muted/10 hover:border-terminal-green/40 transition-colors"
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="font-semibold text-terminal-cyan font-mono text-sm">
              {message.user.name || message.user.email}
            </span>
            <span className="text-xs text-terminal-green/70 font-mono">
              {formatDistanceToNow(new Date(message.createdAt), {
                addSuffix: true,
              })}
            </span>
          </div>
          <p className="text-foreground text-sm whitespace-pre-wrap break-words">
            {message.content}
          </p>
        </div>
      ))}

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
