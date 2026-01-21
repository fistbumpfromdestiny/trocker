"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { usePushNotifications } from "@/hooks/use-push-notifications";

interface Preferences {
  enableMessages: boolean;
  enableArrival: boolean;
  enableDeparture: boolean;
  enableAllLocations: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
}

export function NotificationPreferences() {
  const {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    subscribe,
    unsubscribe,
  } = usePushNotifications();

  const [preferences, setPreferences] = useState<Preferences | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Load preferences
    fetch("/api/notifications/preferences")
      .then((res) => res.json())
      .then((data) => setPreferences(data))
      .catch((err) => console.error("Failed to load preferences:", err));
  }, []);

  const handleSubscribe = async () => {
    const success = await subscribe();
    if (success) {
      toast.success("Notifications enabled!");
    } else {
      toast.error("Failed to enable notifications");
    }
  };

  const handleUnsubscribe = async () => {
    const success = await unsubscribe();
    if (success) {
      toast.success("Notifications disabled");
    } else {
      toast.error("Failed to disable notifications");
    }
  };

  const handleSavePreferences = async () => {
    if (!preferences) return;

    setSaving(true);
    try {
      const res = await fetch("/api/notifications/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preferences),
      });

      if (res.ok) {
        toast.success("Preferences saved");
      } else {
        toast.error("Failed to save preferences");
      }
    } catch {
      toast.error("Failed to save preferences");
    } finally {
      setSaving(false);
    }
  };

  const togglePreference = (key: keyof Preferences) => {
    if (!preferences) return;
    setPreferences({ ...preferences, [key]: !preferences[key] });
  };

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Push Notifications
          </CardTitle>
          <CardDescription>
            Your browser does not support push notifications
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Push Notifications
        </CardTitle>
        <CardDescription>
          Get notified when Rocky arrives or new messages are posted
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enable/Disable Toggle */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <p className="font-medium">
              {isSubscribed ? "Notifications Enabled" : "Notifications Disabled"}
            </p>
            <p className="text-sm text-muted-foreground">
              {permission === "denied"
                ? "Blocked in browser settings"
                : isSubscribed
                  ? "You will receive push notifications"
                  : "Enable to receive notifications"}
            </p>
          </div>
          <Button
            onClick={isSubscribed ? handleUnsubscribe : handleSubscribe}
            disabled={isLoading || permission === "denied"}
            variant={isSubscribed ? "destructive" : "default"}
          >
            {isLoading ? "..." : isSubscribed ? "Disable" : "Enable"}
          </Button>
        </div>

        {/* Preferences (only show if subscribed) */}
        {isSubscribed && preferences && (
          <>
            {/* Message Notifications */}
            <div className="space-y-3">
              <h3 className="font-medium">Messages</h3>
              <ToggleRow
                label="New messages"
                description="When someone posts a new message"
                checked={preferences.enableMessages}
                onChange={() => togglePreference("enableMessages")}
              />
            </div>

            {/* Location Notifications */}
            <div className="space-y-3">
              <h3 className="font-medium">Rocky Tracking</h3>
              <ToggleRow
                label="Arrivals at your apartment"
                description="When Rocky arrives at your place"
                checked={preferences.enableArrival}
                onChange={() => togglePreference("enableArrival")}
              />
              <ToggleRow
                label="Departures from your apartment"
                description="When Rocky leaves your place"
                checked={preferences.enableDeparture}
                onChange={() => togglePreference("enableDeparture")}
              />
              <ToggleRow
                label="All location updates"
                description="Every Rocky movement (lots of notifications)"
                checked={preferences.enableAllLocations}
                onChange={() => togglePreference("enableAllLocations")}
              />
            </div>

            {/* Quiet Hours */}
            <div className="space-y-3">
              <h3 className="font-medium">Quiet Hours</h3>
              <ToggleRow
                label="Enable quiet hours"
                description="No notifications during specified times"
                checked={preferences.quietHoursEnabled}
                onChange={() => togglePreference("quietHoursEnabled")}
              />
              {preferences.quietHoursEnabled && (
                <div className="flex gap-4 pl-4">
                  <div>
                    <Label>Start</Label>
                    <Input
                      type="time"
                      value={preferences.quietHoursStart}
                      onChange={(e) =>
                        setPreferences({
                          ...preferences,
                          quietHoursStart: e.target.value,
                        })
                      }
                      className="w-32"
                    />
                  </div>
                  <div>
                    <Label>End</Label>
                    <Input
                      type="time"
                      value={preferences.quietHoursEnd}
                      onChange={(e) =>
                        setPreferences({
                          ...preferences,
                          quietHoursEnd: e.target.value,
                        })
                      }
                      className="w-32"
                    />
                  </div>
                </div>
              )}
            </div>

            <Button
              onClick={handleSavePreferences}
              disabled={saving}
              className="w-full"
            >
              {saving ? "Saving..." : "Save Preferences"}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <div
      className="flex items-center justify-between p-3 border rounded cursor-pointer hover:bg-muted/50"
      onClick={onChange}
    >
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <div
        className={`w-10 h-6 rounded-full transition-colors ${
          checked ? "bg-primary" : "bg-muted"
        }`}
      >
        <div
          className={`w-4 h-4 rounded-full bg-white mt-1 transition-transform ${
            checked ? "translate-x-5" : "translate-x-1"
          }`}
        />
      </div>
    </div>
  );
}
