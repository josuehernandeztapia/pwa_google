const CACHE_NAME = 'conductores-pwa-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/index.tsx',
  '/App.tsx',
  '/manifest.json',
  'https://cdn.tailwindcss.com'
];

// Install
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

// Fetch con Network First para APIs, Cache First para assets
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  // Serve API requests from network first, then cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => caches.match(event.request).then(res => res || new Response(JSON.stringify({ offline: true }), { headers: { 'Content-Type': 'application/json' } })))
    );
  } else if (event.request.url.startsWith('http')) {
    // Serve assets from cache first, then network
    event.respondWith(
      caches.match(event.request)
        .then((response) => response || fetch(event.request))
    );
  }
});

// Background Sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(syncData());
  }
});

async function syncData() {
  // This is a placeholder for the actual sync logic
  // In a real app, this would get pending operations from IndexedDB
  // and send them to the server via the DataSyncService logic.
  console.log('Sync event triggered. The DataSyncService will handle the queue.');
  // In a real implementation, you might post a message to the client
  // to trigger the sync service logic if the page is open.
  const clients = await self.clients.matchAll({ includeUncontrolled: true, type: 'window' });
  clients.forEach(client => {
      client.postMessage({ type: 'TRIGGER_SYNC' });
  });
}