"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

interface MapLocation {
  id: string;
  name: string;
  type: "APARTMENT" | "OUTDOOR" | "BUILDING_COMMON";
  top: string;    // % from top
  left: string;   // % from left
  width: string;  // % width
  height: string; // % height
}

interface CurrentLocation {
  locationId: string;
  locationType: string;
  exitTime: string | null;
}

// Define map locations using a finer 6x6 grid for better precision
const MAP_LOCATIONS: MapLocation[] = [
  // Row 1
  { id: "park-nw", name: "Northwest Park", type: "OUTDOOR", top: "0%", left: "0%", width: "16.66%", height: "16.66%" },
  { id: "building-1", name: "Apartment 1", type: "APARTMENT", top: "0%", left: "16.66%", width: "16.66%", height: "16.66%" },
  { id: "street-n1", name: "North Street", type: "OUTDOOR", top: "0%", left: "33.33%", width: "16.66%", height: "16.66%" },
  { id: "building-2", name: "Apartment 2", type: "APARTMENT", top: "0%", left: "50%", width: "16.66%", height: "16.66%" },
  { id: "building-3", name: "Apartment 3", type: "APARTMENT", top: "0%", left: "66.66%", width: "16.66%", height: "16.66%" },
  { id: "building-4", name: "Apartment 4", type: "APARTMENT", top: "0%", left: "83.33%", width: "16.67%", height: "16.66%" },

  // Row 2
  { id: "park-w1", name: "West Park 1", type: "OUTDOOR", top: "16.66%", left: "0%", width: "16.66%", height: "16.66%" },
  { id: "building-5", name: "Apartment 5", type: "APARTMENT", top: "16.66%", left: "16.66%", width: "16.66%", height: "16.66%" },
  { id: "courtyard-1", name: "Courtyard 1", type: "OUTDOOR", top: "16.66%", left: "33.33%", width: "16.66%", height: "16.66%" },
  { id: "building-6", name: "Apartment 6", type: "APARTMENT", top: "16.66%", left: "50%", width: "16.66%", height: "16.66%" },
  { id: "building-7", name: "Apartment 7", type: "APARTMENT", top: "16.66%", left: "66.66%", width: "16.66%", height: "16.66%" },
  { id: "building-8", name: "Apartment 8", type: "APARTMENT", top: "16.66%", left: "83.33%", width: "16.67%", height: "16.66%" },

  // Row 3
  { id: "park-w2", name: "West Park 2", type: "OUTDOOR", top: "33.33%", left: "0%", width: "16.66%", height: "16.66%" },
  { id: "building-9", name: "Apartment 9", type: "APARTMENT", top: "33.33%", left: "16.66%", width: "16.66%", height: "16.66%" },
  { id: "courtyard-2", name: "Courtyard 2", type: "OUTDOOR", top: "33.33%", left: "33.33%", width: "16.66%", height: "16.66%" },
  { id: "building-10", name: "Apartment 10", type: "APARTMENT", top: "33.33%", left: "50%", width: "16.66%", height: "16.66%" },
  { id: "street-e1", name: "East Street 1", type: "OUTDOOR", top: "33.33%", left: "66.66%", width: "16.66%", height: "16.66%" },
  { id: "building-11", name: "Apartment 11", type: "APARTMENT", top: "33.33%", left: "83.33%", width: "16.67%", height: "16.66%" },

  // Row 4
  { id: "park-w3", name: "West Park 3", type: "OUTDOOR", top: "50%", left: "0%", width: "16.66%", height: "16.66%" },
  { id: "building-12", name: "Apartment 12", type: "APARTMENT", top: "50%", left: "16.66%", width: "16.66%", height: "16.66%" },
  { id: "street-c1", name: "Central Street", type: "OUTDOOR", top: "50%", left: "33.33%", width: "16.66%", height: "16.66%" },
  { id: "building-13", name: "Apartment 13", type: "APARTMENT", top: "50%", left: "50%", width: "16.66%", height: "16.66%" },
  { id: "building-14", name: "Apartment 14", type: "APARTMENT", top: "50%", left: "66.66%", width: "16.66%", height: "16.66%" },
  { id: "building-15", name: "Apartment 15", type: "APARTMENT", top: "50%", left: "83.33%", width: "16.67%", height: "16.66%" },

  // Row 5
  { id: "park-sw1", name: "Southwest Park 1", type: "OUTDOOR", top: "66.66%", left: "0%", width: "16.66%", height: "16.67%" },
  { id: "building-16", name: "Apartment 16", type: "APARTMENT", top: "66.66%", left: "16.66%", width: "16.66%", height: "16.67%" },
  { id: "building-17", name: "Apartment 17", type: "APARTMENT", top: "66.66%", left: "33.33%", width: "16.66%", height: "16.67%" },
  { id: "parking-1", name: "Parking Area", type: "OUTDOOR", top: "66.66%", left: "50%", width: "16.66%", height: "16.67%" },
  { id: "building-18", name: "Apartment 18", type: "APARTMENT", top: "66.66%", left: "66.66%", width: "16.66%", height: "16.67%" },
  { id: "building-19", name: "Apartment 19", type: "APARTMENT", top: "66.66%", left: "83.33%", width: "16.67%", height: "16.67%" },

  // Row 6
  { id: "park-sw2", name: "Southwest Park 2", type: "OUTDOOR", top: "83.33%", left: "0%", width: "16.66%", height: "16.67%" },
  { id: "park-s1", name: "South Park 1", type: "OUTDOOR", top: "83.33%", left: "16.66%", width: "16.66%", height: "16.67%" },
  { id: "park-s2", name: "South Park 2", type: "OUTDOOR", top: "83.33%", left: "33.33%", width: "16.66%", height: "16.67%" },
  { id: "street-s1", name: "South Street", type: "OUTDOOR", top: "83.33%", left: "50%", width: "16.66%", height: "16.67%" },
  { id: "park-se1", name: "Southeast Park 1", type: "OUTDOOR", top: "83.33%", left: "66.66%", width: "16.66%", height: "16.67%" },
  { id: "park-se2", name: "Southeast Park 2", type: "OUTDOOR", top: "83.33%", left: "83.33%", width: "16.67%", height: "16.67%" },
];

export function InteractiveMap({ catId }: { catId: string }) {
  const [currentLocation, setCurrentLocation] = useState<CurrentLocation | null>(null);
  const [isReporting, setIsReporting] = useState(false);

  useEffect(() => {
    fetchCurrentLocation();
  }, []);

  const fetchCurrentLocation = async () => {
    try {
      const res = await fetch(`/api/locations/current?catId=${catId}`);
      if (res.ok) {
        const data = await res.json();
        setCurrentLocation(data);
      }
    } catch (error) {
      console.error("Failed to fetch location:", error);
    }
  };

  const handleLocationClick = async (location: MapLocation) => {
    if (isReporting) return;

    setIsReporting(true);
    try {
      const res = await fetch("/api/locations/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          catId,
          locationType: location.type,
          locationId: location.id,
        }),
      });

      if (res.ok) {
        toast.success(`Rocky reported at ${location.name}`);
        fetchCurrentLocation();
      } else {
        const error = await res.json();
        toast.error(error.message || "Failed to report location");
      }
    } catch (error) {
      toast.error("Failed to report location");
    } finally {
      setIsReporting(false);
    }
  };

  const getRockyPosition = () => {
    if (!currentLocation || currentLocation.exitTime) return null;

    const location = MAP_LOCATIONS.find(loc => loc.id === currentLocation.locationId);
    if (!location) return null;

    const isOutdoor = location.type === "OUTDOOR";
    return {
      location,
      sprite: isOutdoor ? "/rocky-motion.png" : "/rocky-resting.png",
    };
  };

  const rockyPos = getRockyPosition();

  return (
    <Card className="overflow-hidden">
      <div className="relative">
        {/* Map background */}
        <img
          src="/map-area.png"
          alt="Rocky's Area"
          className="w-full h-auto rounded-lg"
        />

        {/* Clickable regions overlay */}
        <div className="absolute inset-0">
          {MAP_LOCATIONS.map((location) => (
            <button
              key={location.id}
              onClick={() => handleLocationClick(location)}
              disabled={isReporting}
              className="absolute border border-primary/30 hover:bg-primary/20 hover:border-primary transition-all rounded-sm group"
              style={{
                top: location.top,
                left: location.left,
                width: location.width,
                height: location.height,
              }}
              title={location.name}
            >
              {/* Location name tooltip */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-background/90 rounded-sm">
                <span className="text-xs font-mono text-foreground px-2 text-center">
                  {location.name}
                </span>
              </div>

              {/* Rocky's position */}
              {rockyPos && rockyPos.location.id === location.id && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <img
                    src={rockyPos.sprite}
                    alt="Rocky"
                    className="w-12 h-12 object-contain drop-shadow-lg"
                  />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Map legend */}
      <div className="p-3 bg-muted/30 border-t border-border">
        <div className="flex items-center justify-between gap-4 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="text-terminal-cyan">◆</span>
            <span className="text-muted-foreground">Click grid to report location</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <img src="/rocky-motion.png" alt="" className="w-4 h-4" />
              <span className="text-muted-foreground">Outdoor</span>
            </div>
            <div className="flex items-center gap-1">
              <img src="/rocky-resting.png" alt="" className="w-4 h-4" />
              <span className="text-muted-foreground">Indoor</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
