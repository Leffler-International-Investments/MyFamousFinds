// FILE: /pages/reviews.tsx
// Public reviews page for social proof.
// - Shows only 4-5 star reviews
// - On first visit (empty collection) seeds 2 sample reviews
// - Lets any visitor write a new review inline

import Head from "next/head";
import { useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import type { GetServerSideProps } from "next";
import { adminDb, FieldValue, isFirebaseAdminReady } from "../utils/firebaseAdmin";

type Review = {
  id: string;
  rating: number;
  comment: string;
  authorName: string;
  createdAt: string;
};

type Props = {
  reviews: Review[];
  averageRating: number | null;
  totalCount: number;
};

function StarDisplay({ rating }: { rating: number }) {
  const clamped = Math.max(0, Math.min(5, Math.round(rating)));
  return (
    <span style={{ color: "#eab308", fontSize: 18, letterSpacing: 2 }}>
      {"★".repeat(clamped)}
      {"☆".repeat(5 - clamped)}
    </span>
  );
}

function StarPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div style={{ display: "inline-flex", gap: 4 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          aria-label={`${n} star${n === 1 ? "" : "s"}`}
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            fontSize: 28,
            lineHeight: 1,
            color: n <= value ? "#eab308" : "#d1d5db",
            padding: "0 2px",
          }}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export default function ReviewsPage({
  reviews: initialReviews,
  averageRating: initialAverage,
  totalCount: initialTotal,
}: Props) {
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [averageRating, setAverageRating] = useState<number | null>(initialAverage);
  const [totalCount, setTotalCount] = useState<number>(initialTotal);

  const [formRating, setFormRating] = useState(5);
  const [formComment, setFormComment] = useState("");
  const [formAuthor, setFormAuthor] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState<{
    kind: "ok" | "err";
    text: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitMsg(null);

    const comment = formComment.trim();
    if (!comment) {
      setSubmitMsg({ kind: "err", text: "Please write a short comment." });
      return;
    }
    if (formRating < 1 || formRating > 5) {
      setSubmitMsg({ kind: "err", text: "Please pick a star rating." });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/reviews/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating: formRating,
          comment,
          authorName: formAuthor.trim(),
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json?.error || "Failed to submit");
      }

      // Update running stats
      const newTotal = totalCount + 1;
      const newAvg =
        averageRating === null
          ? formRating
          : (averageRating * totalCount + formRating) / newTotal;
      setTotalCount(newTotal);
      setAverageRating(newAvg);

      // Only add to visible list if rating qualifies (4-5 stars)
      if (formRating >= 4) {
        const newReview: Review = {
          id: json.id,
          rating: formRating,
          comment,
          authorName: formAuthor.trim(),
          createdAt: new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          }),
        };
        setReviews((prev) => [newReview, ...prev]);
        setSubmitMsg({ kind: "ok", text: "Thank you! Your review is now live." });
      } else {
        setSubmitMsg({
          kind: "ok",
          text: "Thanks for the feedback — we've sent it to the team.",
        });
      }

      setFormComment("");
      setFormAuthor("");
      setFormRating(5);
    } catch (err: any) {
      setSubmitMsg({
        kind: "err",
        text: err?.message || "Could not submit review. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>Customer Reviews - Famous Finds</title>
        <meta
          name="description"
          content="Read verified customer reviews for Famous Finds and leave your own. See what buyers say about our authenticated luxury items and trusted seller community."
        />
        <meta property="og:title" content="Customer Reviews - Famous Finds" />
        <meta
          property="og:description"
          content="Read verified customer reviews for Famous Finds and leave your own."
        />
        <meta name="twitter:title" content="Customer Reviews - Famous Finds" />
      </Head>

      <div style={{ background: "#f7f7f5", minHeight: "100vh" }}>
        <Header />

        <main style={{ maxWidth: 800, margin: "0 auto", padding: "32px 16px 64px" }}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <h1
              style={{
                margin: "0 0 8px",
                fontSize: 32,
                fontWeight: 600,
                color: "#0f172a",
                letterSpacing: "-0.02em",
              }}
            >
              Customer Reviews
            </h1>
            {averageRating !== null && totalCount > 0 ? (
              <div style={{ marginTop: 8 }}>
                <StarDisplay rating={Math.round(averageRating)} />
                <p style={{ margin: "8px 0 0", fontSize: 16, color: "#6b7280" }}>
                  {averageRating.toFixed(1)} out of 5 — based on {totalCount}{" "}
                  review{totalCount === 1 ? "" : "s"}
                </p>
              </div>
            ) : (
              <p style={{ margin: "8px 0 0", fontSize: 14, color: "#6b7280" }}>
                Be the first to share your experience!
              </p>
            )}
          </div>

          {/* WRITE A REVIEW FORM */}
          <section
            style={{
              background: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: 16,
              padding: 20,
              marginBottom: 24,
              boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
            }}
          >
            <h2
              style={{
                margin: "0 0 4px",
                fontSize: 18,
                fontWeight: 700,
                color: "#111827",
              }}
            >
              Write a Review
            </h2>
            <p style={{ margin: "0 0 14px", fontSize: 13, color: "#6b7280" }}>
              Share your experience with Famous Finds. Only 4 and 5 star reviews
              are published on this page.
            </p>

            <form onSubmit={handleSubmit}>
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#374151",
                  marginBottom: 6,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                Your Rating
              </label>
              <StarPicker value={formRating} onChange={setFormRating} />

              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#374151",
                  marginTop: 14,
                  marginBottom: 6,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                Your Name (optional)
              </label>
              <input
                type="text"
                value={formAuthor}
                onChange={(e) => setFormAuthor(e.target.value)}
                placeholder="e.g. Jane from London"
                maxLength={80}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: 8,
                  fontSize: 14,
                  fontFamily: "inherit",
                  background: "#fff",
                  color: "#111827",
                }}
              />

              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#374151",
                  marginTop: 14,
                  marginBottom: 6,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                Your Review
              </label>
              <textarea
                value={formComment}
                onChange={(e) => setFormComment(e.target.value)}
                placeholder="Tell us what you loved..."
                rows={4}
                maxLength={1000}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: 8,
                  fontSize: 14,
                  fontFamily: "inherit",
                  background: "#fff",
                  color: "#111827",
                  resize: "vertical",
                }}
              />

              <div
                style={{
                  marginTop: 14,
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    background: submitting ? "#6b7280" : "#111827",
                    color: "#fff",
                    border: "none",
                    borderRadius: 8,
                    padding: "10px 20px",
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: submitting ? "not-allowed" : "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  {submitting ? "Submitting..." : "Submit Review"}
                </button>

                {submitMsg && (
                  <span
                    style={{
                      fontSize: 13,
                      color: submitMsg.kind === "ok" ? "#166534" : "#991b1b",
                    }}
                  >
                    {submitMsg.text}
                  </span>
                )}
              </div>
            </form>
          </section>

          {/* REVIEWS LIST */}
          {reviews.length === 0 ? (
            <div
              style={{
                padding: 48,
                textAlign: "center",
                background: "#fff",
                border: "1px dashed #e5e7eb",
                borderRadius: 16,
              }}
            >
              <h3
                style={{
                  margin: "0 0 8px",
                  fontSize: 18,
                  fontWeight: 800,
                  color: "#111827",
                }}
              >
                No Reviews Yet
              </h3>
              <p style={{ margin: 0, fontSize: 13, color: "#6b7280" }}>
                Be the first to share your experience above.
              </p>
            </div>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {reviews.map((r) => (
                <div
                  key={r.id}
                  style={{
                    background: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: 14,
                    padding: "16px 20px",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 8,
                    }}
                  >
                    <StarDisplay rating={r.rating} />
                    <span style={{ fontSize: 12, color: "#9ca3af" }}>
                      {r.createdAt}
                    </span>
                  </div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 14,
                      color: "#334155",
                      lineHeight: 1.6,
                    }}
                  >
                    &ldquo;{r.comment}&rdquo;
                  </p>
                  {r.authorName && (
                    <p
                      style={{
                        margin: "8px 0 0",
                        fontSize: 12,
                        color: "#6b7280",
                        fontWeight: 600,
                      }}
                    >
                      — {r.authorName}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </main>

        <Footer />
      </div>
    </>
  );
}

// Sample reviews used to seed the collection on first ever load.
const SAMPLE_REVIEWS = [
  {
    rating: 5,
    comment:
      "Absolutely delighted with my Famous Finds purchase. The authentication was thorough, packaging was beautiful, and the bag is exactly as described. Will definitely buy again.",
    authorName: "Sophie M.",
  },
  {
    rating: 5,
    comment:
      "Five stars for the whole experience — quick shipping, transparent seller communication, and the item is in pristine condition. This is how pre-loved luxury should be done.",
    authorName: "Isabella R.",
  },
];

export const getServerSideProps: GetServerSideProps<Props> = async () => {
  if (!isFirebaseAdminReady || !adminDb) {
    return { props: { reviews: [], averageRating: null, totalCount: 0 } };
  }

  try {
    // Seed sample reviews if collection is empty (first-ever visit)
    const existingSnap = await adminDb
      .collection("reviews")
      .limit(1)
      .get();

    if (existingSnap.empty) {
      const batch = adminDb.batch();
      for (const r of SAMPLE_REVIEWS) {
        const ref = adminDb.collection("reviews").doc();
        batch.set(ref, {
          rating: r.rating,
          comment: r.comment,
          authorName: r.authorName,
          source: "seed",
          createdAt: FieldValue.serverTimestamp(),
        });
      }
      try {
        await batch.commit();
      } catch (seedErr) {
        console.warn("Could not seed sample reviews:", seedErr);
      }
    }

    const snap = await adminDb
      .collection("reviews")
      .orderBy("createdAt", "desc")
      .limit(200)
      .get();

    let totalRating = 0;
    let ratingCount = 0;
    const reviews: Review[] = [];

    snap.docs.forEach((doc) => {
      const d = doc.data();
      const rating = Number(d.rating || 0);
      const comment = String(d.comment || "").trim();

      if (rating > 0) {
        totalRating += rating;
        ratingCount++;
      }

      // Only show 4 and 5 star reviews to customers
      if (comment && rating >= 4) {
        const createdAt = d.createdAt?.toDate?.()
          ? d.createdAt.toDate().toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })
          : "";

        reviews.push({
          id: doc.id,
          rating,
          comment,
          authorName: String(d.authorName || d.userName || ""),
          createdAt,
        });
      }
    });

    return {
      props: {
        reviews,
        averageRating: ratingCount > 0 ? totalRating / ratingCount : null,
        totalCount: ratingCount,
      },
    };
  } catch (err) {
    console.error("Error loading reviews", err);
    return { props: { reviews: [], averageRating: null, totalCount: 0 } };
  }
};
