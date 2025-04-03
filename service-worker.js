// ElementalBox Service Worker
// Features: offline caching, background sync, periodic sync, push notifications

const VERSION = '1.0.0';
const CACHE_NAME = 'elementalbox-cache-v1';
const OFFLINE_URL = '/index.html';

// List of files to cache for offline use
const CACHE_FILES = [
  '/',
  '/index.html',
  '/privacy-policy.html',
  '/contact.html',
  '/protocol-handler.html',
  '/pwa-features.html',
  '/pwa-detection.html',
  '/styles.css',
  '/main.js',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/maskable-icon-192x192.png',
  '/icons/maskable-icon-512x512.png',
  '/icons/shortcut-new.png',
  '/icons/shortcut-fire.png',
  '/icons/shortcut-water.png',
  '/icons/notification-badge.png',
  '/screenshots/screen1.png',
  '/screenshots/screen2.png',
  '/share-target/index.html',
  '/open-file/index.html'
];

// Install event - cache important resources
self.addEventListener('install', function(event) {
  console.log('[ElementalBox SW] Installing Service Worker version', VERSION);
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('[ElementalBox SW] Caching app shell');
        return cache.addAll(CACHE_FILES);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', function(event) {
  console.log('[ElementalBox SW] Activating Service Worker version', VERSION);
  self.clients.claim();
  
  event.waitUntil(
    caches.keys().then(function(keyList) {
      return Promise.all(keyList.map(function(key) {
        if (key !== CACHE_NAME) {
          console.log('[ElementalBox SW] Removing old cache', key);
          return caches.delete(key);
        }
      }));
    })
  );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', function(event) {
  console.log('[ElementalBox SW] Fetch event for', event.request.url);
  
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // Cache hit - return response
        if (response) {
          console.log('[ElementalBox SW] Serving from cache:', event.request.url);
          return response;
        }
        
        console.log('[ElementalBox SW] Fetching from network:', event.request.url);
        return fetch(event.request)
          .then(function(response) {
            // Cache the response
            if (response.status === 200) {
              let responseClone = response.clone();
              caches.open(CACHE_NAME).then(function(cache) {
                cache.put(event.request, responseClone);
              });
            }
            return response;
          })
          .catch(function(error) {
            console.log('[ElementalBox SW] Fetch failed, serving offline page instead:', error);
            
            // If the request was for an HTML page, serve the offline page
            if (event.request.headers.get('accept').includes('text/html')) {
              return caches.match(OFFLINE_URL);
            }
            
            // Otherwise, just return an error response
            return new Response('Network error', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'text/plain'
              })
            });
          });
      })
  );
});

// Background Sync - for syncing offline changes when coming back online
self.addEventListener('sync', function(event) {
  console.log('[ElementalBox SW] Background Sync event:', event.tag);
  
  if (event.tag === 'sync-user-data') {
    event.waitUntil(syncData());
  }
});

// Function to sync data - would connect to your backend API
function syncData() {
  console.log('[ElementalBox SW] Syncing data with server');
  return Promise.resolve(); // Placeholder for actual sync logic
}

// Periodic Background Sync - for regular updates in the background
self.addEventListener('periodicsync', function(event) {
  console.log('[ElementalBox SW] Periodic Sync event:', event.tag);
  
  if (event.tag === 'update-content') {
    event.waitUntil(updateContent());
  }
});

// Function to update content periodically
function updateContent() {
  console.log('[ElementalBox SW] Updating content');
  return caches.open(CACHE_NAME)
    .then(function(cache) {
      return cache.addAll(CACHE_FILES);
    });
}

// Push notifications - to engage users even when the app is closed
self.addEventListener('push', function(event) {
  console.log('[ElementalBox SW] Push notification received:', event);
  
  let notificationData = {
    title: 'ElementalBox Update',
    body: 'Something new happened in ElementalBox!',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/notification-badge.png'
  };
  
  if (event.data) {
    try {
      notificationData = event.data.json();
    } catch (e) {
      notificationData.body = event.data.text();
    }
  }
  
  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      vibrate: [100, 50, 100]
    })
  );
});

// Notification click handler
self.addEventListener('notificationclick', function(event) {
  console.log('[ElementalBox SW] Notification clicked:', event);
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow('/')
  );
});

// Add message event handling for PWA feature detection
self.addEventListener('message', function(event) {
  console.log('[ElementalBox SW] Message received:', event.data);
  
  if (event.data && event.data.action === 'getPWAFeatures') {
    // Respond with all supported PWA features
    event.ports[0].postMessage({
      pwaFeatures: {
        offlineSupport: true,
        backgroundSync: true,
        periodicBackgroundSync: true,
        pushNotifications: true
      }
    });
  }
  
  if (event.data && event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});

// Development helper - log to know the service worker is running
console.log('Service Worker loaded and running!'); 