"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { UtensilsCrossed } from "lucide-react";

interface FeedButtonProps {
  catId: string;
}

export function FeedButton({ catId }: FeedButtonProps) {
  const [isFeeding, setIsFeeding] = useState(false);

  const handleFeed = async () => {
    setIsFeeding(true);
    try {
      const res = await fetch("/api/hunger/feed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ catId }),
      });

      if (res.ok) {
        toast.success("Rocky has been fed!");
        // Trigger a page refresh to update hunger meter
        window.location.reload();
      } else {
        toast.error("Failed to feed Rocky");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsFeeding(false);
    }
  };

  return (
    <Button
      onClick={handleFeed}
      disabled={isFeeding}
      className="w-full h-12 gap-2 text-base font-medium"
      size="lg"
    >
      <UtensilsCrossed className="h-5 w-5" />
      {isFeeding ? "Feeding..." : "Feed Rocky"}
    </Button>
  );
}
