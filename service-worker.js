// Unique cache name for this version of the app
const CACHE_NAME = 'elementalbox-v1';

// List of files to cache for offline use
const CACHE_FILES = [
  '/',
  '/index.html',
  '/privacy-policy.html',
  '/contact.html',
  '/styles.css',
  '/main.js',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/screenshots/screen1.png',
  '/screenshots/screen2.png'
];

// Install event - cache initial resources
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Caching app shell');
        return cache.addAll(CACHE_FILES);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keyList => {
      return Promise.all(keyList.map(key => {
        if (key !== CACHE_NAME) {
          console.log('Removing old cache', key);
          return caches.delete(key);
        }
      }));
    })
  );
  return self.clients.claim();
});

// Fetch event - serve from cache or network with network-first strategy for dynamic content
self.addEventListener('fetch', event => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }
  
  // For HTML pages, use network-first strategy
  if (event.request.headers.get('accept').includes('text/html')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Cache the latest version
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
          return response;
        })
        .catch(() => {
          // If network fails, use cache
          return caches.match(event.request);
        })
    );
    return;
  }
  
  // For other assets, use cache-first strategy
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        // Clone the request
        const fetchRequest = event.request.clone();

        // Make network request and cache the response
        return fetch(fetchRequest).then(
          response => {
            // Check if valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response
            const responseToCache = response.clone();

            // Add to cache
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        ).catch(() => {
          // If both cache and network fail, return a custom offline page
          if (event.request.headers.get('accept').includes('text/html')) {
            return caches.match('/index.html');
          }
        });
      })
  );
});

// Background Sync API support
self.addEventListener('sync', event => {
  if (event.tag === 'sync-user-data') {
    event.waitUntil(syncUserData());
  }
});

// Function to sync user data when online
async function syncUserData() {
  // Get pending data from IndexedDB
  const pendingData = await getPendingData();
  
  if (pendingData.length === 0) {
    return;
  }
  
  // Send data to server
  try {
    for (const data of pendingData) {
      await fetch('/api/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      // Remove synced data from pending queue
      await removeFromPendingData(data.id);
    }
  } catch (error) {
    console.error('Background sync failed:', error);
    // Will retry automatically by the browser
  }
}

// Periodic Background Sync API
// This requires the 'periodic-background-sync' permission
self.addEventListener('periodicsync', event => {
  if (event.tag === 'update-content') {
    event.waitUntil(updateContent());
  }
});

// Function to update content periodically
async function updateContent() {
  try {
    // Check for updates to game content
    const response = await fetch('/api/content-updates', {
      cache: 'no-cache'
    });
    
    if (response.ok) {
      const updates = await response.json();
      // Process updates and update caches
      const cache = await caches.open(CACHE_NAME);
      
      for (const update of updates) {
        const response = await fetch(update.url);
        if (response.ok) {
          await cache.put(update.url, response);
        }
      }
    }
  } catch (error) {
    console.error('Periodic content update failed:', error);
  }
}

// Push notification support
self.addEventListener('push', event => {
  let notificationData = {};
  
  try {
    notificationData = event.data.json();
  } catch (e) {
    notificationData = {
      title: 'ElementalBox Update',
      body: event.data ? event.data.text() : 'Something new in ElementalBox!',
      icon: '/icons/icon-192x192.png'
    };
  }
  
  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon || '/icons/icon-192x192.png',
      badge: '/icons/notification-badge.png',
      data: notificationData.data || {},
      actions: notificationData.actions || [],
      vibrate: [100, 50, 100]
    })
  );
});

// Notification click handler
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  // Handle notification click - open appropriate page
  let url = '/';
  if (event.notification.data && event.notification.data.url) {
    url = event.notification.data.url;
  }
  
  event.waitUntil(
    clients.matchAll({type: 'window'})
      .then(clientList => {
        // If a window client already exists, focus it
        for (const client of clientList) {
          if (client.url === url && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Otherwise open a new window
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});

// Helper functions for IndexedDB operations
// These would be implemented to store pending operations when offline
async function getPendingData() {
  // In a real implementation, this would access IndexedDB
  // This is a stub implementation
  return [];
}

async function removeFromPendingData(id) {
  // In a real implementation, this would access IndexedDB
  // This is a stub implementation
  return true;
} 