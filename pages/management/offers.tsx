// FILE: /pages/management/offers.tsx
import Head from "next/head";
import Link from "next/link";
import type { GetServerSideProps } from "next";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { adminDb } from "../../utils/firebaseAdmin";
import { useRequireAdmin } from "../../hooks/useRequireAdmin";
import { useState } from "react";

type Offer = {
  id: string;
  listingTitle: string;
  listingBrand: string;
  buyerEmail: string;
  sellerId: string;
  offerAmount: number;
  currency: string;
  message: string;
  status: string;
  createdAt: string;
};

type Props = { offers: Offer[] };

export default function ManagementOffers({ offers: initial }: Props) {
  const { loading } = useRequireAdmin();
  const [offers, setOffers] = useState(initial);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (loading) return <div className="dashboard-page" />;

  const handleAction = async (id: string, action: "accept" | "reject") => {
    if (actionLoading) return;
    setActionLoading(id);
    setError(null);

    try {
      const res = await fetch(`/api/offers/${action}/${id}`, { method: "POST" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || `Failed to ${action} offer`);

      setOffers((prev) =>
        prev.map((o) => (o.id === id ? { ...o, status: action === "accept" ? "accepted" : "rejected" } : o))
      );
    } catch (err: any) {
      setError(err?.message || "Something went wrong.");
    } finally {
      setActionLoading(null);
    }
  };

  const pending = offers.filter((o) => o.status === "pending");
  const resolved = offers.filter((o) => o.status !== "pending");

  return (
    <>
      <Head>
        <title>Offers — Admin</title>
      </Head>

      <div className="dashboard-page">
        <Header />
        <main className="dashboard-main" style={{ maxWidth: "100%" }}>
          <div className="dashboard-header">
            <div>
              <h1>All Offers</h1>
              <p>View and manage buyer offers. Accept or reject on behalf of sellers.</p>
            </div>
            <Link href="/management/dashboard">← Back to Dashboard</Link>
          </div>

          {error && (
            <div style={{ background: "#fee2e2", color: "#991b1b", padding: "10px 16px", borderRadius: 8, marginBottom: 16 }}>
              <strong>Error:</strong> {error}
            </div>
          )}

          <h2 style={{ fontSize: 18, marginBottom: 12 }}>Pending Offers ({pending.length})</h2>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Brand</th>
                  <th>Buyer</th>
                  <th>Offer</th>
                  <th>Message</th>
                  <th>Seller</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pending.length === 0 ? (
                  <tr><td colSpan={8} className="table-message">No pending offers</td></tr>
                ) : (
                  pending.map((o) => (
                    <tr key={o.id}>
                      <td style={{ fontWeight: 500 }}>{o.listingTitle}</td>
                      <td>{o.listingBrand || "—"}</td>
                      <td>{o.buyerEmail || "—"}</td>
                      <td style={{ fontWeight: 600 }}>${o.offerAmount.toLocaleString()} {o.currency}</td>
                      <td style={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis" }}>{o.message || "—"}</td>
                      <td style={{ fontSize: 12, color: "#6b7280" }}>{o.sellerId || "—"}</td>
                      <td style={{ fontSize: 12, whiteSpace: "nowrap" }}>{o.createdAt}</td>
                      <td>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            onClick={() => handleAction(o.id, "accept")}
                            disabled={actionLoading === o.id}
                            style={{ background: "#16a34a", color: "#fff", border: "none", borderRadius: 999, padding: "4px 12px", fontSize: 12, cursor: "pointer" }}
                          >
                            {actionLoading === o.id ? "..." : "Accept"}
                          </button>
                          <button
                            onClick={() => handleAction(o.id, "reject")}
                            disabled={actionLoading === o.id}
                            style={{ background: "#dc2626", color: "#fff", border: "none", borderRadius: 999, padding: "4px 12px", fontSize: 12, cursor: "pointer" }}
                          >
                            {actionLoading === o.id ? "..." : "Reject"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {resolved.length > 0 && (
            <>
              <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 12 }}>Resolved Offers ({resolved.length})</h2>
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Brand</th>
                      <th>Buyer</th>
                      <th>Offer</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resolved.map((o) => (
                      <tr key={o.id}>
                        <td>{o.listingTitle}</td>
                        <td>{o.listingBrand || "—"}</td>
                        <td>{o.buyerEmail || "—"}</td>
                        <td>${o.offerAmount.toLocaleString()} {o.currency}</td>
                        <td>
                          <span style={{
                            display: "inline-block",
                            borderRadius: 999,
                            padding: "2px 8px",
                            fontSize: 12,
                            fontWeight: 500,
                            background: o.status === "accepted" ? "#d1fae5" : "#fee2e2",
                            color: o.status === "accepted" ? "#065f46" : "#991b1b",
                          }}>
                            {o.status}
                          </span>
                        </td>
                        <td style={{ fontSize: 12, whiteSpace: "nowrap" }}>{o.createdAt}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </main>
        <Footer />
      </div>

      <style jsx>{`
        .table-wrapper {
          overflow-x: auto;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
          background: #fff;
          box-shadow: 0 1px 2px 0 rgba(0,0,0,0.05);
        }
        .data-table {
          min-width: 100%;
          border-collapse: collapse;
          font-size: 14px;
        }
        .data-table thead { background: #f9fafb; }
        .data-table th {
          padding: 10px 12px;
          text-align: left;
          font-weight: 600;
          color: #374151;
          white-space: nowrap;
        }
        .data-table tbody tr { border-bottom: 1px solid #f3f4f6; }
        .data-table td { padding: 10px 12px; color: #111827; }
        .table-message { padding: 24px; text-align: center; color: #6b7280; }
      `}</style>
    </>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async () => {
  if (!adminDb) return { props: { offers: [] } };

  try {
    const snap = await adminDb
      .collection("offers")
      .limit(200)
      .get();

    const offers: Offer[] = snap.docs.map((doc) => {
      const d: any = doc.data() || {};
      return {
        id: doc.id,
        listingTitle: String(d.listingTitle || "Untitled"),
        listingBrand: String(d.listingBrand || ""),
        buyerEmail: String(d.buyerEmail || ""),
        sellerId: String(d.sellerId || ""),
        offerAmount: Number(d.offerAmount || d.offerPrice || 0),
        currency: String(d.currency || "USD"),
        message: String(d.message || ""),
        status: String(d.status || "pending"),
        createdAt: d.createdAt?.toDate?.().toLocaleString("en-US") || "",
      };
    });

    offers.sort((a, b) => {
      if (!a.createdAt && !b.createdAt) return 0;
      if (!a.createdAt) return 1;
      if (!b.createdAt) return -1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return { props: { offers } };
  } catch (err) {
    console.error("Error loading offers", err);
    return { props: { offers: [] } };
  }
};
