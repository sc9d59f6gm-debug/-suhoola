const C='suhoola-v3',A=['./','index.html','app.css','engine.js','sections.js','app.js','manifest.webmanifest','icon-192.png','icon-512.png','apple-touch-icon.png'];
self.addEventListener('install',e=>e.waitUntil(caches.open(C).then(c=>c.addAll(A)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!=C).map(x=>caches.delete(x)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
  const r=e.request;if(r.method!='GET')return;const u=new URL(r.url);
  if(u.hostname=='fonts.googleapis.com'||u.hostname=='fonts.gstatic.com'){e.respondWith(caches.open(C).then(c=>c.match(r).then(m=>{const f=fetch(r).then(res=>{if(res.ok||res.type=='opaque')c.put(r,res.clone());return res}).catch(()=>m);return m||f})));return}
  if(u.origin!=location.origin)return;
  e.respondWith(fetch(r).then(res=>{if(res.ok){const cp=res.clone();caches.open(C).then(c=>c.put(r,cp))}return res}).catch(()=>caches.match(r).then(m=>m||caches.match('index.html'))));
});
