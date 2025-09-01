import { useState, useEffect, useCallback } from 'react';

export const useServiceWorker = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      setIsSupported(true);
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then((registration) => {
              console.log('Service Worker registered with scope:', registration.scope);
              setIsRegistered(true);
            })
            .catch(error => console.error('Service Worker registration failed:', error));
      });
    }
  }, []);

  const syncInBackground = useCallback(() => {
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      navigator.serviceWorker.ready.then((registration) => {
        // The 'sync' property is on the registration object.
        // Fix: Cast registration to any to bypass TypeScript error for experimental API.
        if ((registration as any).sync) {
            // Fix: Cast registration to any to bypass TypeScript error for experimental API.
            return (registration as any).sync.register('background-sync');
        }
      }).catch(err => console.error("Background sync registration failed:", err));
    } else {
        console.warn("Background Sync is not supported by this browser.");
    }
  }, []);

  return { isSupported, isRegistered, syncInBackground };
};