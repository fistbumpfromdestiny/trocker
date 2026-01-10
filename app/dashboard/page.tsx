"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { HungerMeter } from "@/components/hunger/hunger-meter";
import { FeedButton } from "@/components/hunger/feed-button";
import { CurrentLocationCard } from "@/components/location/current-location-card";
import { TimelineList } from "@/components/location/timeline-list";
import { LocationReportForm } from "@/components/location/location-report-form";
import { AlertCircle } from "lucide-react";

export default function DashboardPage() {
  const [dbError, setDbError] = useState(false);
  const [loading, setLoading] = useState(true);

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
          <p className="text-muted-foreground">Follow Rocky's adventures around the neighborhood</p>
        </div>

        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Database Not Ready
            </CardTitle>
            <CardDescription>
              The database needs to be set up before you can track Rocky.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">Steps to get started:</p>
              <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                <li>Make sure PostgreSQL is running</li>
                <li>
                  Run migrations:{" "}
                  <code className="bg-muted px-2 py-1 rounded text-xs">bun run db:migrate</code>
                </li>
                <li>
                  Seed the database:{" "}
                  <code className="bg-muted px-2 py-1 rounded text-xs">bun run db:seed</code>
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
      <div>
        <h1 className="text-3xl md:text-4xl font-bold mb-2">Track Rocky</h1>
        <p className="text-muted-foreground">Follow Rocky's adventures around the neighborhood</p>
      </div>

      {/* Quick Actions - Mobile First */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Hunger Status */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Hunger Level</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <HungerMeter catId="rocky" />
            <FeedButton catId="rocky" />
          </CardContent>
        </Card>

        {/* Current Location */}
        <Card className="md:col-span-2 lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Current Location</CardTitle>
          </CardHeader>
          <CardContent>
            <CurrentLocationCard catId="rocky" />
          </CardContent>
        </Card>
      </div>

      {/* Report Location - Prominent on Mobile */}
      <Card className="border-primary/50 shadow-md">
        <CardHeader>
          <CardTitle>Report Rocky's Location</CardTitle>
          <CardDescription>Spotted Rocky? Let everyone know where he is!</CardDescription>
        </CardHeader>
        <CardContent>
          <LocationReportForm catId="rocky" />
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Sightings</CardTitle>
          <CardDescription>Rocky's location history</CardDescription>
        </CardHeader>
        <CardContent>
          <TimelineList catId="rocky" />
        </CardContent>
      </Card>
    </div>
  );
}
