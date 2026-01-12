"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

interface LocationData {
  location: string;
  lastSeen: Date | null;
}

export function StatusBar() {
  const pathname = usePathname();
  const [locationData, setLocationData] = useState<LocationData>({
    location: "Unknown",
    lastSeen: null,
  });

  useEffect(() => {
    // Fetch current location initially
    const fetchLocation = async () => {
      try {
        const res = await fetch("/api/locations/current-v2?catId=rocky");
        if (res.ok) {
          const data = await res.json();

          // If we have a location, fetch the location details
          if (data.locationId) {
            const locationsRes = await fetch("/api/locations/list");
            if (locationsRes.ok) {
              const locations = await locationsRes.json();
              const location = locations.find((loc: any) => loc.id === data.locationId);

              let locationName = location?.name || "Unknown";

              // If there's an apartment, include it
              if (data.apartmentId && location) {
                const apartment = location.apartments?.find((apt: any) => apt.id === data.apartmentId);
                if (apartment) {
                  locationName = `${locationName} (${apartment.name})`;
                }
              }

              setLocationData({
                location: locationName,
                lastSeen: data.entryTime ? new Date(data.entryTime) : null,
              });
            }
          } else {
            setLocationData({
              location: "Unknown",
              lastSeen: null,
            });
          }
        }
      } catch (error) {
        console.error("Failed to fetch location:", error);
      }
    };

    fetchLocation();

    // Subscribe to real-time updates via SSE
    const eventSource = new EventSource("/api/locations/events?catId=rocky");

    eventSource.addEventListener("message", (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "location-update") {
          // Update location in real-time
          let locationName = data.locationName || "Unknown";
          if (data.apartmentName) {
            locationName = `${locationName} (${data.apartmentName})`;
          }

          setLocationData({
            location: locationName,
            lastSeen: data.entryTime ? new Date(data.entryTime) : null,
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
  }, []);

  const formatTime = (date: Date | null) => {
    if (!date) return "N/A";
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const getPathDisplay = () => {
    // Remove /dashboard prefix and format nicely
    const path = pathname.replace("/dashboard", "") || "/";
    return `trocker${path === "/" ? "/dashboard" : path}`;
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 h-7 bg-[#252020] border border-border text-xs font-mono flex items-center z-50 shadow-lg overflow-hidden">
      {/* Left section - Path */}
      <div className="bg-primary text-[#2c2525] px-3 h-full flex items-center font-bold gap-1.5">
        <span className="text-base">◆</span>
        <span>{getPathDisplay()}</span>
      </div>
      <div className="text-primary" style={{ fontSize: '1.4em', lineHeight: '0.5', marginLeft: '-1px' }}>▶</div>

      {/* Last spotted at section */}
      <div className="bg-[#363031] text-terminal-cyan px-3 h-full flex items-center gap-1.5 ml-[-1px]">
        <span className="text-base">★</span>
        <span>Last spotted at:</span>
        <span className="text-foreground font-semibold">{locationData.location}</span>
      </div>
      <div className="text-[#363031]" style={{ fontSize: '1.4em', lineHeight: '0.5', marginLeft: '-1px' }}>▶</div>

      {/* Middle section - spacer */}
      <div className="flex-1"></div>

      {/* Spotted at section */}
      <div className="text-secondary" style={{ fontSize: '1.4em', lineHeight: '0.5', transform: 'scaleX(-1)' }}>▶</div>
      <div className="bg-secondary text-[#2c2525] px-3 h-full flex items-center font-semibold gap-1.5 ml-[-1px]">
        <span className="text-base">◷</span>
        <span>Spotted at: {formatTime(locationData.lastSeen)}</span>
      </div>
    </div>
  );
}
