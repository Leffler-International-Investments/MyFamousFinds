// FILE: /pages/management/reviews.tsx
import type { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useRequireAdmin } from "../../hooks/useRequireAdmin";
import { adminDb } from "../../utils/firebaseAdmin";

type ReviewRow = {
  id: string;
  listing: string;
  user: string;
  rating: number;
  status: string;
};

type Props = {
  reviews: ReviewRow[];
};

export default function ManagementReviews({ reviews }: Props) {
  const { loading } = useRequireAdmin();
  if (loading) return null;

  const hasAny = reviews.length > 0;

  return (
    <>
      <Head>
        <title>Reviews & Moderation — Admin</title>
      </Head>
      <div className="min-h-screen bg-gray-50 text-gray-900">
        <Header />
        <main className="mx-auto max-w-6xl px-4 pb-16 pt-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Reviews & Moderation
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Monitor and moderate reviews left by buyers.
              </p>
            </div>
            <Link
              href="/management/dashboard"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              ← Back to Management Dash
            </Link>
          </div>

          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">
                    Review ID
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">
                    Listing
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">
                    User
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">
                    Rating
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {hasAny ? (
                  reviews.map((r) => (
                    <tr key={r.id}>
                      <td className="px-4 py-2 text-gray-900">{r.id}</td>
                      <td className="px-4 py-2 text-gray-900">
                        {r.listing || "—"}
                      </td>
                      <td className="px-4 py-2 text-gray-700">
                        {r.user || "—"}
                      </td>
                      <td className="px-4 py-2 text-gray-700">
                        {r.rating ? `${r.rating}/5` : "—"}
                      </td>
                      <td className="px-4 py-2">
                        <span
                          className={
                            "rounded-full px-3 py-1 text-xs font-medium " +
                            (r.status === "Published"
                              ? "bg-green-100 text-green-800"
                              : r.status === "Flagged"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800")
                          }
                        >
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-6 text-center text-sm text-gray-500"
                    >
                      No reviews found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async () => {
  try {
    const snap = await adminDb
      .collection("reviews")
      .orderBy("createdAt", "desc")
      .limit(200)
      .get();

    const reviews: ReviewRow[] = snap.docs.map((doc) => {
      const d: any = doc.data() || {};
      const ratingRaw = d.rating ?? 0;
      const rating =
        typeof ratingRaw === "number"
          ? ratingRaw
          : typeof ratingRaw === "string"
          ? Number(ratingRaw) || 0
          : 0;

      return {
        id: doc.id,
        listing: d.listingTitle || d.listingId || "",
        user: d.userName || d.userDisplayName || d.userId || "",
        rating,
        status: d.status || "Published",
      };
    });

    return { props: { reviews } };
  } catch (err) {
    console.error("Error loading reviews", err);
    return { props: { reviews: [] } };
  }
};
