"use client";

import { useEffect, useState, useCallback } from "react";
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

interface Apartment {
  id: string;
  name: string;
  description: string | null;
  displayOrder: number;
  user: {
    id: string;
    email: string;
    name: string | null;
  };
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
  apartments: Apartment[];
}

interface CurrentLocation {
  locationId: string;
  apartmentId?: string | null;
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
  const [selectedApartmentId, setSelectedApartmentId] = useState<string>("");
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

    // Subscribe to real-time location updates via SSE
    const eventSource = new EventSource(`/api/locations/events?catId=${catId}`);

    eventSource.addEventListener("message", (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "location-update") {
          // Update current location in real-time
          setCurrentLocation({
            locationId: data.locationId,
            apartmentId: data.apartmentId,
            locationType: data.locationType || "OUTDOOR",
            exitTime: null,
          });
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
  }, [fetchCurrentLocation, fetchLocations, catId]);

  const handleLocationClick = (location: MapLocation) => {
    if (isReporting) return;
    setSelectedLocation(location);

    // Pre-select apartment if location has apartments
    if (location.apartments.length > 0) {
      // If Rocky is currently in this location and in a specific apartment, pre-select that apartment
      if (currentLocation &&
          currentLocation.locationId === location.id &&
          currentLocation.apartmentId &&
          location.apartments.some(apt => apt.id === currentLocation.apartmentId)) {
        setSelectedApartmentId(currentLocation.apartmentId);
      } else {
        // Otherwise pre-select the first apartment
        setSelectedApartmentId(location.apartments[0].id);
      }
    }
  };

  const handleConfirmReport = async () => {
    if (!selectedLocation || isReporting) return;

    // If location has apartments, ensure one is selected
    if (selectedLocation.apartments.length > 0 && !selectedApartmentId) {
      toast.error("Please select an apartment");
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
          apartmentId: selectedApartmentId || null,
        }),
      });

      if (res.ok) {
        const selectedApartment = selectedLocation.apartments.find(
          (a) => a.id === selectedApartmentId,
        );
        const locationName = selectedApartment
          ? `${selectedLocation.name} (${selectedApartment.name})`
          : selectedLocation.name;
        toast.success(`Rocky reported at ${locationName}`);
        fetchCurrentLocation();
        setSelectedLocation(null);
        setSelectedApartmentId("");
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
    setSelectedApartmentId("");
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
              {selectedLocation && selectedLocation.apartments.length > 0
                ? `Which apartment in ${selectedLocation.name} is Prince Rocky in?`
                : `Confirm that Prince Rocky is at ${selectedLocation?.name}`}
            </DialogDescription>
          </DialogHeader>

          {selectedLocation && selectedLocation.apartments.length > 0 && (
            <div className="py-4">
              <Label className="text-sm font-medium mb-3 block">
                Select Apartment:
              </Label>
              <RadioGroup
                value={selectedApartmentId}
                onValueChange={setSelectedApartmentId}
              >
                {selectedLocation.apartments.map((apartment) => (
                  <div
                    key={apartment.id}
                    className="flex items-center space-x-2 mb-2"
                  >
                    <RadioGroupItem value={apartment.id} id={`apt-${apartment.id}`} />
                    <Label
                      htmlFor={`apt-${apartment.id}`}
                      className="cursor-pointer flex flex-col"
                    >
                      <span>{apartment.name}</span>
                      <span className="text-xs text-muted-foreground">
                        Owner: {apartment.user.name || apartment.user.email}
                      </span>
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
