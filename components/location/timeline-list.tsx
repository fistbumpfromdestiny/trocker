"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Home, TreePine, ChevronDown, ChevronUp } from "lucide-react";
import { format, differenceInMinutes } from "date-fns";

interface TimelineListProps {
  catId: string;
}

interface TimelineReport {
  id: string;
  entryTime: string;
  exitTime: string | null;
  notes: string | null;
  location: {
    id: string;
    name: string;
    type: "APARTMENT" | "OUTDOOR" | "BUILDING_COMMON";
  };
  apartment: {
    id: string;
    name: string;
    user: {
      id: string;
      name: string | null;
      email: string;
    };
  } | null;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
}

export function TimelineList({ catId }: TimelineListProps) {
  const [timeline, setTimeline] = useState<TimelineReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [displayCount, setDisplayCount] = useState(5);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    const fetchTimeline = async () => {
      try {
        const res = await fetch(
          `/api/locations/timeline?catId=${catId}&limit=100`,
        );
        if (res.ok) {
          const data = await res.json();
          setTimeline(data);
          setHasMore(data.length > displayCount);
        }
      } catch (error) {
        console.error("Failed to fetch timeline:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTimeline();

    // Subscribe to real-time updates via SSE
    const eventSource = new EventSource(`/api/locations/events?catId=${catId}`);

    eventSource.addEventListener("message", (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "location-update") {
          // Refetch timeline when location changes
          fetchTimeline();
        }
      } catch (error) {
        console.error("Error parsing SSE message:", error);
      }
    });

    eventSource.addEventListener("error", (error) => {
      console.error("SSE connection error:", error);
      eventSource.close();
    });

    // Cleanup on unmount
    return () => {
      eventSource.close();
    };
  }, [catId, displayCount]);

  const handleLoadMore = () => {
    setDisplayCount((prev) => prev + 5);
  };

  useEffect(() => {
    setHasMore(timeline.length > displayCount);
  }, [timeline.length, displayCount]);

  const getLocationIcon = (locationType: string) => {
    if (locationType === "APARTMENT") return Home;
    if (locationType === "OUTDOOR") return TreePine;
    return MapPin;
  };

  const getLocationName = (report: TimelineReport) => {
    // LocationReportV2 structure: location + optional apartment
    if (report.location) {
      if (report.apartment) {
        return `${report.location.name} (${report.apartment.name})`;
      }
      return report.location.name;
    }
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

  const displayedTimeline = isExpanded ? timeline.slice(0, displayCount) : [];

  if (loading) {
    return (
      <div className="text-sm text-terminal-green/70 font-mono">
        Loading timeline...
      </div>
    );
  }

  if (timeline.length === 0) {
    return (
      <div className="text-center p-8 text-terminal-green/70 font-mono">
        <MapPin className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p>No sightings yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 mb-8">
      {/* Collapse/Expand Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-terminal-cyan/10 to-terminal-green/10 border border-terminal-cyan/30 hover:border-terminal-cyan/50 transition-all rounded font-mono"
      >
        <div className="flex items-center gap-2">
          <span className="text-terminal-cyan text-lg">▶</span>
          <span className="text-foreground font-semibold">
            {isExpanded
              ? "Hide Timeline"
              : `Show Timeline (${timeline.length} sightings)`}
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5 text-terminal-cyan" />
        ) : (
          <ChevronDown className="h-5 w-5 text-terminal-cyan" />
        )}
      </button>

      {/* Timeline Content */}
      {isExpanded && (
        <div className="space-y-4 border border-terminal-green/20 rounded p-4 bg-gradient-to-b from-background to-muted/20">
          {displayedTimeline.map((report, index) => {
            const Icon = getLocationIcon(report.location?.type || "OUTDOOR");
            const duration = getDuration(report.entryTime, report.exitTime);
            const isCurrent = !report.exitTime;

            return (
              <div key={report.id}>
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div
                      className={`p-2 rounded ${isCurrent ? "bg-terminal-cyan/20 border border-terminal-cyan" : "bg-muted/50 border border-terminal-green/30"}`}
                    >
                      <Icon
                        className={`h-4 w-4 ${isCurrent ? "text-terminal-cyan" : "text-terminal-green/70"}`}
                      />
                    </div>
                    {index < displayedTimeline.length - 1 && (
                      <div className="h-full w-px bg-gradient-to-b from-terminal-cyan/50 to-terminal-green/30 mt-2" />
                    )}
                  </div>

                  <div className="flex-1 pb-6">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div>
                        <h4 className="font-medium text-foreground font-mono">
                          {getLocationName(report)}
                        </h4>
                        <p className="text-xs text-terminal-green/70 font-mono">
                          {format(new Date(report.entryTime), "MMM d, h:mm a")}
                          {duration && ` • ${duration}`}
                        </p>
                      </div>
                      {isCurrent && (
                        <Badge className="bg-terminal-cyan text-background font-mono">
                          CURRENT
                        </Badge>
                      )}
                    </div>

                    {report.notes && (
                      <p className="text-sm text-terminal-yellow/80 italic mt-1 font-mono">
                        "{report.notes}"
                      </p>
                    )}

                    <p className="text-xs text-terminal-green/70 mt-1 font-mono">
                      Reported by {report.user.name || report.user.email}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Load More Button */}
          {hasMore && displayCount < timeline.length && (
            <div className="flex justify-center pt-4">
              <Button
                onClick={handleLoadMore}
                variant="outline"
                className="border-terminal-cyan/30 hover:border-terminal-cyan hover:bg-terminal-cyan/10 text-terminal-cyan font-mono"
              >
                Load More ({Math.min(5, timeline.length - displayCount)} more)
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
