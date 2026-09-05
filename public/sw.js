const APP_CACHE = 'pokeshiny-app-v2';
const RUNTIME_CACHE = 'pokeshiny-runtime-v2';
const APP_SHELL = [
  '/',
  '/counter',
  '/manifest.webmanifest',
  '/placeholder.svg',
  '/pwa/app-icon-192.png',
  '/pwa/app-icon-512.png',
  '/pwa/app-icon-maskable-512.png',
];

const cacheResponse = async (cacheName, request, response) => {
  if (!response || !response.ok || response.type === 'opaque') return response;
  const cache = await caches.open(cacheName);
  await cache.put(request, response.clone());
  return response;
};

const trimCache = async (cacheName, maxEntries) => {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  const extra = keys.length - maxEntries;
  if (extra > 0) {
    await Promise.all(keys.slice(0, extra).map((key) => cache.delete(key)));
  }
};

const precacheCurrentBuild = async () => {
  const cache = await caches.open(APP_CACHE);
  const rootResponse = await fetch('/', { cache: 'reload' });
  if (rootResponse.ok) {
    await cache.put('/', rootResponse.clone());
    const html = await rootResponse.text();
    const assetPaths = Array.from(html.matchAll(/(?:src|href)=["']([^"']+)["']/g))
      .map((match) => match[1])
      .filter((path) => path.startsWith('/assets/'));
    await Promise.allSettled(assetPaths.map(async (path) => {
      const response = await fetch(path, { cache: 'reload' });
      if (response.ok) await cache.put(path, response);
    }));
  }

  await Promise.allSettled(APP_SHELL.slice(1).map(async (path) => {
    const response = await fetch(path, { cache: 'reload' });
    if (response.ok) await cache.put(path, response);
  }));
};

self.addEventListener('install', (event) => {
  event.waitUntil(precacheCurrentBuild().then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const validCaches = new Set([APP_CACHE, RUNTIME_CACHE]);
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.filter((name) => !validCaches.has(name)).map((name) => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname === '/sw.js') return;

  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        if (response.ok) {
          const cache = await caches.open(APP_CACHE);
          await cache.put('/', response.clone());
        }
        return response;
      } catch {
        const cache = await caches.open(APP_CACHE);
        return (await cache.match(request)) || (await cache.match('/counter')) || (await cache.match('/'));
      }
    })());
    return;
  }

  const isBuildAsset = url.pathname.startsWith('/assets/');
  const isReusableAsset = request.destination === 'image' || request.destination === 'font';

  if (isBuildAsset || isReusableAsset) {
    event.respondWith((async () => {
      const cacheName = isBuildAsset ? APP_CACHE : RUNTIME_CACHE;
      const cached = await caches.match(request);
      if (cached) return cached;

      try {
        const response = await fetch(request);
        await cacheResponse(cacheName, request, response);
        // A Pokédex view can display hundreds of unique HOME and game sprites.
        // Keep enough assets to avoid evicting them while the user rapidly moves
        // between pages, which otherwise causes repeated downloads and blank cards.
        if (isReusableAsset) void trimCache(RUNTIME_CACHE, 1500);
        return response;
      } catch {
        if (request.destination === 'image') {
          return (await caches.match('/placeholder.svg')) || Response.error();
        }
        return Response.error();
      }
    })());
  }
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});
