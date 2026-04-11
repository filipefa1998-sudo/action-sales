// Action Plumbing Sales Tracker — Service Worker
// Caches the app shell so it loads fast even on bad signal.
// Data always comes from Firebase (live), never cached.

const CACHE_NAME = 'action-tracker-v1';
const SHELL = [
  '/action-sales/index.html',
  '/action-sales/calls.html',
  '/action-sales/goals.html',
  '/action-sales/reports.html',
  '/action-sales/money.html',
  '/action-sales/competition.html',
  '/action-sales/manager.html',
  '/action-sales/turnin.html',
  '/action-sales/action_workbook.html',
  '/action-sales/team_workbook.html',
  '/action-sales/manifest.json',
  '/action-sales/icon-192x192.png',
  '/action-sales/icon-512x512.png'
];

// Install — cache the app shell
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL))
  );
  self.skipWaiting();
});

// Activate — clean up old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — network first for Firebase, cache first for app shell
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Always go network for Firebase / external APIs
  if (
    url.hostname.includes('firebase') ||
    url.hostname.includes('firebaseio') ||
    url.hostname.includes('googleapis') ||
    url.hostname.includes('gstatic') ||
    url.hostname.includes('fonts') ||
    url.hostname.includes('anthropic') ||
    url.hostname.includes('workers.dev')
  ) {
    return; // let browser handle it normally
  }

  // Cache-first for local app files
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(response => {
        // Cache new local files on the fly
        if (response && response.status === 200 && e.request.method === 'GET') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return response;
      });
    })
  );
});
