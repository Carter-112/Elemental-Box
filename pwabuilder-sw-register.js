// PWA Builder Service Worker Registration Script
// This script explicitly registers and sets up all PWA features

// Register the service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('/pwabuilder-sw.js', {scope: '/'})
      .then(function(registration) {
        console.log('PWA Builder: Service Worker registered with scope:', registration.scope);
        
        // After successful registration, initialize PWA features
        initializePwaFeatures(registration);
      })
      .catch(function(error) {
        console.error('PWA Builder: Service Worker registration failed:', error);
      });
  });
} else {
  console.warn('PWA Builder: Service Workers are not supported by this browser');
}

// Initialize all PWA features
function initializePwaFeatures(registration) {
  // Initialize all features in sequence
  setupBackgroundSync()
    .then(() => setupPeriodicSync(registration))
    .then(() => setupPushNotifications(registration))
    .then(() => console.log('PWA Builder: All features initialized successfully'))
    .catch(error => console.error('PWA Builder: Feature initialization error:', error));
}

// Setup Background Sync
function setupBackgroundSync() {
  return new Promise((resolve, reject) => {
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      console.log('PWA Builder: Background Sync is supported');
      
      // Set up event listener for user data changes
      document.addEventListener('userDataChanged', function() {
        navigator.serviceWorker.ready.then(function(registration) {
          registration.sync.register('sync-user-data')
            .then(() => console.log('PWA Builder: Background sync registered'))
            .catch(error => console.error('PWA Builder: Background sync registration error:', error));
        });
      });
      
      resolve();
    } else {
      console.warn('PWA Builder: Background Sync is not supported by this browser');
      resolve(); // Resolve anyway to continue with other features
    }
  });
}

// Setup Periodic Background Sync
function setupPeriodicSync(registration) {
  return new Promise((resolve, reject) => {
    if ('periodicSync' in registration) {
      console.log('PWA Builder: Periodic Background Sync is supported');
      
      // Request permission for periodic sync
      navigator.permissions.query({name: 'periodic-background-sync'})
        .then(status => {
          if (status.state === 'granted') {
            // Register for periodic sync
            registration.periodicSync.register('update-content', {
              minInterval: 24 * 60 * 60 * 1000 // 24 hours
            })
            .then(() => {
              console.log('PWA Builder: Periodic sync registered successfully');
              resolve();
            })
            .catch(error => {
              console.error('PWA Builder: Periodic sync registration error:', error);
              resolve(); // Resolve anyway to continue with other features
            });
          } else {
            console.warn('PWA Builder: Periodic sync permission not granted:', status.state);
            resolve(); // Resolve anyway to continue with other features
          }
        })
        .catch(error => {
          console.error('PWA Builder: Periodic sync permission error:', error);
          resolve(); // Resolve anyway to continue with other features
        });
    } else {
      console.warn('PWA Builder: Periodic Background Sync is not supported by this browser');
      resolve(); // Resolve anyway to continue with other features
    }
  });
}

// Setup Push Notifications
function setupPushNotifications(registration) {
  return new Promise((resolve, reject) => {
    if ('Notification' in window && 'PushManager' in window) {
      console.log('PWA Builder: Push Notifications are supported');
      
      // Request permission for notifications
      Notification.requestPermission()
        .then(permission => {
          if (permission === 'granted') {
            console.log('PWA Builder: Notification permission granted');
            
            // Convert base64 string to Uint8Array for the application server key
            const applicationServerKey = urlBase64ToUint8Array(
              'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U'
            );
            
            // Subscribe to push notifications
            registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: applicationServerKey
            })
            .then(subscription => {
              console.log('PWA Builder: User is subscribed to push notifications');
              // Here you would typically send the subscription to your server
              resolve();
            })
            .catch(error => {
              console.error('PWA Builder: Push subscription error:', error);
              resolve(); // Resolve anyway to continue
            });
          } else {
            console.warn('PWA Builder: Notification permission denied');
            resolve(); // Resolve anyway to continue
          }
        })
        .catch(error => {
          console.error('PWA Builder: Notification permission error:', error);
          resolve(); // Resolve anyway to continue
        });
    } else {
      console.warn('PWA Builder: Push Notifications are not supported by this browser');
      resolve(); // Resolve anyway to continue
    }
  });
}

// Helper function to convert base64 string to Uint8Array
// (required for the applicationServerKey)
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');
  
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
} 