import React, { useState, useEffect } from 'react';

/**
 * InstallPrompt – Cross-platform PWA install banner.
 *
 * - Chrome/Edge/Android: Captures `beforeinstallprompt` and shows a native install button.
 * - iOS Safari: Detects non-standalone mode and shows manual "Add to Home Screen" instructions.
 * - Dismissal is remembered in localStorage for 14 days.
 */
export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  // Check if already installed (standalone mode)
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true;

  // Check if dismissed recently
  useEffect(() => {
    const dismissedAt = localStorage.getItem('pwa-install-dismissed');
    if (dismissedAt) {
      const daysSince = (Date.now() - parseInt(dismissedAt, 10)) / (1000 * 60 * 60 * 24);
      if (daysSince < 14) {
        setDismissed(true);
      } else {
        localStorage.removeItem('pwa-install-dismissed');
      }
    }
  }, []);

  // Capture the beforeinstallprompt event (Chrome/Edge/Android)
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Detect iOS Safari (not standalone)
  useEffect(() => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isSafari = /Safari/.test(navigator.userAgent) && !/CriOS|FxiOS|Chrome/.test(navigator.userAgent);
    if (isIOS && isSafari && !isStandalone) {
      setShowIOSGuide(true);
    }
  }, [isStandalone]);

  // Listen for SW update events
  useEffect(() => {
    const handler = () => setUpdateAvailable(true);
    window.addEventListener('sw-update-available', handler);
    return () => window.removeEventListener('sw-update-available', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const result = await deferredPrompt.userChoice;
    if (result.outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  const handleUpdate = () => {
    window.location.reload();
  };

  // Don't show anything if already installed or dismissed
  if (isStandalone && !updateAvailable) return null;
  if (dismissed && !updateAvailable) return null;

  // Update available toast
  if (updateAvailable) {
    return (
      <div className="fixed top-4 left-4 right-4 mx-auto max-w-max z-[100] animate-slide-down">
        <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-surface-container/95 backdrop-blur-2xl border border-white/10 shadow-2xl">
          <span className="material-symbols-outlined text-emerald-400 text-xl">system_update</span>
          <span className="text-sm text-white/90 font-medium">New version available</span>
          <button
            onClick={handleUpdate}
            className="ml-2 px-3.5 py-1.5 rounded-full bg-emerald-500/90 text-white text-xs font-semibold hover:bg-emerald-400 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>
    );
  }

  // Nothing to show
  if (!deferredPrompt && !showIOSGuide) return null;

  return (
    <div className="fixed bottom-[9.5rem] left-4 right-4 mx-auto md:left-auto md:right-8 md:mx-0 md:bottom-32 z-[100] w-[calc(100%-2rem)] max-w-md animate-slide-up">
      <div className="relative flex items-start gap-3 px-5 py-4 rounded-2xl bg-surface-container/95 backdrop-blur-2xl border border-white/10 shadow-2xl">
        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-2.5 right-2.5 text-white/40 hover:text-white/70 transition-colors"
          aria-label="Dismiss"
        >
          <span className="material-symbols-outlined text-lg">close</span>
        </button>

        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
          <span className="material-symbols-outlined text-white text-xl">install_mobile</span>
        </div>

        <div className="flex-1 min-w-0 pr-4">
          <p className="text-sm font-semibold text-white/95 leading-snug">Install Aero Music</p>

          {/* Chrome / Edge / Android — native prompt */}
          {deferredPrompt && (
            <>
              <p className="text-xs text-white/50 mt-0.5 leading-relaxed">
                Add to your home screen for a native app experience.
              </p>
              <button
                onClick={handleInstall}
                className="mt-2.5 px-4 py-1.5 rounded-full bg-white/15 text-white text-xs font-semibold hover:bg-white/25 transition-colors"
              >
                Install App
              </button>
            </>
          )}

          {/* iOS Safari — manual guide */}
          {showIOSGuide && !deferredPrompt && (
            <p className="text-xs text-white/50 mt-0.5 leading-relaxed">
              Tap{' '}
              <span className="inline-flex items-center align-middle mx-0.5 px-1.5 py-0.5 rounded bg-white/10 text-white/80 text-[11px] font-medium">
                <svg viewBox="0 0 24 24" className="w-3 h-3 mr-0.5" fill="currentColor">
                  <path d="M12 2l3 3h-2v6h-2V5H9l3-3zm-7 9v10h14V11h-2v8H7v-8H5z"/>
                </svg>
                Share
              </span>{' '}
              then <strong className="text-white/80">Add to Home Screen</strong>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
