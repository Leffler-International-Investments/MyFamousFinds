// FILE: /pages/seller/offers.tsx
import Head from "next/head";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useRequireSeller } from "../../hooks/useRequireSeller";
import { sellerFetch } from "../../utils/sellerClient";
import { useEffect, useState } from "react";

type Offer = {
  id: string;
  listingTitle: string;
  listingBrand: string;
  buyerEmail: string;
  offerAmount: number;
  currency: string;
  message: string;
  status: string;
  createdAt: string;
};

export default function SellerOffers() {
  const { loading: authLoading } = useRequireSeller();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    sellerFetch("/api/seller/offers")
      .then((r) => r.json())
      .then((json) => {
        if (json?.offers) setOffers(json.offers);
        else setError(json?.error || "Failed to load offers");
      })
      .catch(() => setError("Failed to load offers"))
      .finally(() => setLoading(false));
  }, [authLoading]);

  const handleAction = async (id: string, action: "accept" | "reject") => {
    if (actionLoading) return;
    const confirmed =
      action === "accept"
        ? window.confirm("Accept this offer?")
        : window.confirm("Reject this offer?");
    if (!confirmed) return;

    setActionLoading(id);
    setError(null);

    try {
      const res = await sellerFetch(`/api/offers/${action}/${id}`, { method: "POST" });
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

  if (authLoading || loading) return <div className="dashboard-page"><Header /><main className="dashboard-main"><p>Loading...</p></main><Footer /></div>;

  const pending = offers.filter((o) => o.status === "pending");
  const resolved = offers.filter((o) => o.status !== "pending");

  return (
    <>
      <Head>
        <title>Offers — Seller Dashboard</title>
      </Head>

      <div className="dashboard-page">
        <Header />
        <main className="dashboard-main" style={{ maxWidth: "100%" }}>
          <div className="dashboard-header">
            <div>
              <h1>Your Offers</h1>
              <p>Buyer offers on your listings. Accept or decline each offer.</p>
            </div>
            <Link href="/seller/catalogue">← Back to Catalogue</Link>
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
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pending.length === 0 ? (
                  <tr><td colSpan={7} style={{ padding: 24, textAlign: "center", color: "#6b7280" }}>No pending offers</td></tr>
                ) : (
                  pending.map((o) => (
                    <tr key={o.id}>
                      <td style={{ fontWeight: 500 }}>{o.listingTitle}</td>
                      <td>{o.listingBrand || "—"}</td>
                      <td>{o.buyerEmail || "—"}</td>
                      <td style={{ fontWeight: 600 }}>${o.offerAmount.toLocaleString()} {o.currency}</td>
                      <td style={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis" }}>{o.message || "—"}</td>
                      <td style={{ fontSize: 12, whiteSpace: "nowrap" }}>{o.createdAt}</td>
                      <td>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            onClick={() => handleAction(o.id, "accept")}
                            disabled={actionLoading === o.id}
                            className="btn-accept"
                          >
                            {actionLoading === o.id ? "..." : "Accept"}
                          </button>
                          <button
                            onClick={() => handleAction(o.id, "reject")}
                            disabled={actionLoading === o.id}
                            className="btn-reject"
                          >
                            {actionLoading === o.id ? "..." : "Decline"}
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
              <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 12 }}>Past Offers ({resolved.length})</h2>
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
                          <span className={o.status === "accepted" ? "badge-accepted" : "badge-rejected"}>
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
        .btn-accept {
          background: #16a34a;
          color: #fff;
          border: none;
          border-radius: 999px;
          padding: 6px 16px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
        }
        .btn-accept:hover:not(:disabled) { background: #15803d; }
        .btn-reject {
          background: #dc2626;
          color: #fff;
          border: none;
          border-radius: 999px;
          padding: 6px 16px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
        }
        .btn-reject:hover:not(:disabled) { background: #b91c1c; }
        .badge-accepted {
          display: inline-block;
          border-radius: 999px;
          padding: 2px 8px;
          font-size: 12px;
          font-weight: 500;
          background: #d1fae5;
          color: #065f46;
        }
        .badge-rejected {
          display: inline-block;
          border-radius: 999px;
          padding: 2px 8px;
          font-size: 12px;
          font-weight: 500;
          background: #fee2e2;
          color: #991b1b;
        }
      `}</style>
    </>
  );
}
