// サービスワーカー(オフライン対応)。
// このファイルを直す。sw.js は build.py が作るので直接編集しない。
// 版番号は中身のハッシュ。データや画面が変わると sw.js も変わり、ブラウザが更新を検知する。
// 新しい版は裏で保存され、次に開いたときに表示される。
var VERSION = '5a4efb08969f';
var PREFIX = 'string-counselor-';
var CACHE = PREFIX + VERSION;
var FONT_CACHE = PREFIX + 'fonts-v1'; // フォントは版をまたいで使い回す
var ASSETS = ["./", "manifest.webmanifest", "logo/icon-192.png", "logo/icon-512.png", "logo/apple-touch-icon-180.png"];
var FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', function (event) {
  event.waitUntil(caches.open(CACHE).then(function (cache) {
    // ブラウザのHTTPキャッシュから古いファイルを拾わないように reload で取る
    return cache.addAll(ASSETS.map(function (a) { return new Request(a, { cache: 'reload' }); }));
  }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (event) {
  event.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) {
      return k.indexOf(PREFIX) === 0 && k !== CACHE && k !== FONT_CACHE;
    }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

function fromCache(cacheName, key, request, saveResponse) {
  return caches.open(cacheName).then(function (cache) {
    return cache.match(key).then(function (hit) {
      if (hit) return hit;
      return fetch(request).then(function (res) {
        if (saveResponse && res.ok) cache.put(request, res.clone());
        return res;
      });
    });
  });
}

self.addEventListener('fetch', function (event) {
  var request = event.request;
  if (request.method !== 'GET') return;
  var url = new URL(request.url);
  if (FONT_HOSTS.indexOf(url.hostname) !== -1) {
    event.respondWith(fromCache(FONT_CACHE, request, request, true));
  } else if (url.origin === self.location.origin) {
    event.respondWith(fromCache(CACHE, request.mode === 'navigate' ? './' : request, request, false));
  }
});
