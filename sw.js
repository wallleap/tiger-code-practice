const FONT_CACHE = 'tiger-fonts-v1';
const DATA_CACHE = 'tiger-data-v1';
const APP_CACHE = 'tiger-app-v1';
const ACTIVE_CACHES = [FONT_CACHE, DATA_CACHE, APP_CACHE];

const PRECACHE_FONTS = [
  'fonts/TumanPUA.ttf',
  'fonts/PingFang-Mod.otf',
  'fonts/WubiPUA.ttf',
  'fonts/TH-Times.ttc',
  'fonts/TH-Tshyn-P0.ttf',
  'fonts/TH-Tshyn-P1.ttf',
  'fonts/TH-Tshyn-P2.ttf',
  'fonts/TH-Tshyn-P16.ttf',
];

const PRECACHE_DATA = [
  'data/虎码字根.txt.gz',
  'data/单字编码.txt.gz',
  'data/zhmnwhei.txt.gz',
  'data/hu_cf.txt.gz',
  'data/zi_py.txt.gz',
  'data/86_ws.txt.gz',
  'data/98_ws.txt.gz',
  'data/06_ws.txt.gz',
];

self.addEventListener('install', (e) => {
  e.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => !ACTIVE_CACHES.includes(k))
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim())
      .then(() => {
        setTimeout(() => {
          precacheAll((progress) => {
            self.clients.matchAll({type: 'window'}).then((list) => {
              list.forEach((client) => client.postMessage({type: 'PRECACHE_PROGRESS', ...progress}));
            });
          });
        }, 5000);
      }),
  );
});

self.addEventListener('message', (e) => {
  if (e.data && e.data.type === 'PRECACHE') {
    const notify = (progress) => {
      self.clients.matchAll({type: 'window'}).then((list) => {
        list.forEach((client) => client.postMessage({type: 'PRECACHE_PROGRESS', ...progress}));
      });
    };
    e.waitUntil(precacheAll(notify));
  }
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  if (req.headers.get('range')) return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  const path = url.pathname;

  if (path.includes('/fonts/') || /\.(ttf|otf|woff2?)$/.test(path)) {
    e.respondWith(cacheFirst(req, FONT_CACHE));
  } else if (path.includes('/data/') || /\.txt$/.test(path)) {
    e.respondWith(networkFirst(req, DATA_CACHE));
  } else {
    e.respondWith(networkFirst(req, APP_CACHE));
  }
});

const inflight = new Map();

async function fetchAndCache(url, cacheName, {networkFirst = false} = {}) {
  const key = cacheName + '|' + url.href + '|' + (networkFirst ? 'n' : 'c');
  if (inflight.has(key)) return inflight.get(key);
  const p = (async () => {
    const cache = await caches.open(cacheName);
    if (!networkFirst) {
      const cached = await cache.match(url);
      if (cached) return cached;
    }
    try {
      const response = await fetch(url);
      if (response && response.ok) cache.put(url, response.clone());
      return response;
    } catch (err) {
      const cached = await cache.match(url);
      if (cached) return cached;
      throw err;
    }
  })();
  inflight.set(key, p);
  try {
    return await p;
  } finally {
    inflight.delete(key);
  }
}

function precacheAll(onProgress) {
  const paths = [
    ...PRECACHE_FONTS.map((rel) => [rel, FONT_CACHE]),
    ...PRECACHE_DATA.map((rel) => [rel, DATA_CACHE]),
  ];
  return (async () => {
    // 先筛出缺失项：已缓存的直接跳过，不计数也不上报，避免切换页面时重复闪现进度条
    const missing = [];
    for (const [rel, cacheName] of paths) {
      const cache = await caches.open(cacheName);
      const url = new URL(rel, self.registration.scope);
      if (!(await cache.match(url))) missing.push([rel, cacheName]);
    }
    if (!missing.length) return;
    let i = 0;
    let done = 0;
    let failed = 0;
    const total = missing.length;
    const worker = async () => {
      while (i < missing.length) {
        const [rel, cacheName] = missing[i++];
        try {
          const url = new URL(rel, self.registration.scope);
          await fetchAndCache(url, cacheName);
        } catch (err) {
          failed++;
        }
        done++;
        if (onProgress) onProgress({done, total, failed});
        await new Promise((r) => setTimeout(r, 50));
      }
    };
    const CONCURRENCY = 3;
    return Promise.all(Array.from({length: CONCURRENCY}, () => worker()));
  })();
}

async function cacheFirst(request, cacheName) {
  const url = new URL(request.url);
  const cached = await fetchAndCache(url, cacheName);
  return cached;
}

async function networkFirst(request, cacheName) {
  const url = new URL(request.url);
  return fetchAndCache(url, cacheName, {networkFirst: true});
}
