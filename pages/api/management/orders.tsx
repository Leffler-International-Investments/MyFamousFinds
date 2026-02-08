// FILE: /pages/management/orders.tsx

import { useMemo, useState } from "react";
import type { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { adminDb } from "../../utils/firebaseAdmin";
import { useRequireAdmin } from "../../hooks/useRequireAdmin";

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

type AdminCard = {
  remarks?: string;
  checklist?: {
    shipped?: boolean;
    delivered?: boolean;
    signed?: boolean;
    buyerConfirmed?: boolean;
    payoutReady?: boolean;
    payoutPaid?: boolean;
  };
  closed?: boolean;
};

type Order = {
  id: string;
  listingId?: string;
  listingTitle?: string;

  buyerName?: string;
  buyerEmail?: string;

  sellerId?: string;

  status?: string;
  createdAt?: string;

  totals?: { currency?: string; total?: number };
  shippingAddress?: ShippingAddress | null;
  shipping?: ShippingInfo;

  fulfillment?: { stage?: string; signatureRequired?: boolean };
  payout?: { status?: string; coolingDays?: number };

  adminCard?: AdminCard;
};

type Props = { initialOrders: Order[] };

function money(amount?: number, currency?: string) {
  const c = (currency || "USD").toUpperCase();
  const n = Number(amount || 0);
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: c }).format(n);
  } catch {
    return `${c} ${n.toFixed(2)}`;
  }
}

function formatAddress(a?: ShippingAddress | null) {
  if (!a) return "";
  return [
    a.name,
    a.line1,
    a.line2,
    [a.city, a.state, a.postal_code].filter(Boolean).join(" "),
    a.country,
  ]
    .filter(Boolean)
    .join("\n");
}

export default function ManagementOrders({ initialOrders }: Props) {
  const { loading } = useRequireAdmin();

  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [openId, setOpenId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter((o) => {
      const status = String(o.status || "");
      if (statusFilter !== "All" && status !== statusFilter) return false;
      if (!q) return true;

      return (
        o.id.toLowerCase().includes(q) ||
        String(o.buyerEmail || "").toLowerCase().includes(q) ||
        String(o.buyerName || "").toLowerCase().includes(q) ||
        String(o.listingTitle || "").toLowerCase().includes(q) ||
        String(o.listingId || "").toLowerCase().includes(q)
      );
    });
  }, [orders, query, statusFilter]);

  const updateAdminCard = async (orderId: string, patch: Partial<AdminCard>) => {
    const current = orders.find((x) => x.id === orderId);
    const merged: AdminCard = {
      remarks: patch.remarks ?? current?.adminCard?.remarks ?? "",
      checklist: {
        shipped: patch.checklist?.shipped ?? current?.adminCard?.checklist?.shipped ?? false,
        delivered: patch.checklist?.delivered ?? current?.adminCard?.checklist?.delivered ?? false,
        signed: patch.checklist?.signed ?? current?.adminCard?.checklist?.signed ?? false,
        buyerConfirmed:
          patch.checklist?.buyerConfirmed ?? current?.adminCard?.checklist?.buyerConfirmed ?? false,
        payoutReady: patch.checklist?.payoutReady ?? current?.adminCard?.checklist?.payoutReady ?? false,
        payoutPaid: patch.checklist?.payoutPaid ?? current?.adminCard?.checklist?.payoutPaid ?? false,
      },
      closed: patch.closed ?? current?.adminCard?.closed ?? false,
    };

    try {
      setSavingId(orderId);
      setError(null);

      const res = await fetch("/api/orders/updateAdminCard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          remarks: merged.remarks,
          checklist: merged.checklist,
          closed: merged.closed,
        }),
      });

      const json = await res.json();
      if (!res.ok || json?.error) throw new Error(json?.error || "Failed saving admin card");

      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, adminCard: merged } : o))
      );
    } catch (e: any) {
      console.error(e);
      setError(e?.message || "Failed saving admin card");
    } finally {
      setSavingId(null);
    }
  };

  if (loading) return <div className="dashboard-page" />;

  return (
    <>
      <Head>
        <title>Buyer Order Cards — Management</title>
      </Head>

      <div className="dashboard-page">
        <Header />

        <main className="dashboard-main">
          <div className="dashboard-header">
            <div>
              <h1>Buyer Order Cards</h1>
              <p>
                Track every purchase end-to-end: buyer, item, shipping, delivery, signature,
                and payout — with remarks and closure.
              </p>
            </div>
            <Link href="/management/dashboard">← Back to Management Dashboard</Link>
          </div>

          {error && <p className="banner-error">{error}</p>}

          <div className="filters-bar">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by order ID, buyer, listing title…"
              className="form-input"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="form-input"
              style={{ maxWidth: 220 }}
            >
              <option value="All">All statuses</option>
              <option value="Paid">Paid</option>
              <option value="Shipped">Shipped</option>
              <option value="Delivered">Delivered</option>
              <option value="Completed">Completed</option>
              <option value="Refunded">Refunded</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <div className="cards">
            {visible.length === 0 && <div className="empty">No orders found.</div>}

            {visible.map((o) => {
              const isOpen = openId === o.id;
              const addrText = formatAddress(o.shippingAddress);
              const total = money(o.totals?.total, o.totals?.currency);
              const ship = o.shipping || {};
              const card = o.adminCard || {};
              const checklist = card.checklist || {};
              const disabled = savingId === o.id;

              return (
                <div key={o.id} className={`card ${card.closed ? "closed" : ""}`}>
                  <div className="cardTop">
                    <div className="left">
                      <div className="kicker">ORDER</div>
                      <div className="big">{o.id}</div>
                      <div className="sub">
                        <span className="pill">{String(o.status || "Paid")}</span>
                        <span className="muted">{o.createdAt || ""}</span>
                      </div>
                    </div>

                    <div className="right">
                      <div className="price">{total}</div>
                      <button className="btn" onClick={() => setOpenId(isOpen ? null : o.id)}>
                        {isOpen ? "Hide" : "Open"} Card
                      </button>
                    </div>
                  </div>

                  <div className="rowGrid">
                    <div className="box">
                      <div className="label">Item</div>
                      <div className="value">{o.listingTitle || "—"}</div>
                      <div className="small">Listing ID: {o.listingId || "—"}</div>
                    </div>

                    <div className="box">
                      <div className="label">Buyer</div>
                      <div className="value">{o.buyerName || "—"}</div>
                      <div className="small">{o.buyerEmail || "—"}</div>
                    </div>

                    <div className="box">
                      <div className="label">Shipping</div>
                      <div className="value small pre">{addrText || "Pending / Not provided"}</div>
                    </div>

                    <div className="box">
                      <div className="label">Tracking</div>
                      <div className="value">
                        {ship.carrier ? `${ship.carrier} — ${ship.trackingNumber || ""}` : "—"}
                      </div>
                      {ship.trackingUrl ? (
                        <a className="link" href={ship.trackingUrl} target="_blank" rel="noreferrer">
                          Open tracking
                        </a>
                      ) : (
                        <div className="small">Add tracking from this same page (existing flow).</div>
                      )}
                    </div>
                  </div>

                  {isOpen && (
                    <div className="cardBody">
                      <div className="sectionTitle">Management Checklist</div>

                      <div className="checks">
                        {[
                          ["shipped", "Shipped (tracking saved)"],
                          ["delivered", "Delivered"],
                          ["signed", "Signed (proof / signature)"],
                          ["buyerConfirmed", "Buyer confirmed received"],
                          ["payoutReady", "Payout ready (cooling passed)"],
                          ["payoutPaid", "Seller payout completed"],
                        ].map(([key, label]) => (
                          <label key={key} className="check">
                            <input
                              type="checkbox"
                              checked={!!(checklist as any)[key]}
                              onChange={(e) =>
                                updateAdminCard(o.id, {
                                  checklist: { ...(checklist as any), [key]: e.target.checked },
                                })
                              }
                              disabled={disabled}
                            />
                            <span>{label}</span>
                          </label>
                        ))}
                      </div>

                      <div className="sectionTitle">Admin Remarks</div>
                      <textarea
                        className="remarks"
                        value={String(card.remarks || "")}
                        onChange={(e) => {
                          const v = e.target.value;
                          setOrders((prev) =>
                            prev.map((x) =>
                              x.id === o.id ? { ...x, adminCard: { ...(x.adminCard || {}), remarks: v } } : x
                            )
                          );
                        }}
                        placeholder="Add notes, follow-ups, exceptions, seller contact info, etc."
                      />

                      <div className="actions">
                        <button
                          className="btnSecondary"
                          onClick={() =>
                            updateAdminCard(o.id, {
                              remarks: String((orders.find((x) => x.id === o.id)?.adminCard?.remarks || "")),
                              checklist,
                              closed: !!card.closed,
                            })
                          }
                          disabled={disabled}
                        >
                          {disabled ? "Saving…" : "Save"}
                        </button>

                        <button
                          className="btn"
                          onClick={() => updateAdminCard(o.id, { closed: true })}
                          disabled={disabled || !!card.closed}
                        >
                          {card.closed ? "Card Closed" : "Mission accomplished → Close card"}
                        </button>
                      </div>

                      <div className="small muted">
                        Payout status: {String(o.payout?.status || "—")} • Stage:{" "}
                        {String(o.fulfillment?.stage || "—")}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </main>

        <Footer />
      </div>

      <style jsx>{`
        .cards {
          display: grid;
          gap: 12px;
        }
        .card {
          border: 1px solid #e5e7eb;
          border-radius: 14px;
          background: #fff;
          padding: 12px 12px;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
        }
        .card.closed {
          opacity: 0.8;
        }
        .cardTop {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          align-items: flex-start;
        }
        .kicker {
          font-size: 11px;
          letter-spacing: 0.2em;
          color: #6b7280;
          font-weight: 800;
        }
        .big {
          font-size: 16px;
          font-weight: 900;
          color: #0b1220;
        }
        .sub {
          margin-top: 6px;
          display: flex;
          gap: 10px;
          align-items: center;
        }
        .pill {
          display: inline-flex;
          padding: 4px 10px;
          border-radius: 999px;
          background: #0b1220;
          color: white;
          font-weight: 800;
          font-size: 12px;
        }
        .muted {
          color: #6b7280;
          font-size: 12px;
        }
        .right {
          display: grid;
          justify-items: end;
          gap: 8px;
        }
        .price {
          font-size: 16px;
          font-weight: 900;
        }
        .btn {
          border: none;
          border-radius: 999px;
          background: #0b1220;
          color: #fff;
          padding: 8px 12px;
          font-weight: 800;
          cursor: pointer;
          font-size: 12px;
        }
        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .btnSecondary {
          border: 1px solid #0b1220;
          border-radius: 999px;
          background: #fff;
          color: #0b1220;
          padding: 8px 12px;
          font-weight: 800;
          cursor: pointer;
          font-size: 12px;
        }
        .rowGrid {
          margin-top: 12px;
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }
        .box {
          border: 1px solid #eef2f7;
          border-radius: 12px;
          padding: 10px;
          background: #fafafa;
        }
        .label {
          font-size: 12px;
          color: #6b7280;
          font-weight: 800;
          margin-bottom: 6px;
        }
        .value {
          font-size: 13px;
          font-weight: 800;
          color: #0b1220;
        }
        .small {
          font-size: 12px;
          color: #4b5563;
          margin-top: 4px;
        }
        .pre {
          white-space: pre-line;
        }
        .link {
          display: inline-block;
          margin-top: 6px;
          font-size: 12px;
          font-weight: 800;
          text-decoration: underline;
          color: #0b1220;
        }
        .cardBody {
          margin-top: 12px;
          border-top: 1px solid #eef2f7;
          padding-top: 12px;
        }
        .sectionTitle {
          font-size: 12px;
          letter-spacing: 0.18em;
          color: #0b1220;
          font-weight: 900;
          margin: 10px 0 8px;
          text-transform: uppercase;
        }
        .checks {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }
        .check {
          display: flex;
          gap: 8px;
          align-items: center;
          font-size: 13px;
          color: #111827;
          font-weight: 700;
        }
        .remarks {
          width: 100%;
          min-height: 90px;
          border: 1px solid #d1d5db;
          border-radius: 12px;
          padding: 10px;
          font-size: 13px;
          outline: none;
        }
        .actions {
          margin-top: 10px;
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }
        .empty {
          padding: 18px;
          text-align: center;
          color: #6b7280;
        }
        .banner-error {
          margin-bottom: 16px;
          padding: 8px 10px;
          border-radius: 6px;
          font-size: 13px;
          background: #7f1d1d;
          color: #fee2e2;
        }
        @media (max-width: 900px) {
          .rowGrid {
            grid-template-columns: 1fr;
          }
          .checks {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async () => {
  try {
    const snap = await adminDb.collection("orders").orderBy("createdAt", "desc").limit(200).get();

    const initialOrders: Order[] = snap.docs.map((doc) => {
      const d: any = doc.data() || {};
      const buyer = d.buyer || {};
      const totals = d.totals || {};
      const createdAt =
        d.createdAt?.toDate?.().toLocaleString("en-US") ||
        d.createdAt?.toDate?.().toString?.() ||
        "";

      return {
        id: doc.id,
        listingId: d.listingId || "",
        listingTitle: d.listingTitle || "",
        buyerName: buyer.name || "",
        buyerEmail: buyer.email || "",
        sellerId: d.sellerId || "",
        status: d.status || "Paid",
        createdAt,
        totals: { currency: totals.currency || "USD", total: Number(totals.total || 0) },
        shippingAddress: d.shippingAddress || null,
        shipping: d.shipping || {},
        fulfillment: d.fulfillment || {},
        payout: d.payout || {},
        adminCard: d.adminCard || {},
      };
    });

    return { props: { initialOrders } };
  } catch (err) {
    console.error("Error loading orders", err);
    return { props: { initialOrders: [] } };
  }
};
