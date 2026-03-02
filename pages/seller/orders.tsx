// FILE: /pages/seller/orders.tsx

import Head from "next/head";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useRequireSeller } from "../../hooks/useRequireSeller";
import { sellerFetch } from "../../utils/sellerClient";

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
  item?: string; // backward compatibility
  buyerName?: string;
  buyerEmail?: string;
  buyer?: string; // backward compatibility
  total?: number;
  currency?: string;
  totalLabel?: string; // backward compatibility
  status: string;
  createdAt?: string | null;
  shipDeadlineAt?: string | null;
  shippingAddress?: ShippingAddress | null;
  shipping?: ShippingInfo | null;
  fulfillment?: FulfillmentInfo | null;
};

type UpsDiag = {
  ok: boolean;
  title: string;
  details?: string;
};

type UpsDiagnosticsResponse = {
  ok: boolean;
  checks: UpsDiag[];
  summary: {
    readyForProductionLabel: boolean;
    notes: string[];
  };
};

function getSellerIdHeader(): string {
  if (typeof window === "undefined") return "";
  return String(window.localStorage.getItem("ff-seller-id") || "").trim();
}

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
  const [generatingLabelId, setGeneratingLabelId] = useState<string | null>(null);
  const [labelResult, setLabelResult] = useState<
    Record<string, { trackingNumber: string; labelUrl: string; trackingUrl: string } | null>
  >({});

  // NEW: Diagnostics state
  const [diagOpen, setDiagOpen] = useState(false);
  const [diagLoading, setDiagLoading] = useState(false);
  const [diagError, setDiagError] = useState<string | null>(null);
  const [diagData, setDiagData] = useState<UpsDiagnosticsResponse | null>(null);

  useEffect(() => {
    if (authLoading) return;
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading]);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const res = await sellerFetch("/api/seller/orders");
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
      return id.includes(q) || title.includes(q) || buyerName.includes(q) || buyerEmail.includes(q);
    });
  }, [rows, query]);

  if (authLoading) return <div className="dashboard-page" />;

  return (
    <>
      <Head>
        <title>Seller — Orders | MyFamousFinds</title>
      </Head>

      <div className="dashboard-page">
        <Header />

        <main className="dashboard-main">
          <div className="back-link">
            <Link href="/seller/dashboard">← Back to Dashboard</Link>
          </div>

          <div className="page-head">
            <div>
              <h1 className="page-title">My Orders</h1>
              <p className="subtitle">
                When an item is sold, you’ll see the buyer’s details and shipping address here. Ship with{" "}
                <strong>Signature Required</strong>, then enter the tracking number.
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

          {/* DESKTOP TABLE VIEW */}
          <section className="sell-card desktop-table" style={{ marginTop: 18 }}>
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
                          <div className="muted">{r.createdAt ? formatLocal(r.createdAt) : ""}</div>
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

          {/* MOBILE CARD VIEW */}
          <section className="mobile-cards" style={{ marginTop: 18 }}>
            {loading && <p className="mobile-message">Loading orders…</p>}

            {error && <p className="mobile-message mobile-error">{error}</p>}

            {!loading && !error && visible.length === 0 && <p className="mobile-message">No orders found.</p>}

            {!loading &&
              !error &&
              visible.map((r) => (
                <div key={r.id} className="mobile-order-card">
                  <div className="mobile-card-top">
                    <div>
                      <div className="cell-strong">{r.listingTitle || r.item || "Item"}</div>
                      <div className="muted">{formatMoney(r)}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>{renderStatus(r)}</div>
                  </div>

                  <div className="mobile-card-rows">
                    <div className="mobile-card-row">
                      <span className="mobile-label">Order</span>
                      <span className="mobile-value">
                        <span className="cell-strong">{r.id}</span>
                        {r.createdAt && (
                          <span className="muted" style={{ display: "block" }}>
                            {formatLocal(r.createdAt)}
                          </span>
                        )}
                      </span>
                    </div>

                    <div className="mobile-card-row">
                      <span className="mobile-label">Buyer</span>
                      <span className="mobile-value">
                        <span className="cell-strong">{r.buyerName || r.buyer || "Buyer"}</span>
                        {r.buyerEmail && (
                          <span className="muted" style={{ display: "block" }}>
                            {r.buyerEmail}
                          </span>
                        )}
                      </span>
                    </div>

                    <div className="mobile-card-row">
                      <span className="mobile-label">Ship to</span>
                      <span className="mobile-value">{renderShipTo(r.shippingAddress)}</span>
                    </div>

                    <div className="mobile-card-row">
                      <span className="mobile-label">Ship by</span>
                      <span className="mobile-value">{renderDeadline(r.shipDeadlineAt)}</span>
                    </div>
                  </div>

                  <div className="mobile-card-action">{renderAction(r)}</div>
                </div>
              ))}
          </section>

          {/* Diagnostics Modal */}
          {diagOpen && (
            <div className="diag-overlay" role="dialog" aria-modal="true">
              <div className="diag-modal">
                <div className="diag-head">
                  <div>
                    <div className="diag-title">UPS Diagnostics</div>
                    <div className="muted" style={{ marginTop: 4 }}>
                      This checks env vars + Firebase + seller address readiness for label generation.
                    </div>
                  </div>

                  <button className="btn" type="button" onClick={() => setDiagOpen(false)}>
                    Close
                  </button>
                </div>

                <div style={{ marginTop: 12 }}>
                  {diagLoading ? (
                    <div className="muted">Running checks…</div>
                  ) : diagError ? (
                    <div className="diag-error">{diagError}</div>
                  ) : diagData ? (
                    <>
                      <div className="diag-summary">
                        <span className={`badge ${diagData.summary.readyForProductionLabel ? "good" : "warn"}`}>
                          {diagData.summary.readyForProductionLabel ? "READY" : "NOT READY"}
                        </span>
                        <span className="muted" style={{ marginLeft: 10 }}>
                          Production label roadmap status
                        </span>
                      </div>

                      {diagData.summary.notes?.length ? (
                        <ul className="diag-notes">
                          {diagData.summary.notes.map((n, idx) => (
                            <li key={idx}>{n}</li>
                          ))}
                        </ul>
                      ) : null}

                      <div className="diag-list">
                        {diagData.checks.map((c, idx) => (
                          <div key={idx} className="diag-item">
                            <span className={`badge ${c.ok ? "good" : "warn"}`}>{c.ok ? "PASS" : "FAIL"}</span>
                            <div className="diag-item-body">
                              <div className="cell-strong">{c.title}</div>
                              {c.details ? <div className="muted">{c.details}</div> : null}
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="muted">No results yet.</div>
                  )}
                </div>

                <div style={{ marginTop: 14, display: "flex", gap: 10, justifyContent: "flex-end", flexWrap: "wrap" }}>
                  <button className="btn btn-primary" type="button" disabled={diagLoading} onClick={runDiagnostics}>
                    {diagLoading ? "Checking…" : "Run Diagnostics"}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div style={{ height: 26 }} />
        </main>

        <Footer />
      </div>

      <style jsx>{`
        .back-link a {
          font-size: 12px;
          color: #6b7280;
        }
        .back-link a:hover {
          color: #111827;
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
          color: #111827;
        }
        .subtitle {
          margin-top: 6px;
          font-size: 13px;
          color: #6b7280;
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
          border: 1px solid #d1d5db;
          background: #ffffff;
          padding: 10px 12px;
          font-size: 13px;
          color: #111827;
        }
        .search:focus {
          outline: none;
          border-color: #9ca3af;
        }

        .sell-card {
          background: #ffffff;
          border-radius: 16px;
          padding: 18px 18px 20px;
          border: 1px solid #e5e7eb;
          box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04);
        }
        .table-overflow-wrapper {
          overflow-x: auto;
        }
        .catalogue-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
          color: #374151;
        }
        .catalogue-table th,
        .catalogue-table td {
          padding: 10px 10px;
          text-align: left;
          border-bottom: 1px solid #e5e7eb;
          vertical-align: top;
        }
        .catalogue-table th {
          font-size: 11px;
          text-transform: uppercase;
          color: #6b7280;
          font-weight: 500;
        }
        .catalogue-table tr:last-child td {
          border-bottom: none;
        }
        .table-message {
          text-align: center;
          color: #6b7280;
          padding: 24px;
        }
        .table-message.error {
          color: #dc2626;
        }

        .cell-strong {
          color: #111827;
          font-weight: 600;
          font-size: 12px;
          line-height: 1.2;
        }

        .muted {
          color: #6b7280;
          font-size: 11px;
          margin-top: 3px;
          line-height: 1.25;
        }

        .shipto {
          line-height: 1.25;
          font-size: 11px;
          color: #374151;
          max-width: 260px;
        }
        .shipto-name {
          font-weight: 600;
          color: #111827;
          margin-bottom: 2px;
        }
        .shipto-line {
          color: #6b7280;
        }

        .badge {
          display: inline-flex;
          align-items: center;
          border: 1px solid #e5e7eb;
          border-radius: 999px;
          padding: 4px 10px;
          font-size: 11px;
          color: #374151;
          background: #f9fafb;
          white-space: nowrap;
        }
        .badge.good {
          border-color: #a7f3d0;
          color: #047857;
          background: #ecfdf5;
        }
        .badge.warn {
          border-color: #fecaca;
          color: #b91c1c;
          background: #fef2f2;
        }
        .badge.neutral {
          border-color: #e5e7eb;
          color: #374151;
          background: #f9fafb;
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
          border: 1px solid #d1d5db;
          background: #ffffff;
          padding: 8px 10px;
          font-size: 11px;
          color: #111827;
          width: 150px;
        }
        .small-input:focus {
          outline: none;
          border-color: #6b7280;
        }
        .small-select {
          width: 120px;
        }

        .btn {
          border-radius: 999px;
          padding: 7px 12px;
          font-size: 11px;
          font-weight: 600;
          border: 1px solid #d1d5db;
          background: #ffffff;
          color: #374151;
          cursor: pointer;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          line-height: 1;
        }
        .btn:hover {
          border-color: #111827;
        }
        .btn-primary {
          border-color: #111827;
          background: #111827;
          color: #ffffff;
        }
        .btn-primary:hover {
          background: #000000;
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
          color: #6b7280;
          font-size: 11px;
          user-select: none;
        }

        .label-result {
          display: flex;
          flex-direction: column;
          gap: 6px;
          padding: 8px 10px;
          background: #ecfdf5;
          border: 1px solid #a7f3d0;
          border-radius: 10px;
        }

        /* ---- Desktop / Mobile toggle ---- */
        .mobile-cards {
          display: none;
        }

        @media (max-width: 700px) {
          .desktop-table {
            display: none;
          }
          .mobile-cards {
            display: block;
          }

          .page-head {
            flex-direction: column;
          }
          .search-wrap {
            min-width: unset;
            width: 100%;
          }
          .search {
            max-width: 100%;
          }
        }

        /* ---- Mobile card styles ---- */
        .mobile-message {
          text-align: center;
          color: #6b7280;
          padding: 32px 16px;
          font-size: 13px;
          background: #ffffff;
          border-radius: 16px;
          border: 1px solid #e5e7eb;
        }
        .mobile-error {
          color: #dc2626;
        }

        .mobile-order-card {
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 14px;
          padding: 16px;
          margin-bottom: 12px;
          box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04);
        }

        .mobile-card-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
          padding-bottom: 12px;
          border-bottom: 1px solid #e5e7eb;
        }

        .mobile-card-rows {
          display: flex;
          flex-direction: column;
          gap: 10px;
          padding: 12px 0;
        }

        .mobile-card-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
        }

        .mobile-label {
          font-size: 11px;
          text-transform: uppercase;
          color: #6b7280;
          font-weight: 500;
          flex-shrink: 0;
          padding-top: 2px;
        }

        .mobile-value {
          font-size: 12px;
          color: #374151;
          text-align: right;
          word-break: break-word;
        }

        .mobile-card-action {
          border-top: 1px solid #e5e7eb;
          padding-top: 12px;
        }

        .mobile-card-action .action-box {
          align-items: stretch;
          min-width: unset;
          width: 100%;
        }

        .mobile-card-action .action-row {
          justify-content: stretch;
        }

        .mobile-card-action .small-input {
          width: auto;
          flex: 1;
          min-width: 0;
        }

        .mobile-card-action .small-select {
          width: auto;
          flex: 0 0 auto;
        }

        /* Diagnostics modal */
        .diag-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.4);
          display: flex;
          justify-content: center;
          align-items: flex-start;
          padding: 24px 16px;
          z-index: 1000;
        }
        .diag-modal {
          width: 100%;
          max-width: 720px;
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          padding: 16px;
          margin-top: 40px;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.15);
        }
        .diag-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
        }
        .diag-title {
          font-size: 16px;
          font-weight: 700;
          color: #111827;
        }
        .diag-error {
          padding: 10px 12px;
          border-radius: 12px;
          border: 1px solid #fecaca;
          background: #fef2f2;
          color: #b91c1c;
          font-size: 12px;
        }
        .diag-summary {
          display: flex;
          align-items: center;
          padding: 10px 12px;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
          background: #f9fafb;
        }
        .diag-notes {
          margin: 10px 0 0;
          padding-left: 18px;
          color: #6b7280;
          font-size: 12px;
        }
        .diag-list {
          margin-top: 12px;
          display: grid;
          gap: 10px;
        }
        .diag-item {
          display: flex;
          gap: 10px;
          align-items: flex-start;
          padding: 10px 12px;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
          background: #f9fafb;
        }
        .diag-item-body {
          flex: 1;
          min-width: 0;
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

    return <span className={`badge ${overdue ? "warn" : soon ? "warn" : "good"}`}>{overdue ? `Overdue • ${label}` : label}</span>;
  }

  function renderStatus(r: OrderRow) {
    const stage = String(r.fulfillment?.stage || "").toUpperCase();
    const status = String(r.status || "").toUpperCase();

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
          {/* NEW: Diagnostics button */}
          <button
            type="button"
            className="btn"
            onClick={() => {
              setDiagOpen(true);
              setDiagError(null);
              setDiagData(null);
            }}
            title="Run checks to confirm UPS + Firebase config and seller address readiness"
          >
            UPS Diagnostics
          </button>

          <button
            type="button"
            className="btn"
            disabled={generatingLabelId === r.id}
            onClick={() => onGenerateLabel(r.id)}
            title="Generate a UPS shipping label for this order"
          >
            {generatingLabelId === r.id ? "Generating…" : "Generate UPS Label"}
          </button>
        </div>

        {labelResult[r.id] && (
          <div className="label-result">
            <div className="muted" style={{ textAlign: "right" }}>
              Tracking: {labelResult[r.id]!.trackingNumber}
            </div>
            <div className="action-row">
              <a className="btn" href={labelResult[r.id]!.labelUrl} target="_blank" rel="noreferrer">
                Download Label
              </a>
              <a className="btn" href={labelResult[r.id]!.trackingUrl} target="_blank" rel="noreferrer">
                Track
              </a>
            </div>
          </div>
        )}

        <div className="action-row">
          <label className="checkbox" title="Required for release of funds">
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

          <button type="button" className="btn btn-primary" disabled={savingId === r.id} onClick={() => onMarkShipped(r.id)}>
            {savingId === r.id ? "Saving…" : "Mark Shipped"}
          </button>
        </div>

        <div className="muted" style={{ textAlign: "right" }}>
          Tip: Generate a UPS label or enter tracking manually, then mark shipped.
        </div>
      </div>
    );
  }

  // NEW: run diagnostics (server checks envs + Firebase + seller address)
  async function runDiagnostics() {
    try {
      setDiagLoading(true);
      setDiagError(null);
      setDiagData(null);

      const res = await sellerFetch("/api/ups/diagnostics", { method: "POST" });
      const json = await res.json();

      if (!res.ok || !json?.ok) throw new Error(json?.error || "Diagnostics failed.");

      setDiagData(json as UpsDiagnosticsResponse);
    } catch (e: any) {
      setDiagError(e?.message || "Diagnostics failed.");
    } finally {
      setDiagLoading(false);
    }
  }

  async function onGenerateLabel(orderId: string) {
    try {
      setGeneratingLabelId(orderId);
      setError(null);

      // ✅ FIX: Do NOT send blank seller address from the UI.
      // The server should resolve seller address from Firestore (seller_banking / seller profile).
      const res = await sellerFetch("/api/ups/generate-order-label", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          pkg: {
            weightLbs: 3,
            lengthIn: 16,
            widthIn: 12,
            heightIn: 6,
          },
        }),
      });

      const json = await res.json();
      if (!res.ok || !json?.ok) throw new Error(json?.error || "Failed to generate label.");

      setLabelResult((prev) => ({
        ...prev,
        [orderId]: {
          trackingNumber: json.trackingNumber,
          labelUrl: json.labelUrl,
          trackingUrl: json.trackingUrl,
        },
      }));

      // Auto-fill the tracking number and carrier
      setEditing((prev) => ({
        ...prev,
        [orderId]: {
          ...(prev[orderId] || { signatureRequired: true }),
          carrier: "UPS",
          trackingNumber: json.trackingNumber,
        },
      }));
    } catch (e: any) {
      setError(e?.message || "Failed to generate shipping label.");
    } finally {
      setGeneratingLabelId(null);
    }
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

      const res = await sellerFetch("/api/seller/mark-shipped", {
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
  const ms = Date.parse(input);
  if (!Number.isFinite(ms)) return input;
  return new Date(ms).toLocaleString();
}

function formatDeadline(deadlineMs: number) {
  const d = new Date(deadlineMs);
  const date = d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
  const time = d.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${date} • ${time}`;
}
