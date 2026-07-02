/* ══════════════════════════════════════════════════════════════════
   ACTION ARMY — SERVICE WORKER
   Strategy: network-first for everything (so GitHub Pages deploys
   show up immediately), falling back to the last cached copy when
   offline. Firebase SDK + Google Fonts get cached too, so the app
   shell opens with no signal — live data syncs when Firebase
   reconnects.
   Bump CACHE_VERSION any time you want to force-clear old caches.
   ══════════════════════════════════════════════════════════════════ */
const CACHE_VERSION = 'action-army-v2';

self.addEventListener('install', (e) => {
    self.skipWaiting();
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k)))
        ).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (e) => {
    const req = e.request;
    if (req.method !== 'GET') return;

    // Never intercept Firebase Realtime Database traffic
    const url = new URL(req.url);
    if (url.hostname.endsWith('firebaseio.com') || url.hostname.endsWith('firebasedatabase.app')) return;

    e.respondWith(
        fetch(req)
            .then(res => {
                if (res && (res.ok || res.type === 'opaque')) {
                    const copy = res.clone();
                    caches.open(CACHE_VERSION).then(c => c.put(req, copy)).catch(() => {});
                }
                return res;
            })
            .catch(() =>
                caches.match(req).then(hit =>
                    hit || (req.mode === 'navigate' ? caches.match('index.html') : Response.error())
                )
            )
    );
});
