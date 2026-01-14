"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { X, Home, Building2, MapPin, Settings, LogOut, Users, ChevronRight, Mail, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isAdmin?: boolean;
  user: {
    name?: string | null;
    email?: string;
  };
}

export function Sidebar({ isOpen, onClose, isAdmin, user }: SidebarProps) {
  const pathname = usePathname();

  const navItems = [
    { href: "/dashboard", label: "dashboard", icon: Home },
    { href: "/messages", label: "messages", icon: Mail },
    { href: "/dashboard/settings", label: "settings", icon: Settings },
  ];

  const adminItems = isAdmin
    ? [
        { href: "/dashboard/admin/access", label: "user access", icon: UserCheck },
        { href: "/dashboard/admin/users", label: "users", icon: Users },
        { href: "/dashboard/admin/apartments", label: "apartments", icon: Building2 },
        { href: "/dashboard/admin/locations", label: "locations", icon: MapPin },
        { href: "/dashboard/admin/settings", label: "app settings", icon: Settings },
      ]
    : [];

  return (
    <>
      {/* Overlay */}
      <div
        className={cn(
          "fixed inset-0 bg-black/60 z-40 transition-opacity",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Sidebar */}
      <div
        className={cn(
          "fixed top-0 left-0 h-full w-64 bg-sidebar border-r border-sidebar-border z-50 transition-transform duration-300 ease-in-out font-mono",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
            <div className="flex items-center gap-2">
              <span className="text-primary text-xl font-bold">trocker</span>
              <span className="text-terminal-cursor inline-block w-2 h-4 bg-primary terminal-cursor"></span>
            </div>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* User info */}
          <div className="p-4 border-b border-sidebar-border text-xs space-y-1">
            <div className="text-terminal-cyan">
              <span className="text-muted-foreground">$</span> whoami
            </div>
            <div className="text-foreground pl-2">
              {user.name || user.email}
            </div>
            {isAdmin && (
              <div className="text-terminal-yellow pl-2">
                [ADMIN]
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-2">
            <div className="space-y-1">
              <div className="px-2 py-1 text-xs text-terminal-green">
                # NAVIGATION
              </div>
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-2 px-2 py-2 text-sm rounded transition-colors",
                      isActive
                        ? "bg-muted text-primary font-semibold"
                        : "text-foreground hover:bg-muted/50 hover:text-primary"
                    )}
                  >
                    {isActive && <ChevronRight className="h-3 w-3 text-primary" />}
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}

              {adminItems.length > 0 && (
                <>
                  <div className="px-2 py-2 mt-4 text-xs text-terminal-yellow">
                    # ADMIN
                  </div>
                  {adminItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={onClose}
                        className={cn(
                          "flex items-center gap-2 px-2 py-2 text-sm rounded transition-colors",
                          isActive
                            ? "bg-muted text-primary font-semibold"
                            : "text-foreground hover:bg-muted/50 hover:text-primary"
                        )}
                      >
                        {isActive && <ChevronRight className="h-3 w-3 text-primary" />}
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </>
              )}
            </div>
          </nav>

          {/* Footer */}
          <div className="p-2 pb-12 border-t border-sidebar-border">
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex items-center gap-2 px-2 py-2 text-sm text-terminal-red hover:bg-terminal-red/10 rounded transition-colors w-full"
            >
              <LogOut className="h-4 w-4" />
              <span>logout</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
