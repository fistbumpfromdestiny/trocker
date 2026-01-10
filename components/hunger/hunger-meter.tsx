"use client";

import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface HungerMeterProps {
  catId: string;
}

export function HungerMeter({ catId }: HungerMeterProps) {
  const [hunger, setHunger] = useState<number>(0);
  const [lastFed, setLastFed] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchHunger = async () => {
    try {
      const res = await fetch(`/api/hunger/status?catId=${catId}`);
      if (res.ok) {
        const data = await res.json();
        setHunger(data.hungerLevel);
        setLastFed(data.lastFedAt ? new Date(data.lastFedAt) : null);
      }
    } catch (error) {
      console.error("Failed to fetch hunger:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHunger();
    const interval = setInterval(fetchHunger, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [catId]);

  const getHungerColor = () => {
    if (hunger <= 30) return "bg-terminal-green";
    if (hunger <= 60) return "bg-terminal-yellow";
    return "bg-terminal-red";
  };

  const getHungerStatus = () => {
    if (hunger <= 30) return "[WELL_FED]";
    if (hunger <= 60) return "[HUNGRY]";
    return "[VERY_HUNGRY!]";
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="space-y-3 font-mono">
      <div className="flex items-center justify-between text-xs">
        <span className="text-terminal-cyan">STATUS:</span>
        <span
          className={`font-semibold ${
            hunger <= 30
              ? "text-terminal-green"
              : hunger <= 60
                ? "text-terminal-yellow"
                : "text-terminal-red"
          }`}
        >
          {getHungerStatus()}
        </span>
      </div>

      <Progress
        value={hunger}
        className="h-2 bg-muted/30"
        indicatorClassName={getHungerColor()}
      />

      <div className="flex justify-between text-xs text-muted-foreground">
        <span>0%</span>
        <span className="text-primary font-semibold">
          {Math.round(hunger)}%
        </span>
        <span>100%</span>
      </div>

      {lastFed && (
        <p className="text-xs text-muted-foreground">
          {">"} last_fed: {formatDistanceToNow(lastFed, { addSuffix: true })}
        </p>
      )}
    </div>
  );
}
