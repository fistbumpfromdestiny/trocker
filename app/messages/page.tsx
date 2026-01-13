"use client";

import { useState } from "react";
import { Separator } from "@/components/ui/separator";
import { MessageList } from "@/components/messages/message-list";
import { MessageInput } from "@/components/messages/message-input";

interface ReplyToMessage {
  id: string;
  content: string;
  userName: string | null;
  userEmail: string;
}

export default function MessagesPage() {
  const [replyTo, setReplyTo] = useState<ReplyToMessage | null>(null);

  const handleReply = (message: {
    id: string;
    content: string;
    user: { name: string | null; email: string };
  }) => {
    setReplyTo({
      id: message.id,
      content: message.content,
      userName: message.user.name,
      userEmail: message.user.email,
    });
  };

  return (
    <div className="container max-w-4xl mx-auto p-4 h-[calc(100vh-theme(spacing.14)-theme(spacing.12))]">
      <div className="bg-gradient-to-b from-background to-muted/20 border border-terminal-cyan/30 rounded-lg shadow-xl p-6 flex flex-col gap-4 h-full">
        {/* Header */}
        <div className="flex-shrink-0">
          <h1 className="text-terminal-cyan font-mono text-2xl flex items-center gap-2">
            <span className="text-terminal-yellow">▶</span>
            Message Board
          </h1>
          <p className="text-terminal-green/70 text-sm mt-1 font-mono">
            Shared message board for all users
          </p>
        </div>

        <Separator className="bg-terminal-green/30 flex-shrink-0" />

        {/* Message List - scrolls internally */}
        <div className="flex-1 overflow-hidden min-h-0">
          <MessageList onReply={handleReply} />
        </div>

        <Separator className="bg-terminal-green/30 flex-shrink-0" />

        {/* Message Input */}
        <div className="flex-shrink-0">
          <MessageInput
            replyTo={replyTo}
            onClearReply={() => setReplyTo(null)}
          />
        </div>
      </div>
    </div>
  );
}
