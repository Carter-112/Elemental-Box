// Unique cache name for this version of the app
const CACHE_NAME = 'elementalbox-v1';
const APP_SHELL = 'elementalbox-shell-v1';
const DATA_CACHE = 'elementalbox-data-v1';

// List of files to cache for offline use
const CACHE_FILES = [
  '/',
  '/index.html',
  '/privacy-policy.html',
  '/contact.html',
  '/protocol-handler.html',
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

// Install event - cache initial resources
self.addEventListener('install', event => {
  console.log('Service Worker installing.');
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(APP_SHELL)
      .then(cache => {
        console.log('Caching app shell');
        return cache.addAll(CACHE_FILES);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('Service Worker activating.');
  
  // Take control immediately
  self.clients.claim();
  
  event.waitUntil(
    caches.keys().then(keyList => {
      return Promise.all(keyList.map(key => {
        if (key !== APP_SHELL && key !== DATA_CACHE) {
          console.log('Removing old cache', key);
          return caches.delete(key);
        }
      }));
    })
  );
});

// Fetch event - serve from cache or network with network-first strategy for dynamic content
self.addEventListener('fetch', event => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }
  
  // For API requests, use network-first strategy
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Make a copy of the response
          const clonedResponse = response.clone();
          
          // Open the data cache and put the response there
          caches.open(DATA_CACHE).then(cache => {
            cache.put(event.request, clonedResponse);
          });
          
          return response;
        })
        .catch(() => {
          // If network fails, try to get it from the cache
          return caches.match(event.request);
        })
    );
    return;
  }
  
  // For HTML pages, use network-first strategy
  if (event.request.headers.get('accept').includes('text/html')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Cache the latest version
          const responseToCache = response.clone();
          caches.open(APP_SHELL).then(cache => {
            cache.put(event.request, responseToCache);
          });
          return response;
        })
        .catch(() => {
          // If network fails, use cache
          return caches.match(event.request).then(response => {
            return response || caches.match('/index.html');
          });
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
            caches.open(APP_SHELL)
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
  console.log('Background Sync event received', event.tag);
  
  if (event.tag === 'sync-user-data') {
    event.waitUntil(syncUserData());
  }
});

// Function to sync user data when online
async function syncUserData() {
  try {
    // Open the IndexedDB database (example code)
    const pendingItems = await getItemsFromIndexedDB('pending-sync');
    
    if (pendingItems && pendingItems.length) {
      for (const item of pendingItems) {
        // Attempt to send data to server
        const response = await fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item)
        });
        
        if (response.ok) {
          // If successful, remove from pending queue
          await removeItemFromIndexedDB('pending-sync', item.id);
        }
      }
    }
    return true;
  } catch (error) {
    console.error('Background sync failed:', error);
    return false;
  }
}

// Periodic Background Sync API
self.addEventListener('periodicsync', event => {
  console.log('Periodic Sync event received', event.tag);
  
  if (event.tag === 'update-content') {
    event.waitUntil(updateContent());
  }
});

// Function to update content periodically
async function updateContent() {
  try {
    // Refresh app shell cache
    const cache = await caches.open(APP_SHELL);
    await cache.addAll(CACHE_FILES);
    
    // Update any dynamic content
    const dataResponse = await fetch('/api/content-updates', {
      cache: 'no-cache'
    });
    
    if (dataResponse.ok) {
      const updates = await dataResponse.json();
      const dataCache = await caches.open(DATA_CACHE);
      
      for (const update of updates) {
        const response = await fetch(update.url);
        if (response.ok) {
          await dataCache.put(update.url, response);
        }
      }
    }
    
    return true;
  } catch (error) {
    console.error('Periodic content update failed:', error);
    return false;
  }
}

// Push notification support
self.addEventListener('push', event => {
  console.log('Push notification received', event);
  
  let notificationData = {};
  
  try {
    if (event.data) {
      notificationData = event.data.json();
    }
  } catch (e) {
    notificationData = {
      title: 'ElementalBox Update',
      body: event.data ? event.data.text() : 'Something new in ElementalBox!',
      icon: '/icons/icon-192x192.png'
    };
  }
  
  event.waitUntil(
    self.registration.showNotification(notificationData.title || 'ElementalBox', {
      body: notificationData.body || 'New content available!',
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
  console.log('Notification clicked', event);
  
  event.notification.close();
  
  // Handle notification click
  let url = '/';
  if (event.notification.data && event.notification.data.url) {
    url = event.notification.data.url;
  }
  
  // Handle action buttons if present
  if (event.action) {
    switch(event.action) {
      case 'open':
        url = event.notification.data.openUrl || '/';
        break;
      case 'dismiss':
        return; // Just close the notification
      default:
        // Use URL from the action if available
        if (event.notification.data && event.notification.data[event.action]) {
          url = event.notification.data[event.action];
        }
    }
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
// These would normally be implemented with actual IndexedDB code
async function getItemsFromIndexedDB(storeName) {
  // This is a stub that would normally access IndexedDB
  // In a real implementation, this would open the IndexedDB database
  // and retrieve the pending sync items
  console.log(`Getting items from IndexedDB store: ${storeName}`);
  return [];
}

async function removeItemFromIndexedDB(storeName, id) {
  // This is a stub that would normally access IndexedDB
  // In a real implementation, this would open the IndexedDB database
  // and delete the synced item
  console.log(`Removing item ${id} from IndexedDB store: ${storeName}`);
  return true;
}

// Development helper - log to know the service worker is running
console.log('Service Worker loaded and running!'); 