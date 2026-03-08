"use client";
import React, { useState, useEffect, type CSSProperties } from "react";

const DISMISSED_KEY = "ff-install-dismissed";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function getIsIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
}

function getIsStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true
  );
}

const pillStyle: CSSProperties = {
  position: "fixed",
  zIndex: 50,
  left: 24,
  bottom: 24,
  background: "#111827",
  color: "#ffffff",
  padding: "10px 18px",
  borderRadius: 24,
  boxShadow: "0 10px 25px rgba(0, 0, 0, 0.3)",
  fontWeight: 700,
  fontSize: 14,
  display: "flex",
  alignItems: "center",
  gap: 8,
  cursor: "pointer",
  border: "1px solid #374151",
  userSelect: "none",
  whiteSpace: "nowrap",
};

const overlayStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 9999,
  background: "rgba(0, 0, 0, 0.75)",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "flex-end",
  padding: "0 16px 40px",
};

const guideCardStyle: CSSProperties = {
  background: "#1e293b",
  color: "#ffffff",
  borderRadius: 20,
  padding: "28px 24px",
  maxWidth: 340,
  width: "100%",
  textAlign: "center",
  boxShadow: "0 20px 60px rgba(0, 0, 0, 0.5)",
};

const InstallAppButton: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Already installed
    if (getIsStandalone()) return;
    // Dismissed this session
    if (sessionStorage.getItem(DISMISSED_KEY)) return;

    const ios = getIsIOS();
    setIsIOS(ios);

    // On iOS, always show the button (no beforeinstallprompt on iOS)
    if (ios) {
      setVisible(true);
      return;
    }

    // Pick up prompt captured in _document.tsx
    const captured = (window as any).__pwaInstallPrompt as BeforeInstallPromptEvent | null;
    if (captured) {
      setDeferredPrompt(captured);
      setVisible(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", handler);

    const installedHandler = () => {
      setVisible(false);
      setInstalling(false);
    };
    window.addEventListener("appinstalled", installedHandler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);

  const handleInstall = async () => {
    // iOS — no native prompt, show a quick visual guide
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }

    // Android / Desktop — trigger native install prompt directly
    const prompt = deferredPrompt || (window as any).__pwaInstallPrompt;
    if (!prompt) return;

    setInstalling(true);
    try {
      await prompt.prompt();
      const choice = await prompt.userChoice;
      if (choice.outcome === "accepted") {
        setVisible(false);
      } else {
        sessionStorage.setItem(DISMISSED_KEY, "1");
        setVisible(false);
      }
    } catch {
      setVisible(false);
    } finally {
      setInstalling(false);
      setDeferredPrompt(null);
      (window as any).__pwaInstallPrompt = null;
    }
  };

  const dismissButton = () => {
    sessionStorage.setItem(DISMISSED_KEY, "1");
    setVisible(false);
    setShowIOSGuide(false);
  };

  if (!visible) return null;

  return (
    <>
      {/* Fixed pill button — bottom-left */}
      <div onClick={handleInstall} style={pillStyle}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 5v14M5 12l7 7 7-7" />
        </svg>
        <span>{installing ? "Installing..." : "Install App"}</span>
        <button
          onClick={(e) => { e.stopPropagation(); dismissButton(); }}
          style={{
            background: "transparent",
            border: "none",
            color: "#6b7280",
            cursor: "pointer",
            fontSize: 16,
            padding: "0 0 0 4px",
            lineHeight: 1,
          }}
          aria-label="Dismiss"
        >
          ✕
        </button>
      </div>

      {/* iOS guide overlay — shown only on iOS when user taps Install */}
      {showIOSGuide && (
        <div style={overlayStyle} onClick={() => setShowIOSGuide(false)}>
          {/* Arrow pointing down to Safari share button */}
          <div style={guideCardStyle} onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12l7-7 7 7" />
                <rect x="3" y="15" width="18" height="6" rx="2" fill="none" />
              </svg>
            </div>
            <p style={{ fontSize: 18, fontWeight: 700, margin: "0 0 8px" }}>
              Tap
              <span style={{ display: "inline-flex", verticalAlign: "middle", margin: "0 6px" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 12v6a2 2 0 002 2h12a2 2 0 002-2v-6" />
                  <polyline points="16 6 12 2 8 6" />
                  <line x1="12" y1="2" x2="12" y2="15" />
                </svg>
              </span>
              then <strong>&ldquo;Add to Home Screen&rdquo;</strong>
            </p>
            <p style={{ fontSize: 13, color: "#94a3b8", margin: "0 0 16px" }}>
              The share button is at the bottom of Safari
            </p>
            <button
              onClick={() => setShowIOSGuide(false)}
              style={{
                background: "#38bdf8",
                color: "#0f172a",
                border: "none",
                borderRadius: 10,
                padding: "10px 24px",
                fontWeight: 700,
                fontSize: 14,
                cursor: "pointer",
                width: "100%",
              }}
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default InstallAppButton;
