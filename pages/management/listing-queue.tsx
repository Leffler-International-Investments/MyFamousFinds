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
  const { loading } } = useRequireAdmin();
  const [items, setItems] = useState(initialItems);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (loading) return <div className="dashboard-page"></div>;

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
      <div className="dashboard-page">
        <Header />
        <main className="dashboard-main">
          <div className="dashboard-header">
            <div>
              <h1>Listing Review Queue</h1>
              <p>
                Pending submissions from all sellers. Check authenticity before
                approval.
              </p>
            </div>
            <Link
              href="/management/dashboard"
              className="action-button-dark"
            >
              ← Back to admin home
            </Link>
          </div>

          <section className="dashboard-section">
            {error && <div className="error-message">{error}</div>}

            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Listing</th>
                    <th>Seller</th>
                    <th>Price</th>
                    <th>Category</th>
                    <th>Purchased From</th>
                    <th>Proof</th>
                    <th>Serial #</th>
                    <th>Proof Docs</th>
                    <th>Submitted</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {hasAny ? (
                    items.map((item) => (
                      <tr key={item.id}>
                        <td className="font-medium">{item.title}</td>
                        <td>{item.seller}</td>
                        <td>
                          {item.price
                            ? `US$${item.price.toLocaleString("en-US")}`
                            : "—"}
                        </td>
                        <td>{item.category || "—"}</td>
                        <td>{item.purchase_source || "—"}</td>
                        <td>{item.purchase_proof || "—"}</td>
                        <td>{item.serial_number || "—"}</td>
                        <td>
                          {item.auth_photos && item.auth_photos.length > 0 ? (
                            <span>
                              {item.auth_photos.length} photo
                              {item.auth_photos.length > 1 ? "s" : ""}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td>{item.submittedAt || "—"}</td>
                        <td>{item.status}</td>
                        <td>
                          <div className="action-buttons">
                            <button
                              onClick={() =>
                                handleAction(item.id, "approve")
                              }
                              disabled={
                                actionLoading === item.id ||
                                item.status === "Live"
                              }
                              className="action-button button-approve"
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
                              className="action-button button-reject"
                            >
                              Reject
                            </button>
                            <button
                              onClick={() =>
                                handleAction(item.id, "request-proof")
                              }
                              disabled={actionLoading === item.id}
                              className="action-button button-request"
                            >
                              Request proof
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={11} className="text-center">
                        No listings are currently pending review.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </main>
        <Footer />
      </div>

      <style jsx>{`
        .action-button-dark {
          border-radius: 999px;
          background-color: #1f2937; /* gray-800 */
          color: #f9fafb; /* gray-50 */
          padding: 8px 16px;
          font-size: 12px;
          font-weight: 500;
          text-decoration: none;
          white-space: nowrap;
        }
        .action-button-dark:hover {
          background-color: #111827; /* gray-900 */
        }
        .error-message {
          margin-bottom: 16px;
          border-radius: 6px;
          background-color: #fee2e2; /* red-100 */
          padding: 12px;
          font-size: 14px;
          color: #991b1b; /* red-800 */
          border: 1px solid #fca5a5; /* red-400 */
        }
        .table-wrapper {
          overflow-x: auto;
          width: 100%;
          border: 1px solid #e5e7eb; /* gray-200 */
          border-radius: 8px;
        }
        .data-table {
          width: 100%;
          min-width: 1000px;
          font-size: 14px;
          border-collapse: collapse;
        }
        .data-table thead {
          background-color: #f9fafb; /* gray-50 */
        }
        .data-table th,
        .data-table td {
          padding: 10px 14px;
          text-align: left;
          border-bottom: 1px solid #e5e7eb; /* gray-200 */
          white-space: nowrap;
        }
        .data-table th {
          font-weight: 600;
          color: #374151; /* gray-700 */
          font-size: 12px;
          text-transform: uppercase;
        }
        .data-table td {
          color: #4b5563; /* gray-600 */
          vertical-align: top;
          padding-top: 12px;
          padding-bottom: 12px;
        }
        .data-table td.font-medium {
          font-weight: 500;
          color: #111827; /* gray-900 */
        }
        .data-table tbody tr:last-child td {
          border-bottom: none;
        }
        .text-center {
          text-align: center;
          padding: 24px;
          color: #6b7280; /* gray-500 */
        }
        .action-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .action-button {
          border-radius: 999px;
          padding: 4px 12px;
          font-size: 12px;
          font-weight: 500;
          border: none;
          cursor: pointer;
          white-space: nowrap;
        }
        .action-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .button-approve {
          background-color: #16a34a; /* green-600 */
          color: white;
        }
        .button-approve:hover:not(:disabled) {
          background-color: #15803d; /* green-700 */
        }
        .button-reject {
          background-color: #dc2626; /* red-600 */
          color: white;
        }
        .button-reject:hover:not(:disabled) {
          background-color: #b91c1c; /* red-700 */
        }
        .button-request {
          background-color: #facc15; /* yellow-400 */
          color: #422006; /* yellow-900 */
        }
        .button-request:hover:not(:disabled) {
          background-color: #eab308; /* yellow-500 */
        }
      `}</style>
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
