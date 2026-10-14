const CACHE = "nimbu-v4";
const CORE = ["nimbu.html", "welcome.html", "style.css", "data.js", "tools-extra.js", "app.js", "features.js", "pro.js", "appmode.js", "manifest.json", "icon.svg" ,"kitto-widget.js","kitto-widget.css"];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(CORE.map(u => c.add(u).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const r = e.request;
  if (r.method !== "GET" || new URL(r.url).origin !== location.origin) return;
  e.respondWith(
    fetch(r, { cache: "no-cache" })
      .then(res => { if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(r, copy)); } return res; })
      .catch(() => caches.match(r, { ignoreSearch: true }))
  );
});