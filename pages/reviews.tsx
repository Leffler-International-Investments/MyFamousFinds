// FILE: /pages/reviews.tsx
// Public reviews page for social proof.

import Head from "next/head";
import Header from "../components/Header";
import Footer from "../components/Footer";
import type { GetServerSideProps } from "next";
import { adminDb, isFirebaseAdminReady } from "../utils/firebaseAdmin";

type Review = {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
};

type Props = {
  reviews: Review[];
  averageRating: number | null;
  totalCount: number;
};

function StarDisplay({ rating }: { rating: number }) {
  return (
    <span style={{ color: "#eab308", fontSize: 18, letterSpacing: 2 }}>
      {"★".repeat(rating)}
      {"☆".repeat(5 - rating)}
    </span>
  );
}

export default function ReviewsPage({ reviews, averageRating, totalCount }: Props) {
  return (
    <>
      <Head>
        <title>Customer Reviews - Famous Finds</title>
      </Head>

      <div style={{ background: "#f7f7f5", minHeight: "100vh" }}>
        <Header />

        <main style={{ maxWidth: 800, margin: "0 auto", padding: "32px 16px 64px" }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <h1 style={{
              margin: "0 0 8px",
              fontSize: 32,
              fontWeight: 600,
              color: "#0f172a",
              letterSpacing: "-0.02em",
            }}>
              Customer Reviews
            </h1>
            {averageRating !== null && totalCount > 0 ? (
              <div style={{ marginTop: 8 }}>
                <StarDisplay rating={Math.round(averageRating)} />
                <p style={{ margin: "8px 0 0", fontSize: 16, color: "#6b7280" }}>
                  {averageRating.toFixed(1)} out of 5 — based on {totalCount} review{totalCount === 1 ? "" : "s"}
                </p>
              </div>
            ) : (
              <p style={{ margin: "8px 0 0", fontSize: 14, color: "#6b7280" }}>
                No reviews yet. Be the first to share your experience!
              </p>
            )}
          </div>

          {reviews.length === 0 ? (
            <div style={{
              padding: 48,
              textAlign: "center",
              background: "#fff",
              border: "1px dashed #e5e7eb",
              borderRadius: 16,
            }}>
              <h3 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 800, color: "#111827" }}>
                No Reviews Yet
              </h3>
              <p style={{ margin: "0 0 16px", fontSize: 13, color: "#6b7280" }}>
                Purchased from Famous Finds? We would love to hear your feedback.
              </p>
            </div>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {reviews.map((r) => (
                <div key={r.id} style={{
                  background: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: 14,
                  padding: "16px 20px",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <StarDisplay rating={r.rating} />
                    <span style={{ fontSize: 12, color: "#9ca3af" }}>{r.createdAt}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: 14, color: "#334155", lineHeight: 1.6 }}>
                    &ldquo;{r.comment}&rdquo;
                  </p>
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

export const getServerSideProps: GetServerSideProps<Props> = async () => {
  if (!isFirebaseAdminReady || !adminDb) {
    return { props: { reviews: [], averageRating: null, totalCount: 0 } };
  }

  try {
    const snap = await adminDb
      .collection("reviews")
      .orderBy("createdAt", "desc")
      .limit(100)
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

      if (comment) {
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
