import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Key used in sessionStorage to prevent repeated reload loops
 */
const RELOAD_GUARD_KEY = 'app_update_reload_guard';
const MAX_RELOAD_ATTEMPTS = 2;
const RELOAD_WINDOW_MS = 60 * 1000; // 1 minute window

/**
 * Checks if the user is currently typing in an input/textarea
 * or if a form submission is in progress.
 */
const isUserActivelyEditingOrSubmitting = () => {
  if (typeof document === 'undefined') return false;

  // 1. Check if user is focused on an input/textarea with content
  const activeEl = document.activeElement;
  if (activeEl) {
    const tagName = activeEl.tagName?.toLowerCase();
    if (tagName === 'textarea' && activeEl.value?.trim().length > 0) {
      return true;
    }
    if (tagName === 'input') {
      const type = (activeEl.type || 'text').toLowerCase();
      const textTypes = ['text', 'email', 'password', 'search', 'tel', 'url', 'number'];
      if (textTypes.includes(type) && activeEl.value?.trim().length > 0) {
        return true;
      }
    }
  }

  // 2. Check for active form submissions (e.g., disabled submit buttons, aria-busy elements)
  const isSubmitting = document.querySelector(
    'form [aria-busy="true"], form button[type="submit"]:disabled, [data-submitting="true"]'
  );
  if (isSubmitting) {
    return true;
  }

  return false;
};

/**
 * Guard to prevent infinite reload loops
 */
const canReloadForVersion = (targetVersion) => {
  try {
    const stored = sessionStorage.getItem(RELOAD_GUARD_KEY);
    if (!stored) return true;

    const data = JSON.parse(stored);
    if (data.version === targetVersion) {
      const isWithinWindow = Date.now() - data.timestamp < RELOAD_WINDOW_MS;
      if (isWithinWindow && data.count >= MAX_RELOAD_ATTEMPTS) {
        console.warn(
          `[useAppUpdate] Reload loop prevented: already reloaded ${data.count} times for version ${targetVersion}`
        );
        return false;
      }
    }
    return true;
  } catch {
    return true;
  }
};

/**
 * Records a reload event in sessionStorage
 */
const recordReload = (targetVersion) => {
  try {
    const stored = sessionStorage.getItem(RELOAD_GUARD_KEY);
    let count = 1;
    if (stored) {
      const data = JSON.parse(stored);
      if (data.version === targetVersion && Date.now() - data.timestamp < RELOAD_WINDOW_MS) {
        count = (data.count || 1) + 1;
      }
    }
    sessionStorage.setItem(
      RELOAD_GUARD_KEY,
      JSON.stringify({ version: targetVersion, timestamp: Date.now(), count })
    );
  } catch {}
};

/**
 * Clears the reload guard once currentVersion matches the target
 */
const clearReloadGuardIfCurrent = (currentVersion) => {
  try {
    const stored = sessionStorage.getItem(RELOAD_GUARD_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      if (data.version === currentVersion) {
        sessionStorage.removeItem(RELOAD_GUARD_KEY);
      }
    }
  } catch {}
};

/**
 * Hook to automatically detect frontend version updates and reload the UI.
 *
 * @param {Object} options
 * @param {number} options.interval Polling interval in ms (default: 60,000ms / 60 seconds)
 * @param {boolean} options.enabled Whether automatic checking is enabled (default: true)
 */
export const useAppUpdate = ({ interval = 60000, enabled = true } = {}) => {
  const currentVersion = import.meta.env.VITE_APP_VERSION || '';
  const [latestVersion, setLatestVersion] = useState(currentVersion);
  const [hasUpdate, setHasUpdate] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  const pendingReloadRef = useRef(null);
  const isCheckingRef = useRef(false);

  // Clear guard if we already run the new version
  useEffect(() => {
    if (currentVersion) {
      clearReloadGuardIfCurrent(currentVersion);
    }
  }, [currentVersion]);

  /**
   * Executes page reload safely
   */
  const triggerReload = useCallback((targetVersion) => {
    if (!targetVersion) return;

    if (!canReloadForVersion(targetVersion)) {
      return;
    }

    recordReload(targetVersion);

    // Perform reload with cache bypass
    try {
      window.location.reload();
    } catch {
      window.location.href = window.location.href;
    }
  }, []);

  /**
   * Checks remote version.json
   */
  const checkForUpdates = useCallback(async () => {
    if (!enabled || isCheckingRef.current) return;

    isCheckingRef.current = true;
    setIsChecking(true);

    try {
      // Use cache-busting timestamp query parameter + strict anti-caching headers
      const url = `/version.json?t=${Date.now()}`;
      const response = await fetch(url, {
        method: 'GET',
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      });

      if (!response.ok) {
        return;
      }

      const data = await response.json();
      const remoteVersion = data?.version;

      if (!remoteVersion) return;

      setLatestVersion(remoteVersion);

      // Check if remote version differs from currently running version
      if (currentVersion && remoteVersion !== currentVersion) {
        setHasUpdate(true);
        pendingReloadRef.current = remoteVersion;

        // Requirement 8: Avoid interrupting active typing or form submission
        if (isUserActivelyEditingOrSubmitting()) {
          console.info(
            `[useAppUpdate] New version ${remoteVersion} detected. Deferring reload until active form/input is idle.`
          );
        } else {
          triggerReload(remoteVersion);
        }
      }
    } catch (err) {
      // Gracefully handle network failures without disturbing the user
      console.debug('[useAppUpdate] Version check skipped:', err.message);
    } finally {
      isCheckingRef.current = false;
      setIsChecking(false);
    }
  }, [enabled, currentVersion, triggerReload]);

  // Periodic polling every 60 seconds
  useEffect(() => {
    if (!enabled) return;

    // Check immediately on mount
    checkForUpdates();

    const intervalId = setInterval(() => {
      checkForUpdates();
    }, interval);

    return () => clearInterval(intervalId);
  }, [enabled, interval, checkForUpdates]);

  // Check on tab visibility change or window focus
  useEffect(() => {
    if (!enabled) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkForUpdates();
      } else if (document.visibilityState === 'hidden' && pendingReloadRef.current) {
        // If tab is hidden and an update is pending, it's completely safe to reload now!
        triggerReload(pendingReloadRef.current);
      }
    };

    const handleFocus = () => {
      checkForUpdates();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [enabled, checkForUpdates, triggerReload]);

  // Listen for blur on active input when an update is pending
  useEffect(() => {
    if (!hasUpdate || !pendingReloadRef.current) return;

    const checkDeferredReload = () => {
      if (pendingReloadRef.current && !isUserActivelyEditingOrSubmitting()) {
        triggerReload(pendingReloadRef.current);
      }
    };

    // Retry checking deferred reload every 10 seconds
    const deferredInterval = setInterval(checkDeferredReload, 10000);
    window.addEventListener('blur', checkDeferredReload, true);

    return () => {
      clearInterval(deferredInterval);
      window.removeEventListener('blur', checkDeferredReload, true);
    };
  }, [hasUpdate, triggerReload]);

  return {
    currentVersion,
    latestVersion,
    hasUpdate,
    isChecking,
    checkForUpdates,
    reloadNow: () => triggerReload(latestVersion),
  };
};

export default useAppUpdate;
