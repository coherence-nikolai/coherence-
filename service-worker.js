// Only this instrument's static resources; preserve sibling apps and private data.
const CACHE='field-v8-context';
const SHARED=['/assets/tool-context.css?v=20260907-r2','/assets/tool-context.js?v=20260907-r2'];
const PRECACHE=['./','./index.html','./app.js','./data.js','./manifest.webmanifest','./icon-192.png','./icon-512.png',...SHARED];
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(PRECACHE)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(
    keys.filter(key=>key.startsWith('field-')&&key!==CACHE).map(key=>caches.delete(key))
  )).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin)return;
  if(!url.pathname.startsWith('/field/')&&!SHARED.includes(url.pathname+url.search))return;
  // Fresh navigation avoids stranding the visitor on an outdated entrance.
  event.respondWith(fetch(event.request).then(response=>{
    if(response.ok){
      const copy=response.clone();
      event.waitUntil(caches.open(CACHE).then(cache=>cache.put(event.request,copy)).catch(()=>{}));
    }
    return response;
  }).catch(async()=>{
    const cache=await caches.open(CACHE);
    return await cache.match(event.request)
      || (event.request.mode==='navigate'?await cache.match('./index.html'):undefined)
      || Response.error();
  }));
});
