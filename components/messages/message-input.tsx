"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Send } from "lucide-react";

export function MessageInput() {
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) return;

    setSending(true);
    const messageContent = content.trim();
    setContent("");

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: messageContent }),
      });

      if (res.ok) {
        toast.success("Message sent!");
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
    <form onSubmit={handleSubmit} className="flex gap-2 items-end">
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
    </form>
  );
}
