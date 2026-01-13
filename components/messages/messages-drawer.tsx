"use client";

import { useEffect } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Separator } from "@/components/ui/separator";
import { MessageList } from "./message-list";
import { MessageInput } from "./message-input";

interface MessagesDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMarkRead: () => void;
}

export function MessagesDrawer({
  open,
  onOpenChange,
  onMarkRead,
}: MessagesDrawerProps) {
  useEffect(() => {
    if (open) {
      // Mark messages as read when drawer opens
      onMarkRead();
    }
  }, [open, onMarkRead]);

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent
        className="w-full sm:max-w-2xl flex flex-col bg-gradient-to-b from-background to-muted/20 border-terminal-cyan/30 p-6 h-full"
        aria-describedby="message-board-description"
      >
        <DrawerHeader className="p-0 mb-4">
          <DrawerTitle className="text-terminal-cyan font-mono text-xl flex items-center gap-2">
            <span className="text-terminal-yellow">▶</span>
            Message Board
          </DrawerTitle>
          <p id="message-board-description" className="sr-only">
            View and send messages to other users
          </p>
        </DrawerHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          <MessageList />

          <Separator className="bg-terminal-green/30" />

          <MessageInput />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
