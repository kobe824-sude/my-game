// 妙脆角猫与刀盾狗的奇妙探险 - Service Worker
// 网络优先：永远优先拿最新版，离线时用缓存兜底（版本号更新后自动清理旧缓存）
const CACHE = 'milkfrog-v1.0';
const CORE = ['./', './index.html', './manifest.webmanifest',
  './css/style.css',
  './js/config.js','./js/enemy.js','./js/battle.js','./js/frogAI.js','./js/ui_v13.js','./js/R_RocketRain.js','./js/main.js','./js/mobile.js','./js/player/DaodungouDog.js',
  './assets/ui/bg_scene.png','./assets/ui/bg_boss1.png',
  './assets/players/miaocuijiao_cat/sprites/miaocat_idle.png',
  './assets/players/daodungou/sprites/daodungou_idle.png',
  './assets/audio/bgm/bgm.wav',
  './assets/ui/icon-192.png','./assets/ui/icon-512.png'
];
self.addEventListener('install', (e)=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate', (e)=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch', (e)=>{
  if(e.request.method!=='GET' || !e.request.url.startsWith(self.location.origin)) return;
  e.respondWith(
    fetch(e.request).then(res=>{
      const cl = res.clone();
      caches.open(CACHE).then(c=>c.put(e.request, cl)).catch(()=>{});
      return res;
    }).catch(()=>caches.match(e.request).then(m=>m || caches.match('./index.html')))
  );
});
