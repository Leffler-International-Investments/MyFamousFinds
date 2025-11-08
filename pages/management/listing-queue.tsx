// FILE: /pages/management/listing-queue.tsx
import Head from "next/head";
import Link from "next/link";
import { GetServerSideProps } from "next";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { adminDb } from "../../utils/firebaseAdmin";
import { useRequireAdmin } from "../../hooks/useRequireAdmin";
import { useState } from "react"; 

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
  proofRequested?: boolean; // <-- ADDED
};

type Props = {
  items: Listing[];
};

export default function ManagementListingQueue({ items: initialItems }: Props) {
  const { loading } = useRequireAdmin();
  
  const [items, setItems] = useState<Listing[]>(initialItems);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (loading) return null;

  const handleAction = async (id: string, action: "approve" | "reject" | "request-proof") => {
    if (actionLoading) return;
    setActionLoading(id);
    setError(null);

    try {
      // --- UPDATED: Use the correct API path for each action ---
      const res = await fetch(`/api/admin/${action}/${id}`, {
        method: "POST",
      });
      
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || `Failed to ${action} item`);
      }
      
      // Success: Remove the item from the local list
      if (action === "approve" || action === "reject") {
        setItems((prevItems) => prevItems.filter((item) => item.id !== id));
      } else {
        // For "request-proof", just update the item's state locally
        setItems((prevItems) => 
          prevItems.map((item) =>
            item.id === id ? { ...item, proofRequested: true } : item
          )
        );
      }

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
        <main className="mx-auto max-w-7xl px-4 pb-16 pt-6">
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
              href="/management/dashboard" 
              className="rounded-full bg-gray-900 px-4 py-2 text-xs font-medium text-white"
            >
              ← Back to admin home
            </Link>
          </div>
          
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
                            (item.status === "Pending" && !item.proofRequested
                              ? "bg-yellow-100 text-yellow-800"
                              : item.status === "Pending" && item.proofRequested
                              ? "bg-blue-100 text-blue-800" // <-- ADDED for requested proof
                              : item.status === "Rejected"
                              ? "bg-red-100 text-red-800"
                              : "bg-green-100 text-green-800")
                          }
                        >
                          {/* --- UPDATED: Show "Proof Requested" --- */}
                          {item.status === "Pending" && item.proofRequested 
                            ? "Proof Requested" 
                            : item.status
                          }
                        </span>
                      </td>
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
                          {/* --- ADDED: Request Proof Button --- */}
                          <button
                            onClick={() => handleAction(item.id, "request-proof")}
                            disabled={actionLoading === item.id || item.proofRequested}
                            className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800 hover:bg-blue-200 disabled:opacity-50"
                          >
                            {actionLoading === item.id ? "..." : (item.proofRequested ? "Sent" : "Request Proof")}
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

// ... (getServerSideProps is unchanged, but we add 'proofRequested') ...
export const getServerSideProps: GetServerSideProps<Props> = async () => {
  try {
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
        proofRequested: d.proofRequested || false, // <-- ADDED
      };
    });

    const items = all.filter((i) => i.status === "Pending");

    return { props: { items } };
  } catch (err) {
    console.error("Error loading listing queue", err);
    return { props: { items: [] } };
  }
};
