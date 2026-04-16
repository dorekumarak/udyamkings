// Unregister all service workers
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    for (let registration of registrations) {
      registration.unregister();
      console.log('Unregistered service worker');
    }
    // Clear all caches
    if ('caches' in window) {
      caches.keys().then(cacheNames => {
        cacheNames.forEach(cacheName => {
          caches.delete(cacheName);
          console.log('Deleted cache:', cacheName);
        });
        // Force reload after cleanup
        setTimeout(() => {
          window.location.reload(true);
        }, 1000);
      });
    }
  });
}
