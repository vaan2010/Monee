// Service Worker for Monee PWA
const CACHE_NAME = 'monee-v1';
const urlsToCache = [
  './',
  './index.html',
  './favico.png'
];

// 安裝 Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: 快取已開啟');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.log('Service Worker: 快取失敗', error);
      })
  );
  self.skipWaiting();
});

// 啟用 Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: 刪除舊快取', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// 攔截網路請求
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // 如果有快取，返回快取版本
        if (response) {
          return response;
        }
        // 否則從網路獲取
        return fetch(event.request).then((response) => {
          // 檢查是否為有效回應
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          // 複製回應並加入快取
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });
          return response;
        });
      })
      .catch(() => {
        // 如果網路和快取都失敗，可以返回離線頁面
        return caches.match('./index.html');
      })
  );
});

// 處理背景同步
self.addEventListener('sync', (event) => {
  if (event.tag === 'cloud-backup') {
    event.waitUntil(
      // 通知主線程執行備份
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: 'BACKGROUND_BACKUP'
          });
        });
      })
    );
  }
});

// 處理推送通知（如果需要）
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : '您有新的通知',
    icon: './favico.png',
    badge: './favico.png',
    vibrate: [200, 100, 200],
    tag: 'monee-notification'
  };
  
  event.waitUntil(
    self.registration.showNotification('Monee', options)
  );
});

// 處理通知點擊
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('./')
  );
});

