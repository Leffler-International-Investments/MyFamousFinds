// FILE: /pages/seller/orders.tsx

import Head from "next/head";
import Link from "next/link";
import { useEffect, useState } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import useRequireSeller from "../../hooks/useRequireSeller";

type OrderRow = {
  id: string;
  item: string;
  buyer: string;
  total: string;
  status: string;
  createdAt?: string;
  shippingAddress?: {
    name?: string;
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  } | null;
  fulfillment?: { stage?: string; signatureRequired?: boolean } | null;
  shipping?: { carrier?: string; trackingNumber?: string; trackingUrl?: string; status?: string } | null;
};

export default function SellerOrders() {
  const { loading: authLoading } = useRequireSeller();
  const [rows, setRows] = useState<OrderRow[]>([]);
  const [editing, setEditing] = useState<
    Record<string, { carrier: string; trackingNumber: string; signatureRequired: boolean }>
  >({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

    async function loadOrders() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/seller/orders");
        const json = await res.json();

        if (!json.ok) {
          throw new Error(json.error || "Failed to fetch orders.");
        }

        const formattedRows = json.orders.map((order: any) => ({
          id: order.id,
          item: order.item || order.title || "Unknown Item",
          buyer: order.buyer || order.buyerName || "Private Buyer",
          total: order.total || `$${(order.price || 0).toLocaleString("en-US")}`,
          status: order.status || "Unknown",
          createdAt: order.createdAt || undefined,
          shippingAddress: order.shippingAddress || null,
          fulfillment: order.fulfillment || null,
          shipping: order.shipping || null,
        }));
        setRows(formattedRows);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadOrders();
  }, [authLoading]);

  if (authLoading) {
    return <div className="dark-theme-page"></div>;
  }

  return (
    <>
      <Head>
        <title>Seller — Orders | Famous Finds</title>
      </Head>
      <div className="dark-theme-page">
        <Header />
        <main className="section">
          <div className="back-link">
            <Link href="/seller/dashboard">← Back to Dashboard</Link>
          </div>

          <h1 className="mt-4 text-2xl font-semibold text-white">My orders</h1>
          <p className="subtitle">
            Review new orders and mark items as shipped once dispatched.
          </p>

          <section className="sell-card" style={{ marginTop: "24px" }}>
            <div className="table-overflow-wrapper">
              <table className="catalogue-table">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Item</th>
                    <th>Buyer</th>
                    <th>Ship to</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th style={{ textAlign: "right" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <tr>
                      <td colSpan={7} className="table-message">
                        Loading orders...
                      </td>
                    </tr>
                  )}
                  {error && (
                    <tr>
                      <td colSpan={7} className="table-message error">
                        {error}
                      </td>
                    </tr>
                  )}
                  {!loading && !error && rows.length === 0 && (
                    <tr>
                      <td colSpan={7} className="table-message">
                        You have no orders yet.
                      </td>
                    </tr>
                  )}
                  {!loading &&
                    !error &&
                    rows.map((r) => (
                      <tr key={r.id}>
                        <td>{r.id}</td>
                        <td>{r.item}</td>
                        <td>{r.buyer}</td>
                        <td>
                          {r.shippingAddress ? (
                            <div className="shipto">
                              <div className="shipto-name">{r.shippingAddress.name || ""}</div>
                              <div className="shipto-line">
                                {r.shippingAddress.line1}
                                {r.shippingAddress.line2 ? `, ${r.shippingAddress.line2}` : ""}
                              </div>
                              <div className="shipto-line">
                                {[r.shippingAddress.city, r.shippingAddress.state, r.shippingAddress.postal_code]
                                  .filter(Boolean)
                                  .join(" ")}
                              </div>
                              <div className="shipto-line">{r.shippingAddress.country}</div>
                            </div>
                          ) : (
                            <span className="muted">(Shipping address will appear after buyer payment)</span>
                          )}
                        </td>
                        <td>{r.total}</td>
                        <td>{r.status}</td>
                        <td style={{ textAlign: "right" }}>{renderAction(r)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </section>
        </main>
        <Footer />
      </div>

      <script dangerouslySetInnerHTML={{ __html: "" }} />

      <style jsx>{`
        .back-link a {
          font-size: 12px;
          color: #9ca3af;
        }
        .back-link a:hover {
          color: #e5e7eb;
        }
        h1 {
          margin-top: 16px;
          font-size: 24px;
          font-weight: 600;
          color: white;
        }
        .subtitle {
          margin-top: 4px;
          font-size: 14px;
          color: #9ca3af;
        }
        .sell-card {
          background: #111827;
          border-radius: 16px;
          padding: 18px 18px 20px;
          border: 1px solid #1f2937;
        }
        .table-overflow-wrapper {
          overflow-x: auto;
        }
        .catalogue-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
          color: #e5e7eb;
        }
        .catalogue-table th,
        .catalogue-table td {
          padding: 8px 10px;
          text-align: left;
          border-bottom: 1px solid #374151;
        }
        .catalogue-table th {
          font-size: 11px;
          text-transform: uppercase;
          color: #9ca3af;
          font-weight: 500;
        }
        .catalogue-table tr:last-child td {
          border-bottom: none;
        }
        .table-message {
          text-align: center;
          color: #9ca3af;
          padding: 24px;
        }
        .table-message.error {
          color: #f87171;
        }

        .btn-primary {
          border-radius: 999px;
          background: white;
          padding: 6px 12px;
          font-size: 11px;
          font-weight: 500;
          color: black;
          border: none;
          cursor: pointer;
        }
        .btn-primary:hover {
          background: #e5e7eb;
        }
        .muted {
          color: #9ca3af;
          font-size: 11px;
        }
        .shipto {
          line-height: 1.25;
          font-size: 11px;
          color: #e5e7eb;
        }
        .shipto-name {
          font-weight: 600;
          color: white;
        }
        .shipto-line {
          color: #d1d5db;
        }

        .action-box {
          display: inline-flex;
          flex-direction: column;
          gap: 8px;
          align-items: flex-end;
        }
        .action-row {
          display: flex;
          gap: 8px;
          align-items: center;
          justify-content: flex-end;
        }
        .small-input {
          border-radius: 8px;
          border: 1px solid #374151;
          background: #0b1220;
          padding: 6px 10px;
          font-size: 11px;
          color: #e5e7eb;
          width: 140px;
        }
        .small-input:focus {
          outline: none;
          border-color: #9ca3af;
        }
        .small-select {
          width: 120px;
        }
        .tag {
          display: inline-flex;
          align-items: center;
          border: 1px solid #374151;
          border-radius: 999px;
          padding: 4px 10px;
          font-size: 11px;
          color: #e5e7eb;
          background: #0b1220;
        }
      `}</style>
    </>
  );

  function renderAction(r: OrderRow) {
    const stage = String(r.fulfillment?.stage || "").toUpperCase();
    const isShipped = stage === "SHIPPED" || String(r.status).toLowerCase() === "shipped";
    const canShip = !isShipped && String(r.status).toLowerCase() === "paid";

    if (isShipped) {
      const url = r.shipping?.trackingUrl;
      return (
        <div className="action-box">
          <span className="tag">Shipped</span>
          {r.shipping?.trackingNumber ? (
            <span className="muted">
              {r.shipping.carrier || "Carrier"}: {r.shipping.trackingNumber}
            </span>
          ) : null}
          {url ? (
            <a className="muted" href={url} target="_blank" rel="noreferrer">
              Open tracking
            </a>
          ) : null}
        </div>
      );
    }

    if (!canShip) {
      return <span className="muted">—</span>;
    }

    const edit = editing[r.id] || {
      carrier: "DHL",
      trackingNumber: "",
      signatureRequired: true,
    };

    return (
      <div className="action-box">
        <div className="action-row">
          <select
            className="small-input small-select"
            value={edit.carrier}
            onChange={(e) =>
              setEditing((prev) => ({
                ...prev,
                [r.id]: { ...edit, carrier: e.target.value },
              }))
            }
          >
            <option value="DHL">DHL</option>
            <option value="UPS">UPS</option>
            <option value="FedEx">FedEx</option>
            <option value="AusPost">AusPost</option>
            <option value="Other">Other</option>
          </select>
          <input
            className="small-input"
            placeholder="Tracking #"
            value={edit.trackingNumber}
            onChange={(e) =>
              setEditing((prev) => ({
                ...prev,
                [r.id]: { ...edit, trackingNumber: e.target.value },
              }))
            }
          />
        </div>
        <div className="action-row">
          <label className="muted" style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <input
              type="checkbox"
              checked={edit.signatureRequired}
              onChange={(e) =>
                setEditing((prev) => ({
                  ...prev,
                  [r.id]: { ...edit, signatureRequired: e.target.checked },
                }))
              }
            />
            Signature required
          </label>
          <button
            type="button"
            className="btn-primary"
            disabled={savingId === r.id}
            onClick={() => onMarkShipped(r.id)}
          >
            {savingId === r.id ? "Saving…" : "Mark shipped"}
          </button>
        </div>
      </div>
    );
  }

  async function onMarkShipped(orderId: string) {
    const edit = editing[orderId];
    if (!edit?.carrier || !edit?.trackingNumber) {
      setError("Carrier and tracking number are required.");
      return;
    }
    try {
      setSavingId(orderId);
      setError(null);

      const res = await fetch("/api/seller/mark-shipped", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          carrier: edit.carrier,
          trackingNumber: edit.trackingNumber,
          signatureRequired: edit.signatureRequired,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || "Failed to mark shipped");
      }

      const reload = await fetch("/api/seller/orders");
      const rj = await reload.json();
      if (rj.ok) {
        const formattedRows = rj.orders.map((order: any) => ({
          id: order.id,
          item: order.item || order.title || "Unknown Item",
          buyer: order.buyer || order.buyerName || "Private Buyer",
          total: order.total || `$${(order.price || 0).toLocaleString("en-US")}`,
          status: order.status || "Unknown",
          createdAt: order.createdAt || undefined,
          shippingAddress: order.shippingAddress || null,
          fulfillment: order.fulfillment || null,
          shipping: order.shipping || null,
        }));
        setRows(formattedRows);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to mark shipped");
    } finally {
      setSavingId(null);
    }
  }
}
