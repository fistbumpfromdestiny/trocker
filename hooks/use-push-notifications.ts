"use client";

import { useState, useEffect, useCallback } from "react";

export type PushPermissionState =
  | "prompt"
  | "granted"
  | "denied"
  | "unsupported";

export function usePushNotifications() {
  const [permission, setPermission] =
    useState<PushPermissionState>("prompt");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Check if push notifications are supported (only after mount)
  const isSupported =
    mounted &&
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    if (!isSupported) {
      setPermission("unsupported");
      setIsLoading(false);
      return;
    }

    // Check current permission
    setPermission(Notification.permission as PushPermissionState);

    // Check existing subscription - but don't wait forever if no SW registered
    const checkSubscription = async () => {
      try {
        const registration = await navigator.serviceWorker.getRegistration("/sw.js");
        if (registration) {
          const subscription = await registration.pushManager.getSubscription();
          setIsSubscribed(!!subscription);
        } else {
          setIsSubscribed(false);
        }
      } catch (err) {
        console.error("Error checking push subscription:", err);
        setIsSubscribed(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkSubscription();
  }, [mounted, isSupported]);

  const subscribe = useCallback(async () => {
    if (!isSupported) {
      setError("Push notifications not supported");
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Request permission
      const permissionResult = await Notification.requestPermission();
      setPermission(permissionResult as PushPermissionState);

      if (permissionResult !== "granted") {
        setError("Notification permission denied");
        setIsLoading(false);
        return false;
      }

      // Register service worker
      const registration = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      // Get VAPID public key
      const keyResponse = await fetch("/api/notifications/vapid-public-key");
      if (!keyResponse.ok) {
        throw new Error("Failed to get VAPID key");
      }
      const { publicKey } = await keyResponse.json();

      // Subscribe to push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      // Send subscription to server
      const response = await fetch("/api/notifications/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          userAgent: navigator.userAgent,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save subscription");
      }

      setIsSubscribed(true);
      setIsLoading(false);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to subscribe");
      setIsLoading(false);
      return false;
    }
  }, [isSupported]);

  const unsubscribe = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        // Unsubscribe from push manager
        await subscription.unsubscribe();

        // Remove from server
        await fetch(
          `/api/notifications/unsubscribe?endpoint=${encodeURIComponent(subscription.endpoint)}`,
          {
            method: "DELETE",
          }
        );
      }

      setIsSubscribed(false);
      setIsLoading(false);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to unsubscribe");
      setIsLoading(false);
      return false;
    }
  }, []);

  return {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    error,
    subscribe,
    unsubscribe,
  };
}

// Helper to convert VAPID key from base64 to ArrayBuffer
function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray.buffer;
}
