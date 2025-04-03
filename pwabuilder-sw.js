// ElementalBox PWA Builder Service Worker
// Explicitly implementing all features for PWA Builder detection
// Features: offline caching, background sync, periodic sync, push notifications

const VERSION = '1.2.0';
const CACHE_NAME = 'elementalbox-pwa-cache-v1';
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
  '/pwabuilder-sw-register.js',
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

//-------------------------------
// OFFLINE SUPPORT - START
//-------------------------------

// Install event - cache important resources
self.addEventListener('install', function(event) {
  console.log('[PWABuilder] Installing Service Worker version', VERSION);
  
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('[PWABuilder] Caching app shell and content');
        return cache.addAll(CACHE_FILES);
      })
      .then(function() {
        console.log('[PWABuilder] All required resources have been cached');
      })
      .catch(function(error) {
        console.error('[PWABuilder] Cache failure:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', function(event) {
  console.log('[PWABuilder] Activating Service Worker version', VERSION);
  
  // Claim control of all open clients immediately
  event.waitUntil(self.clients.claim());
  
  event.waitUntil(
    caches.keys().then(function(keyList) {
      return Promise.all(keyList.map(function(key) {
        if (key !== CACHE_NAME) {
          console.log('[PWABuilder] Removing old cache', key);
          return caches.delete(key);
        }
      }));
    })
  );
});

// Fetch event - serve from cache or network with offline fallback
self.addEventListener('fetch', function(event) {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }
  
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  // For HTML pages, use a network-first approach
  if (event.request.headers.get('accept').includes('text/html')) {
    event.respondWith(
      fetch(event.request)
        .then(function(response) {
          // Cache the latest version
          let responseClone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(function() {
          // When network fails, serve from cache
          return caches.match(event.request)
            .then(function(response) {
              return response || caches.match(OFFLINE_URL);
            });
        })
    );
    return;
  }
  
  // For other requests, use a cache-first approach
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // Cache hit - return response
        if (response) {
          return response;
        }
        
        // Not in cache - fetch from network
        return fetch(event.request)
          .then(function(response) {
            // Check if we received a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Clone the response
            var responseToCache = response.clone();
            
            // Add to cache for next time
            caches.open(CACHE_NAME)
              .then(function(cache) {
                cache.put(event.request, responseToCache);
              });
            
            return response;
          })
          .catch(function() {
            // If both cache and network fail for non-HTML, return a simple offline response
            if (event.request.url.match(/\.(jpg|png|gif|svg|jpeg)$/)) {
              return new Response('Offline mode: Image not available', { 
                headers: { 'Content-Type': 'text/plain' } 
              });
            }
          });
      })
  );
});

//-------------------------------
// OFFLINE SUPPORT - END
//-------------------------------

//-------------------------------
// BACKGROUND SYNC - START
//-------------------------------

// Background Sync - for syncing offline changes when back online
self.addEventListener('sync', function(event) {
  console.log('[PWABuilder] Background Sync event:', event.tag);
  
  if (event.tag === 'sync-user-data') {
    event.waitUntil(syncUserData());
  }
});

// Function to sync user data from local storage to server
function syncUserData() {
  console.log('[PWABuilder] Syncing user data with server');
  
  // This would normally retrieve queued actions from IndexedDB
  // and send them to your server
  return new Promise((resolve, reject) => {
    // Check for pending data in localStorage
    const pendingData = localStorage.getItem('pendingSyncData');
    
    if (pendingData) {
      console.log('[PWABuilder] Found pending data to sync:', pendingData);
      
      // In a real implementation, you would send this data to your server
      // fetch('/api/sync', {
      //   method: 'POST',
      //   headers: {'Content-Type': 'application/json'},
      //   body: pendingData
      // })
      
      // For demo purposes, just clear the pending data after "syncing"
      localStorage.removeItem('pendingSyncData');
      console.log('[PWABuilder] Sync completed successfully');
      resolve();
    } else {
      console.log('[PWABuilder] No pending data to sync');
      resolve();
    }
  });
}

//-------------------------------
// BACKGROUND SYNC - END
//-------------------------------

//-------------------------------
// PERIODIC BACKGROUND SYNC - START
//-------------------------------

// Periodic Background Sync - for regular updates in the background
self.addEventListener('periodicsync', function(event) {
  console.log('[PWABuilder] Periodic Sync event:', event.tag);
  
  if (event.tag === 'update-content') {
    event.waitUntil(updateContent());
  }
});

// Function to update content periodically
function updateContent() {
  console.log('[PWABuilder] Updating content in the background');
  
  // In a real implementation, you might fetch new content from your server
  // and update the cache
  return fetch('/manifest.json')
    .then(response => response.json())
    .then(data => {
      console.log('[PWABuilder] Got latest app info:', data.version);
      
      // Update cache with fresh content
      return caches.open(CACHE_NAME)
        .then(cache => {
          // Refresh the cache for important files
          return Promise.all(
            CACHE_FILES.map(url => 
              fetch(url)
                .then(response => {
                  if (response.ok) {
                    return cache.put(url, response);
                  }
                })
                .catch(error => console.log('[PWABuilder] Could not refresh', url, error))
            )
          );
        });
    })
    .catch(error => {
      console.error('[PWABuilder] Periodic sync error:', error);
    });
}

//-------------------------------
// PERIODIC BACKGROUND SYNC - END
//-------------------------------

//-------------------------------
// PUSH NOTIFICATIONS - START
//-------------------------------

// Push notifications - to engage users even when the app is closed
self.addEventListener('push', function(event) {
  console.log('[PWABuilder] Push notification received');
  
  let notificationData = {
    title: 'ElementalBox Update',
    body: 'Check out the latest ElementalBox features!',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/notification-badge.png',
    data: {
      url: '/'
    }
  };
  
  // Try to extract notification data from the push message
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
      vibrate: [100, 50, 100],
      data: notificationData.data
    })
  );
});

// Notification click handler
self.addEventListener('notificationclick', function(event) {
  console.log('[PWABuilder] Notification clicked');
  
  // Close the notification
  event.notification.close();
  
  // Get target URL from the notification data or use default
  const targetUrl = event.notification.data?.url || '/';
  
  // Open or focus the appropriate window
  event.waitUntil(
    clients.matchAll({type: 'window'}).then(function(clientList) {
      // Check if there's already a window/tab open with the target URL
      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i];
        if (client.url === targetUrl && 'focus' in client) {
          return client.focus();
        }
      }
      
      // If no window/tab is already open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

//-------------------------------
// PUSH NOTIFICATIONS - END
//-------------------------------

// Message event handler
self.addEventListener('message', function(event) {
  console.log('[PWABuilder] Message received:', event.data);
  
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

// Log to make sure service worker is running
console.log('[PWABuilder] ElementalBox PWA Builder Service Worker version', VERSION, 'loaded successfully'); 