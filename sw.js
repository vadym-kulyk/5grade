// Офлайн-режим: сайт відкривається без інтернету, а результати Firebase надішле, щойно з'явиться зв'язок.
const CACHE = "ukr5-v2";
self.addEventListener("install", (e) => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => clients.claim())));
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET") return;
  // Дані Firebase не кешуємо
  if (url.hostname.includes("firebase") || url.hostname.includes("googleapis.com") && !url.hostname.startsWith("fonts")) return;
  // Мережа спершу, кеш — запасний варіант. Власні файли завжди перевіряємо на сервері (no-cache),
  // інакше браузер 10 хв віддає старі версії з HTTP-кешу GitHub Pages.
  const own = url.origin === location.origin;
  e.respondWith((own ? fetch(e.request.url, { cache: "no-cache", credentials: "same-origin" }) : fetch(e.request)).then((res) => {
    if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); }
    return res;
  }).catch(() => caches.match(e.request)));
});
