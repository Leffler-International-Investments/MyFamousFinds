// FILE: /pages/management/listing-queue.tsx
import Head from "next/head";
import Link from "next/link";
import { GetServerSideProps } from "next";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { adminDb } from "../../utils/firebaseAdmin";
import { useRequireAdmin } from "../../hooks/useRequireAdmin";
import { useState } from "react"; // <-- ADDED

type Listing = {
  id: string;
  title: string;
  seller: string;
  category: string;
  purchase_source?: string;
  purchase_proof?: string;
  serial_number?: string;
  auth_photos?: string;
  submittedAt: string;
  status: string;
};

type Props = {
  items: Listing[];
};

export default function ManagementListingQueue({ items: initialItems }: Props) {
  const { loading } = useRequireAdmin();
  
  // --- ADDED: State to manage items and loading status ---
  const [items, setItems] = useState<Listing[]>(initialItems);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (loading) return null;

  // --- ADDED: Handle Approve/Reject ---
  const handleAction = async (id: string, action: "approve" | "reject") => {
    if (actionLoading) return; // Prevent simultaneous actions
    setActionLoading(id);
    setError(null);

    try {
      const res = await fetch(`/api/admin/${action}/${id}`, {
        method: "POST",
      });
      
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || `Failed to ${action} item`);
      }
      
      // Success: Remove the item from the local list
      setItems((prevItems) => prevItems.filter((item) => item.id !== id));

    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const hasAny = items.length > 0;

  return (
    <>
      <Head>
        <title>Listing Review Queue — Admin</title>
      </Head>
      <div className="min-h-screen bg-gray-50 text-gray-900">
        <Header />
        <main className="mx-auto max-w-7xl px-4 pb-16 pt-6"> {/* Widened container */}
          <div className="mb-4 flex items-center justify-between gap-2">
            <div>
              <h1 className="text-xl font-semibold tracking-tight">
                Listing review queue
              </h1>
              <p className="text-sm text-gray-600">
                Pending submissions from open-market / casual sellers. Check
                authenticity notes before approval.
              </p>
            </div>
            <Link
              href="/management/dashboard" // <-- Corrected link
              className="rounded-full bg-gray-900 px-4 py-2 text-xs font-medium text-white"
            >
              ← Back to admin home
            </Link>
          </div>
          
          {/* --- ADDED: Error message display --- */}
          {error && (
            <div className="mb-4 rounded-md bg-red-100 p-3 text-sm text-red-700">
              <strong>Error:</strong> {error}
            </div>
          )}

          <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">
                    Listing
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">
                    Seller
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">
                    Category
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">
                    Purchased From
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">
                    Proof
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">
                    Serial
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">
                    Proof Docs
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">
                    Submitted
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">
                    Status
                  </th>
                  {/* --- ADDED: Actions Header --- */}
                  <th className="px-4 py-2 text-left font-medium text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {hasAny ? (
                  items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-2 text-gray-900">{item.title}</td>
                      <td className="px-4 py-2 text-gray-700">
                        {item.seller}
                      </td>
                      <td className="px-4 py-2 text-gray-700">
                        {item.category || "—"}
                      </td>
                      <td className="px-4 py-2 text-gray-700">
                        {item.purchase_source || "—"}
                      </td>
                      <td className="px-4 py-2 text-gray-700">
                        {item.purchase_proof || "—"}
                      </td>
                      <td className="px-4 py-2 text-gray-700">
                        {item.serial_number || "—"}
                      </td>
                      <td className="px-4 py-2 text-gray-700">
                        {item.auth_photos ? (
                          <a
                            href={item.auth_photos}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            View
                          </a>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-2 text-gray-700">
                        {item.submittedAt || "—"}
                      </td>
                      <td className="px-4 py-2">
                        <span
                          className={
                            "rounded-full px-3 py-1 text-xs font-medium " +
                            (item.status === "Pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : item.status === "Rejected"
                              ? "bg-red-100 text-red-800"
                              : "bg-green-100 text-green-800")
                          }
                        >
                          {item.status}
                        </span>
                      </td>
                      {/* --- ADDED: Action Buttons --- */}
                      <td className="px-4 py-2">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAction(item.id, "approve")}
                            disabled={actionLoading === item.id}
                            className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800 hover:bg-green-200 disabled:opacity-50"
                          >
                            {actionLoading === item.id ? "..." : "Approve"}
                          </button>
                          <button
                            onClick={() => handleAction(item.id, "reject")}
                            disabled={actionLoading === item.id}
                            className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-800 hover:bg-red-200 disabled:opacity-50"
                          >
                            {actionLoading === item.id ? "..." : "Reject"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={10} // <-- Increased colspan
                      className="px-4 py-6 text-center text-sm text-gray-500"
                    >
                      No listings awaiting review.
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
// ... (formatDate function is unchanged) ...
function formatDate(ts: any): string {
  try {
    if (!ts) return "";
    const d =
      typeof ts.toDate === "function"
        ? ts.toDate()
        : ts instanceof Date
        ? ts
        : null;
    if (!d) return "";
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
      d.getDate()
    )}`;
  } catch {
    return "";
  }
}

// ... (getServerSideProps is unchanged) ...
export const getServerSideProps: GetServerSideProps<Props> = async () => {
  try {
    // Reuse the listings collection and filter to "pending" in JS
    const snap = await adminDb
      .collection("listings")
      .orderBy("createdAt", "desc")
      .limit(200)
      .get();

    const all: Listing[] = snap.docs.map((doc) => {
      const d: any = doc.data() || {};
      const rawStatus = (d.status || "").toString();
      let status: string = "Live";
      if (/pending/i.test(rawStatus)) status = "Pending";
      else if (/reject/i.test(rawStatus)) status = "Rejected";

      return {
        id: doc.id,
        title: d.title || "Untitled listing",
        seller: d.sellerName || d.sellerDisplayName || d.sellerId || "Seller",
        category: d.categoryName || d.category || "",
        purchase_source: d.purchase_source || "",
        purchase_proof: d.purchase_proof || "",
        serial_number: d.serial_number || "",
        auth_photos: d.auth_photos || "",
        submittedAt: formatDate(d.createdAt),
        status,
      };
    });

    const items = all.filter((i) => i.status === "Pending");

    return { props: { items } };
  } catch (err) {
    console.error("Error loading listing queue", err);
    return { props: { items: [] } };
  }
};
