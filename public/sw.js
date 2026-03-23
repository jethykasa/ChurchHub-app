// ChurchHub Service Worker v9 — Cloudflare Pages optimised
const CACHE = 'churchhub-v9';

self.addEventListener('install', e => {
  // Skip waiting immediately — don't block on precache
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(c =>
      Promise.allSettled([
        c.add('./index.html'),
        c.add('./manifest.json'),
        c.add('./icon-192.png'),
        c.add('./icon-512.png'),
        c.add('./icon.svg')
      ])
    )
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  // Only handle same-origin requests — let Supabase calls pass through untouched
  if (url.hostname !== self.location.hostname) return;
  e.respondWith(
    fetch(e.request)
      .then(res => {
        if (res && res.status === 200 && res.type !== 'opaque') {
          caches.open(CACHE).then(c => c.put(e.request, res.clone()));
        }
        return res;
      })
      .catch(() => caches.match(e.request)
        .then(r => r || caches.match('./index.html'))
      )
  );
});
