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
    // Fetch current location
    const fetchLocation = async () => {
      try {
        const res = await fetch("/api/locations/current?catId=rocky");
        if (res.ok) {
          const data = await res.json();
          setLocationData({
            location: data.location || "Unknown",
            lastSeen: data.entryTime ? new Date(data.entryTime) : null,
          });
        }
      } catch (error) {
        console.error("Failed to fetch location:", error);
      }
    };

    fetchLocation();
    const interval = setInterval(fetchLocation, 10000); // Update every 10s
    return () => clearInterval(interval);
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

      {/* Currently at section */}
      <div className="bg-[#363031] text-terminal-cyan px-3 h-full flex items-center gap-1.5 ml-[-1px]">
        <span className="text-base">★</span>
        <span>Currently at:</span>
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
