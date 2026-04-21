// FILE: /pages/management/reviews.tsx
// Reviews monitor for management: view, add, and delete customer reviews.

import Head from "next/head";
import Link from "next/link";
import { useState } from "react";
import type { GetServerSideProps } from "next";

import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useRequireAdmin } from "../../hooks/useRequireAdmin";
import { adminDb } from "../../utils/firebaseAdmin";

type AdminReview = {
  id: string;
  rating: number;
  comment: string;
  authorName: string;
  source: string;
  createdAt: string;
  createdAtMs: number;
};

type Props = {
  initialReviews: AdminReview[];
};

function StarDisplay({ rating }: { rating: number }) {
  const clamped = Math.max(0, Math.min(5, Math.round(rating)));
  return (
    <span style={{ color: "#eab308", fontSize: 16, letterSpacing: 2 }}>
      {"★".repeat(clamped)}
      {"☆".repeat(5 - clamped)}
    </span>
  );
}

export default function ReviewsMonitor({ initialReviews }: Props) {
  const { loading } = useRequireAdmin();
  const [reviews, setReviews] = useState<AdminReview[]>(initialReviews);
  const [formRating, setFormRating] = useState<number>(5);
  const [formComment, setFormComment] = useState("");
  const [formAuthor, setFormAuthor] = useState("");
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<"all" | "public" | "low">("all");

  const handleAdd = async () => {
    const comment = formComment.trim();
    if (!comment) {
      alert("Comment is required");
      return;
    }
    if (formRating < 1 || formRating > 5) {
      alert("Rating must be between 1 and 5");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/management/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating: formRating,
          comment,
          authorName: formAuthor.trim(),
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok || !json.id) {
        throw new Error(json?.error || "Failed to add review");
      }

      const newReview: AdminReview = {
        id: json.id,
        rating: formRating,
        comment,
        authorName: formAuthor.trim(),
        source: "admin",
        createdAt: new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        }),
        createdAtMs: Date.now(),
      };
      setReviews((prev) => [newReview, ...prev]);
      setFormComment("");
      setFormAuthor("");
      setFormRating(5);
    } catch (err: any) {
      console.error("Error adding review:", err);
      alert(err?.message || "Failed to add review.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this review permanently?")) return;
    try {
      const res = await fetch(`/api/management/reviews?id=${id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json?.error || "Failed to delete review");
      }
      setReviews((prev) => prev.filter((r) => r.id !== id));
    } catch (err: any) {
      console.error("Error deleting review:", err);
      alert(err?.message || "Failed to delete review.");
    }
  };

  if (loading) return <div className="dashboard-page" />;

  const visible = reviews.filter((r) => {
    if (filter === "public") return r.rating >= 4;
    if (filter === "low") return r.rating <= 3;
    return true;
  });

  const total = reviews.length;
  const publicCount = reviews.filter((r) => r.rating >= 4).length;
  const lowCount = reviews.filter((r) => r.rating <= 3).length;
  const avg =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

  return (
    <div className="dashboard-page">
      <Head>
        <title>Reviews Monitor - Admin</title>
      </Head>
      <Header />

      <main className="dashboard-main">
        <div className="dashboard-header">
          <div>
            <h1>Reviews Monitor</h1>
            <p>
              View, add, and delete customer reviews. Only 4 and 5 star reviews
              are shown on the public reviews page.
            </p>
          </div>
          <Link href="/management/dashboard">&larr; Back to Dashboard</Link>
        </div>

        {/* STATS */}
        <section className="stats-grid">
          <div className="stat-card">
            <p className="stat-label">Total Reviews</p>
            <p className="stat-value">{total}</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">Average Rating</p>
            <p className="stat-value">
              {avg > 0 ? avg.toFixed(2) : "—"}{" "}
              <span className="stat-sub"><StarDisplay rating={avg} /></span>
            </p>
          </div>
          <div className="stat-card">
            <p className="stat-label">Public (4-5 ★)</p>
            <p className="stat-value">{publicCount}</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">Hidden (1-3 ★)</p>
            <p className="stat-value">{lowCount}</p>
          </div>
        </section>

        {/* ADD FORM */}
        <section className="editor-card">
          <h2>Add a Review</h2>
          <p className="editor-hint">
            Enter a written review and choose a star rating (1-5). 4 and 5 star
            reviews will appear on the public reviews page.
          </p>

          <div className="form-grid">
            <label className="span-1">
              Star Rating
              <select
                value={formRating}
                onChange={(e) => setFormRating(Number(e.target.value))}
              >
                <option value={5}>5 ★★★★★</option>
                <option value={4}>4 ★★★★</option>
                <option value={3}>3 ★★★</option>
                <option value={2}>2 ★★</option>
                <option value={1}>1 ★</option>
              </select>
            </label>

            <label className="span-2">
              Author Name (optional)
              <input
                value={formAuthor}
                onChange={(e) => setFormAuthor(e.target.value)}
                placeholder="e.g. Jane from London"
              />
            </label>

            <label className="span-3">
              Review Comment
              <textarea
                value={formComment}
                onChange={(e) => setFormComment(e.target.value)}
                placeholder="Write the customer review here..."
                rows={3}
                spellCheck
              />
            </label>
          </div>

          <div className="form-actions">
            <button
              className="btn-save"
              onClick={handleAdd}
              disabled={saving}
            >
              {saving ? "Saving..." : "Add Review"}
            </button>
          </div>
        </section>

        {/* FILTERS */}
        <section className="filter-row">
          <button
            className={`filter-btn${filter === "all" ? " filter-btn--active" : ""}`}
            onClick={() => setFilter("all")}
          >
            All ({total})
          </button>
          <button
            className={`filter-btn${filter === "public" ? " filter-btn--active" : ""}`}
            onClick={() => setFilter("public")}
          >
            Public 4-5 ★ ({publicCount})
          </button>
          <button
            className={`filter-btn${filter === "low" ? " filter-btn--active" : ""}`}
            onClick={() => setFilter("low")}
          >
            Hidden 1-3 ★ ({lowCount})
          </button>
        </section>

        {/* LIST */}
        <section className="reviews-list">
          <h3>Reviews</h3>
          {visible.length === 0 ? (
            <p className="empty">No reviews in this view.</p>
          ) : (
            <div className="list-grid">
              {visible.map((r) => (
                <div
                  key={r.id}
                  className={`review-item${r.rating >= 4 ? " review-item--public" : " review-item--hidden"}`}
                >
                  <div className="review-content">
                    <div className="review-header">
                      <StarDisplay rating={r.rating} />
                      <span className={`visibility-badge ${r.rating >= 4 ? "public" : "hidden"}`}>
                        {r.rating >= 4 ? "Public" : "Hidden"}
                      </span>
                      {r.source === "admin" && (
                        <span className="source-badge">admin</span>
                      )}
                    </div>
                    <p className="review-comment">&ldquo;{r.comment}&rdquo;</p>
                    <p className="review-meta">
                      {r.authorName && <span>{r.authorName} &middot; </span>}
                      <span>{r.createdAt || "—"}</span>
                    </p>
                  </div>
                  <div className="review-actions">
                    <button className="delete" onClick={() => handleDelete(r.id)}>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <Footer />

      <style jsx>{`
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-bottom: 24px;
        }
        .stat-card {
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 14px 16px;
        }
        .stat-label {
          font-size: 12px;
          color: #6b7280;
          margin: 0 0 4px;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }
        .stat-value {
          font-size: 22px;
          font-weight: 700;
          color: #111827;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .stat-sub {
          font-size: 14px;
          font-weight: 500;
        }
        @media (max-width: 720px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        .editor-card {
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 14px;
          padding: 20px;
          margin-bottom: 20px;
        }
        .editor-card h2 {
          margin: 0 0 4px;
          font-size: 18px;
          color: #111827;
        }
        .editor-hint {
          margin: 0 0 16px;
          font-size: 13px;
          color: #6b7280;
        }
        .form-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }
        .form-grid label {
          display: flex;
          flex-direction: column;
          gap: 6px;
          font-size: 12px;
          color: #374151;
          font-weight: 600;
        }
        .form-grid .span-1 { grid-column: span 1; }
        .form-grid .span-2 { grid-column: span 2; }
        .form-grid .span-3 { grid-column: span 3; }
        .form-grid input,
        .form-grid select,
        .form-grid textarea {
          font-family: inherit;
          font-size: 14px;
          padding: 8px 10px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          color: #111827;
          background: #fff;
        }
        @media (max-width: 720px) {
          .form-grid { grid-template-columns: 1fr; }
          .form-grid .span-1,
          .form-grid .span-2,
          .form-grid .span-3 { grid-column: span 1; }
        }

        .form-actions {
          margin-top: 16px;
          display: flex;
          gap: 10px;
        }
        .btn-save {
          background: #111827;
          color: #fff;
          border: none;
          border-radius: 8px;
          padding: 10px 18px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
        }
        .btn-save:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .filter-row {
          display: flex;
          gap: 8px;
          margin-bottom: 12px;
          flex-wrap: wrap;
        }
        .filter-btn {
          background: #fff;
          border: 1px solid #d1d5db;
          border-radius: 999px;
          padding: 6px 14px;
          font-size: 13px;
          cursor: pointer;
          color: #4b5563;
          font-family: inherit;
        }
        .filter-btn--active {
          background: #111827;
          color: #fff;
          border-color: #111827;
        }

        .reviews-list h3 {
          font-size: 14px;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin: 0 0 10px;
        }
        .empty {
          font-size: 13px;
          color: #6b7280;
        }
        .list-grid {
          display: grid;
          gap: 10px;
        }
        .review-item {
          display: flex;
          gap: 16px;
          justify-content: space-between;
          align-items: flex-start;
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 14px 16px;
        }
        .review-item--hidden {
          background: #fafafa;
          border-color: #e5e7eb;
          opacity: 0.95;
        }
        .review-content {
          flex: 1;
          min-width: 0;
        }
        .review-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 6px;
          flex-wrap: wrap;
        }
        .visibility-badge {
          font-size: 11px;
          padding: 2px 8px;
          border-radius: 999px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .visibility-badge.public {
          background: #dcfce7;
          color: #166534;
        }
        .visibility-badge.hidden {
          background: #fee2e2;
          color: #991b1b;
        }
        .source-badge {
          font-size: 11px;
          padding: 2px 8px;
          border-radius: 999px;
          background: #e0e7ff;
          color: #3730a3;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .review-comment {
          margin: 4px 0 6px;
          font-size: 14px;
          color: #334155;
          line-height: 1.5;
          word-wrap: break-word;
        }
        .review-meta {
          margin: 0;
          font-size: 12px;
          color: #9ca3af;
        }
        .review-actions {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .review-actions .delete {
          background: #fff;
          border: 1px solid #dc2626;
          color: #dc2626;
          border-radius: 8px;
          padding: 6px 12px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
        }
        .review-actions .delete:hover {
          background: #dc2626;
          color: #fff;
        }
      `}</style>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  // Server-side auth check: same pattern as other management pages
  const { verifySessionToken, ADMIN_SESSION_COOKIE, getAdminEmails } =
    await import("../../utils/adminSession");
  const raw = ctx.req.cookies?.[ADMIN_SESSION_COOKIE] || "";
  if (!raw) {
    return { redirect: { destination: "/management/login", permanent: false } };
  }
  const result = verifySessionToken(raw);
  if (!result.valid) {
    return { redirect: { destination: "/management/login", permanent: false } };
  }
  const admins = getAdminEmails();
  if (admins.size > 0 && !admins.has(result.email)) {
    return { redirect: { destination: "/management/login", permanent: false } };
  }

  if (!adminDb) {
    return { props: { initialReviews: [] } };
  }

  try {
    const snap = await adminDb
      .collection("reviews")
      .orderBy("createdAt", "desc")
      .limit(500)
      .get();

    const initialReviews: AdminReview[] = snap.docs.map((doc) => {
      const d = doc.data() || {};
      const createdAtDate = d.createdAt?.toDate?.();
      return {
        id: doc.id,
        rating: Number(d.rating || 0),
        comment: String(d.comment || ""),
        authorName: String(d.authorName || d.userName || ""),
        source: String(d.source || "user"),
        createdAt: createdAtDate
          ? createdAtDate.toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })
          : "",
        createdAtMs: createdAtDate ? createdAtDate.getTime() : 0,
      };
    });

    return { props: { initialReviews } };
  } catch (err) {
    console.error("Error loading reviews", err);
    return { props: { initialReviews: [] } };
  }
};
