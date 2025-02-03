const CACHE_NAME = "pwa-cache-v1";

// Define assets to cache
const assetsToCache = [
  "/",
  "/manifest.webmanifest",
  "/favicon.ico",
  "/app-logo-192.png",
  "/app-logo-512.png",
  "/static/css/styles.css",
  "/static/js/bundle.js",
];

self.addEventListener("install", (event) => {
  console.log("Service Worker installing.");
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Caching assets...");
      return cache.addAll(assetsToCache).catch((err) => {
        console.error("Failed to cache assets:", err);
      });
    })
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        console.log("Serving cached asset:", event.request.url);
        return response;
      }
      return fetch(event.request).catch((err) => {
        console.error("Network fetch failed:", err);
      });
    })
  );
});
