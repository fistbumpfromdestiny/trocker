"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { MapPin, Home, TreePine } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface CurrentLocationCardProps {
  catId: string;
}

export function CurrentLocationCard({ catId }: CurrentLocationCardProps) {
  const [location, setLocation] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLocation = async () => {
      try {
        const res = await fetch(`/api/locations/current?catId=${catId}`);
        if (res.ok) {
          const data = await res.json();
          setLocation(data.location ? data : null);
        }
      } catch (error) {
        console.error("Failed to fetch location:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLocation();
    const interval = setInterval(fetchLocation, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [catId]);

  const getLocationIcon = () => {
    if (location?.locationType === "APARTMENT") return Home;
    if (location?.locationType === "OUTDOOR") return TreePine;
    return MapPin;
  };

  const getLocationName = () => {
    if (!location) return null;
    if (location.apartment) return location.apartment.name;
    if (location.outdoorLocation) return location.outdoorLocation.name;
    if (location.buildingAreaName) return location.buildingAreaName;
    return "Unknown";
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading...</div>;
  }

  if (!location) {
    return (
      <div className="text-center p-6 text-muted-foreground">
        <MapPin className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p>Rocky hasn't been spotted yet</p>
      </div>
    );
  }

  const Icon = getLocationIcon();

  return (
    <div className="flex items-start gap-4">
      <div className="p-3 rounded-full bg-primary/10">
        <Icon className="h-6 w-6 text-primary" />
      </div>
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-lg">{getLocationName()}</h3>
          <Badge variant="secondary">Current</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Arrived {formatDistanceToNow(new Date(location.entryTime), { addSuffix: true })}
        </p>
        <p className="text-xs text-muted-foreground">
          Reported by {location.user.name || location.user.email}
        </p>
        {location.notes && (
          <p className="text-sm text-muted-foreground mt-2 italic">{location.notes}</p>
        )}
      </div>
    </div>
  );
}
