/*! coi-serviceworker v0.1.7 - Guido Zuidhof and contributors, licensed under MIT */
/*! mini-coi - Andrea Giammarchi and contributors, licensed under MIT */
(({ document: d, navigator: { serviceWorker: s } }) => {
    if (d) {
      const { currentScript: c } = d;
      s.register(c.src, { scope: c.getAttribute('scope') || '.' }).then(r => {
        r.addEventListener('updatefound', () => location.reload());
        if (r.active && !s.controller) location.reload();
      });
    }
    else {
      addEventListener('install', () => skipWaiting());
      addEventListener('activate', e => e.waitUntil(clients.claim()));
      addEventListener('fetch', e => {
        const { request: r } = e;
        if (r.cache === 'only-if-cached' && r.mode !== 'same-origin') return;
        e.respondWith(fetch(r).then(r => {
          const { body, status, statusText } = r;
          if (!status || status > 399) return r;
          const h = new Headers(r.headers);
          h.set('Cross-Origin-Opener-Policy', 'same-origin');
          h.set('Cross-Origin-Embedder-Policy', 'require-corp');
          h.set('Cross-Origin-Resource-Policy', 'cross-origin');
          return new Response(body, { status, statusText, headers: h });
        }));
      });
    }
  })(self);
