// 홈 화면 앱용 서비스 워커. 화면과 로그인은 늘 서버에서 받고(승인 확인), 아이콘 같은 고정 파일만 저장해 둔다.
const CACHE = 'hfa-v1';
const ASSETS = ['/manifest.webmanifest', '/icons/icon-192.png', '/icons/icon-512.png', '/icons/icon-maskable-512.png', '/icons/apple-touch-icon.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS))); self.skipWaiting(); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin || !ASSETS.includes(url.pathname)) return;
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});
