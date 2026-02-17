// FILE: /utils/capacitor.ts
// Capacitor native plugin initialization for iOS and Android.
// Safe to import on web — all calls are no-ops when running in browser.

import { Capacitor } from "@capacitor/core";

export const isNative = Capacitor.isNativePlatform();
export const platform = Capacitor.getPlatform(); // "ios" | "android" | "web"

/**
 * Initialize native plugins. Call once from _app.tsx on mount.
 */
export async function initNativePlugins() {
  if (!isNative) return;

  // Status bar
  try {
    const { StatusBar, Style } = await import("@capacitor/status-bar");
    await StatusBar.setStyle({ style: Style.Dark });
    if (platform === "android") {
      await StatusBar.setBackgroundColor({ color: "#111827" });
    }
  } catch (e) {
    console.warn("StatusBar plugin not available:", e);
  }

  // Splash screen — auto-hide after a brief delay
  try {
    const { SplashScreen } = await import("@capacitor/splash-screen");
    await SplashScreen.hide({ fadeOutDuration: 300 });
  } catch (e) {
    console.warn("SplashScreen plugin not available:", e);
  }

  // Keyboard — add body class when keyboard opens
  try {
    const { Keyboard } = await import("@capacitor/keyboard");
    Keyboard.addListener("keyboardWillShow", () => {
      document.body.classList.add("keyboard-open");
    });
    Keyboard.addListener("keyboardWillHide", () => {
      document.body.classList.remove("keyboard-open");
    });
  } catch (e) {
    // Keyboard plugin only works on iOS/Android
  }

  // Mark body with platform class
  document.body.classList.add("capacitor-app", `platform-${platform}`);
}

/**
 * Register for push notifications (call after user interaction).
 */
export async function registerPushNotifications() {
  if (!isNative) return;

  try {
    const { PushNotifications } = await import("@capacitor/push-notifications");

    const permission = await PushNotifications.requestPermissions();
    if (permission.receive !== "granted") return;

    await PushNotifications.register();

    PushNotifications.addListener("registration", (token) => {
      console.log("Push registration token:", token.value);
      // Send token to your server for storing
      fetch("/api/push/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: token.value, platform }),
      }).catch(() => {});
    });

    PushNotifications.addListener("pushNotificationReceived", (notification) => {
      console.log("Push notification received:", notification);
    });

    PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
      console.log("Push notification action:", action);
      // Navigate to relevant page based on action data
      const url = action.notification.data?.url;
      if (url && typeof window !== "undefined") {
        window.location.href = url;
      }
    });
  } catch (e) {
    console.warn("PushNotifications not available:", e);
  }
}
