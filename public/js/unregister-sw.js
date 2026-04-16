// Unregister all service workers
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(function(registrations) {
    for (let registration of registrations) {
      console.log('Unregistering service worker:', registration.scope);
      registration.unregister();
    }
    
    // Clear all caches
    if ('caches' in window) {
      caches.keys().then(function(cacheNames) {
        cacheNames.forEach(function(cacheName) {
          console.log('Deleting cache:', cacheName);
          caches.delete(cacheName);
        });
      });
    }
    
    // Force reload the page to apply changes
    setTimeout(function() {
      window.location.reload(true);
    }, 1000);
  });
}
