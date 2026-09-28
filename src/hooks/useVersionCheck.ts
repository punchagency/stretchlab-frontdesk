import { useEffect, useRef } from "react";

const POLL_INTERVAL_MS = 60_000; // Poll /version.json every 60s
const RELOAD_DELAY_MS = 2_000; // 2s branded card animation before reload
const LOOP_GUARD_WINDOW_MS = 30_000; // 30s window to prevent re-reload loops
const IDLE_TIMEOUT_MS = 25_000; // 25s of inactivity before applying update if not busy

interface VersionManifest {
  buildId: string;
  timestamp: string;
}

interface LoopGuard {
  buildId: string;
  reloadedAt: number;
}

const GUARD_KEY = "__version_reload_guard";
const OVERLAY_ID = "__version-update-overlay";
const TOAST_ID = "__version-update-toast";

/**
 * Fetches /version.json silently with cache-busting. Returns null on any failure.
 */
async function fetchVersion(): Promise<VersionManifest | null> {
  try {
    const res = await fetch(`/version.json?t=${Date.now()}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null; // Network offline, 404, parse error — all silent
  }
}

/**
 * Returns true if we already reloaded for this buildId recently.
 */
function isLoopGuarded(buildId: string): boolean {
  try {
    const raw = sessionStorage.getItem(GUARD_KEY);
    if (!raw) return false;
    const guard: LoopGuard = JSON.parse(raw);
    if (
      guard.buildId === buildId &&
      Date.now() - guard.reloadedAt < LOOP_GUARD_WINDOW_MS
    ) {
      return true; // We just reloaded for this version — don't loop
    }
  } catch {
    /* corrupted storage — ignore */
  }
  return false;
}

/**
 * Write the loop guard before reloading.
 */
function setLoopGuard(buildId: string): void {
  try {
    const guard: LoopGuard = { buildId, reloadedAt: Date.now() };
    sessionStorage.setItem(GUARD_KEY, JSON.stringify(guard));
  } catch {
    /* storage full — proceed anyway */
  }
}

/**
 * Check if the user is currently actively typing in a form, has unsaved input values, or is interacting with a modal.
 */
function isUserBusy(): boolean {
  try {
    const activeEl = document.activeElement;
    if (activeEl) {
      const tag = activeEl.tagName.toUpperCase();
      if (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        (activeEl as HTMLElement).isContentEditable
      ) {
        return true;
      }
    }

    // Check if user has entered content into any text inputs or textareas on the page
    const inputs = document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(
      'input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]), textarea'
    );
    for (let i = 0; i < inputs.length; i++) {
      if (inputs[i].value && inputs[i].value.trim().length > 0) {
        return true;
      }
    }

    // Check if a modal or dialog is currently open
    const modal = document.querySelector(
      '[role="dialog"], [aria-modal="true"], dialog[open], [data-state="open"][role="alertdialog"]'
    );
    if (modal) {
      return true;
    }
  } catch {
    /* ignore DOM errors */
  }
  return false;
}

/**
 * Remove the update toast if present.
 */
function removeUpdateToast(): void {
  const toast = document.getElementById(TOAST_ID);
  if (toast) {
    toast.remove();
  }
}

/**
 * Show a high-visibility, full-width top announcement bar that cannot be missed.
 */
function showUpdateToast(onReload: () => void): void {
  if (document.getElementById(TOAST_ID) || document.getElementById(OVERLAY_ID)) {
    return;
  }

  const toast = document.createElement("div");
  toast.id = TOAST_ID;
  toast.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    width: 100%;
    height: 44px;
    z-index: 999999;
    background: linear-gradient(90deg, #102529 0%, #1A4E57 25%, #2A6B75 50%, #1A4E57 75%, #102529 100%);
    border-bottom: 1.5px solid rgba(88, 203, 219, 0.6);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.35), 0 0 20px rgba(54, 133, 145, 0.4);
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    animation: __versionBarSlideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    padding: 0 16px;
    box-sizing: border-box;
    display: flex;
    align-items: center;
  `;

  toast.innerHTML = `
    <style>
      @keyframes __versionBarSlideDown {
        from { transform: translateY(-100%); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      @keyframes __versionRadarPing {
        0% { transform: scale(0.9); opacity: 0.9; }
        70%, 100% { transform: scale(2.4); opacity: 0; }
      }
      @keyframes __versionPulseBtn {
        0%, 100% { transform: scale(1); box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3); }
        50% { transform: scale(1.04); box-shadow: 0 0 16px rgba(255, 255, 255, 0.8), 0 2px 12px rgba(0, 0, 0, 0.4); }
      }
    </style>
    <div style="width: 100%; max-width: 1400px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; gap: 14px;">
      <!-- Left side: Live indicator + announcement -->
      <div style="display: flex; align-items: center; gap: 10px; min-width: 0;">
        <span style="position: relative; width: 12px; height: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
          <span style="position: absolute; width: 100%; height: 100%; border-radius: 50%; background: #10B981; animation: __versionRadarPing 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
          <span style="width: 8px; height: 8px; border-radius: 50%; background: #10B981; box-shadow: 0 0 8px #10B981;"></span>
        </span>
        <div style="display: flex; align-items: center; gap: 8px; font-size: 13px; color: #FFFFFF; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
          <span>✨ New version of StretchNote is ready</span>
          <span style="display: inline-block; font-size: 12px; font-weight: 400; color: #A5F3FC; opacity: 0.9;">
            — updates on your next page change, or:
          </span>
        </div>
      </div>

      <!-- Right side: Actions -->
      <div style="display: flex; align-items: center; gap: 10px; flex-shrink: 0;">
        <button id="__version-toast-reload-btn" style="
          background: #FFFFFF;
          color: #102529;
          border: none;
          padding: 5px 15px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.01em;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          animation: __versionPulseBtn 2.2s ease-in-out infinite;
          transition: background 0.15s ease, transform 0.1s ease;
        ">
          Update Now
        </button>
        <button id="__version-toast-close" style="
          background: none;
          border: none;
          padding: 4px 6px;
          color: #A5F3FC;
          cursor: pointer;
          font-size: 18px;
          line-height: 1;
          opacity: 0.8;
          transition: opacity 0.15s, color 0.15s;
        " title="Dismiss">&times;</button>
      </div>
    </div>
  `;

  document.body.appendChild(toast);

  // Hook up event handlers
  const reloadBtn = document.getElementById("__version-toast-reload-btn");
  reloadBtn?.addEventListener("click", () => {
    removeUpdateToast();
    onReload();
  });

  const closeBtn = document.getElementById("__version-toast-close");
  closeBtn?.addEventListener("click", () => {
    removeUpdateToast();
  });
}

/**
 * Show a branded, appealing glassmorphic update overlay, then reload.
 */
function showOverlayAndReload(buildId: string): void {
  removeUpdateToast();

  if (document.getElementById(OVERLAY_ID)) return;

  const isDark =
    document.documentElement.classList.contains("dark") ||
    document.body.classList.contains("dark");

  const cardBg = isDark ? "rgba(22, 21, 26, 0.94)" : "rgba(255, 255, 255, 0.96)";
  const cardBorder = isDark ? "rgba(54, 133, 145, 0.35)" : "rgba(54, 133, 145, 0.2)";
  const titleColor = isDark ? "#F4F5F6" : "#16151A";
  const descColor = isDark ? "#B1B5C3" : "#667185";
  const badgeBg = isDark ? "rgba(54, 133, 145, 0.2)" : "#E1EEF0";
  const badgeColor = isDark ? "#79AACD" : "#368591";
  const trackBg = isDark ? "rgba(255, 255, 255, 0.1)" : "#E1EEF0";
  const shadow = isDark
    ? "0 24px 48px -12px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(54, 133, 145, 0.3)"
    : "0 24px 48px -12px rgba(54, 133, 145, 0.28), 0 0 0 1px rgba(54, 133, 145, 0.12)";

  const overlay = document.createElement("div");
  overlay.id = OVERLAY_ID;
  overlay.style.cssText = `
    position: fixed;
    inset: 0;
    z-index: 999999;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(15, 23, 42, 0.45);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    animation: __versionOverlayFadeIn 0.25s ease-out forwards;
    padding: 16px;
  `;

  overlay.innerHTML = `
    <style>
      @keyframes __versionOverlayFadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes __versionCardPop {
        from { opacity: 0; transform: scale(0.94) translateY(8px); }
        to { opacity: 1; transform: scale(1) translateY(0); }
      }
      @keyframes __versionSpinGlow {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      @keyframes __versionPulseRing {
        0%, 100% { transform: scale(1); opacity: 0.3; }
        50% { transform: scale(1.15); opacity: 0.6; }
      }
      @keyframes __versionProgress {
        0% { transform: translateX(-100%); }
        50% { transform: translateX(30%); }
        100% { transform: translateX(250%); }
      }
    </style>
    <div style="
      background: ${cardBg};
      border: 1px solid ${cardBorder};
      box-shadow: ${shadow};
      border-radius: 20px;
      padding: 32px 36px;
      max-width: 380px;
      width: 100%;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      box-sizing: border-box;
      animation: __versionCardPop 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    ">
      <!-- Animated Brand Icon -->
      <div style="position: relative; width: 64px; height: 64px; margin-bottom: 18px;">
        <div style="
          position: absolute; inset: -4px; border-radius: 50%;
          background: radial-gradient(circle, rgba(54, 133, 145, 0.3) 0%, rgba(121, 170, 205, 0) 70%);
          animation: __versionPulseRing 2s ease-in-out infinite;
        "></div>
        <div style="
          width: 100%; height: 100%; border-radius: 50%;
          background: linear-gradient(135deg, rgba(54, 133, 145, 0.12) 0%, rgba(121, 170, 205, 0.18) 100%);
          border: 1px solid rgba(54, 133, 145, 0.25);
          display: flex; align-items: center; justify-content: center;
          position: relative;
        ">
          <svg style="width: 28px; height: 28px; animation: __versionSpinGlow 1.2s cubic-bezier(0.4, 0, 0.2, 1) infinite;" viewBox="0 0 24 24" fill="none">
            <defs>
              <linearGradient id="__versionGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#368591" />
                <stop offset="100%" stop-color="#79AACD" />
              </linearGradient>
            </defs>
            <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.8 1.03 6.44 2.7L21 8" stroke="url(#__versionGradient)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M21 3v5h-5" stroke="url(#__versionGradient)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
      </div>

      <!-- Badge -->
      <span style="
        display: inline-flex; align-items: center; gap: 6px;
        padding: 4px 12px; border-radius: 9999px;
        background: ${badgeBg}; color: ${badgeColor};
        font-size: 11px; font-weight: 700; letter-spacing: 0.05em;
        text-transform: uppercase; margin-bottom: 12px;
      ">
        <span style="width: 6px; height: 6px; border-radius: 50%; background: #368591;"></span>
        New Version Available
      </span>

      <!-- Title -->
      <h3 style="
        margin: 0 0 6px; color: ${titleColor};
        font-size: 18px; font-weight: 700; letter-spacing: -0.01em;
      ">
        Updating Application
      </h3>

      <!-- Subtitle -->
      <p style="
        margin: 0 0 20px; color: ${descColor};
        font-size: 13px; font-weight: 400; line-height: 1.5;
      ">
        Applying the latest enhancements. Refreshing your workspace...
      </p>

      <!-- Sleek Progress Bar -->
      <div style="
        width: 100%; max-width: 220px; height: 4px;
        background: ${trackBg}; border-radius: 9999px;
        overflow: hidden; position: relative;
      ">
        <div style="
          position: absolute; top: 0; bottom: 0; width: 50%;
          border-radius: 9999px;
          background: linear-gradient(90deg, #368591 0%, #79AACD 100%);
          animation: __versionProgress 1.4s ease-in-out infinite;
        "></div>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  setTimeout(() => {
    setLoopGuard(buildId);
    window.location.reload();
  }, RELOAD_DELAY_MS);
}

/**
 * Production hook that polls /version.json and applies updates gracefully:
 *   - If user is actively typing / in a modal → displays floating update pill and defers
 *   - If user navigates to another page → applies update immediately
 *   - If user switches tabs back or is idle → applies update cleanly
 *   - On dynamic import failure (vite:preloadError) → reloads immediately to recover
 */
export function useVersionCheck(): void {
  const baselineRef = useRef<string | null>(null);
  const pendingReloadRef = useRef<string | null>(null);
  const isDeferredRef = useRef(false);

  useEffect(() => {
    // Only run in production builds
    if (!import.meta.env.PROD) return;

    let isDestroyed = false;
    let lastActivity = Date.now();

    const triggerReload = (buildId: string) => {
      if (isLoopGuarded(buildId) || isDestroyed) return;
      pendingReloadRef.current = null;
      isDeferredRef.current = false;
      showOverlayAndReload(buildId);
    };

    const handleNewVersionDetected = (buildId: string) => {
      if (isLoopGuarded(buildId)) return;

      pendingReloadRef.current = buildId;

      if (document.hidden) {
        // Tab is hidden — mark deferred so returning never surprises the user with a reload
        isDeferredRef.current = true;
        return;
      }

      if (isUserBusy() || isDeferredRef.current) {
        // User is typing, has unsaved form values, or is already deferred
        isDeferredRef.current = true;
        showUpdateToast(() => triggerReload(buildId));
      } else {
        // User is completely idle on a clean page — safe to reload
        triggerReload(buildId);
      }
    };

    const checkVersion = async () => {
      const manifest = await fetchVersion();
      if (!manifest?.buildId || isDestroyed) return;

      if (baselineRef.current === null) {
        // First fetch — establish baseline buildId
        baselineRef.current = manifest.buildId;
        return;
      }

      if (manifest.buildId !== baselineRef.current) {
        handleNewVersionDetected(manifest.buildId);
      }
    };

    // 1. Navigation Interception: if an update is pending, route change triggers reload cleanly
    const onNavigation = () => {
      if (pendingReloadRef.current) {
        triggerReload(pendingReloadRef.current);
      }
    };

    const origPushState = history.pushState;
    const origReplaceState = history.replaceState;

    history.pushState = function (...args) {
      origPushState.apply(this, args);
      onNavigation();
    };

    history.replaceState = function (...args) {
      origReplaceState.apply(this, args);
      onNavigation();
    };

    window.addEventListener("popstate", onNavigation);

    // 2. Tab visibility changes: Never auto-reload on tab return if user was busy/deferred
    const onVisibilityChange = () => {
      if (!document.hidden && pendingReloadRef.current) {
        if (isDeferredRef.current || isUserBusy() || document.getElementById(TOAST_ID)) {
          // Keep user safe: do NOT reload, just ensure the top toast is visible
          isDeferredRef.current = true;
          showUpdateToast(() => triggerReload(pendingReloadRef.current!));
        } else {
          // Tab was left on an empty, untouched page — safe to reload
          triggerReload(pendingReloadRef.current);
        }
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    // 3. User Activity & Idle Tracking
    const recordActivity = () => {
      lastActivity = Date.now();
    };
    const activityEvents = ["keydown", "mousedown", "pointerdown", "touchstart"];
    activityEvents.forEach((ev) =>
      window.addEventListener(ev, recordActivity, { passive: true })
    );

    const idleIntervalId = setInterval(() => {
      // Never interrupt with an idle timer reload if user was deferred or toast is shown
      if (
        pendingReloadRef.current &&
        !isDeferredRef.current &&
        !document.getElementById(TOAST_ID) &&
        !isUserBusy()
      ) {
        const idleTime = Date.now() - lastActivity;
        if (idleTime >= IDLE_TIMEOUT_MS) {
          triggerReload(pendingReloadRef.current);
        }
      }
    }, 5_000);

    // 4. Vite Preload Error Guard (stale chunks recovery)
    const onPreloadError = () => {
      window.location.reload();
    };
    window.addEventListener("vite:preloadError", onPreloadError);

    // 5. Back/Forward bfcache restoration
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        checkVersion();
      }
    };
    window.addEventListener("pageshow", onPageShow);

    // Initial check and periodic polling
    checkVersion();
    const pollIntervalId = setInterval(checkVersion, POLL_INTERVAL_MS);

    return () => {
      isDestroyed = true;
      clearInterval(pollIntervalId);
      clearInterval(idleIntervalId);

      history.pushState = origPushState;
      history.replaceState = origReplaceState;

      window.removeEventListener("popstate", onNavigation);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      activityEvents.forEach((ev) =>
        window.removeEventListener(ev, recordActivity)
      );
      window.removeEventListener("vite:preloadError", onPreloadError);
      window.removeEventListener("pageshow", onPageShow);

      removeUpdateToast();
    };
  }, []);
}
