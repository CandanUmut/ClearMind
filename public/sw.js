// ClearMind service worker — offline-first, no network at runtime by design.
// Strategy: precache the app shell; serve same-origin assets cache-first and
// backfill the cache on first fetch (works with Vite's hashed filenames).
//
// The base is derived from the worker's own location so it works at any path
// (e.g. /ClearMind/) without hardcoding the repo name or casing.

const CACHE = 'clearmind-v5';
const BASE = new URL('./', self.location).pathname; // e.g. "/ClearMind/"
const SHELL = [BASE, BASE + 'index.html', BASE + 'manifest.webmanifest'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      // Ignore precache failures (e.g. a path that isn't there yet) so install
      // never blocks the app from loading.
      .then((c) => Promise.allSettled(SHELL.map((u) => c.add(u))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // never touch cross-origin (fonts)

  // SPA navigations → network first, fall back to the cached shell offline.
  if (req.mode === 'navigate') {
    event.respondWith(fetch(req).catch(() => caches.match(BASE + 'index.html')));
    return;
  }

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        if (res.ok && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      });
    }),
  );
});
