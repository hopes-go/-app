const CACHE_NAME = "hopes-go-v22";
const APP_FILES = [
  "./",
  "./index.html",
  "./styles.css",
  "./script.js",
  "./manifest.json",
  "./assets/favicon.svg",
  "./assets/logo.png",
  "./assets/hero-business.png",
  "./assets/pickup-delivery.png",
  "./assets/shop-deliver.png",
  "./assets/custom-request.png",
  "./assets/after-hours.png",
  "./assets/additional-stop.png",
  "./assets/tip.png",
  "./assets/tier-1.png",
  "./assets/tier-2.png",
  "./assets/tier-3.png",
  "./assets/tier-4.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_FILES)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(names.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request)));
});
