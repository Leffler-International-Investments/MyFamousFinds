// Famous Finds — Service Worker for PWA
// Lightweight: caches static assets only, never intercepts page navigations.

const CACHE_NAME = "famous-finds-v3";
const OFFLINE_URL = "/offline.html";

// Static assets to pre-cache on install
const PRE_CACHE = [
  "/offline.html",
  "/manifest.json",
  "/icon/icon-192x192.png",
  "/icon/icon-512x512.png",
  "/favicon-32x32.png",
];

// Install — pre-cache essentials
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.allSettled(PRE_CACHE.map((url) => cache.add(url).catch(() => {})))
    )
  );
  self.skipWaiting();
});

// Activate — clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch — only intercept static assets; let everything else go straight to network
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin GET requests
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  // Never intercept API calls or page navigations — let them go to network normally
  if (url.pathname.startsWith("/api/") || request.mode === "navigate") {
    // For page navigations, only provide offline fallback when network is down
    if (request.mode === "navigate") {
      event.respondWith(
        fetch(request).catch(() => caches.match(OFFLINE_URL))
      );
    }
    return;
  }

  // Static assets (JS, CSS, images, fonts, icons) — cache-first
  if (
    url.pathname.startsWith("/icon/") ||
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.match(/\.(png|jpg|jpeg|svg|webp|gif|ico|woff2?|css|js)$/)
  ) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response.ok) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            }
            return response;
          })
      )
    );
  }
});
