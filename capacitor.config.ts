// FILE: /capacitor.config.ts
const config = {
  appId: "com.myfamousfinds.app",
  appName: "Famous Finds",
  webDir: "out",
  bundledWebRuntime: false,

  server: {
    // In production, the app loads from the bundled files.
    // For development, uncomment the url below to point to your dev server:
    // url: "http://YOUR_LOCAL_IP:3000",
    androidScheme: "https",
    iosScheme: "https",
  },

  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: "#111827",
      showSpinner: false,
      androidScaleType: "CENTER_CROP",
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#111827",
    },
    Keyboard: {
      resize: "body",
      resizeOnFullScreen: true,
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
  },

  ios: {
    contentInset: "automatic",
    preferredContentMode: "mobile",
    scheme: "Famous Finds",
    backgroundColor: "#111827",
  },

  android: {
    backgroundColor: "#111827",
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
};

export default config;
