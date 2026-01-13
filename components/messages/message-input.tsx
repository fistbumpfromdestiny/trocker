"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Send, X } from "lucide-react";

interface ReplyToMessage {
  id: string;
  content: string;
  userName: string | null;
  userEmail: string;
}

interface MessageInputProps {
  replyTo?: ReplyToMessage | null;
  onClearReply?: () => void;
}

export function MessageInput({ replyTo, onClearReply }: MessageInputProps = {}) {
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) return;

    setSending(true);
    const messageContent = content.trim();
    setContent("");

    try {
      const body: {
        content: string;
        replyToId?: string;
        replyToContent?: string;
        replyToUserName?: string;
      } = { content: messageContent };

      // Include reply data if replying
      if (replyTo) {
        body.replyToId = replyTo.id;
        body.replyToContent = replyTo.content;
        body.replyToUserName = replyTo.userName || replyTo.userEmail;
      }

      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        toast.success("Message sent!");
        onClearReply?.(); // Clear the reply after sending
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to send message");
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      {/* Reply preview */}
      {replyTo && (
        <div className="flex items-start gap-2 bg-muted/30 border border-terminal-cyan/30 rounded p-2 text-xs">
          <div className="flex-1 min-w-0">
            <div className="text-terminal-cyan font-semibold mb-0.5">
              Replying to {replyTo.userName || replyTo.userEmail}
            </div>
            <div className="text-muted-foreground line-clamp-1 italic">
              {replyTo.content}
            </div>
          </div>
          <Button
            type="button"
            onClick={onClearReply}
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-terminal-red hover:bg-terminal-red/10 flex-shrink-0"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Input area */}
      <div className="flex gap-2 items-end">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 font-mono text-sm resize-none border-terminal-green/30 focus:border-terminal-cyan bg-background/50 block-cursor"
          maxLength={1000}
          rows={3}
          disabled={sending}
        />
        <Button
          type="submit"
          disabled={!content.trim() || sending}
          className="bg-terminal-yellow hover:bg-terminal-yellow/80 text-background font-mono font-bold px-6"
        >
          {sending ? (
            <span className="animate-pulse">Sending...</span>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Send
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
