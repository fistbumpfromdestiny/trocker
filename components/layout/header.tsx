"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Sidebar } from "./sidebar";
import { Menu, LogOut } from "lucide-react";

interface HeaderProps {
  user: {
    name?: string | null;
    email?: string;
    role: string;
  };
}

export function Header({ user }: HeaderProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const isAdmin = user.role === "ADMIN";

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur-sm font-mono">
        <div className="flex h-14 items-center justify-between px-4">
          {/* Left: Menu button and title */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(true)}
              className="hover:bg-muted"
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>

            <Link href="/dashboard" className="flex items-center gap-2">
              <img
                src="/icon.png"
                alt="Rocky"
                className="w-8 h-8 rounded border border-primary"
              />
              <span className="text-lg font-bold text-primary">trocker</span>
              <span className="hidden sm:inline text-muted-foreground text-xs">
                v1.0.0
              </span>
            </Link>
          </div>

          {/* Right: User info and logout */}
          <div className="flex items-center gap-3 text-xs">
            <div className="hidden sm:flex items-center gap-2 text-muted-foreground">
              <span className="text-terminal-cyan">$</span>
              <span className="text-foreground">{user.name || user.email}</span>
              {isAdmin && (
                <span className="text-terminal-yellow font-semibold">
                  [ADMIN]
                </span>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-terminal-red hover:bg-terminal-red/10 hover:text-terminal-red"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden md:inline ml-2">logout</span>
            </Button>
            <div className="w-2 h-3 bg-primary terminal-cursor"></div>
          </div>
        </div>
      </header>

      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isAdmin={isAdmin}
        user={user}
      />
    </>
  );
}
