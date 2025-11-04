// FILE: /pages/management/reviews.tsx
import Head from "next/head";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";

const mockReviews = [
  { id: "R-001", listing: "Hermès Kelly 28", user: "Sophie", rating: 5, status: "Published" },
  { id: "R-002", listing: "Rolex Submariner 16610", user: "Mark", rating: 3, status: "Flagged" },
  { id: "R-003", listing: "Chanel Classic Flap", user: "Dana", rating: 4, status: "Pending" },
];

export default function ManagementReviews() {
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
                Monitor buyer feedback, handle flags, and keep the marketplace safe.
              </p>
            </div>
            <Link
              href="/management/dashboard"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              ← Back to Management Dashboard
            </Link>
          </div>

          <div className="mb-4 flex flex-wrap gap-3">
            <button className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
              Show Only Flagged
            </button>
          </div>

          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">ID</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Listing</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">User</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Rating</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Status</th>
                  <th className="px-4 py-2 text-right font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {mockReviews.map((review) => (
                  <tr key={review.id}>
                    <td className="px-4 py-2 text-gray-900">{review.id}</td>
                    <td className="px-4 py-2 text-gray-900">{review.listing}</td>
                    <td className="px-4 py-2 text-gray-700">{review.user}</td>
                    <td className="px-4 py-2 text-gray-900">{"⭐".repeat(review.rating)}</td>
                    <td className="px-4 py-2">
                      <span
                        className={
                          "rounded-full px-3 py-1 text-xs font-medium " +
                          (review.status === "Published"
                            ? "bg-green-100 text-green-800"
                            : review.status === "Flagged"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800")
                        }
                      >
                        {review.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right">
                      <button className="text-xs font-medium text-gray-700 hover:text-gray-900">
                        Moderate
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-4 text-xs text-gray-500">
            You can later connect this to your reviews collection with filters and bulk actions.
          </p>
        </main>
        <Footer />
      </div>
    </>
  );
}
