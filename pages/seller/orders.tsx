// FILE: /pages/seller/orders.tsx

import Head from "next/head";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import useRequireSeller from "../../hooks/useRequireSeller";

type ShippingAddress = {
  name?: string;
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
};

type ShippingInfo = {
  status?: string;
  carrier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
};

type FulfillmentInfo = {
  stage?: string;
  signatureRequired?: boolean;
  shippedAt?: string;
  deliveredAt?: string;
};

type OrderRow = {
  id: string;
  listingTitle?: string;
  item?: string; // backward compatibility (older API)
  buyerName?: string;
  buyerEmail?: string;
  buyer?: string; // backward compatibility (older API)
  total?: number;
  currency?: string;
  totalLabel?: string; // backward compatibility (older API)
  status: string;
  createdAt?: string | null;
  shipDeadlineAt?: string | null;
  shippingAddress?: ShippingAddress | null;
  shipping?: ShippingInfo | null;
  fulfillment?: FulfillmentInfo | null;
};

export default function SellerOrders() {
  const { loading: authLoading } = useRequireSeller();

  const [rows, setRows] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);

  const [editing, setEditing] = useState<
    Record<string, { carrier: string; trackingNumber: string; signatureRequired: boolean }>
  >({});

  useEffect(() => {
    if (authLoading) return;
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading]);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/seller/orders");
      const json = await res.json();
      if (!res.ok || !json?.ok) throw new Error(json?.error || "Failed to load orders.");
      const orders = Array.isArray(json.orders) ? json.orders : [];
      setRows(orders);
    } catch (e: any) {
      setError(e?.message || "Failed to load orders.");
    } finally {
      setLoading(false);
    }
  }

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      const id = String(r.id || "").toLowerCase();
      const title = String(r.listingTitle || r.item || "").toLowerCase();
      const buyerName = String(r.buyerName || r.buyer || "").toLowerCase();
      const buyerEmail = String(r.buyerEmail || "").toLowerCase();
      return (
        id.includes(q) ||
        title.includes(q) ||
        buyerName.includes(q) ||
        buyerEmail.includes(q)
      );
    });
  }, [rows, query]);

  if (authLoading) return <div className="dark-theme-page" />;

  return (
    <>
      <Head>
        <title>Seller — Orders | MyFamousFinds</title>
      </Head>

      <div className="dark-theme-page">
        <Header />

        <main className="section">
          <div className="back-link">
            <Link href="/seller/dashboard">← Back to Dashboard</Link>
          </div>

          <div className="page-head">
            <div>
              <h1 className="page-title">My Orders</h1>
              <p className="subtitle">
                When an item is sold, you’ll see the buyer’s details and shipping address here.
                Ship with <strong>Signature Required</strong>, then enter the tracking number.
              </p>
            </div>

            <div className="search-wrap">
              <input
                className="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by order, item, buyer…"
              />
            </div>
          </div>

          <section className="sell-card" style={{ marginTop: 18 }}>
            <div className="table-overflow-wrapper">
              <table className="catalogue-table">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Item</th>
                    <th>Buyer</th>
                    <th>Ship to</th>
                    <th>Ship by</th>
                    <th>Status</th>
                    <th style={{ textAlign: "right" }}>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {loading && (
                    <tr>
                      <td colSpan={7} className="table-message">
                        Loading orders…
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

                  {!loading && !error && visible.length === 0 && (
                    <tr>
                      <td colSpan={7} className="table-message">
                        No orders found.
                      </td>
                    </tr>
                  )}

                  {!loading &&
                    !error &&
                    visible.map((r) => (
                      <tr key={r.id}>
                        <td>
                          <div className="cell-strong">{r.id}</div>
                          <div className="muted">
                            {r.createdAt ? formatLocal(r.createdAt) : ""}
                          </div>
                        </td>

                        <td>
                          <div className="cell-strong">{r.listingTitle || r.item || "Item"}</div>
                          <div className="muted">{formatMoney(r)}</div>
                        </td>

                        <td>
                          <div className="cell-strong">{r.buyerName || r.buyer || "Buyer"}</div>
                          <div className="muted">{r.buyerEmail || ""}</div>
                        </td>

                        <td>{renderShipTo(r.shippingAddress)}</td>

                        <td>{renderDeadline(r.shipDeadlineAt)}</td>

                        <td>{renderStatus(r)}</td>

                        <td style={{ textAlign: "right" }}>{renderAction(r)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </section>

          <div style={{ height: 26 }} />
        </main>

        <Footer />
      </div>

      <style jsx>{`
        .back-link a {
          font-size: 12px;
          color: #9ca3af;
        }
        .back-link a:hover {
          color: #e5e7eb;
        }

        .page-head {
          margin-top: 14px;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }

        .page-title {
          margin-top: 0;
          font-size: 24px;
          font-weight: 600;
          color: #ffffff;
        }
        .subtitle {
          margin-top: 6px;
          font-size: 13px;
          color: #9ca3af;
          max-width: 760px;
          line-height: 1.35;
        }

        .search-wrap {
          display: flex;
          justify-content: flex-end;
          min-width: 240px;
          flex: 1;
        }
        .search {
          width: 100%;
          max-width: 360px;
          border-radius: 12px;
          border: 1px solid #1f2937;
          background: #0b1220;
          padding: 10px 12px;
          font-size: 13px;
          color: #e5e7eb;
        }
        .search:focus {
          outline: none;
          border-color: #374151;
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
          padding: 10px 10px;
          text-align: left;
          border-bottom: 1px solid #374151;
          vertical-align: top;
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

        .cell-strong {
          color: #ffffff;
          font-weight: 600;
          font-size: 12px;
          line-height: 1.2;
        }

        .muted {
          color: #9ca3af;
          font-size: 11px;
          margin-top: 3px;
          line-height: 1.25;
        }

        .shipto {
          line-height: 1.25;
          font-size: 11px;
          color: #e5e7eb;
          max-width: 260px;
        }
        .shipto-name {
          font-weight: 600;
          color: #ffffff;
          margin-bottom: 2px;
        }
        .shipto-line {
          color: #d1d5db;
        }

        .badge {
          display: inline-flex;
          align-items: center;
          border: 1px solid #374151;
          border-radius: 999px;
          padding: 4px 10px;
          font-size: 11px;
          color: #e5e7eb;
          background: #0b1220;
          white-space: nowrap;
        }
        .badge.good {
          border-color: #14532d;
          color: #bbf7d0;
          background: rgba(20, 83, 45, 0.25);
        }
        .badge.warn {
          border-color: #7c2d12;
          color: #fed7aa;
          background: rgba(124, 45, 18, 0.25);
        }
        .badge.neutral {
          border-color: #374151;
          color: #e5e7eb;
          background: #0b1220;
        }

        .action-box {
          display: inline-flex;
          flex-direction: column;
          gap: 8px;
          align-items: flex-end;
          min-width: 220px;
        }
        .action-row {
          display: flex;
          gap: 8px;
          align-items: center;
          justify-content: flex-end;
          flex-wrap: wrap;
        }

        .small-input {
          border-radius: 10px;
          border: 1px solid #374151;
          background: #0b1220;
          padding: 8px 10px;
          font-size: 11px;
          color: #e5e7eb;
          width: 150px;
        }
        .small-input:focus {
          outline: none;
          border-color: #9ca3af;
        }
        .small-select {
          width: 120px;
        }

        .btn {
          border-radius: 999px;
          padding: 7px 12px;
          font-size: 11px;
          font-weight: 600;
          border: 1px solid #374151;
          background: #0b1220;
          color: #e5e7eb;
          cursor: pointer;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          line-height: 1;
        }
        .btn:hover {
          border-color: #9ca3af;
        }
        .btn-primary {
          border-color: #ffffff;
          background: #ffffff;
          color: #000000;
        }
        .btn-primary:hover {
          background: #e5e7eb;
        }
        .btn:disabled,
        .btn[aria-disabled="true"] {
          opacity: 0.6;
          cursor: default;
        }

        .checkbox {
          display: flex;
          gap: 6px;
          align-items: center;
          color: #9ca3af;
          font-size: 11px;
          user-select: none;
        }
      `}</style>
    </>
  );

  function renderShipTo(addr?: ShippingAddress | null) {
    if (!addr) return <span className="muted">(Address available after payment)</span>;

    const line2 = addr.line2 ? `, ${addr.line2}` : "";
    const cityLine = [addr.city, addr.state, addr.postal_code].filter(Boolean).join(" ");

    return (
      <div className="shipto">
        <div className="shipto-name">{addr.name || "Buyer"}</div>
        <div className="shipto-line">
          {addr.line1}
          {line2}
        </div>
        <div className="shipto-line">{cityLine}</div>
        <div className="shipto-line">{addr.country}</div>
      </div>
    );
  }

  function renderDeadline(iso?: string | null) {
    if (!iso) return <span className="muted">—</span>;
    const ms = Date.parse(iso);
    if (!Number.isFinite(ms)) return <span className="muted">—</span>;

    const now = Date.now();
    const diff = ms - now;

    const label = formatDeadline(ms);
    const overdue = diff < 0;
    const soon = diff >= 0 && diff <= 24 * 60 * 60 * 1000;

    return (
      <span className={`badge ${overdue ? "warn" : soon ? "warn" : "good"}`}>
        {overdue ? `Overdue • ${label}` : label}
      </span>
    );
  }

  function renderStatus(r: OrderRow) {
    const stage = String(r.fulfillment?.stage || "").toUpperCase();
    const status = String(r.status || "").toUpperCase();

    // Normalize display
    if (stage === "PAID" || status === "PAID") return <span className="badge neutral">SOLD – SHIP NOW</span>;
    if (stage === "SHIPPED" || status === "SHIPPED") return <span className="badge good">Shipped</span>;
    if (stage === "DELIVERED" || status === "DELIVERED") return <span className="badge good">Delivered</span>;
    if (stage === "SIGNATURE_CONFIRMED") return <span className="badge good">Signature Confirmed</span>;

    return <span className="badge neutral">{r.status || "—"}</span>;
  }

  function renderAction(r: OrderRow) {
    const stage = String(r.fulfillment?.stage || "").toUpperCase();
    const status = String(r.status || "").toLowerCase();

    const shipped = stage === "SHIPPED" || status === "shipped";
    const canShip = !shipped && (stage === "PAID" || status === "paid");

    const ship = r.shipping || {};
    const edit = editing[r.id] || {
      carrier: ship.carrier || "DHL",
      trackingNumber: ship.trackingNumber || "",
      signatureRequired: r.fulfillment?.signatureRequired !== false,
    };

    if (shipped) {
      return (
        <div className="action-box">
          <div className="action-row">
            <span className="badge good">Tracking Saved</span>
          </div>

          <div className="muted" style={{ textAlign: "right" }}>
            {ship.carrier ? `${ship.carrier}: ` : ""}
            {ship.trackingNumber || ""}
          </div>

          <div className="action-row">
            {ship.trackingUrl ? (
              <a className="btn" href={ship.trackingUrl} target="_blank" rel="noreferrer">
                Open Tracking
              </a>
            ) : (
              <span className="muted">—</span>
            )}
          </div>
        </div>
      );
    }

    if (!canShip) {
      return (
        <div className="action-box">
          <span className="muted">—</span>
        </div>
      );
    }

    return (
      <div className="action-box">
        <div className="action-row">
          <select
            className="small-input small-select"
            value={edit.carrier}
            onChange={(e) => setEditing((prev) => ({ ...prev, [r.id]: { ...edit, carrier: e.target.value } }))}
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
            onChange={(e) => setEditing((prev) => ({ ...prev, [r.id]: { ...edit, trackingNumber: e.target.value } }))}
          />
        </div>

        <div className="action-row">
          <label className="checkbox" title="Required for release of funds">
            <input
              type="checkbox"
              checked={edit.signatureRequired}
              onChange={(e) => setEditing((prev) => ({ ...prev, [r.id]: { ...edit, signatureRequired: e.target.checked } }))}
            />
            Signature required
          </label>

          <button
            type="button"
            className="btn btn-primary"
            disabled={savingId === r.id}
            onClick={() => onMarkShipped(r.id)}
          >
            {savingId === r.id ? "Saving…" : "Mark Shipped"}
          </button>
        </div>

        <div className="muted" style={{ textAlign: "right" }}>
          Tip: Ship with signature required and enter tracking.
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
      if (!res.ok || !json?.ok) throw new Error(json?.error || "Failed to mark shipped.");

      await refresh();
    } catch (e: any) {
      setError(e?.message || "Failed to mark shipped.");
    } finally {
      setSavingId(null);
    }
  }
}

function formatMoney(r: OrderRow) {
  // Prefer explicit label if your API already formats it
  if (r.totalLabel) return r.totalLabel;

  const total = Number(r.total ?? 0);
  const currency = String(r.currency || "USD").toUpperCase();
  if (!Number.isFinite(total) || total <= 0) return "";

  try {
    return total.toLocaleString("en-US", { style: "currency", currency });
  } catch {
    return `${currency} ${total.toFixed(2)}`;
  }
}

function formatLocal(input: string) {
  // input may already be formatted; if it's ISO, convert nicely
  const ms = Date.parse(input);
  if (!Number.isFinite(ms)) return input;
  return new Date(ms).toLocaleString();
}

function formatDeadline(deadlineMs: number) {
  const d = new Date(deadlineMs);
  const date = d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
  const time = d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  return `${date} • ${time}`;
}
