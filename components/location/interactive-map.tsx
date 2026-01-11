"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface Room {
  id: string;
  name: string;
  description: string | null;
  displayOrder: number;
}

interface MapLocation {
  id: string;
  externalId: string;
  name: string;
  type: "APARTMENT" | "OUTDOOR" | "BUILDING_COMMON";
  gridTop: string;
  gridLeft: string;
  gridWidth: string;
  gridHeight: string;
  rooms: Room[];
}

interface CurrentLocation {
  locationId: string;
  locationType: string;
  exitTime: string | null;
}

export function InteractiveMap({ catId }: { catId: string }) {
  const [currentLocation, setCurrentLocation] =
    useState<CurrentLocation | null>(null);
  const [isReporting, setIsReporting] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<MapLocation | null>(
    null,
  );
  const [selectedRoomId, setSelectedRoomId] = useState<string>("");
  const [locations, setLocations] = useState<MapLocation[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(true);

  const fetchLocations = useCallback(async () => {
    try {
      const res = await fetch("/api/locations/list");
      if (res.ok) {
        const data = await res.json();
        setLocations(data);
      }
    } catch (error) {
      console.error("Failed to fetch locations:", error);
    } finally {
      setLoadingLocations(false);
    }
  }, []);

  const fetchCurrentLocation = useCallback(async () => {
    try {
      const res = await fetch(`/api/locations/current-v2?catId=${catId}`);
      if (res.ok) {
        const data = await res.json();
        setCurrentLocation(data);
      }
    } catch (error) {
      console.error("Failed to fetch location:", error);
    }
  }, [catId]);

  useEffect(() => {
    fetchCurrentLocation();
    fetchLocations();
  }, [fetchCurrentLocation, fetchLocations]);

  const handleLocationClick = (location: MapLocation) => {
    if (isReporting) return;
    setSelectedLocation(location);
    // Pre-select first room if location has rooms
    if (location.rooms.length > 0) {
      setSelectedRoomId(location.rooms[0].id);
    }
  };

  const handleConfirmReport = async () => {
    if (!selectedLocation || isReporting) return;

    // If location has rooms, ensure one is selected
    if (selectedLocation.rooms.length > 0 && !selectedRoomId) {
      toast.error("Please select a room");
      return;
    }

    setIsReporting(true);
    try {
      const res = await fetch("/api/locations/report-v2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          catId,
          locationId: selectedLocation.id,
          roomId: selectedRoomId || null,
        }),
      });

      if (res.ok) {
        const selectedRoom = selectedLocation.rooms.find(
          (r) => r.id === selectedRoomId,
        );
        const locationName = selectedRoom
          ? `${selectedLocation.name} (${selectedRoom.name})`
          : selectedLocation.name;
        toast.success(`Rocky reported at ${locationName}`);
        fetchCurrentLocation();
        setSelectedLocation(null);
        setSelectedRoomId("");
      } else {
        const error = await res.json();
        toast.error(error.message || "Failed to report location");
      }
    } catch (error) {
      toast.error("Failed to report location");
      console.log(error);
    } finally {
      setIsReporting(false);
    }
  };

  const handleCancelReport = () => {
    setSelectedLocation(null);
    setSelectedRoomId("");
  };

  const getRockyPosition = () => {
    if (!currentLocation || currentLocation.exitTime) return null;

    const location = locations.find(
      (loc) => loc.id === currentLocation.locationId,
    );
    if (!location) return null;

    const isOutdoor = location.type === "OUTDOOR";
    return {
      location,
      sprite: isOutdoor ? "/rocky-motion.png" : "/rocky-resting.png",
    };
  };

  const rockyPos = getRockyPosition();

  if (loadingLocations) {
    return (
      <Card className="overflow-hidden">
        <div className="p-8 text-center text-muted-foreground">
          Loading map...
        </div>
      </Card>
    );
  }

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
          {locations.map((location) => (
            <button
              key={location.id}
              onClick={() => handleLocationClick(location)}
              disabled={isReporting}
              className="absolute border border-primary/30 hover:bg-primary/20 hover:border-primary transition-all rounded-sm group"
              style={{
                top: location.gridTop,
                left: location.gridLeft,
                width: location.gridWidth,
                height: location.gridHeight,
              }}
              title={location.name}
            >
              {/* Location name tooltip */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-background/90 rounded-sm">
                <span className="text-xs pixel-font text-foreground px-2 text-center">
                  {location.name}
                </span>
              </div>

              {/* Rocky's position */}
              {rockyPos && rockyPos.location.id === location.id && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <img
                    src={rockyPos.sprite}
                    alt="Rocky"
                    className="w-24 h-24 object-contain drop-shadow-lg"
                  />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Map legend */}
      {/* <div className="p-3 bg-muted/30 border-t border-border"> */}
      {/*   <div className="flex items-center justify-between gap-4 text-xs pixel-font"> */}
      {/*     <div className="flex items-center gap-2"> */}
      {/*       <span className="text-terminal-cyan">◆</span> */}
      {/*       <span className="text-muted-foreground"> */}
      {/*         Click grid to report location */}
      {/*       </span> */}
      {/*     </div> */}
      {/*     <div className="flex items-center gap-3"> */}
      {/*       <div className="flex items-center gap-1"> */}
      {/*         <Image src="/rocky-motion.png" alt="" width={16} height={16} /> */}
      {/*         <span className="text-muted-foreground">Outdoor</span> */}
      {/*       </div> */}
      {/*       <div className="flex items-center gap-1"> */}
      {/*         <Image src="/rocky-resting.png" alt="" width={16} height={16} /> */}
      {/*         <span className="text-muted-foreground">Indoor</span> */}
      {/*       </div> */}
      {/*     </div> */}
      {/*   </div> */}
      {/* </div> */}

      {/* Confirmation Dialog */}
      <Dialog
        open={selectedLocation !== null}
        onOpenChange={(open) => !open && handleCancelReport()}
      >
        <DialogContent className="sm:max-w-106.25">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-terminal-cyan">★</span>
              Report Prince Rocky's Location
            </DialogTitle>
            <DialogDescription>
              {selectedLocation && selectedLocation.rooms.length > 0
                ? `Where in ${selectedLocation.name} is Prince Rocky?`
                : `Confirm that Prince Rocky is at ${selectedLocation?.name}`}
            </DialogDescription>
          </DialogHeader>

          {selectedLocation && selectedLocation.rooms.length > 0 && (
            <div className="py-4">
              <Label className="text-sm font-medium mb-3 block">
                Select Room:
              </Label>
              <RadioGroup
                value={selectedRoomId}
                onValueChange={setSelectedRoomId}
              >
                {selectedLocation.rooms.map((room) => (
                  <div
                    key={room.id}
                    className="flex items-center space-x-2 mb-2"
                  >
                    <RadioGroupItem value={room.id} id={`room-${room.id}`} />
                    <Label
                      htmlFor={`room-${room.id}`}
                      className="cursor-pointer"
                    >
                      {room.name}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCancelReport}
              disabled={isReporting}
            >
              Cancel
            </Button>
            <Button onClick={handleConfirmReport} disabled={isReporting}>
              {isReporting ? "Reporting..." : "Confirm Report"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
