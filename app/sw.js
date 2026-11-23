/* Работа без интернета: сама программа и уже просмотренные фото берутся из памяти телефона. */
var SHELL = 'ix-shell-v2', IMG = 'ix-img-v1';
var SCOPE = new URL(self.registration.scope);

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(SHELL).then(function (c) {
    return c.addAll(['./', 'manifest.json', 'icon-180.png', 'icon-192.png', 'Inter-Quote.ttf']);
  }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.map(function (k) { return k.indexOf('ix-shell-') === 0 && k !== SHELL ? caches.delete(k) : null; }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== SCOPE.origin) return;

  /* Фото каталога: сначала из памяти, иначе с сайта — и запомнить. */
  if (url.pathname.indexOf('/media/') >= 0) {
    e.respondWith(caches.open(IMG).then(function (c) {
      return c.match(req.url).then(function (hit) {
        return hit || fetch(req).then(function (r) {
          if (r.ok) c.put(req.url, r.clone());
          return r;
        });
      });
    }));
    return;
  }

  /* Сама программа: сначала свежая версия с сайта, без связи — сохранённая. */
  if (url.pathname.indexOf(SCOPE.pathname) === 0) {
    e.respondWith(fetch(req).then(function (r) {
      if (r.ok) { var copy = r.clone(); caches.open(SHELL).then(function (c) { c.put(req.url.split('?')[0], copy); }); }
      return r;
    }).catch(function () {
      return caches.open(SHELL).then(function (c) {
        return c.match(req.url.split('?')[0]).then(function (hit) { return hit || c.match(SCOPE.href); });
      });
    }));
  }
  /* Каталог (data/catalog.json) страница сохраняет сама. */
});
