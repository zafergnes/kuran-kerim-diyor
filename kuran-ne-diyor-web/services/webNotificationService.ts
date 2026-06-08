import { apiClient } from "./apiClient";
import { useUserStore } from "@/store/userStore";

// Helper function to convert VAPID public key (urlSafeBase64) to Uint8Array
function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export class WebNotificationService {
  /**
   * Registers Service Worker, requests permission and subscribes to push notifications
   */
  static async registerAndSubscribe() {
    if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      console.warn("[WebNotification] Push notifications not supported in this browser.");
      return null;
    }

    try {
      // 1. Register service worker
      const registration = await navigator.serviceWorker.register("/sw.js");
      console.log("[WebNotification] Service Worker registered:", registration);

      // 2. Request Notification permission
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        console.warn("[WebNotification] Notification permission denied.");
        return null;
      }

      // 3. Get VAPID key from env
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        console.error("[WebNotification] VAPID public key not found. Please set NEXT_PUBLIC_VAPID_PUBLIC_KEY env variable.");
        return null;
      }

      const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);

      // 4. Subscribe with PushManager
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey
      });

      // 5. Send subscription to backend
      const subscriptionJSON = subscription.toJSON();
      if (subscriptionJSON.endpoint && subscriptionJSON.keys?.p256dh && subscriptionJSON.keys?.auth) {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Istanbul";
        const language = useUserStore.getState().language || "tr";
        const userId = useUserStore.getState().user?.id; // backend uses id or user object

        await apiClient.post("/notifications/register-web", {
          endpoint: subscriptionJSON.endpoint,
          p256dh: subscriptionJSON.keys.p256dh,
          auth: subscriptionJSON.keys.auth,
          timezone,
          language,
          userId
        });
        
        console.log("[WebNotification] Registered successfully with subscription.");
        return subscription;
      }
    } catch (error) {
      console.error("[WebNotification] Error registering web push:", error);
    }
    return null;
  }
}
