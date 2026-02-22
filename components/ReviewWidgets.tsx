// FILE: components/ReviewWidgets.tsx
"use client";
import React, { useState, useEffect, useRef, useCallback, type CSSProperties } from "react";
import { addReview } from "../lib/firestore";
import { APP_NAME } from "../lib/appConfig";

export type ReviewWidgetProps = {
  appName?: string;
};

const RATE_LIMIT_KEY = "ff-review-last";
const RATE_LIMIT_MS = 24 * 60 * 60 * 1000; // 24 hours

function isRateLimited(): boolean {
  if (typeof window === "undefined") return false;
  const last = Number(localStorage.getItem(RATE_LIMIT_KEY) || "0");
  return Date.now() - last < RATE_LIMIT_MS;
}

function markReviewSubmitted() {
  if (typeof window !== "undefined") {
    localStorage.setItem(RATE_LIMIT_KEY, String(Date.now()));
  }
}

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

const modalBaseStyle: CSSProperties = {
  position: "fixed",
  zIndex: 51,
  background: "#1e293b",
  color: "white",
  padding: 20,
  borderRadius: 16,
  boxShadow: "0 20px 50px rgba(0, 0, 0, 0.5)",
  width: "calc(100vw - 32px)",
  maxWidth: 300,
  border: "1px solid #334155",
  touchAction: "none",
};

const starButton: CSSProperties = {
  background: "transparent",
  border: "none",
  fontSize: 24,
  cursor: "pointer",
};

const inputBase: CSSProperties = {
  width: "100%",
  borderRadius: 8,
  padding: 8,
  border: "1px solid #334155",
  background: "#0f172a",
  color: "white",
  fontSize: 14,
};

const buttonBase: CSSProperties = {
  width: "100%",
  padding: "10px",
  borderRadius: 8,
  border: "none",
  fontWeight: 700,
  cursor: "pointer",
  fontSize: 14,
};

type ReviewStats = {
  count: number;
  average: number | null;
};

const ReviewWidgets: React.FC<ReviewWidgetProps> = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [reviewerEmail, setReviewerEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [rateLimited, setRateLimited] = useState(false);

  // Draggable state
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [posReady, setPosReady] = useState(false);
  const dragRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const hasMoved = useRef(false);

  // Set initial position (bottom-right) after mount
  useEffect(() => {
    const x = window.innerWidth - 24;
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

  // Check rate limit on mount
  useEffect(() => {
    setRateLimited(isRateLimited());
  }, []);

  // Load dynamic review stats for the pill (count + average)
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setStatsLoading(true);
        const res = await fetch("/api/review-stats");
        if (!res.ok) throw new Error("Failed to load review stats");
        const data = (await res.json()) as {
          success: boolean;
          count?: number;
          average?: number | null;
        };
        if (data.success && typeof data.count === "number") {
          setStats({
            count: data.count,
            average: typeof data.average === "number" ? data.average : null,
          });
        }
      } catch (err) {
        console.error("Review stats error:", err);
      } finally {
        setStatsLoading(false);
      }
    };
    fetchStats();
  }, []);

  const handleSubmit = async () => {
    if (!comment.trim()) return;
    if (isRateLimited()) {
      setRateLimited(true);
      return;
    }

    setLoading(true);
    try {
      // Save ALL reviews to Firestore (positive and negative)
      try {
        await addReview("guest", rating, comment, APP_NAME);
      } catch (err) {
        console.error("addReview failed:", err);
      }

      // Send email notification via AWS SES (admin + optional reviewer confirmation)
      try {
        await fetch("/api/review-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            rating,
            comment,
            appName: APP_NAME,
            reviewerEmail: reviewerEmail.trim() || undefined,
          }),
        });
      } catch (err) {
        console.error("Review email send failed:", err);
      }

      // Optimistic stats update in UI
      setStats((prev) => {
        if (!prev) return { count: 1, average: rating };
        const newCount = prev.count + 1;
        const oldAvg = prev.average ?? rating;
        const newAvg = (oldAvg * prev.count + rating) / newCount;
        return { count: newCount, average: newAvg };
      });

      markReviewSubmitted();
      setRateLimited(true);
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  const renderPillText = () => {
    if (statsLoading) {
      return (
        <>
          <span style={{ color: "#eab308" }}>★★★★★</span>
          <span>Loading reviews...</span>
        </>
      );
    }
    if (stats && stats.count > 0) {
      const avg = stats.average ?? 4.9;
      return (
        <>
          <span style={{ color: "#eab308" }}>★★★★★</span>
          <span>
            {avg.toFixed(1)}/5 • {stats.count} review
            {stats.count === 1 ? "" : "s"}
          </span>
        </>
      );
    }
    return (
      <>
        <span style={{ color: "#eab308" }}>★★★★★</span>
        <span>Leave a review</span>
      </>
    );
  };

  if (!posReady) return null;

  const posStyle: CSSProperties = {
    left: pos.x,
    top: pos.y,
    transform: "translate(-100%, -100%)",
  };

  // Closed pill
  if (!isOpen) {
    return (
      <div
        ref={dragRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onClick={() => { if (!hasMoved.current) setIsOpen(true); }}
        style={{ ...pillBaseStyle, ...posStyle }}
      >
        {renderPillText()}
      </div>
    );
  }

  // Open modal — centered on screen so it never overflows on mobile
  const modalPosStyle: CSSProperties = {
    left: "50%",
    bottom: 24,
    transform: "translateX(-50%)",
  };

  return (
    <div
      ref={dragRef}
      style={{ ...modalBaseStyle, ...modalPosStyle }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 10,
        }}
      >
        <h3 style={{ margin: 0, fontSize: 16 }}>Rate {APP_NAME}</h3>
        <button
          onClick={() => {
            setIsOpen(false);
            setSubmitted(false);
            setComment("");
            setReviewerEmail("");
          }}
          style={{
            background: "transparent",
            border: "none",
            color: "#94a3b8",
            cursor: "pointer",
            fontSize: 16,
          }}
        >
          ✕
        </button>
      </div>

      {rateLimited && !submitted ? (
        <div style={{ textAlign: "center", padding: "12px 0 4px" }}>
          <p style={{ margin: 0, marginBottom: 10, color: "#94a3b8", fontSize: 13 }}>
            You already submitted a review recently. Thank you for your feedback!
          </p>
          <button
            onClick={() => {
              setIsOpen(false);
            }}
            style={{
              ...buttonBase,
              background: "#0f172a",
              color: "#e5e7eb",
              fontWeight: 500,
              fontSize: 13,
            }}
          >
            Close
          </button>
        </div>
      ) : submitted ? (
        <div style={{ textAlign: "center", padding: "12px 0 4px" }}>
          <p
            style={{
              margin: 0,
              marginBottom: 10,
              color: rating >= 4 ? "#4ade80" : "#f97316",
              fontWeight: 600,
            }}
          >
            {rating >= 4
              ? "Thank you for your wonderful feedback!"
              : "Thank you for your honest feedback."}
          </p>
          <p
            style={{
              margin: 0,
              marginBottom: 12,
              fontSize: 13,
              color: "#cbd5f5",
            }}
          >
            {rating >= 4
              ? `Your review helps others discover ${APP_NAME}. We truly appreciate it!`
              : `We'll review your comments carefully to keep improving ${APP_NAME}.`}
          </p>
          {reviewerEmail.trim() && (
            <p style={{ margin: "0 0 12px", fontSize: 12, color: "#94a3b8" }}>
              A confirmation has been sent to {reviewerEmail.trim()}.
            </p>
          )}
          <button
            onClick={() => {
              setIsOpen(false);
              setSubmitted(false);
              setComment("");
              setReviewerEmail("");
              setRating(5);
            }}
            style={{
              ...buttonBase,
              background: "#0f172a",
              color: "#e5e7eb",
              fontWeight: 500,
              fontSize: 13,
            }}
          >
            Close
          </button>
        </div>
      ) : (
        <>
          <div
            style={{
              display: "flex",
              gap: 8,
              marginBottom: 12,
              justifyContent: "center",
            }}
          >
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                style={{
                  ...starButton,
                  color: star <= rating ? "#eab308" : "#475569",
                }}
              >
                ★
              </button>
            ))}
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={`Tell us what you think about ${APP_NAME}...`}
            style={{
              ...inputBase,
              height: 80,
              marginBottom: 8,
              resize: "none",
            }}
          />
          <input
            type="email"
            value={reviewerEmail}
            onChange={(e) => setReviewerEmail(e.target.value)}
            placeholder="Your email (optional, for confirmation)"
            style={{
              ...inputBase,
              marginBottom: 12,
            }}
          />
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              ...buttonBase,
              background: "#38bdf8",
              color: "#0f172a",
              opacity: loading ? 0.7 : 1,
              cursor: loading ? "default" : "pointer",
            }}
          >
            {loading ? "Sending..." : "Submit Review"}
          </button>
        </>
      )}
    </div>
  );
};

export default ReviewWidgets;
export const ReviewWidget = ReviewWidgets;
