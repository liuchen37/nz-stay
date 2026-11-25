"use strict";

const CACHE_NAME = "nz-stay-shell-v2-prv";
const BASE = new URL("./", self.location.href);

const APP_FILES = [
  "index.html",
  "manifest.webmanifest",
  "icon.svg"
].map(path => new URL(path, BASE).href);

const HOME_URL = APP_FILES[0];

// 首次安装时缓存应用文件。
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_FILES))
      .then(() => self.skipWaiting())
  );
});

// 清理本应用的旧版本缓存。
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key =>
            key.startsWith("nz-stay-shell-") &&
            key !== CACHE_NAME
          )
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

// 已缓存的应用文件可在离线时使用。
self.addEventListener("fetch", event => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== "GET") return;
  if (url.origin !== BASE.origin) return;

  const isHomePage =
    request.mode === "navigate" &&
    (url.pathname === BASE.pathname ||
     url.pathname === new URL(HOME_URL).pathname);

  const cacheKey = isHomePage ? HOME_URL : url.href;

  if (!APP_FILES.includes(cacheKey)) return;

  event.respondWith(
    caches.open(CACHE_NAME).then(async cache => {
      const cached = await cache.match(cacheKey);
      return cached || fetch(request);
    })
  );
});
