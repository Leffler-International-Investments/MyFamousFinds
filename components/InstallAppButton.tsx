"use client";
import React, { useState, useEffect, useRef, useCallback, type CSSProperties } from "react";

const DISMISSED_KEY = "ff-install-dismissed";

const pillBaseStyle: CSSProperties = {
  position: "fixed",
  zIndex: 50,
  background: "#ffffff",
  color: "#0f172a",
  padding: "8px 14px",
  borderRadius: 20,
  boxShadow: "0 10px 25px rgba(0, 0, 0, 0.3)",
  fontWeight: 600,
  fontSize: 14,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 2,
  cursor: "grab",
  border: "1px solid #e2e8f0",
  touchAction: "none",
  userSelect: "none",
  whiteSpace: "nowrap",
};

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const InstallAppButton: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [installing, setInstalling] = useState(false);

  // Draggable state
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [posReady, setPosReady] = useState(false);
  const dragRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const hasMoved = useRef(false);

  // Set initial position (bottom-left, offset from review widget which is bottom-right)
  useEffect(() => {
    const x = 24;
    const y = window.innerHeight - 24;
    setPos({ x, y });
    setPosReady(true);
  }, []);

  const clamp = useCallback((x: number, y: number, el: HTMLElement) => {
    const r = el.getBoundingClientRect();
    return {
      x: Math.max(r.width / 2, Math.min(window.innerWidth - r.width / 2, x)),
      y: Math.max(r.height / 2, Math.min(window.innerHeight - r.height / 2, y)),
    };
  }, []);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    const el = dragRef.current;
    if (!el) return;
    dragging.current = true;
    hasMoved.current = false;
    const r = el.getBoundingClientRect();
    dragOffset.current = {
      x: e.clientX - (r.left + r.width / 2),
      y: e.clientY - (r.top + r.height / 2),
    };
    el.setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current || !dragRef.current) return;
    hasMoved.current = true;
    const nx = e.clientX - dragOffset.current.x;
    const ny = e.clientY - dragOffset.current.y;
    const clamped = clamp(nx, ny, dragRef.current);
    setPos(clamped);
  }, [clamp]);

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    dragging.current = false;
    if (dragRef.current) dragRef.current.releasePointerCapture(e.pointerId);
  }, []);

  // Listen for the beforeinstallprompt event
  useEffect(() => {
    // Check if already dismissed this session
    if (typeof window !== "undefined" && sessionStorage.getItem(DISMISSED_KEY)) return;

    // Check if already installed (standalone mode)
    if (typeof window !== "undefined" && window.matchMedia("(display-mode: standalone)").matches) return;

    // Pick up the prompt captured in _document.tsx
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

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt || hasMoved.current) return;
    setInstalling(true);
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setVisible(false);
      } else {
        sessionStorage.setItem(DISMISSED_KEY, "1");
        setVisible(false);
      }
    } catch {
      // prompt failed — hide button
      setVisible(false);
    } finally {
      setInstalling(false);
      setDeferredPrompt(null);
    }
  };

  if (!posReady || !visible) return null;

  const posStyle: CSSProperties = {
    left: pos.x,
    top: pos.y,
    transform: "translate(0%, -100%)",
  };

  return (
    <div
      ref={dragRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onClick={handleInstall}
      style={{ ...pillBaseStyle, ...posStyle }}
    >
      <span style={{ fontSize: 16, lineHeight: 1 }}>+</span>
      <span>{installing ? "Installing..." : "Install App"}</span>
    </div>
  );
};

export default InstallAppButton;
