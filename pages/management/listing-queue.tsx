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

  if (loading) return <div className="dashboard-page" />; // Light theme skeleton

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
      {/* Use light theme classes from globals.css */}
      <div className="dashboard-page">
        <Header />
        <main className="dashboard-main" style={{maxWidth: "100%"}}>
          {/* Use light theme classes from globals.css */}
          <div className="dashboard-header">
            <div>
              <h1>Listing Review Queue</h1>
              <p>
                Pending submissions from all sellers. Check authenticity before
                approval. Your Prada bag and LV sneakers both show here when
                status is Pending.
              </p>
            </div>
            <Link href="/management/dashboard" className="btn-primary-dark">
              ← Back to admin home
            </Link>
          </div>

          {error && (
            <div className="form-message error" style={{marginBottom: "16px"}}>
              <strong>Error:</strong> {error}
            </div>
          )}

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
                      <td>{item.title}</td>
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
                        <div className="actions-cell">
                          <button
                            onClick={() =>
                              handleAction(item.id, "approve")
                            }
                            disabled={
                              actionLoading === item.id ||
                              item.status === "Live"
                            }
                            className="btn-table btn-approve"
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
                            className="btn-table btn-reject"
                          >
                            Reject
                          </button>
                          <button
                            onClick={() =>
                              handleAction(item.id, "request-proof")
                            }
                            disabled={actionLoading === item.id}
                            className="btn-table btn-request"
                          >
                            Request proof
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={11} className="table-message">
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

      {/* Styles for the light theme table and forms */}
      <style jsx>{`
        .btn-primary-dark {
          border-radius: 999px;
          background: #111827; /* gray-900 */
          padding: 8px 16px;
          font-size: 12px;
          font-weight: 500;
          color: #ffffff;
          text-decoration: none;
          border: none;
          flex-shrink: 0;
        }
        
        .form-message {
          font-size: 14px;
          padding: 8px 12px;
          border-radius: 6px;
        }
        .form-message.error {
          background: #fee2e2; /* red-100 */
          color: #b91c1c; /* red-700 */
        }

        .table-wrapper {
          overflow-x: auto;
          border-radius: 8px;
          border: 1px solid #e5e7eb; /* gray-200 */
          background: #ffffff;
          box-shadow: 0 1px 2px 0 rgba(0,0,0,0.05);
        }
        .data-table {
          min-width: 100%;
          border-collapse: collapse;
          font-size: 14px;
        }
        .data-table thead {
          background: #f9fafb; /* gray-50 */
        }
        .data-table th {
          padding: 8px 12px;
          text-align: left;
          font-weight: 500;
          color: #374151; /* gray-700 */
        }
        .data-table tbody tr {
          border-bottom: 1px solid #f3f4f6; /* gray-100 */
        }
        .data-table tbody tr:last-child {
          border-bottom: none;
        }
        .data-table td {
          padding: 8px 12px;
          color: #111827; /* gray-900 */
          white-space: nowrap;
        }
        .data-table td:first-child {
          font-weight: 500;
        }
        .table-message {
          padding: 24px;
          text-align: center;
          color: #6b7280; /* gray-500 */
        }

        .actions-cell {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .btn-table {
          border-radius: 999px;
          padding: 4px 12px;
          font-size: 12px;
          font-weight: 600;
          border: none;
          cursor: pointer;
          white-space: nowrap;
        }
        .btn-table:disabled {
          opacity: 0.5;
        }
        .btn-approve {
          background: #059669; /* green-600 */
          color: white;
        }
        .btn-reject {
          background: #dc2626; /* red-600 */
          color: white;
        }
        .btn-request {
          background: #f59e0b; /* yellow-500 */
          color: black;
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
