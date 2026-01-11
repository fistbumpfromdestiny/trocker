"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
// import { CurrentLocationCard } from "@/components/location/current-location-card";
import { TimelineList } from "@/components/location/timeline-list";
// import { LocationReportForm } from "@/components/location/location-report-form";
import { InteractiveMap } from "@/components/location/interactive-map";
import { AlertCircle } from "lucide-react";
// import { HungerMeter } from "@/components/hunger/hunger-meter";
// import { FeedButton } from "@/components/hunger/feed-button";

export default function DashboardPage() {
  const [dbError, setDbError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [terminalText, setTerminalText] = useState("Initializing Trocker...");
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    // Check if database is accessible
    fetch("/api/hunger/status?catId=rocky")
      .then((res) => {
        if (!res.ok) throw new Error();
        setDbError(false);
      })
      .catch(() => setDbError(true))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    // Terminal animation sequence
    const runAnimation = async () => {
      setTerminalText("Initializing Trocker...");

      await new Promise((resolve) => setTimeout(resolve, 800));
      setTerminalText("Locating Rocky (species: cat)...");

      await new Promise((resolve) => setTimeout(resolve, 800));

      // Check if Rocky has a current location
      try {
        const res = await fetch("/api/locations/current?catId=rocky");
        if (res.ok) {
          const data = await res.json();
          // Check if there's a current location (no exitTime)
          if (data.location && data.exitTime === null) {
            setTerminalText("Rocky's last location determined...");
          } else {
            setTerminalText("Unable to determine Rocky's current location...");
          }
        } else {
          setTerminalText("Unable to determine Rocky's current location...");
        }
      } catch (error) {
        setTerminalText("Unable to determine Rocky's current location...");
        console.log(error);
      }
    };

    runAnimation();

    // Cursor blink
    const cursorInterval = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, 530);

    return () => clearInterval(cursorInterval);
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (dbError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Track Rocky</h1>
          <p className="text-muted-foreground">
            Follow Rocky&apos;s adventures around the neighborhood
          </p>
        </div>

        <Card className="border-terminal-red/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-terminal-red">
              <AlertCircle className="h-5 w-5" />
              Database Not Ready
            </CardTitle>
            <CardDescription className="text-terminal-yellow/70">
              The database needs to be set up before you can track Rocky.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-2 text-terminal-cyan">Steps to get started:</p>
              <ol className="text-sm text-terminal-green/70 space-y-2 list-decimal list-inside">
                <li>Make sure PostgreSQL is running</li>
                <li>
                  Run migrations:{" "}
                  <code className="bg-muted px-2 py-1 rounded text-xs">
                    bun run db:migrate
                  </code>
                </li>
                <li>
                  Seed the database:{" "}
                  <code className="bg-muted px-2 py-1 rounded text-xs">
                    bun run db:seed
                  </code>
                </li>
                <li>Refresh this page</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="mb-6">
        <div className="font-mono text-lg mb-2">
          <span className="text-terminal-cyan">$</span>{" "}
          <span className="text-foreground">{terminalText}</span>
          <span
            className={`inline-block w-2 h-5 bg-primary ml-1 ${showCursor ? "opacity-100" : "opacity-0"}`}
          ></span>
        </div>
        <p className="text-terminal-green/70 text-sm">
          Follow Rocky&apos;s adventures around the neighborhood
        </p>
      </div>

      {/* Interactive Map */}
      <div>
        <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
          <span className="text-terminal-cyan">★</span>
        </h2>
        <InteractiveMap catId="rocky" />
      </div>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-terminal-cyan">Recent Sightings</CardTitle>
          <CardDescription className="text-terminal-green/70">Rocky&apos;s location history</CardDescription>
        </CardHeader>
        <CardContent>
          <TimelineList catId="rocky" />
        </CardContent>
      </Card>
    </div>
  );
}
