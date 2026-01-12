"use client";

import { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { MessageList } from "./message-list";
import { MessageInput } from "./message-input";

interface MessagesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMarkRead: () => void;
}

export function MessagesDialog({
  open,
  onOpenChange,
  onMarkRead,
}: MessagesDialogProps) {
  useEffect(() => {
    if (open) {
      // Mark messages as read when dialog opens
      onMarkRead();
    }
  }, [open, onMarkRead]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col bg-gradient-to-b from-background to-muted/20 border-terminal-cyan/30">
        <DialogHeader>
          <DialogTitle className="text-terminal-cyan font-mono text-xl flex items-center gap-2">
            <span className="text-terminal-yellow">▶</span>
            Message Board
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          <MessageList />

          <Separator className="bg-terminal-green/30" />

          <MessageInput />
        </div>
      </DialogContent>
    </Dialog>
  );
}
