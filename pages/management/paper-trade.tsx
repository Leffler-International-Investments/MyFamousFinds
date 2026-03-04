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
  image: string;
  condition: string;
  category: string;
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

/* ─── helpers ───────────────────────────────────────── */

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
  const [createLog, setCreateLog] = useState<string[]>([]);

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

  // ─ Seller address override (ensures UPS label works) ─
  const [sellerEmailOverride, setSellerEmailOverride] = useState("");
  const [sellerAddrName, setSellerAddrName] = useState("");
  const [sellerAddrPhone, setSellerAddrPhone] = useState("");
  const [sellerAddrLine1, setSellerAddrLine1] = useState("");
  const [sellerAddrLine2, setSellerAddrLine2] = useState("");
  const [sellerAddrCity, setSellerAddrCity] = useState("");
  const [sellerAddrState, setSellerAddrState] = useState("");
  const [sellerAddrZip, setSellerAddrZip] = useState("");
  const [sellerAddrCountry, setSellerAddrCountry] = useState("US");

  // ─ Delete-by-email state ─
  const [deleteEmail, setDeleteEmail] = useState("");

  const [listingSearch, setListingSearch] = useState("");

  const filteredListings = useMemo(() => {
    const q = listingSearch.trim().toLowerCase();
    if (!q) return listings.slice(0, 50);
    return listings.filter(
      (l) =>
        l.title.toLowerCase().includes(q) ||
        l.brand.toLowerCase().includes(q) ||
        l.id.toLowerCase().includes(q) ||
        l.category.toLowerCase().includes(q)
    ).slice(0, 50);
  }, [listings, listingSearch]);

  const selectedListingData = listings.find((l) => l.id === selectedListing);

  /* ─── API calls ───────────────────────────────────── */

  async function createOrder() {
    if (!selectedListing || !buyerName || !buyerEmail) {
      alert("Select a listing and enter buyer name + email.");
      return;
    }
    setBusy(true);
    setCreateLog(["Creating paper trade order..."]);
    try {
      const body: Record<string, any> = {
        listingId: selectedListing,
        buyerName, buyerEmail, buyerPhone,
        shippingAddress: {
          name: buyerName,
          line1: addrLine1, line2: addrLine2,
          city: addrCity, state: addrState,
          postalCode: addrZip, country: addrCountry,
        },
      };
      // Include seller address override if provided (ensures UPS label works)
      if (sellerAddrLine1 && sellerAddrCity && sellerAddrState && sellerAddrZip) {
        body.sellerAddress = {
          name: sellerAddrName, phone: sellerAddrPhone,
          line1: sellerAddrLine1, line2: sellerAddrLine2,
          city: sellerAddrCity, state: sellerAddrState,
          postalCode: sellerAddrZip, country: sellerAddrCountry,
        };
      }
      if (sellerEmailOverride.trim()) {
        body.sellerEmail = sellerEmailOverride.trim();
      }
      const r = await fetch("/api/management/paper-trade/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await r.json();
      if (!r.ok) throw new Error(json.error || "Failed");

      const log: string[] = [];
      log.push(`Order created: ${json.orderId}`);
      log.push(`Buyer confirmation email: ${json.buyerEmailSent ? "SENT" : "FAILED"}`);
      if (json.buyerEmailError) log.push(`  Error: ${json.buyerEmailError}`);
      log.push(`Seller email: ${json.sellerEmailSent ? "SENT" : "NOT SENT"} (${json.sellerEmail || "no email"})`);
      if (json.sellerEmailError) log.push(`  Error: ${json.sellerEmailError}`);
      if (json.labelEmailSent) log.push(`Seller label email: SENT (with UPS label attached)`);
      if (json.buyerShippingEmailSent) log.push(`Buyer shipping notification: SENT (with tracking)`);
      log.push(`UPS label generated: ${json.labelGenerated ? "YES" : "NO"}`);
      if (json.trackingNumber) log.push(`Tracking #: ${json.trackingNumber}`);
      if (json.labelUrl) log.push(`Label URL: ${json.labelUrl}`);
      if (json.buyerShippingEmailSent) log.push("Buyer shipping notification: SENT");
      if (json.labelError) log.push(`Label note: ${json.labelError}`);
      setCreateLog(log);

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
        stage: json.labelGenerated ? "LABEL_GENERATED" : "PAID",
        trackingNumber: json.trackingNumber || "",
        labelUrl: json.labelUrl || "",
        createdAt: new Date().toLocaleString("en-US"),
      };
      setOrders((prev) => [newOrder, ...prev]);
      setSelectedListing("");
      setBuyerName(""); setBuyerEmail(""); setBuyerPhone("");
      setAddrLine1(""); setAddrLine2(""); setAddrCity("");
      setAddrState(""); setAddrZip(""); setAddrCountry("US");
    } catch (e: any) {
      setCreateLog((prev) => [...prev, `ERROR: ${e.message}`]);
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

  async function resetAllOrders() {
    if (!window.confirm(
      `Reset ALL ${orders.length} paper-trade orders?\n\n` +
      `This will:\n` +
      `• Delete all paper-trade orders\n` +
      `• Restore all listings back to "Live"\n` +
      `• Allow you to test again with the same items\n\n` +
      `This cannot be undone.`
    )) return;
    setBusy(true);
    try {
      const r = await fetch("/api/management/paper-trade/reset-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const json = await r.json();
      if (!r.ok) throw new Error(json.error || "Failed");
      setOrders([]);
      alert(`Done! Reset ${json.reset} orders, restored ${json.restored} listings back to Live.`);
      // Reload the page to refresh the listings grid
      window.location.reload();
    } catch (e: any) {
      alert(e.message || "Error resetting all orders");
    } finally {
      setBusy(false);
    }
  }

  async function deleteCustomerByEmail() {
    const email = deleteEmail.trim().toLowerCase();
    if (!email) { alert("Enter an email address."); return; }
    if (!window.confirm(`Delete customer "${email}" from Firebase Auth + Firestore?\n\nThis allows them to re-register.`)) return;
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
        <title>Paper Trade — Full Test Cycle — Management</title>
      </Head>

      <div className="dashboard-page">
        <Header />

        <main className="dashboard-main">
          <div className="dashboard-header">
            <div>
              <h1>Paper Trade — Full Test Cycle</h1>
              <p>
                Run the REAL purchase cycle end-to-end: select a listing, enter
                buyer details, and the system will create the order, send buyer
                confirmation email, generate a real UPS label, and email the
                seller the label — exactly like a live PayPal purchase.
              </p>
            </div>
            <Link href="/management/dashboard">&larr; Back to Dashboard</Link>
          </div>

          {/* ──── Section 1: Delete / Reset Customer ──── */}
          <div className="section">
            <h2>1. Reset a Customer (Delete by Email)</h2>
            <p className="hint">
              Remove a customer from Firebase Auth and Firestore so they can
              re-register. Use this to test the full sign-up &rarr; purchase
              cycle from scratch.
            </p>
            <div className="row">
              <input
                className="input"
                placeholder="Customer email (e.g. jaffaleffler@gmail.com)"
                value={deleteEmail}
                onChange={(e) => setDeleteEmail(e.target.value)}
              />
              <button className="btn btn-danger" disabled={busy} onClick={deleteCustomerByEmail}>
                Delete Customer
              </button>
            </div>
          </div>

          {/* ──── Section 2: Select a Listing ──── */}
          <div className="section">
            <h2>2. Select a Listing</h2>
            <p className="hint">
              Browse live listings — click a card to select it for the paper
              trade. You will see the item image, title, brand, price, and
              seller.
            </p>
            <input
              className="input full-input"
              placeholder="Search by title, brand, category, or listing ID..."
              value={listingSearch}
              onChange={(e) => setListingSearch(e.target.value)}
            />

            {filteredListings.length === 0 && (
              <div className="empty">
                No live listings found. Make sure listings have status
                &quot;Live&quot; and are not marked as sold.
              </div>
            )}

            <div className="listing-grid">
              {filteredListings.map((l) => (
                <div
                  key={l.id}
                  className={`listing-card ${selectedListing === l.id ? "selected" : ""}`}
                  onClick={() => setSelectedListing(l.id)}
                >
                  <div className="listing-img-wrap">
                    {l.image ? (
                      <img src={l.image} alt={l.title} className="listing-img" />
                    ) : (
                      <div className="listing-img-placeholder">No Image</div>
                    )}
                  </div>
                  <div className="listing-info">
                    <div className="listing-title">{l.title}</div>
                    <div className="listing-brand">{l.brand || "No brand"}</div>
                    <div className="listing-price">{money(l.price, l.currency)}</div>
                    {l.condition && <div className="listing-meta">{l.condition}</div>}
                    <div className="listing-meta">{l.category || "Uncategorized"}</div>
                    <div className="listing-meta id">ID: {l.id.slice(0, 10)}...</div>
                  </div>
                  {selectedListing === l.id && <div className="selected-badge">SELECTED</div>}
                </div>
              ))}
            </div>

            {selectedListingData && (
              <div className="selected-summary">
                Selected: <strong>{selectedListingData.title}</strong> — {money(selectedListingData.price, selectedListingData.currency)}
              </div>
            )}
          </div>

          {/* ──── Section 3: Buyer Details ──── */}
          <div className="section">
            <h2>3. Enter Buyer Details</h2>
            <p className="hint">
              Enter the test buyer&apos;s information. Use your own email
              (e.g. Itai.leff@gmail.com) to receive the buyer confirmation
              email and shipping notification. The seller email will go to
              the seller on record for the listing.
            </p>

            <div className="form-grid">
              <div className="field">
                <label>Buyer name *</label>
                <input className="input" value={buyerName} onChange={(e) => setBuyerName(e.target.value)} placeholder="e.g. Itai Leffler" />
              </div>
              <div className="field">
                <label>Buyer email *</label>
                <input className="input" value={buyerEmail} onChange={(e) => setBuyerEmail(e.target.value)} placeholder="e.g. Itai.leff@gmail.com" />
              </div>
              <div className="field">
                <label>Buyer phone</label>
                <input className="input" value={buyerPhone} onChange={(e) => setBuyerPhone(e.target.value)} />
              </div>
              <div className="field">
                <label>Address line 1 *</label>
                <input className="input" value={addrLine1} onChange={(e) => setAddrLine1(e.target.value)} />
              </div>
              <div className="field">
                <label>Address line 2</label>
                <input className="input" value={addrLine2} onChange={(e) => setAddrLine2(e.target.value)} />
              </div>
              <div className="field">
                <label>City *</label>
                <input className="input" value={addrCity} onChange={(e) => setAddrCity(e.target.value)} />
              </div>
              <div className="field">
                <label>State *</label>
                <input className="input" value={addrState} onChange={(e) => setAddrState(e.target.value)} />
              </div>
              <div className="field">
                <label>Zip / Postal *</label>
                <input className="input" value={addrZip} onChange={(e) => setAddrZip(e.target.value)} />
              </div>
              <div className="field">
                <label>Country</label>
                <input className="input" value={addrCountry} onChange={(e) => setAddrCountry(e.target.value)} />
              </div>
            </div>

            <h3 className="sub-heading">Seller Address Override (for UPS Label)</h3>
            <p className="hint">
              If the seller doesn&apos;t have an address on file, provide one here.
              This gets saved to <code>seller_banking</code> so the UPS label
              generation can build a valid sender address.
            </p>

            <div className="form-grid">
              <div className="field">
                <label>Seller email override</label>
                <input className="input" value={sellerEmailOverride} onChange={(e) => setSellerEmailOverride(e.target.value)} placeholder="e.g. leffleryd@gmail.com" />
              </div>
              <div className="field">
                <label>Sender name</label>
                <input className="input" value={sellerAddrName} onChange={(e) => setSellerAddrName(e.target.value)} placeholder="e.g. Yaffa Leffler" />
              </div>
              <div className="field">
                <label>Sender phone</label>
                <input className="input" value={sellerAddrPhone} onChange={(e) => setSellerAddrPhone(e.target.value)} />
              </div>
              <div className="field">
                <label>Address line 1</label>
                <input className="input" value={sellerAddrLine1} onChange={(e) => setSellerAddrLine1(e.target.value)} />
              </div>
              <div className="field">
                <label>Address line 2</label>
                <input className="input" value={sellerAddrLine2} onChange={(e) => setSellerAddrLine2(e.target.value)} />
              </div>
              <div className="field">
                <label>City</label>
                <input className="input" value={sellerAddrCity} onChange={(e) => setSellerAddrCity(e.target.value)} />
              </div>
              <div className="field">
                <label>State</label>
                <input className="input" value={sellerAddrState} onChange={(e) => setSellerAddrState(e.target.value)} />
              </div>
              <div className="field">
                <label>Zip / Postal</label>
                <input className="input" value={sellerAddrZip} onChange={(e) => setSellerAddrZip(e.target.value)} />
              </div>
              <div className="field">
                <label>Country</label>
                <input className="input" value={sellerAddrCountry} onChange={(e) => setSellerAddrCountry(e.target.value)} />
              </div>
            </div>

            <button
              className="btn btn-primary btn-lg"
              disabled={busy || !selectedListing || !buyerName || !buyerEmail || !addrLine1 || !addrCity || !addrState || !addrZip}
              onClick={createOrder}
            >
              {busy ? "Processing..." : "Place Paper Trade Order (Real Emails + UPS Label)"}
            </button>

            {createLog.length > 0 && (
              <div className="log-box">
                <div className="log-title">Execution Log</div>
                {createLog.map((line, i) => (
                  <div key={i} className={`log-line ${line.startsWith("ERROR") ? "log-error" : ""}`}>{line}</div>
                ))}
              </div>
            )}
          </div>

          {/* ──── Section 4: Active Paper Trades ──── */}
          <div className="section">
            <div className="section-header-row">
              <div>
                <h2>4. Active Paper Trades — Order Lifecycle</h2>
                <p className="hint">
                  Each paper trade below mirrors a real order. Click <strong>Next Step</strong> to
                  advance through remaining stages. Use <strong>Reset</strong> to delete individual orders,
                  or <strong>Reset All</strong> to clear everything and start fresh.
                </p>
              </div>
              {orders.length > 0 && (
                <button
                  className="btn btn-reset-all"
                  disabled={busy}
                  onClick={resetAllOrders}
                >
                  {busy ? "Resetting..." : `Reset All (${orders.length})`}
                </button>
              )}
            </div>

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
                        {money(o.total, o.currency)} &middot; {o.buyerName} ({o.buyerEmail})
                      </div>
                      <div className="trade-meta">
                        Order: <code>{o.id}</code> &middot; {o.createdAt}
                      </div>
                    </div>
                    <div className="trade-actions">
                      {!isComplete && (
                        <button className="btn btn-primary btn-sm" disabled={busy} onClick={() => advanceOrder(o.id)}>
                          Next Step &rarr;
                        </button>
                      )}
                      <Link href={`/management/order-roadmap?orderId=${o.id}`} className="btn btn-outline btn-sm">
                        View in Roadmap
                      </Link>
                      <Link href={`/management/ups-diagnostics?orderId=${o.id}`} className="btn btn-outline btn-sm">
                        UPS Diagnostics
                      </Link>
                      <button className="btn btn-danger btn-sm" disabled={busy} onClick={() => resetOrder(o.id)}>
                        Reset
                      </button>
                    </div>
                  </div>

                  {/* Roadmap progress */}
                  <div className="roadmap">
                    {ROAD.map((step, i) => {
                      const done = i < si;
                      const current = i === si && !isComplete;
                      return (
                        <div key={step.key} className={`road-step ${done ? "done" : ""} ${current ? "current" : ""}`}>
                          <div className="road-dot" />
                          <div className="road-label">{step.label}</div>
                        </div>
                      );
                    })}
                  </div>

                  {o.trackingNumber && (
                    <div className="trade-tracking">
                      Tracking: <strong>{o.trackingNumber}</strong>
                      {o.labelUrl && o.labelUrl !== "(paper-trade — no real label)" && (
                        <> &middot; <a href={o.labelUrl} target="_blank" rel="noreferrer">Download Label</a></>
                      )}
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
        .section { background: #fff; border: 1px solid #e5e7eb; border-radius: 14px; padding: 20px; margin-bottom: 20px; }
        .section h2 { font-size: 16px; font-weight: 900; color: #0b1220; margin: 0 0 4px; }
        .section-header-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; margin-bottom: 14px; }
        .section-header-row .hint { margin-bottom: 0; }
        .btn-reset-all { background: #dc2626; color: #fff; border: none; border-radius: 999px; padding: 10px 24px; font-weight: 800; font-size: 14px; cursor: pointer; white-space: nowrap; flex-shrink: 0; }
        .btn-reset-all:hover:not(:disabled) { background: #b91c1c; }
        .btn-reset-all:disabled { opacity: 0.5; cursor: default; }
        .hint { color: #6b7280; font-size: 13px; margin: 0 0 14px; line-height: 1.5; }
        .row { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
        .input { border: 1px solid #d1d5db; border-radius: 6px; padding: 8px 12px; font-size: 14px; width: 100%; }
        .input:focus { border-color: #111827; outline: none; }
        .full-input { margin-bottom: 14px; }

        /* ─── Listing grid ─── */
        .listing-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px; max-height: 420px; overflow-y: auto; padding: 2px; }
        .listing-card { border: 2px solid #e5e7eb; border-radius: 12px; overflow: hidden; cursor: pointer; transition: border-color 0.15s, box-shadow 0.15s; position: relative; background: #fff; }
        .listing-card:hover { border-color: #9ca3af; }
        .listing-card.selected { border-color: #0b1220; box-shadow: 0 0 0 2px #0b1220; }
        .listing-img-wrap { width: 100%; height: 160px; overflow: hidden; background: #f3f4f6; }
        .listing-img { width: 100%; height: 100%; object-fit: cover; }
        .listing-img-placeholder { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: #9ca3af; font-size: 13px; }
        .listing-info { padding: 10px 12px; }
        .listing-title { font-size: 13px; font-weight: 800; color: #0b1220; line-height: 1.3; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .listing-brand { font-size: 11px; font-weight: 700; color: #6b7280; margin-top: 2px; }
        .listing-price { font-size: 15px; font-weight: 900; color: #0b1220; margin-top: 4px; }
        .listing-meta { font-size: 11px; color: #9ca3af; margin-top: 2px; }
        .listing-meta.id { font-family: monospace; font-size: 10px; }
        .selected-badge { position: absolute; top: 8px; right: 8px; background: #0b1220; color: #fff; font-size: 10px; font-weight: 900; padding: 3px 8px; border-radius: 999px; letter-spacing: 0.1em; }
        .selected-summary { margin-top: 12px; padding: 10px 14px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; font-size: 13px; color: #166534; }

        /* ─── Form ─── */
        .form-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 14px; }
        .field { display: flex; flex-direction: column; gap: 4px; }
        .field label { font-size: 11px; font-weight: 800; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; }
        .sub-heading { font-size: 14px; font-weight: 900; color: #374151; margin: 18px 0 4px; }
        .sub-heading + .hint { margin-top: 0; }
        .sub-heading + .hint code { background: #e5e7eb; padding: 1px 4px; border-radius: 4px; font-size: 11px; }

        /* ─── Buttons ─── */
        .btn { border: none; border-radius: 999px; padding: 10px 20px; font-weight: 800; font-size: 13px; cursor: pointer; white-space: nowrap; text-decoration: none; display: inline-flex; align-items: center; }
        .btn:disabled { opacity: 0.5; cursor: default; }
        .btn-primary { background: #0b1220; color: #fff; }
        .btn-primary:hover:not(:disabled) { background: #1f2937; }
        .btn-danger { background: #fee2e2; color: #b91c1c; border: 1px solid #dc2626; }
        .btn-danger:hover:not(:disabled) { background: #fecaca; }
        .btn-outline { background: #f9fafb; color: #374151; border: 1px solid #d1d5db; }
        .btn-outline:hover { background: #e5e7eb; }
        .btn-sm { padding: 6px 14px; font-size: 12px; }
        .btn-lg { padding: 12px 24px; font-size: 14px; }

        /* ─── Log ─── */
        .log-box { margin-top: 14px; padding: 12px 14px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px; font-family: monospace; font-size: 12px; }
        .log-title { font-weight: 800; font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 6px; font-family: sans-serif; }
        .log-line { padding: 2px 0; color: #166534; }
        .log-error { color: #b91c1c; }

        .empty { text-align: center; color: #9ca3af; padding: 20px; font-size: 14px; }

        /* ─── Trade card ─── */
        .trade-card { border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; margin-bottom: 12px; background: #fafafa; }
        .trade-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 14px; flex-wrap: wrap; }
        .trade-kicker { font-size: 11px; letter-spacing: 0.2em; font-weight: 800; color: #b45309; }
        .trade-title { font-size: 15px; font-weight: 900; color: #0b1220; }
        .trade-meta { font-size: 12px; color: #6b7280; margin-top: 2px; }
        .trade-meta code { background: #e5e7eb; padding: 1px 4px; border-radius: 4px; font-size: 11px; }
        .trade-actions { display: flex; gap: 8px; flex-shrink: 0; flex-wrap: wrap; }
        .trade-tracking { font-size: 12px; color: #374151; margin-top: 10px; }
        .trade-tracking a { color: #2563eb; text-decoration: underline; }

        /* ─── Roadmap ─── */
        .roadmap { display: flex; gap: 0; align-items: flex-start; }
        .road-step { flex: 1; display: flex; flex-direction: column; align-items: center; position: relative; text-align: center; }
        .road-step::before { content: ""; position: absolute; top: 8px; left: -50%; right: 50%; height: 3px; background: #e5e7eb; }
        .road-step:first-child::before { display: none; }
        .road-step.done::before { background: #22c55e; }
        .road-step.current::before { background: #3b82f6; }
        .road-dot { width: 18px; height: 18px; border-radius: 50%; background: #e5e7eb; border: 3px solid #fff; z-index: 1; box-shadow: 0 0 0 2px #e5e7eb; }
        .road-step.done .road-dot { background: #22c55e; box-shadow: 0 0 0 2px #22c55e; }
        .road-step.current .road-dot { background: #3b82f6; box-shadow: 0 0 0 2px #3b82f6; animation: pulse 1.5s infinite; }
        @keyframes pulse { 0%, 100% { box-shadow: 0 0 0 2px #3b82f6; } 50% { box-shadow: 0 0 0 5px rgba(59, 130, 246, 0.3); } }
        .road-label { font-size: 10px; font-weight: 700; color: #9ca3af; margin-top: 6px; line-height: 1.3; }
        .road-step.done .road-label { color: #166534; }
        .road-step.current .road-label { color: #1d4ed8; font-weight: 900; }

        @media (max-width: 900px) { .form-grid { grid-template-columns: 1fr 1fr; } .listing-grid { grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); } }
        @media (max-width: 600px) {
          .form-grid { grid-template-columns: 1fr; }
          .listing-grid { grid-template-columns: 1fr 1fr; }
          .roadmap { flex-wrap: wrap; }
          .road-step { min-width: 80px; }
          .road-step::before { display: none; }
        }
      `}</style>
    </>
  );
}

/* ─── data ──────────────────────────────────────────── */

function extractImage(d: any): string {
  // Try every known image field — including nested item.* variants
  const candidates = [
    ...(Array.isArray(d.displayImageUrls) ? d.displayImageUrls : []),
    ...(Array.isArray(d.images) ? d.images : []),
    ...(Array.isArray(d.imageUrls) ? d.imageUrls : []),
    ...(Array.isArray(d.image_urls) ? d.image_urls : []),
    ...(Array.isArray(d.photos) ? d.photos : []),
    ...(Array.isArray(d.photoUrls) ? d.photoUrls : []),
    ...(Array.isArray(d.photo_urls) ? d.photo_urls : []),
    ...(Array.isArray(d.item?.displayImageUrls) ? d.item.displayImageUrls : []),
    ...(Array.isArray(d.item?.images) ? d.item.images : []),
    ...(Array.isArray(d.item?.imageUrls) ? d.item.imageUrls : []),
    ...(Array.isArray(d.item?.image_urls) ? d.item.image_urls : []),
    ...(Array.isArray(d.item?.photos) ? d.item.photos : []),
    d.displayImageUrl,
    d.display_image_url,
    d.image_url,
    d.imageUrl,
    d.image,
    d.mainImage,
    d.main_image,
    d.thumbnail,
    d.item?.displayImageUrl,
    d.item?.imageUrl,
    d.item?.image_url,
    d.item?.image,
  ];
  for (const u of candidates) {
    if (typeof u === "string" && u.trim().length > 0) return u.trim();
  }
  return "";
}

export const getServerSideProps: GetServerSideProps<Props> = async () => {
  try {
    // Fetch ALL listings and filter client-side to avoid Firestore composite index issues
    const listingsSnap = await adminDb
      .collection("listings")
      .orderBy("createdAt", "desc")
      .limit(500)
      .get();

    const listings: ListingOption[] = listingsSnap.docs
      .filter((doc) => {
        const d: any = doc.data() || {};
        // Only include live, unsold listings
        const status = String(d.status || "").toLowerCase();
        const isLive = ["live", "active", "approved", "published"].includes(status);
        const isSold = d.isSold === true || d.sold === true || status === "sold";
        return isLive && !isSold;
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
          image: extractImage(d),
          condition: String(d.condition || ""),
          category: String(d.category || ""),
        };
      });

    // Existing paper-trade orders
    let paperOrders: PaperOrder[] = [];
    try {
      const ordersSnap = await adminDb
        .collection("orders")
        .where("paperTrade", "==", true)
        .orderBy("createdAt", "desc")
        .limit(50)
        .get();

      paperOrders = ordersSnap.docs.map((doc) => {
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
    } catch (ordersErr) {
      // paperTrade index may not exist yet — gracefully degrade
      console.warn("Could not query paper trade orders (index may be needed):", ordersErr);
    }

    return { props: { listings, paperOrders } };
  } catch (err) {
    console.error("Error loading paper trade data", err);
    return { props: { listings: [], paperOrders: [] } };
  }
};
