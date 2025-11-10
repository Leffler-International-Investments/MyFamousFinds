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
  price: number;
  status: "Pending" | "Live" | "Rejected";
  purchase_source?: string;
  purchase_proof?: string;
  serial_number?: string;
  auth_photos?: string[];
  submittedAt?: string;
};

type Props = { items: Listing[] };

export default function ManagementListingQueue({
  items: initialItems,
}: Props) {
  const { loading } = useRequireAdmin();
  const [items, setItems] = useState(initialItems);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (loading) return <div className="min-h-screen bg-gray-50"></div>;

  const handleAction = async (
    id: string,
    action: "approve" | "reject" | "request-proof"
  ) => {
    if (actionLoading) return;
    setActionLoading(id);
    setError(null);

    try {
      const res = await fetch(`/api/admin/${action}/${id}`, {
        method: "POST",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.error || `Failed to ${action} item`);
      }

      if (action === "request-proof") {
        setItems((prev) =>
          prev.map((x) =>
            x.id === id ? { ...x, purchase_proof: "Requested" } : x
          )
        );
      } else {
        const nextStatus: Listing["status"] =
          action === "approve" ? "Live" : "Rejected";
        setItems((prev) =>
          prev.map((x) =>
            x.id === id ? { ...x, status: nextStatus } : x
          )
        );
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Something went wrong.");
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
        <main className="mx-auto max-w-full px-4 pb-16 pt-6 lg:px-8">
          <div className="mb-4 flex items-center justify-between gap-2">
            <div>
              <h1 className="text-xl font-semibold tracking-tight">
                Listing Review Queue
              </h1>
              <p className="text-sm text-gray-600">
                Pending submissions from all sellers. Check authenticity before
                approval. Your Prada bag and LV sneakers both show here when
                status is Pending.
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
                    Price
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
                    Serial #
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
                      <td className="px-4 py-2 text-gray-900">
                        {item.title}
                      </td>
                      <td className="px-4 py-2 text-gray-700">
                        {item.seller}
                      </td>
                      <td className="px-4 py-2 text-gray-700">
                        {item.price
                          ? `US$${item.price.toLocaleString("en-US")}`
                          : "—"}
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
                        {item.auth_photos && item.auth_photos.length > 0 ? (
                          <span>
                            {item.auth_photos.length} photo
                            {item.auth_photos.length > 1 ? "s" : ""}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-2 text-gray-700">
                        {item.submittedAt || "—"}
                      </td>
                      <td className="px-4 py-2 text-gray-700">
                        {item.status}
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() =>
                              handleAction(item.id, "approve")
                            }
                            disabled={
                              actionLoading === item.id ||
                              item.status === "Live"
                            }
                            className="rounded-full bg-green-600 px-3 py-1 text-xs font-semibold text-white disabled:opacity-50"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() =>
                              handleAction(item.id, "reject")
                            }
                            disabled={
                              actionLoading === item.id ||
                              item.status === "Rejected"
                            }
                            className="rounded-full bg-red-600 px-3 py-1 text-xs font-semibold text-white disabled:opacity-50"
                          >
                            Reject
                          </button>
                          <button
                            onClick={() =>
                              handleAction(item.id, "request-proof")
                            }
                            disabled={actionLoading === item.id}
                            className="rounded-full bg-yellow-500 px-3 py-1 text-xs font-semibold text-black disabled:opacity-50"
                          >
                            Request proof
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={11}
                      className="px-4 py-6 text-center text-sm text-gray-500"
                    >
                      No listings are currently pending review.
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
      .collection("listings")
      .orderBy("createdAt", "desc")
      .limit(200)
      .get();

    const all: Listing[] = snap.docs.map((doc) => {
      const d: any = doc.data() || {};
      const rawStatus = (d.status || "").toString();
      let status: Listing["status"] = "Live";
      if (/pending/i.test(rawStatus)) status = "Pending";
      else if (/reject/i.test(rawStatus)) status = "Rejected";

      return {
        id: doc.id,
        title: d.title || "Untitled listing",
        seller: d.sellerName || d.sellerDisplayName || d.sellerId || "Seller",
        category: d.category || "",
        price: Number(d.price || 0),
        status,
        purchase_source: d.purchase_source || "",
        purchase_proof: d.purchase_proof || "",
        serial_number: d.serial_number || "",
        auth_photos: d.auth_photos || [],
        submittedAt:
          d.createdAt?.toDate?.().toLocaleString("en-US") || "",
      };
    });

    const items = all.filter((i) => i.status === "Pending");
    return { props: { items } };
  } catch (err) {
    console.error("Error loading listing queue", err);
    return { props: { items: [] } };
  }
};
