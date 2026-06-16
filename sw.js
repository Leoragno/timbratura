const CACHE_NAME = 'timbratura-v1';
const ASSETS = [
  '/timbratura.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS).catch((err) => {
        console.warn('⚠️ Alcune risorse non sono state cache:', err);
        // Non fallire l'installazione per errori di cache
      });
    })
  );
  self.skipWaiting();
});

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

// Strategia: Network First
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Ignora richieste a estensioni Chrome
  if (url.protocol === 'chrome-extension:' || url.protocol === 'chrome:' || url.protocol === 'about:') {
    return;
  }

  // Le chiamate Supabase vanno sempre in rete
  if (url.hostname.includes('supabase.co')) {
    event.respondWith(fetch(event.request).catch(err => {
      console.warn('⚠️ Fetch Supabase fallito:', err);
      return new Response(JSON.stringify({ error: 'Offline' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }));
    return;
  }

  // CDN → cache first
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

  // Pagine app → network first, cache fallback
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

// Gestione Push Notification
self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Notifica Oratorio';
  const options = {
    body: data.body || 'Nuovo messaggio disponibile',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: data.url || '/timbratura.html'
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Gestione click notifica
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      if (clientList.length > 0) {
        let client = clientList[0];
        for (let i = 0; i < clientList.length; i++) {
          if (clientList[i].focused) {
            client = clientList[i];
          }
        }
        return client.focus();
      }
      return clients.openWindow('/timbratura.html');
    })
  );
});
