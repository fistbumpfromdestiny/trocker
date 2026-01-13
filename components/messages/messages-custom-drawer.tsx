"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { MessageList } from "./message-list";
import { MessageInput } from "./message-input";

interface MessagesCustomDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMarkRead: () => void;
}

export function MessagesCustomDrawer({
  open,
  onOpenChange,
  onMarkRead,
}: MessagesCustomDrawerProps) {
  useEffect(() => {
    if (open) {
      onMarkRead();
    }
  }, [open, onMarkRead]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 animate-in fade-in duration-200"
        style={{ zIndex: 999998 }}
        onClick={() => onOpenChange(false)}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        className="fixed inset-y-0 right-0 w-full sm:max-w-2xl bg-gradient-to-b from-background to-muted/20 border-l border-terminal-cyan/30 shadow-xl flex flex-col animate-in slide-in-from-right duration-300"
        style={{ zIndex: 999999 }}
        role="dialog"
        aria-modal="false"
        aria-labelledby="drawer-title"
        aria-describedby="message-board-description"
      >
        {/* Header */}
        <div className="p-6 pb-4">
          <div className="flex items-center justify-between">
            <h2
              id="drawer-title"
              className="text-terminal-cyan font-mono text-xl flex items-center gap-2"
            >
              <span className="text-terminal-yellow">▶</span>
              Message Board
            </h2>
            <button
              onClick={() => onOpenChange(false)}
              className="text-terminal-green/70 hover:text-terminal-green transition-colors"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <p id="message-board-description" className="sr-only">
            View and send messages to other users
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col gap-4 px-6 pb-6">
          <MessageList />

          <Separator className="bg-terminal-green/30" />

          <MessageInput />
        </div>
      </div>
    </>
  );
}
