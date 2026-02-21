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
  const [counterOfferId, setCounterOfferId] = useState<string | null>(null);
  const [counterAmount, setCounterAmount] = useState("");

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

  const handleCounter = async (id: string) => {
    const amount = Number(counterAmount);
    if (!amount || amount <= 0) {
      setError("Please enter a valid counter amount.");
      return;
    }
    setActionLoading(id);
    setError(null);
    try {
      const res = await sellerFetch(`/api/offers/counter/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ counterAmount: amount }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Failed to counter offer");
      setOffers((prev) =>
        prev.map((o) => (o.id === id ? { ...o, status: "countered" } : o))
      );
      setCounterOfferId(null);
      setCounterAmount("");
    } catch (err: any) {
      setError(err?.message || "Counter offer failed.");
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
            <Link href="/seller/dashboard">← Back to Dashboard</Link>
          </div>

          {error && (
            <div style={{ background: "#fee2e2", color: "#991b1b", padding: "10px 16px", borderRadius: 8, marginBottom: 16 }}>
              <strong>Error:</strong> {error}
            </div>
          )}

          <h2 style={{ fontSize: 18, marginBottom: 12 }}>Pending Offers ({pending.length})</h2>

          {/* DESKTOP: Pending offers table */}
          <div className="table-wrapper desktop-table">
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
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          <button
                            onClick={() => handleAction(o.id, "accept")}
                            disabled={actionLoading === o.id}
                            className="btn-accept"
                          >
                            {actionLoading === o.id ? "..." : "Accept"}
                          </button>
                          <button
                            onClick={() => {
                              setCounterOfferId(counterOfferId === o.id ? null : o.id);
                              setCounterAmount("");
                            }}
                            disabled={actionLoading === o.id}
                            className="btn-counter"
                          >
                            Counter
                          </button>
                          <button
                            onClick={() => handleAction(o.id, "reject")}
                            disabled={actionLoading === o.id}
                            className="btn-reject"
                          >
                            {actionLoading === o.id ? "..." : "Decline"}
                          </button>
                        </div>
                        {counterOfferId === o.id && (
                          <div style={{ display: "flex", gap: 6, marginTop: 6, alignItems: "center" }}>
                            <input
                              type="number"
                              min="1"
                              step="1"
                              value={counterAmount}
                              onChange={(e) => setCounterAmount(e.target.value)}
                              placeholder={`Counter (${o.currency})`}
                              style={{ width: 110, padding: "5px 8px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 13 }}
                            />
                            <button
                              onClick={() => handleCounter(o.id)}
                              disabled={actionLoading === o.id}
                              className="btn-accept"
                              style={{ padding: "5px 12px" }}
                            >
                              Send
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* MOBILE: Pending offers cards */}
          <div className="mobile-cards">
            {pending.length === 0 ? (
              <p className="mobile-empty">No pending offers</p>
            ) : (
              pending.map((o) => (
                <div key={o.id} className="mobile-offer-card">
                  <div className="mobile-offer-header">
                    <div>
                      <div className="mobile-offer-title">{o.listingTitle}</div>
                      <div className="mobile-offer-brand">{o.listingBrand || ""}</div>
                    </div>
                    <div className="mobile-offer-amount">
                      ${o.offerAmount.toLocaleString()} {o.currency}
                    </div>
                  </div>

                  <div className="mobile-offer-rows">
                    <div className="mobile-offer-row">
                      <span className="m-label">Buyer</span>
                      <span className="m-value">{o.buyerEmail || "—"}</span>
                    </div>
                    {o.message && (
                      <div className="mobile-offer-row">
                        <span className="m-label">Message</span>
                        <span className="m-value m-message">{o.message}</span>
                      </div>
                    )}
                    <div className="mobile-offer-row">
                      <span className="m-label">Date</span>
                      <span className="m-value">{o.createdAt}</span>
                    </div>
                  </div>

                  <div className="mobile-offer-actions">
                    <button
                      onClick={() => handleAction(o.id, "accept")}
                      disabled={actionLoading === o.id}
                      className="btn-accept"
                    >
                      {actionLoading === o.id ? "..." : "Accept"}
                    </button>
                    <button
                      onClick={() => {
                        setCounterOfferId(counterOfferId === o.id ? null : o.id);
                        setCounterAmount("");
                      }}
                      disabled={actionLoading === o.id}
                      className="btn-counter"
                    >
                      Counter
                    </button>
                    <button
                      onClick={() => handleAction(o.id, "reject")}
                      disabled={actionLoading === o.id}
                      className="btn-reject"
                    >
                      {actionLoading === o.id ? "..." : "Decline"}
                    </button>
                  </div>
                  {counterOfferId === o.id && (
                    <div className="mobile-counter-row">
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={counterAmount}
                        onChange={(e) => setCounterAmount(e.target.value)}
                        placeholder={`Counter (${o.currency})`}
                        className="mobile-counter-input"
                      />
                      <button
                        onClick={() => handleCounter(o.id)}
                        disabled={actionLoading === o.id}
                        className="btn-accept"
                      >
                        Send
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {resolved.length > 0 && (
            <>
              <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 12 }}>Past Offers ({resolved.length})</h2>

              {/* DESKTOP: Past offers table */}
              <div className="table-wrapper desktop-table">
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
                          <span className={o.status === "accepted" ? "badge-accepted" : o.status === "countered" ? "badge-countered" : "badge-rejected"}>
                            {o.status}
                          </span>
                        </td>
                        <td style={{ fontSize: 12, whiteSpace: "nowrap" }}>{o.createdAt}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* MOBILE: Past offers cards */}
              <div className="mobile-cards">
                {resolved.map((o) => (
                  <div key={o.id} className="mobile-offer-card">
                    <div className="mobile-offer-header">
                      <div>
                        <div className="mobile-offer-title">{o.listingTitle}</div>
                        <div className="mobile-offer-brand">{o.listingBrand || ""}</div>
                      </div>
                      <div className="mobile-offer-amount">
                        ${o.offerAmount.toLocaleString()} {o.currency}
                      </div>
                    </div>
                    <div className="mobile-offer-rows">
                      <div className="mobile-offer-row">
                        <span className="m-label">Buyer</span>
                        <span className="m-value">{o.buyerEmail || "—"}</span>
                      </div>
                      <div className="mobile-offer-row">
                        <span className="m-label">Status</span>
                        <span className="m-value">
                          <span className={o.status === "accepted" ? "badge-accepted" : o.status === "countered" ? "badge-countered" : "badge-rejected"}>
                            {o.status}
                          </span>
                        </span>
                      </div>
                      <div className="mobile-offer-row">
                        <span className="m-label">Date</span>
                        <span className="m-value">{o.createdAt}</span>
                      </div>
                    </div>
                  </div>
                ))}
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
        .btn-counter {
          background: #f59e0b;
          color: #fff;
          border: none;
          border-radius: 999px;
          padding: 6px 16px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
        }
        .btn-counter:hover:not(:disabled) { background: #d97706; }
        .badge-countered {
          display: inline-block;
          border-radius: 999px;
          padding: 2px 8px;
          font-size: 12px;
          font-weight: 500;
          background: #fef3c7;
          color: #92400e;
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

        /* ---- Desktop / Mobile toggle ---- */
        .mobile-cards { display: none; }

        @media (max-width: 700px) {
          .desktop-table { display: none; }
          .mobile-cards { display: block; }
        }

        /* ---- Mobile card styles ---- */
        .mobile-empty {
          text-align: center;
          color: #6b7280;
          padding: 24px 16px;
          font-size: 14px;
          background: #fff;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
        }

        .mobile-offer-card {
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 12px;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }

        .mobile-offer-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
          padding-bottom: 10px;
          border-bottom: 1px solid #f3f4f6;
        }

        .mobile-offer-title {
          font-weight: 600;
          font-size: 14px;
          color: #111827;
        }

        .mobile-offer-brand {
          font-size: 12px;
          color: #6b7280;
          margin-top: 2px;
        }

        .mobile-offer-amount {
          font-weight: 700;
          font-size: 14px;
          color: #111827;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .mobile-offer-rows {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding: 10px 0;
        }

        .mobile-offer-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
        }

        .m-label {
          font-size: 11px;
          text-transform: uppercase;
          color: #6b7280;
          font-weight: 600;
          flex-shrink: 0;
        }

        .m-value {
          font-size: 13px;
          color: #111827;
          text-align: right;
          word-break: break-word;
        }

        .m-message {
          font-size: 12px;
          color: #6b7280;
          max-width: 65%;
        }

        .mobile-offer-actions {
          display: flex;
          gap: 8px;
          padding-top: 10px;
          border-top: 1px solid #f3f4f6;
        }

        .mobile-offer-actions .btn-accept,
        .mobile-offer-actions .btn-counter,
        .mobile-offer-actions .btn-reject {
          flex: 1;
          text-align: center;
          padding: 8px 8px;
          font-size: 12px;
        }

        .mobile-counter-row {
          display: flex;
          gap: 8px;
          align-items: center;
          margin-top: 8px;
        }

        .mobile-counter-input {
          flex: 1;
          padding: 7px 10px;
          border-radius: 8px;
          border: 1px solid #d1d5db;
          font-size: 13px;
        }
      `}</style>
    </>
  );
}
