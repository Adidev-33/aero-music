/**
 * Service Worker Registration for Aero Music PWA
 * Registers the SW in production and handles update notifications.
 */

export function registerSW() {
  if (!('serviceWorker' in navigator)) {
    console.log('[SW] Service workers not supported');
    return;
  }

  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      console.log('[SW] Registered with scope:', registration.scope);

      // Check for updates periodically (every 60 minutes)
      setInterval(() => {
        registration.update();
      }, 60 * 60 * 1000);

      // Listen for new service worker waiting to activate
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New version available — dispatch a custom event so the UI can show a toast
            window.dispatchEvent(
              new CustomEvent('sw-update-available', {
                detail: { registration },
              })
            );
          }
        });
      });
    } catch (error) {
      console.error('[SW] Registration failed:', error);
    }
  });
}
