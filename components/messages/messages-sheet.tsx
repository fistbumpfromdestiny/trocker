"use client";

import { useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { MessageList } from "./message-list";
import { MessageInput } from "./message-input";

interface MessagesSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMarkRead: () => void;
}

export function MessagesSheet({
  open,
  onOpenChange,
  onMarkRead,
}: MessagesSheetProps) {
  useEffect(() => {
    if (open) {
      // Mark messages as read when sheet opens
      onMarkRead();
    }
  }, [open, onMarkRead]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange} modal={false}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl flex flex-col bg-gradient-to-b from-background to-muted/20 border-terminal-cyan/30 p-6"
        aria-describedby="message-board-description"
      >
        <SheetHeader>
          <SheetTitle className="text-terminal-cyan font-mono text-xl flex items-center gap-2">
            <span className="text-terminal-yellow">▶</span>
            Message Board
          </SheetTitle>
          <p id="message-board-description" className="sr-only">
            View and send messages to other users
          </p>
        </SheetHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4 mt-4">
          <MessageList />

          <Separator className="bg-terminal-green/30" />

          <MessageInput />
        </div>
      </SheetContent>
    </Sheet>
  );
}
