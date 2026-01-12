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
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: content.trim() }),
      });

      if (res.ok) {
        setContent("");
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
        className="flex-1 font-mono text-sm resize-none border-terminal-green/30 focus:border-terminal-cyan bg-background/50"
        maxLength={1000}
        rows={3}
        disabled={sending}
      />
      <Button
        type="submit"
        disabled={!content.trim() || sending}
        className="bg-terminal-cyan hover:bg-terminal-cyan/80 text-background font-mono"
        size="icon"
      >
        {sending ? (
          <span className="animate-pulse">...</span>
        ) : (
          <Send className="h-4 w-4" />
        )}
      </Button>
    </form>
  );
}
