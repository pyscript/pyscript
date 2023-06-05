addEventListener("fetch", (event) => {
    event.respondWith(
        (async () => {
            const cache = await caches.open("python-script");
            const cachedResponse = await cache.match(event.request);
            if (cachedResponse) return cachedResponse;
            const networkResponse = await fetch(event.request);
            event.waitUntil(cache.put(event.request, networkResponse.clone()));
            return networkResponse;
        })(),
    );
});
