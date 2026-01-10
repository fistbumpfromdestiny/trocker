"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MapPin, Home, TreePine, ArrowRight } from "lucide-react";
import { format, formatDistanceToNow, differenceInMinutes } from "date-fns";

interface TimelineListProps {
  catId: string;
}

export function TimelineList({ catId }: TimelineListProps) {
  const [timeline, setTimeline] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTimeline = async () => {
      try {
        const res = await fetch(`/api/locations/timeline?catId=${catId}&limit=20`);
        if (res.ok) {
          const data = await res.json();
          setTimeline(data);
        }
      } catch (error) {
        console.error("Failed to fetch timeline:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTimeline();
  }, [catId]);

  const getLocationIcon = (locationType: string) => {
    if (locationType === "APARTMENT") return Home;
    if (locationType === "OUTDOOR") return TreePine;
    return MapPin;
  };

  const getLocationName = (report: any) => {
    if (report.apartment) return report.apartment.name;
    if (report.outdoorLocation) return report.outdoorLocation.name;
    if (report.buildingAreaName) return report.buildingAreaName;
    return "Unknown";
  };

  const getDuration = (entry: Date, exit: Date | null) => {
    if (!exit) return null;
    const minutes = differenceInMinutes(new Date(exit), new Date(entry));
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading timeline...</div>;
  }

  if (timeline.length === 0) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        <MapPin className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p>No sightings yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {timeline.map((report, index) => {
        const Icon = getLocationIcon(report.locationType);
        const duration = getDuration(report.entryTime, report.exitTime);
        const isCurrent = !report.exitTime;

        return (
          <div key={report.id}>
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className={`p-2 rounded-full ${isCurrent ? 'bg-primary' : 'bg-muted'}`}>
                  <Icon className={`h-4 w-4 ${isCurrent ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                </div>
                {index < timeline.length - 1 && (
                  <div className="h-full w-px bg-border mt-2" />
                )}
              </div>

              <div className="flex-1 pb-6">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div>
                    <h4 className="font-medium">{getLocationName(report)}</h4>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(report.entryTime), "MMM d, h:mm a")}
                      {duration && ` • ${duration}`}
                    </p>
                  </div>
                  {isCurrent && <Badge className="bg-primary">Current</Badge>}
                </div>

                {report.notes && (
                  <p className="text-sm text-muted-foreground italic mt-1">
                    "{report.notes}"
                  </p>
                )}

                <p className="text-xs text-muted-foreground mt-1">
                  Reported by {report.user.name || report.user.email}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
