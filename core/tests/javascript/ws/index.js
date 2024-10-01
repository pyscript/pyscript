import { serve, file } from 'bun';

import path, { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const dir = dirname(fileURLToPath(import.meta.url));

console.log('http://localhost:5037/');

serve({
  port: 5037,
  fetch(req, server) {
    if (server.upgrade(req)) return;
    const url = new URL(req.url);
    let { pathname } = url;
    if (pathname === '/') pathname = '/index.html';
    else if (/^\/dist\//.test(pathname)) pathname = `/../../..${pathname}`;
    else if (pathname === '/favicon.ico')
      return new Response('Not Found', { status: 404 });
    const response = new Response(file(`${dir}${pathname}`));
    const { headers } = response;
    headers.set('Cross-Origin-Opener-Policy', 'same-origin');
    headers.set('Cross-Origin-Embedder-Policy', 'require-corp');
    headers.set('Cross-Origin-Resource-Policy', 'cross-origin');
    return response;
  },
  websocket: {
    message(ws, message) {
      ws.send(message);
    },
    close() {
      process.exit(0);
    }
  },
});
