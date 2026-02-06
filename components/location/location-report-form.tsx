"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { MapPin, Home, Building2 } from "lucide-react";

const reportSchema = z.object({
  locationType: z.enum(["APARTMENT", "OUTDOOR", "BUILDING_COMMON"]),
  apartmentId: z.string().optional(),
  outdoorLocationId: z.string().optional(),
  buildingAreaName: z.string().optional(),
  notes: z.string().optional(),
});

type ReportFormData = z.infer<typeof reportSchema>;

interface LocationReportFormProps {
  catId: string;
}

interface Apartment {
  id: string;
  name: string;
}

interface OutdoorLocation {
  id: string;
  name: string;
}

export function LocationReportForm({ catId }: LocationReportFormProps) {
  const [locationType, setLocationType] = useState<string>("OUTDOOR");
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [outdoorLocations, setOutdoorLocations] = useState<OutdoorLocation[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, setValue } = useForm<ReportFormData>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      locationType: "OUTDOOR",
    },
  });

  useEffect(() => {
    // Fetch user's apartments
    fetch("/api/apartments")
      .then((res) => res.json())
      .then((data) => setApartments(data))
      .catch(console.error);

    // Fetch outdoor locations
    fetch("/api/outdoor-locations")
      .then((res) => res.json())
      .then((data) => setOutdoorLocations(data))
      .catch(console.error);
  }, []);

  const onSubmit = async (data: ReportFormData) => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/locations/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          catId,
          ...data,
          entryTime: new Date().toISOString(),
        }),
      });

      if (res.ok) {
        toast.success("Location reported!");
        window.location.reload();
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to report location");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Location Type Selection */}
      <div className="grid grid-cols-3 gap-2">
        <Button
          type="button"
          variant={locationType === "APARTMENT" ? "default" : "outline"}
          className="h-20 flex-col gap-2"
          onClick={() => {
            setLocationType("APARTMENT");
            setValue("locationType", "APARTMENT");
          }}
        >
          <Home className="h-6 w-6" />
          <span className="text-xs">My Apartment</span>
        </Button>

        <Button
          type="button"
          variant={locationType === "OUTDOOR" ? "default" : "outline"}
          className="h-20 flex-col gap-2"
          onClick={() => {
            setLocationType("OUTDOOR");
            setValue("locationType", "OUTDOOR");
          }}
        >
          <MapPin className="h-6 w-6" />
          <span className="text-xs">Outdoor</span>
        </Button>

        <Button
          type="button"
          variant={locationType === "BUILDING_COMMON" ? "default" : "outline"}
          className="h-20 flex-col gap-2"
          onClick={() => {
            setLocationType("BUILDING_COMMON");
            setValue("locationType", "BUILDING_COMMON");
          }}
        >
          <Building2 className="h-6 w-6" />
          <span className="text-xs">Building</span>
        </Button>
      </div>

      {/* Location Selection based on type */}
      {locationType === "APARTMENT" && (
        <div className="space-y-2">
          <Label htmlFor="apartmentId">Select Your Apartment</Label>
          <Select
            onValueChange={(value) => setValue("apartmentId", value)}
          >
            <SelectTrigger className="h-12">
              <SelectValue placeholder="Choose apartment..." />
            </SelectTrigger>
            <SelectContent>
              {apartments.length === 0 ? (
                <div className="p-2 text-sm text-muted-foreground">
                  No apartments yet. Add one first!
                </div>
              ) : (
                apartments.map((apt) => (
                  <SelectItem key={apt.id} value={apt.id}>
                    {apt.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
      )}

      {locationType === "OUTDOOR" && (
        <div className="space-y-2">
          <Label htmlFor="outdoorLocationId">Select Outdoor Location</Label>
          <Select
            onValueChange={(value) => setValue("outdoorLocationId", value)}
          >
            <SelectTrigger className="h-12">
              <SelectValue placeholder="Choose location..." />
            </SelectTrigger>
            <SelectContent>
              {outdoorLocations.map((loc) => (
                <SelectItem key={loc.id} value={loc.id}>
                  {loc.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {locationType === "BUILDING_COMMON" && (
        <div className="space-y-2">
          <Label htmlFor="buildingAreaName">Building Area</Label>
          <Input
            id="buildingAreaName"
            placeholder="e.g., Hallway, Stairwell, Lobby"
            {...register("buildingAreaName")}
            className="h-12"
          />
        </div>
      )}

      {/* Optional Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes">Notes (optional)</Label>
        <Input
          id="notes"
          placeholder="Add any additional details..."
          {...register("notes")}
          className="h-12"
        />
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full h-12 text-base font-medium"
        size="lg"
      >
        {isSubmitting ? "Reporting..." : "Report Location"}
      </Button>
    </form>
  );
}
