// Keeps the app on the phone so it opens and works even without internet.
const CACHE = 'cmc-phone-v2';
const FILES = ['./', './index.html', './manifest.webmanifest', './icon-180.png', './icon-512.png',
  './vendor/ffmpeg/index.js', './vendor/ffmpeg/classes.js', './vendor/ffmpeg/const.js', './vendor/ffmpeg/errors.js',
  './vendor/ffmpeg/types.js', './vendor/ffmpeg/utils.js', './vendor/ffmpeg/worker.js',
  './vendor/core/ffmpeg-core.js', './vendor/core/ffmpeg-core.wasm'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === location.origin) {
    // The page itself: try for the newest copy first, fall back to the saved one.
    if (req.mode === 'navigate') {
      e.respondWith(fetch(req).then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put('./index.html', copy)); return r; })
        .catch(() => caches.match('./index.html')));
      return;
    }
    e.respondWith(caches.match(req).then(hit => hit || fetch(req)));
  } else if (url.hostname.endsWith('fonts.googleapis.com') || url.hostname.endsWith('fonts.gstatic.com')) {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put(req, copy)); return r; })));
  }
});
