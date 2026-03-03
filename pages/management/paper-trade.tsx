import { useMemo, useState } from "react";
import type { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { adminDb } from "../../utils/firebaseAdmin";
import { useRequireAdmin } from "../../hooks/useRequireAdmin";

/* ─── types ─────────────────────────────────────────── */

type ListingOption = {
  id: string;
  title: string;
  brand: string;
  price: number;
  currency: string;
  sellerId: string;
};

type PaperOrder = {
  id: string;
  listingId: string;
  listingTitle: string;
  buyerName: string;
  buyerEmail: string;
  sellerId: string;
  sellerName: string;
  total: number;
  currency: string;
  status: string;
  stage: string;
  trackingNumber: string;
  labelUrl: string;
  createdAt: string;
};

type Props = {
  listings: ListingOption[];
  paperOrders: PaperOrder[];
};

/* ─── stage helpers ─────────────────────────────────── */

const ROAD = [
  { key: "PAID",                  label: "Order Placed & Paid" },
  { key: "LABEL_GENERATED",      label: "Label Generated" },
  { key: "SHIPPED",              label: "Order Shipped" },
  { key: "DELIVERED",            label: "Delivered" },
  { key: "SIGNATURE_CONFIRMED",  label: "Signature Confirmed" },
  { key: "COOLING_COMPLETE",     label: "Cooling Complete" },
  { key: "PAYOUT_RELEASED",      label: "Payout Released" },
];

function stageIndex(stage: string) {
  const s = stage.toUpperCase();
  // "COMPLETED" is the final state — same as after PAYOUT_RELEASED
  if (s === "COMPLETED") return ROAD.length;
  const idx = ROAD.findIndex((r) => r.key === s);
  return idx >= 0 ? idx + 1 : 0;
}

function money(amount: number, currency = "USD") {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
  } catch {
    return `$${amount.toFixed(2)}`;
  }
}

/* ─── component ─────────────────────────────────────── */

export default function PaperTradePage({ listings, paperOrders: initial }: Props) {
  const { loading } = useRequireAdmin();
  const [orders, setOrders] = useState<PaperOrder[]>(initial);
  const [busy, setBusy] = useState(false);

  // ─ Create form state ─
  const [selectedListing, setSelectedListing] = useState("");
  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [addrLine1, setAddrLine1] = useState("");
  const [addrLine2, setAddrLine2] = useState("");
  const [addrCity, setAddrCity] = useState("");
  const [addrState, setAddrState] = useState("");
  const [addrZip, setAddrZip] = useState("");
  const [addrCountry, setAddrCountry] = useState("US");

  // ─ Delete-by-email state ─
  const [deleteEmail, setDeleteEmail] = useState("");

  const [listingSearch, setListingSearch] = useState("");

  const filteredListings = useMemo(() => {
    const q = listingSearch.trim().toLowerCase();
    if (!q) return listings.slice(0, 30);
    return listings.filter(
      (l) =>
        l.title.toLowerCase().includes(q) ||
        l.brand.toLowerCase().includes(q) ||
        l.id.toLowerCase().includes(q)
    ).slice(0, 30);
  }, [listings, listingSearch]);

  /* ─── API calls ───────────────────────────────────── */

  async function createOrder() {
    if (!selectedListing || !buyerName || !buyerEmail) {
      alert("Select a listing and enter buyer name + email.");
      return;
    }
    setBusy(true);
    try {
      const r = await fetch("/api/management/paper-trade/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId: selectedListing,
          buyerName, buyerEmail, buyerPhone,
          shippingAddress: {
            name: buyerName,
            line1: addrLine1, line2: addrLine2,
            city: addrCity, state: addrState,
            postalCode: addrZip, country: addrCountry,
          },
        }),
      });
      const json = await r.json();
      if (!r.ok) throw new Error(json.error || "Failed");

      const listing = listings.find((l) => l.id === selectedListing);
      const newOrder: PaperOrder = {
        id: json.orderId,
        listingId: selectedListing,
        listingTitle: json.listingTitle || listing?.title || "",
        buyerName,
        buyerEmail,
        sellerId: listing?.sellerId || "",
        sellerName: "",
        total: json.total || listing?.price || 0,
        currency: json.currency || "USD",
        status: "paid",
        stage: "PAID",
        trackingNumber: "",
        labelUrl: "",
        createdAt: new Date().toLocaleString("en-US"),
      };
      setOrders((prev) => [newOrder, ...prev]);
      // Reset form
      setSelectedListing("");
      setBuyerName(""); setBuyerEmail(""); setBuyerPhone("");
      setAddrLine1(""); setAddrLine2(""); setAddrCity("");
      setAddrState(""); setAddrZip(""); setAddrCountry("US");
      alert(`Paper trade order created!\nOrder ID: ${json.orderId}`);
    } catch (e: any) {
      alert(e.message || "Error creating paper trade order");
    } finally {
      setBusy(false);
    }
  }

  async function advanceOrder(orderId: string) {
    setBusy(true);
    try {
      const r = await fetch("/api/management/paper-trade/advance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      const json = await r.json();
      if (!r.ok) throw new Error(json.error || "Failed");

      setOrders((prev) =>
        prev.map((o) => {
          if (o.id !== orderId) return o;
          const stage = String(json.stage || "").toUpperCase();
          return {
            ...o,
            stage,
            status: stage === "SHIPPED" ? "Shipped"
              : stage === "DELIVERED" ? "Delivered"
              : stage === "PAYOUT_RELEASED" ? "Completed"
              : o.status,
            trackingNumber: stage === "LABEL_GENERATED" || stage === "SHIPPED"
              ? o.trackingNumber || `1Z999PT...`
              : o.trackingNumber,
          };
        })
      );
    } catch (e: any) {
      alert(e.message || "Error advancing order");
    } finally {
      setBusy(false);
    }
  }

  async function resetOrder(orderId: string) {
    if (!window.confirm("Reset this paper trade? The listing will be restored to live.")) return;
    setBusy(true);
    try {
      const r = await fetch("/api/management/paper-trade/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      const json = await r.json();
      if (!r.ok) throw new Error(json.error || "Failed");
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
    } catch (e: any) {
      alert(e.message || "Error resetting order");
    } finally {
      setBusy(false);
    }
  }

  async function deleteCustomerByEmail() {
    const email = deleteEmail.trim().toLowerCase();
    if (!email) { alert("Enter an email address."); return; }
    if (!window.confirm(`Delete customer with email "${email}" from Firebase Auth + Firestore?\n\nThis allows them to re-register.`)) return;
    setBusy(true);
    try {
      const r = await fetch("/api/management/customers/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = await r.json();
      if (!r.ok) throw new Error(json.error || "Failed");
      alert(`Customer deleted.\nFirestore: ${json.deletedFirestore ? "Yes" : "No"}\nFirebase Auth: ${json.deletedAuth ? "Yes" : "No"}`);
      setDeleteEmail("");
    } catch (e: any) {
      alert(e.message || "Error deleting customer");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <div className="dashboard-page" />;

  return (
    <>
      <Head>
        <title>Paper Trade — Test Cycle — Management</title>
      </Head>

      <div className="dashboard-page">
        <Header />

        <main className="dashboard-main">
          <div className="dashboard-header">
            <div>
              <h1>Paper Trade — Test Cycle</h1>
              <p>
                Simulate the full customer purchase cycle: register &rarr; buy
                &rarr; payment &rarr; label &rarr; ship &rarr; deliver &rarr;
                payout. No real PayPal charges.
              </p>
            </div>
            <Link href="/management/dashboard">
              &larr; Back to Dashboard
            </Link>
          </div>

          {/* ──── Section 1: Delete / Reset Customer ──── */}
          <div className="section">
            <h2>1. Reset a Customer (Delete by Email)</h2>
            <p className="hint">
              Remove a customer from Firebase Auth and Firestore so they can
              re-register and you can test the full sign-up &rarr; purchase
              cycle from scratch.
            </p>
            <div className="row">
              <input
                className="input"
                placeholder="Customer email (e.g. jaffaleffler@gmail.com)"
                value={deleteEmail}
                onChange={(e) => setDeleteEmail(e.target.value)}
              />
              <button
                className="btn btn-danger"
                disabled={busy}
                onClick={deleteCustomerByEmail}
              >
                Delete Customer
              </button>
            </div>
          </div>

          {/* ──── Section 2: Create Paper Trade Order ──── */}
          <div className="section">
            <h2>2. Create a Paper Trade Order</h2>
            <p className="hint">
              Pick a live listing and enter buyer details. This simulates a
              completed PayPal payment — the listing will be marked as sold and
              an order created in &quot;paid&quot; status.
            </p>

            <div className="form-grid">
              <div className="field full">
                <label>Search listing</label>
                <input
                  className="input"
                  placeholder="Search by title, brand, or ID..."
                  value={listingSearch}
                  onChange={(e) => setListingSearch(e.target.value)}
                />
              </div>

              <div className="field full">
                <label>Select listing</label>
                <select
                  className="input"
                  value={selectedListing}
                  onChange={(e) => setSelectedListing(e.target.value)}
                >
                  <option value="">— choose a listing —</option>
                  {filteredListings.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.title} — {money(l.price, l.currency)} ({l.brand || "No brand"})
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label>Buyer name *</label>
                <input className="input" value={buyerName} onChange={(e) => setBuyerName(e.target.value)} />
              </div>
              <div className="field">
                <label>Buyer email *</label>
                <input className="input" value={buyerEmail} onChange={(e) => setBuyerEmail(e.target.value)} />
              </div>
              <div className="field">
                <label>Buyer phone</label>
                <input className="input" value={buyerPhone} onChange={(e) => setBuyerPhone(e.target.value)} />
              </div>

              <div className="field">
                <label>Address line 1</label>
                <input className="input" value={addrLine1} onChange={(e) => setAddrLine1(e.target.value)} />
              </div>
              <div className="field">
                <label>Address line 2</label>
                <input className="input" value={addrLine2} onChange={(e) => setAddrLine2(e.target.value)} />
              </div>
              <div className="field">
                <label>City</label>
                <input className="input" value={addrCity} onChange={(e) => setAddrCity(e.target.value)} />
              </div>
              <div className="field">
                <label>State</label>
                <input className="input" value={addrState} onChange={(e) => setAddrState(e.target.value)} />
              </div>
              <div className="field">
                <label>Zip / Postal</label>
                <input className="input" value={addrZip} onChange={(e) => setAddrZip(e.target.value)} />
              </div>
              <div className="field">
                <label>Country</label>
                <input className="input" value={addrCountry} onChange={(e) => setAddrCountry(e.target.value)} />
              </div>
            </div>

            <button
              className="btn btn-primary"
              disabled={busy || !selectedListing || !buyerName || !buyerEmail}
              onClick={createOrder}
            >
              {busy ? "Creating..." : "Create Paper Trade Order"}
            </button>
          </div>

          {/* ──── Section 3: Active Paper Trades (Roadmap) ──── */}
          <div className="section">
            <h2>3. Active Paper Trades — Walk Through the Cycle</h2>
            <p className="hint">
              Click <strong>Next Step</strong> to advance each order through
              the lifecycle. Use <strong>Reset</strong> to delete the order and
              restore the listing.
            </p>

            {orders.length === 0 && (
              <div className="empty">No paper-trade orders yet. Create one above.</div>
            )}

            {orders.map((o) => {
              const si = stageIndex(o.stage);
              const isComplete = si >= ROAD.length;

              return (
                <div key={o.id} className="trade-card">
                  <div className="trade-header">
                    <div>
                      <div className="trade-kicker">PAPER TRADE</div>
                      <div className="trade-title">{o.listingTitle}</div>
                      <div className="trade-meta">
                        {money(o.total, o.currency)} &middot; {o.buyerName} ({o.buyerEmail}) &middot; Order {o.id.slice(0, 8)}...
                      </div>
                    </div>
                    <div className="trade-actions">
                      {!isComplete && (
                        <button
                          className="btn btn-primary btn-sm"
                          disabled={busy}
                          onClick={() => advanceOrder(o.id)}
                        >
                          Next Step &rarr;
                        </button>
                      )}
                      <button
                        className="btn btn-danger btn-sm"
                        disabled={busy}
                        onClick={() => resetOrder(o.id)}
                      >
                        Reset
                      </button>
                    </div>
                  </div>

                  {/* Roadmap progress bar */}
                  <div className="roadmap">
                    {ROAD.map((step, i) => {
                      const done = i < si;
                      const current = i === si && !isComplete;
                      return (
                        <div
                          key={step.key}
                          className={`road-step ${done ? "done" : ""} ${current ? "current" : ""}`}
                        >
                          <div className="road-dot" />
                          <div className="road-label">{step.label}</div>
                        </div>
                      );
                    })}
                  </div>

                  {o.trackingNumber && (
                    <div className="trade-tracking">
                      Tracking: {o.trackingNumber}
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
        .section {
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 14px;
          padding: 20px;
          margin-bottom: 20px;
        }
        .section h2 {
          font-size: 16px;
          font-weight: 900;
          color: #0b1220;
          margin: 0 0 4px;
        }
        .hint {
          color: #6b7280;
          font-size: 13px;
          margin: 0 0 14px;
          line-height: 1.5;
        }

        .row {
          display: flex;
          gap: 10px;
          align-items: center;
          flex-wrap: wrap;
        }
        .input {
          border: 1px solid #d1d5db;
          border-radius: 6px;
          padding: 8px 12px;
          font-size: 14px;
          width: 100%;
          max-width: 360px;
        }
        .input:focus {
          border-color: #111827;
          outline: none;
        }
        select.input {
          max-width: 100%;
        }

        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 12px;
          margin-bottom: 14px;
        }
        .field {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .field.full {
          grid-column: 1 / -1;
        }
        .field label {
          font-size: 11px;
          font-weight: 800;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .field .input {
          max-width: none;
        }

        .btn {
          border: none;
          border-radius: 999px;
          padding: 10px 20px;
          font-weight: 800;
          font-size: 13px;
          cursor: pointer;
          white-space: nowrap;
        }
        .btn:disabled {
          opacity: 0.5;
          cursor: default;
        }
        .btn-primary {
          background: #0b1220;
          color: #fff;
        }
        .btn-primary:hover:not(:disabled) {
          background: #1f2937;
        }
        .btn-danger {
          background: #fee2e2;
          color: #b91c1c;
          border: 1px solid #dc2626;
        }
        .btn-danger:hover:not(:disabled) {
          background: #fecaca;
        }
        .btn-sm {
          padding: 6px 14px;
          font-size: 12px;
        }

        .empty {
          text-align: center;
          color: #9ca3af;
          padding: 20px;
          font-size: 14px;
        }

        /* ─── Trade card ─── */
        .trade-card {
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 12px;
          background: #fafafa;
        }
        .trade-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 14px;
        }
        .trade-kicker {
          font-size: 11px;
          letter-spacing: 0.2em;
          font-weight: 800;
          color: #b45309;
        }
        .trade-title {
          font-size: 15px;
          font-weight: 900;
          color: #0b1220;
        }
        .trade-meta {
          font-size: 12px;
          color: #6b7280;
          margin-top: 2px;
        }
        .trade-actions {
          display: flex;
          gap: 8px;
          flex-shrink: 0;
        }
        .trade-tracking {
          font-size: 12px;
          color: #374151;
          margin-top: 8px;
          font-family: monospace;
        }

        /* ─── Roadmap ─── */
        .roadmap {
          display: flex;
          gap: 0;
          align-items: flex-start;
        }
        .road-step {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
          text-align: center;
        }
        .road-step::before {
          content: "";
          position: absolute;
          top: 8px;
          left: -50%;
          right: 50%;
          height: 3px;
          background: #e5e7eb;
        }
        .road-step:first-child::before {
          display: none;
        }
        .road-step.done::before {
          background: #22c55e;
        }
        .road-step.current::before {
          background: #3b82f6;
        }

        .road-dot {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #e5e7eb;
          border: 3px solid #fff;
          z-index: 1;
          box-shadow: 0 0 0 2px #e5e7eb;
        }
        .road-step.done .road-dot {
          background: #22c55e;
          box-shadow: 0 0 0 2px #22c55e;
        }
        .road-step.current .road-dot {
          background: #3b82f6;
          box-shadow: 0 0 0 2px #3b82f6;
          animation: pulse 1.5s infinite;
        }
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 2px #3b82f6; }
          50% { box-shadow: 0 0 0 5px rgba(59, 130, 246, 0.3); }
        }

        .road-label {
          font-size: 10px;
          font-weight: 700;
          color: #9ca3af;
          margin-top: 6px;
          line-height: 1.3;
        }
        .road-step.done .road-label {
          color: #166534;
        }
        .road-step.current .road-label {
          color: #1d4ed8;
          font-weight: 900;
        }

        @media (max-width: 900px) {
          .form-grid {
            grid-template-columns: 1fr 1fr;
          }
        }
        @media (max-width: 600px) {
          .form-grid {
            grid-template-columns: 1fr;
          }
          .roadmap {
            flex-wrap: wrap;
          }
          .road-step {
            min-width: 80px;
          }
          .road-step::before {
            display: none;
          }
        }
      `}</style>
    </>
  );
}

/* ─── data ──────────────────────────────────────────── */

export const getServerSideProps: GetServerSideProps<Props> = async () => {
  try {
    // Live listings the user can pick from
    const listingsSnap = await adminDb
      .collection("listings")
      .where("status", "in", ["live", "Live", "active", "Active", "approved", "Approved"])
      .orderBy("createdAt", "desc")
      .limit(200)
      .get();

    const listings: ListingOption[] = listingsSnap.docs
      .filter((doc) => {
        const d: any = doc.data() || {};
        return !(d.isSold || d.sold);
      })
      .map((doc) => {
        const d: any = doc.data() || {};
        return {
          id: doc.id,
          title: String(d.title || d.name || "Untitled").slice(0, 80),
          brand: String(d.brand || d.designer || ""),
          price:
            typeof d.priceUsd === "number" ? d.priceUsd
            : typeof d.price === "number" ? d.price
            : Number(d.price || 0),
          currency: String(d.currency || "USD").toUpperCase(),
          sellerId: String(d.sellerId || d.seller || ""),
        };
      });

    // Existing paper-trade orders
    const ordersSnap = await adminDb
      .collection("orders")
      .where("paperTrade", "==", true)
      .orderBy("createdAt", "desc")
      .limit(50)
      .get();

    const paperOrders: PaperOrder[] = ordersSnap.docs.map((doc) => {
      const d: any = doc.data() || {};
      return {
        id: doc.id,
        listingId: d.listingId || "",
        listingTitle: d.listingTitle || "",
        buyerName: d.buyerName || d.buyer?.name || "",
        buyerEmail: d.buyerEmail || d.buyer?.email || "",
        sellerId: d.sellerId || "",
        sellerName: d.sellerName || "",
        total: Number(d.totals?.total || 0),
        currency: String(d.totals?.currency || d.currency || "USD"),
        status: d.status || "paid",
        stage: String(d.fulfillment?.stage || "PAID").toUpperCase(),
        trackingNumber: d.shipping?.trackingNumber || "",
        labelUrl: d.shipping?.labelUrl || "",
        createdAt: d.createdAt?.toDate?.().toLocaleString("en-US") || "",
      };
    });

    return { props: { listings, paperOrders } };
  } catch (err) {
    console.error("Error loading paper trade data", err);
    return { props: { listings: [], paperOrders: [] } };
  }
};
