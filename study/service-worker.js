/* Sky Sir Study Hub V27: small shell precache, feature bundles only after user opens */
const CACHE='sky-sir-study-hub-v27';
const SHELL=['./','./index.html','./study-dashboard-v27.css','./study-dashboard-v27.js','./exam-centric-f4.css','./competition.html','./board.html'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>Promise.allSettled(SHELL.map(u=>c.add(u)))).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(Promise.all([self.clients.claim(),caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('sky-sir-')&&k!==CACHE).map(k=>caches.delete(k))))])));
self.addEventListener('fetch',e=>{const req=e.request;if(req.method!=='GET')return;const u=new URL(req.url);if(u.origin!==self.location.origin||u.pathname.startsWith('/api/'))return;
// HTML/CSS navigation: fresh when online, cached offline. Immutable heavy JS reused from cache.
const isDoc=req.mode==='navigate'||/\.(html|css)(\?|$)/.test(u.pathname);
if(isDoc){e.respondWith(fetch(req).then(r=>{if(r.ok){const copy=r.clone();e.waitUntil(caches.open(CACHE).then(c=>c.put(req,copy)))}return r}).catch(()=>caches.match(req).then(x=>x||Response.error())));return;}
e.respondWith(caches.match(req).then(cached=>cached||fetch(req).then(r=>{if(r.ok){const copy=r.clone();e.waitUntil(caches.open(CACHE).then(c=>c.put(req,copy)))}return r})));});
