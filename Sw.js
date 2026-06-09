const CACHE_NAME = 'timbratura-v1';
const ASSETS = [
  '/timbratura.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// Installa e pre-carica le risorse essenziali
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS).catch(() => {
        // Se alcune risorse non ci sono ancora, ignora l'errore
      });
    })
  );
  self.skipWaiting();
});

// Attiva e pulisce cache vecchie
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Strategia: Network First (sempre dati freschi da Supabase)
// Fallback sulla cache se offline
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Le chiamate Supabase vanno sempre in rete (dati live)
  if (url.hostname.includes('supabase.co')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // CDN (font, librerie) → cache first
  if (url.hostname.includes('fonts.googleapis.com') ||
      url.hostname.includes('fonts.gstatic.com') ||
      url.hostname.includes('cdn.jsdelivr.net')) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        return cached || fetch(event.request).then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return res;
        });
      })
    );
    return;
  }

  // Pagine app → network first, cache come fallback offline
  event.respondWith(
    fetch(event.request)
      .then(res => {
        if (res && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(event.request))
  );
});
