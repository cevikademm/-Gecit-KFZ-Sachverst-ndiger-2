// GECIT-KFZ Service Worker — PWA + Push Notifications
const CACHE_NAME = 'gecit-kfz-cache-v1';
const OFFLINE_URL = './index.html';

// Install: cache the app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        OFFLINE_URL,
        'https://cdn.tailwindcss.com',
        'https://unpkg.com/react@18.3.1/umd/react.production.min.js',
        'https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js',
        'https://unpkg.com/framer-motion@11.11.17/dist/framer-motion.js',
        'https://unpkg.com/@babel/standalone@7.25.9/babel.min.js',
      ]);
    })
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: network-first, fallback to cache
self.addEventListener('fetch', (event) => {
  // Skip non-GET
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone and cache successful responses
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, clone);
        });
        return response;
      })
      .catch(() => {
        // Offline fallback
        return caches.match(event.request).then((cached) => {
          return cached || caches.match(OFFLINE_URL);
        });
      })
  );
});

// Push notification received from server (for future FCM integration)
self.addEventListener('push', (event) => {
  let data = { title: 'GECIT-KFZ Bildirim', body: 'Yeni bir güncelleme var.', tag: 'gecit-kfz-push' };

  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body || data.message || '',
    icon: data.icon || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Ctext y=".9em" font-size="80"%3E🚗%3C/text%3E%3C/svg%3E',
    badge: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"%3E%3Crect width="96" height="96" rx="20" fill="%237C3AED"/%3E%3Ctext x="48" y="58" text-anchor="middle" font-size="50" font-weight="bold" fill="white" font-family="system-ui"%3EOX%3C/text%3E%3C/svg%3E',
    tag: data.tag || 'gecit-kfz-push-' + Date.now(),
    requireInteraction: true,
    renotify: true,
    vibrate: [200, 100, 200, 100, 200],
    data: {
      url: data.url || './',
      reminder_id: data.reminder_id || null,
    },
    actions: [
      { action: 'open', title: 'Aç' },
      { action: 'dismiss', title: 'Kapat' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click: open the app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const urlToOpen = event.notification.data?.url || './';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focus existing window if available
      for (const client of clientList) {
        if (client.url.includes('index.html') && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open new window
      return self.clients.openWindow(urlToOpen);
    })
  );
});

// Periodic background sync (for future use with Supabase)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'gecit-kfz-check-reminders') {
    event.waitUntil(checkReminders());
  }
});

async function checkReminders() {
  // Future: fetch from Supabase and show notifications
  // For now, the main thread handles reminder checks
}

// Show notification from main thread via postMessage
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, options } = event.data;
    self.registration.showNotification(title, {
      ...options,
      requireInteraction: true,
      renotify: true,
      vibrate: [200, 100, 200, 100, 200],
      actions: [
        { action: 'open', title: 'Aç' },
        { action: 'dismiss', title: 'Kapat' },
      ],
    });
  }
});
