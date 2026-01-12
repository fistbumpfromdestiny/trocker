"use client"

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      toastOptions={{
        classNames: {
          toast: "font-mono border-2 shadow-lg backdrop-blur-sm",
          title: "font-bold text-sm tracking-wide",
          description: "text-xs opacity-90",
          success: "border-terminal-green bg-terminal-green/10 text-terminal-green",
          error: "border-terminal-red bg-terminal-red/10 text-terminal-red",
          warning: "border-terminal-yellow bg-terminal-yellow/10 text-terminal-yellow",
          info: "border-terminal-cyan bg-terminal-cyan/10 text-terminal-cyan",
        },
      }}
      style={
        {
          "--normal-bg": "hsl(var(--background) / 0.95)",
          "--normal-text": "hsl(var(--foreground))",
          "--normal-border": "var(--terminal-green)",
          "--border-radius": "0.375rem",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
