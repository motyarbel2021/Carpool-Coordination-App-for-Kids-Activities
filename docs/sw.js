// Service Worker for Hebrew Transportation Coordination App
const CACHE_NAME = 'hebrew-transport-app-v1.0.9-radical-fix';
const OFFLINE_URL = './offline.html';

// Files to cache for offline functionality
const CACHE_FILES = [
  './',
  './index.html',
  './app.js',
  './styles.css',
  './manifest.json',
  './offline.html',
  // CDN files that we want to cache
  'https://cdn.tailwindcss.com',
  'https://unpkg.com/react@18/umd/react.development.js',
  'https://unpkg.com/react-dom@18/umd/react-dom.development.js',
  'https://unpkg.com/@babel/standalone/babel.min.js',
  'https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css'
];

// Install event - cache files
self.addEventListener('install', (event) => {
  console.log('📱 Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📁 Service Worker: Caching app files');
        return cache.addAll(CACHE_FILES);
      })
      .then(() => {
        console.log('✅ Service Worker: Install completed');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('❌ Service Worker: Install failed', error);
      })
  );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  console.log('🔄 Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('🗑️ Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('✅ Service Worker: Activation completed');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve cached files when offline
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;
  
  // Skip chrome extension requests
  if (event.request.url.startsWith('chrome-extension://')) return;
  
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version if available
        if (response) {
          console.log('📋 Service Worker: Serving from cache', event.request.url);
          return response;
        }
        
        // Try to fetch from network
        return fetch(event.request)
          .then((response) => {
            // Don't cache non-successful responses
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Clone response for caching
            const responseToCache = response.clone();
            
            // Add to cache for future use
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
            
            return response;
          })
          .catch(() => {
            console.log('📱 Service Worker: Network failed, serving offline page');
            // If it's a navigation request, show offline page
            if (event.request.destination === 'document') {
              return caches.match(OFFLINE_URL);
            }
            
            // For other requests, try to return a cached fallback
            if (event.request.destination === 'image') {
              return new Response('', {
                status: 200,
                statusText: 'OK',
                headers: new Headers({
                  'Content-Type': 'image/svg+xml'
                })
              });
            }
            
            return new Response('', {
              status: 200,
              statusText: 'OK',
              headers: new Headers({
                'Content-Type': 'text/plain'
              })
            });
          });
      })
  );
});

// Background sync for when connection is restored
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    console.log('🔄 Service Worker: Background sync triggered');
    event.waitUntil(doBackgroundSync());
  }
});

function doBackgroundSync() {
  // Here you can sync data when connection is restored
  // For example, send queued form submissions or sync user data
  return Promise.resolve();
}

// Push notification handling (for future use)
self.addEventListener('push', (event) => {
  console.log('📳 Service Worker: Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : 'עדכון חדש באפליקציית ההסעות',
    icon: './icons/icon-192x192.png',
    badge: './icons/icon-72x72.png',
    tag: 'transport-notification',
    dir: 'rtl',
    lang: 'he',
    actions: [
      {
        action: 'view',
        title: 'צפה',
        icon: './icons/icon-96x96.png'
      },
      {
        action: 'dismiss',
        title: 'סגור',
        icon: './icons/icon-96x96.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('ניהול הסעות החוג', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Service Worker: Notification clicked', event.action);
  
  event.notification.close();
  
  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow('./')
    );
  }
});