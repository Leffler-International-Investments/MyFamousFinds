// FILE: /pages/management/listing-queue.tsx
import Head from "next/head";
import Link from "next/link";
import type { GetServerSideProps } from "next";
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

function ManagementListingQueue({ items: initialItems }: Props) {
  const { loading } = useRequireAdmin();
  const [items, setItems] = useState(initialItems);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (loading) return <div className="dashboard-page" />;

  const handleAction = async (
    id: string,
    action: "approve" | "reject" | "request-proof" | "delete"
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
        // Only update the proof column
        setItems((prev) =>
          prev.map((x) =>
            x.id === id ? { ...x, purchase_proof: "Requested" } : x
          )
        );
      } else if (action === "delete") {
        // Remove from table completely
        setItems((prev) => prev.filter((x) => x.id !== id));
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
        <main className="dashboard-main" style={{ maxWidth: "100%" }}>
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
              ← Back to Management Dashboard
            </Link>
          </div>

          {error && (
            <div
              className="form-message error"
              style={{ marginBottom: "16px" }}
            >
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
                        {item.auth_photos && item.auth_photos.length > 0
                          ? `${item.auth_photos.length} photo${
                              item.auth_photos.length > 1 ? "s" : ""
                            }`
                          : "—"}
                      </td>
                      <td>{item.submittedAt || "—"}</td>
                      <td>{item.status}</td>
                      <td>
                        <div className="table-actions">
                          <Link
                            href={`/product/${item.id}`}
                            className="btn-table btn-view"
                          >
                            View
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleAction(item.id, "approve")}
                            disabled={actionLoading === item.id}
                            className="btn-table btn-approve"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAction(item.id, "reject")}
                            disabled={actionLoading === item.id}
                            className="btn-table btn-reject"
                          >
                            Reject
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleAction(item.id, "request-proof")
                            }
                            disabled={actionLoading === item.id}
                            className="btn-table btn-request"
                          >
                            Request proof
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (
                                window.confirm(
                                  "Delete this listing permanently?"
                                )
                              ) {
                                handleAction(item.id, "delete");
                              }
                            }}
                            disabled={actionLoading === item.id}
                            className="btn-table btn-delete"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={11} className="table-message">
                      No pending listings – go enjoy a coffee ☕
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </main>

        <Footer />
      </div>

      <style jsx>{`
        .table-wrapper {
          margin-top: 24px;
          overflow-x: auto;
        }
        .data-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 14px;
        }
        .data-table th,
        .data-table td {
          padding: 10px 12px;
          border-bottom: 1px solid #e5e7eb;
          text-align: left;
        }
        .data-table thead th {
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          color: #6b7280;
          background: #f9fafb;
        }
        .table-message {
          text-align: center;
          padding: 24px;
          color: #6b7280;
        }
        .table-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        .btn-table {
          border-radius: 999px;
          padding: 4px 10px;
          border: none;
          font-size: 12px;
          cursor: pointer;
          white-space: nowrap;
        }
        .btn-view {
          background: #111827;
          color: #ffffff;
          text-decoration: none;
        }
        .btn-approve {
          background: #16a34a;
          color: white;
        }
        .btn-reject {
          background: #dc2626;
          color: white;
        }
        .btn-request {
          background: #f59e0b;
          color: black;
        }
        .btn-delete {
          background: #4b5563;
          color: #f9fafb;
        }
      `}</style>
    </>
  );
}

export default ManagementListingQueue;

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
