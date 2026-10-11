(async function () {
  if (!('serviceWorker' in navigator)) return;
  const registrations = await navigator.serviceWorker.getRegistrations();
  for (const registration of registrations) {
    if (new URL(registration.scope).pathname.startsWith('/app/')) await registration.unregister();
  }
  if ('caches' in window) {
    for (const key of await caches.keys()) {
      if (/workbox|precache|runtime/i.test(key)) await caches.delete(key);
    }
  }
})().catch(function () {});
