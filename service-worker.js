/* Monee service worker：快取資產 logo，外連 CDN 失敗時改用舊圖 */
const MONEE_LOGO_CACHE = 'monee-logos-v1';

function isAssetLogoRequest(url) {
    try {
        const u = new URL(url);
        const host = u.hostname;
        const path = u.pathname || '';
        if (host.includes('static2.finnhub.io')) return true;
        if (host.includes('finnhub.io') && (path.includes('logo') || path.includes('stock_logo'))) return true;
        if (host.includes('coincap.io') && path.includes('/assets/icons/')) return true;
        if (host.includes('financialmodelingprep.com') && path.includes('/image-stock/')) return true;
        return false;
    } catch (e) {
        return false;
    }
}

self.addEventListener('install', () => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil((async () => {
        const keys = await caches.keys();
        await Promise.all(
            keys
                .filter((k) => k.startsWith('monee-logos-') && k !== MONEE_LOGO_CACHE)
                .map((k) => caches.delete(k))
        );
        await self.clients.claim();
    })());
});

self.addEventListener('fetch', (event) => {
    const req = event.request;
    if (req.method !== 'GET') return;
    if (!isAssetLogoRequest(req.url)) return;

    event.respondWith((async () => {
        const cache = await caches.open(MONEE_LOGO_CACHE);
        try {
            const fresh = await fetch(req);
            if (fresh && fresh.ok) {
                cache.put(req, fresh.clone()).catch(() => {});
                return fresh;
            }
            const cached = await cache.match(req);
            if (cached) return cached;
            return fresh;
        } catch (e) {
            const cached = await cache.match(req);
            if (cached) return cached;
            throw e;
        }
    })());
});
