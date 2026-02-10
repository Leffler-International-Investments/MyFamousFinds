// FILE: /pages/seller/dashboard.tsx
// Seller dashboard with consignment agreement gate.
// The agreement must be accepted before the dashboard becomes active.

import Head from "next/head";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import type { ReactNode } from "react";
import { useEffect, useState, useRef } from "react";
import SellerDashboardTutorial from "../../components/SellerDashboardTutorial";
import { useRequireSeller } from "../../hooks/useRequireSeller";

/* ───────── Dashboard helper components ───────── */

const DashboardSection = ({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) => (
  <section className="dashboard-section">
    <div className="dashboard-section-header">
      <h2 className="dashboard-section-title">{title}</h2>
    </div>
    <div className="dashboard-grid">{children}</div>
  </section>
);

const DashboardLink = ({
  href,
  title,
  description,
  accentColor = "blue",
  disabled = false,
}: {
  href: string;
  title: string;
  description: string;
  accentColor?: "blue" | "green" | "gray";
  disabled?: boolean;
}) => {
  const linkColorClass =
    accentColor === "green"
      ? "dashboard-tile-link-green"
      : accentColor === "gray"
      ? "dashboard-tile-link-gray"
      : "dashboard-tile-link-blue";

  if (disabled) {
    return (
      <div className="dashboard-tile dashboard-tile-disabled">
        <div>
          <h3 className="dashboard-tile-title">{title}</h3>
          <p className="dashboard-tile-description">{description}</p>
        </div>
        <div className={`dashboard-tile-link ${linkColorClass}`}>
          Complete agreement first
        </div>
      </div>
    );
  }

  return (
    <Link href={href} className="dashboard-tile">
      <div>
        <h3 className="dashboard-tile-title">{title}</h3>
        <p className="dashboard-tile-description">{description}</p>
      </div>
      <div className={`dashboard-tile-link ${linkColorClass}`}>Go to page →</div>
    </Link>
  );
};

/* ───────── Agreement component ───────── */

function ConsignmentAgreement({
  sellerEmail,
  onAccepted,
}: {
  sellerEmail: string;
  onAccepted: () => void;
}) {
  const [consignorName, setConsignorName] = useState("");
  const [consignorAddress, setConsignorAddress] = useState("");
  const [consignorPhone, setConsignorPhone] = useState("");
  const [consignorDate, setConsignorDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  async function handleAccept() {
    if (!agreed) {
      setError("Please tick the checkbox to accept the terms.");
      return;
    }
    if (!consignorName.trim()) {
      setError("Please enter your full name.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/seller/agreement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: sellerEmail,
          consignorName: consignorName.trim(),
          consignorAddress: consignorAddress.trim(),
          consignorPhone: consignorPhone.trim(),
          consignorDate,
        }),
      });
      const json = await res.json();
      if (!json.ok) {
        setError(json.error || "Failed to save agreement.");
        return;
      }
      onAccepted();
    } catch (err: any) {
      setError(err?.message || "Unexpected error.");
    } finally {
      setLoading(false);
    }
  }

  function handleDownload() {
    if (!printRef.current) return;
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`
      <html>
      <head><title>Luxury Consignment Agreement</title>
      <style>
        body { font-family: "Times New Roman", Georgia, serif; padding: 40px 60px; color: #111; line-height: 1.6; }
        h1 { font-size: 22px; margin-bottom: 4px; }
        h2 { font-size: 17px; margin-top: 28px; }
        h3 { font-size: 15px; margin-top: 20px; }
        table { border-collapse: collapse; width: 100%; margin: 12px 0; }
        th, td { border: 1px solid #ccc; padding: 6px 10px; text-align: left; font-size: 13px; }
        th { background: #f0f0f0; }
        ul { padding-left: 20px; }
        li { margin-bottom: 4px; }
        .sig-block { display: flex; gap: 60px; margin-top: 40px; }
        .sig-col { flex: 1; }
        .sig-line { border-bottom: 1px solid #333; margin: 8px 0; height: 24px; }
        .field-value { font-weight: bold; }
        @media print { body { padding: 20px; } }
      </style>
      </head>
      <body>
        ${printRef.current.innerHTML}
      </body>
      </html>
    `);
    w.document.close();
    w.print();
  }

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="agreement-wrapper">
      <div className="agreement-header-bar">
        <h2>Consignment Agreement</h2>
        <p>
          Please read and accept the consignment agreement below before accessing
          your seller dashboard.
        </p>
      </div>

      <div className="agreement-scroll" ref={printRef}>
        {/* ---- PAGE 1: PARTIES & CONSIGNED ITEMS ---- */}
        <h1>LUXURY CONSIGNMENT AGREEMENT</h1>
        <p>
          <strong>Agreement Number:</strong> ___________________<br />
          <strong>Date:</strong> ___________________
        </p>

        <h2>1. PARTIES</h2>
        <p>
          This Consignment Agreement (&quot;Agreement&quot;) is entered into
          between:
        </p>

        <h3>Consignor (Supplier):</h3>
        <div className="info-box">
          <p>
            <strong>Name:</strong>{" "}
            <input
              type="text"
              value={consignorName}
              onChange={(e) => setConsignorName(e.target.value)}
              placeholder="Enter your full legal name"
              className="inline-field"
            />
          </p>
          <p>
            <strong>Address:</strong>{" "}
            <input
              type="text"
              value={consignorAddress}
              onChange={(e) => setConsignorAddress(e.target.value)}
              placeholder="Enter your address"
              className="inline-field"
            />
          </p>
          <p>
            <strong>Email:</strong>{" "}
            <span className="field-value">{sellerEmail}</span>
          </p>
          <p>
            <strong>Phone:</strong>{" "}
            <input
              type="tel"
              value={consignorPhone}
              onChange={(e) => setConsignorPhone(e.target.value)}
              placeholder="Enter your phone number"
              className="inline-field"
            />
          </p>
        </div>

        <h3>Consignee:</h3>
        <p>
          <strong>[A Rich Wines]</strong>
          <br />
          <strong>[7865 Firefall Way #3442 Dallas TX 75230]</strong>
          <br />
          <strong>Email: [Ariel@arichwines.com]</strong>
          <br />
          <strong>Phone: [4048611733]</strong>
        </p>

        <h2>2. CONSIGNED ITEMS</h2>
        <p>
          <strong>
            The Consignor hereby delivers the following authentic luxury item(s)
            to the Consignee for sale on consignment:
          </strong>
        </p>
        <table>
          <thead>
            <tr>
              <th>Item #</th>
              <th>Brand</th>
              <th>Description</th>
              <th>Condition</th>
              <th>Asking Price</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>&nbsp;</td>
              <td>&nbsp;</td>
              <td>&nbsp;</td>
              <td>&nbsp;</td>
              <td>&nbsp;</td>
            </tr>
            <tr>
              <td>&nbsp;</td>
              <td>&nbsp;</td>
              <td>&nbsp;</td>
              <td>&nbsp;</td>
              <td>&nbsp;</td>
            </tr>
          </tbody>
        </table>

        {/* ---- PAGE 2: REPRESENTATIONS & TERMS ---- */}
        <h2>3. CONSIGNOR REPRESENTATIONS AND WARRANTIES</h2>
        <p>
          <strong>
            The Consignor represents, warrants, and certifies that:
          </strong>
        </p>
        <ul>
          <li>
            The Consignor is the lawful owner of all items listed above and has
            full legal right and authority to consign these items for sale.
          </li>
          <li>
            All consigned items are authentic luxury goods and are not
            counterfeit, replica, or unauthorized copies.
          </li>
          <li>
            The items were lawfully acquired and the Consignor has clear title to
            all items without any liens, encumbrances, or third-party claims.
          </li>
          <li>
            The Consignor authorizes the Consignee to sell these items under the
            first sale doctrine (exhaustion of rights), which permits the resale
            of authentic goods that were lawfully purchased.
          </li>
          <li>
            The Consignor grants the Consignee permission to photograph, describe,
            and market the items through all sales channels including online
            platforms.
          </li>
          <li>
            All items are accurately described in this agreement, including any
            defects or condition issues.
          </li>
        </ul>

        <h2>4. CONSIGNMENT TERMS</h2>
        <h3>4.1 Commission and Payment</h3>
        <p>
          Commission Rate: Consignor will receive <strong>80%</strong> of the
          final sale price for any item $3500 or less. Any item priced at $3500
          or higher, Consignor will receive 70% commission.
        </p>
        <p>
          <strong>
            Payment Timeline: The Consignor will receive payment every month on
            the 15th date.
          </strong>
        </p>
        <p>
          Payment Method: &#9746; Bank Transfer &nbsp; &#9744; Check &nbsp;
          &#9744; Other: ___________
        </p>

        <h3>4.3 Pricing and Adjustments</h3>
        <p>
          The Consigner is in charge of setting selling price and accepting offer
          and final price for item.
        </p>

        <h2>5. CONSIGNEE RESPONSIBILITIES</h2>
        <ul>
          <li>
            Market and sell the consigned items through appropriate sales
            channels.
          </li>
          <li>
            Exercise reasonable care in handling and storing the items.
          </li>
          <li>
            Maintain insurance coverage for consigned items while in possession.
          </li>
          <li>
            Provide regular updates on item status and sales efforts.
          </li>
          <li>
            Authenticate items and ensure only genuine luxury goods are sold.
          </li>
          <li>
            Remit payment to Consignor according to the agreed timeline.
          </li>
        </ul>

        {/* ---- PAGE 3: LIABILITY, INDEMNIFICATION, SIGNATURES ---- */}
        <h2>6. LIABILITY AND INSURANCE</h2>
        <p>
          The Consignee maintains insurance coverage of up to $_____ per item for
          loss, theft, or damage while items are in the Consignee&apos;s
          possession. The Consignor is responsible for ensuring adequate insurance
          coverage beyond this amount if desired.
        </p>

        <h2>7. TERM AND TERMINATION</h2>
        <p>
          This Agreement shall remain in effect until all consigned items are
          sold, returned, or this Agreement is terminated by either party with 30
          days&apos; written notice.
        </p>

        <h2>8. INDEMNIFICATION</h2>
        <p>
          The Consignor agrees to indemnify and hold harmless the Consignee from
          any claims, damages, or legal actions arising from: (a) false
          representations about item authenticity or ownership, (b) copyright or
          trademark infringement claims, (c) third-party claims of ownership or
          liens on the consigned items.
        </p>

        <h2>9. GOVERNING LAW</h2>
        <p>
          This Agreement shall be governed by the laws of
          ___________________.
        </p>

        <h2>10. SIGNATURES</h2>
        <p>
          By signing below, both parties acknowledge that they have read,
          understood, and agree to be bound by the terms of this Consignment
          Agreement.
        </p>

        <div className="sig-block">
          <div className="sig-col">
            <p>
              <strong>CONSIGNOR</strong>
            </p>
            <p>
              <strong>Signature:</strong> ___________________
            </p>
            <p>
              <strong>Print Name:</strong>{" "}
              <span className="field-value">
                {consignorName || "___________________"}
              </span>
            </p>
            <p>
              <strong>Date:</strong>{" "}
              <span className="field-value">{consignorDate || today}</span>
            </p>
          </div>
          <div className="sig-col">
            <p>
              <strong>CONSIGNEE</strong>
            </p>
            <p>
              <strong>Signature:</strong> ___________________
            </p>
            <p>
              <strong>Print Name:</strong> A Rich Wines / MyFamousFinds
            </p>
            <p>
              <strong>Date:</strong> {today}
            </p>
          </div>
        </div>
      </div>

      {/* ---- ACCEPTANCE FORM (outside the printable area) ---- */}
      <div className="agreement-accept-area">
        {error && <div className="agreement-error">{error}</div>}

        <div className="agreement-form-row">
          <label>
            <strong>Your Full Name (Consignor):</strong>
          </label>
          <input
            type="text"
            value={consignorName}
            onChange={(e) => setConsignorName(e.target.value)}
            placeholder="Enter your full legal name"
            className="agreement-input"
          />
        </div>
        <div className="agreement-form-row">
          <label>
            <strong>Date:</strong>
          </label>
          <input
            type="date"
            value={consignorDate}
            onChange={(e) => setConsignorDate(e.target.value)}
            className="agreement-input"
          />
        </div>

        <div className="agreement-check-row">
          <input
            type="checkbox"
            id="agree-check"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
          />
          <label htmlFor="agree-check">
            I have read, understood, and agree to the terms of this Consignment
            Agreement.
          </label>
        </div>

        <div className="agreement-buttons">
          <button
            className="agreement-accept-btn"
            onClick={handleAccept}
            disabled={loading}
          >
            {loading ? "Saving..." : "Accept Agreement"}
          </button>
          <button
            className="agreement-download-btn"
            onClick={handleDownload}
            type="button"
          >
            Download / Print Agreement
          </button>
        </div>

        <p className="agreement-email-note">
          You can also download the agreement and email it to{" "}
          <strong>admin@myfamousfinds.com</strong>
        </p>
      </div>
    </div>
  );
}

/* ───────── Main Dashboard ───────── */

export default function SellerDashboard() {
  const { loading: authLoading } = useRequireSeller();
  const [agreementAccepted, setAgreementAccepted] = useState<boolean | null>(
    null
  );
  const [checkingAgreement, setCheckingAgreement] = useState(true);

  const sellerEmail =
    typeof window !== "undefined"
      ? window.localStorage.getItem("ff-email") || ""
      : "";

  useEffect(() => {
    if (!sellerEmail) return;
    async function checkAgreement() {
      try {
        const res = await fetch(
          `/api/seller/agreement?email=${encodeURIComponent(sellerEmail)}`
        );
        const json = await res.json();
        setAgreementAccepted(json.ok && json.accepted);
      } catch {
        setAgreementAccepted(false);
      } finally {
        setCheckingAgreement(false);
      }
    }
    checkAgreement();
  }, [sellerEmail]);

  if (authLoading || checkingAgreement) {
    return <div className="dashboard-page" />;
  }

  const dashboardLocked = !agreementAccepted;

  return (
    <>
      <Head>
        <title>Seller Console - Famous Finds</title>
      </Head>
      <div className="dashboard-page">
        <Header />
        <main className="dashboard-main">
          <div className="dashboard-header">
            <div>
              <h1>Seller Console</h1>
              <p>Manage your listings, orders, and payouts in one place.</p>
            </div>
            <Link href="/">Back to Storefront</Link>
          </div>

          {/* ── AGREEMENT GATE ── */}
          {dashboardLocked && (
            <ConsignmentAgreement
              sellerEmail={sellerEmail}
              onAccepted={() => setAgreementAccepted(true)}
            />
          )}

          {/* ── DASHBOARD CONTENT ── */}
          {!dashboardLocked && <SellerDashboardTutorial />}

          {!dashboardLocked && (
            <section className="dashboard-welcome-banner">
              <h2>Welcome to Famous Finds!</h2>
              <p>
                Your application is approved. Please complete your banking
                details to start receiving payouts.
              </p>
              <div>
                <Link
                  href="/seller/banking"
                  className="dashboard-welcome-banner-button"
                >
                  Set up banking &amp; payouts →
                </Link>
              </div>
            </section>
          )}

          <DashboardSection title="Manage Listings">
            <DashboardLink
              href="/sell"
              title="Create New Listing"
              description="Upload a new item to your catalogue."
              accentColor="blue"
              disabled={dashboardLocked}
            />
            <DashboardLink
              href="/seller/catalogue"
              title="My Catalogue"
              description="Edit prices, quantity, and details for your active listings."
              accentColor="blue"
              disabled={dashboardLocked}
            />
            <DashboardLink
              href="/seller/bulk-simple"
              title="Quick Add (Form)"
              description="Add several items with dropdowns and image uploads."
              accentColor="blue"
              disabled={dashboardLocked}
            />
          </DashboardSection>

          <DashboardSection title="Orders & Performance">
            <DashboardLink
              href="/seller/orders"
              title="Orders"
              description="View new, in-transit, and delivered orders."
              accentColor="green"
              disabled={dashboardLocked}
            />
            <DashboardLink
              href="/seller/insights"
              title="Insights"
              description="Track your sales, top products, and performance."
              accentColor="green"
              disabled={dashboardLocked}
            />
          </DashboardSection>

          <DashboardSection title="Finance & Account">
            <DashboardLink
              href="/seller/banking"
              title="Banking & Payouts"
              description="Connect Stripe and control payout schedule."
              accentColor="gray"
              disabled={dashboardLocked}
            />
            <DashboardLink
              href="/seller/wallet"
              title="Wallet & Payouts"
              description="See your available balance and payout history."
              accentColor="gray"
              disabled={dashboardLocked}
            />
            <DashboardLink
              href="/seller/statements"
              title="Statements"
              description="Download monthly financial statements for your records."
              accentColor="gray"
              disabled={dashboardLocked}
            />
            <DashboardLink
              href="/seller/profile"
              title="Seller Profile"
              description="Update your business details and public shop info."
              accentColor="gray"
              disabled={dashboardLocked}
            />
          </DashboardSection>
        </main>
        <Footer />
      </div>

      <style jsx global>{`
        /* Disabled tile */
        .dashboard-tile-disabled {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 16px 18px;
          border-radius: 18px;
          border: 1px solid #e5e7eb;
          background: #f3f4f6;
          color: #9ca3af;
          box-shadow: none;
          pointer-events: none;
          opacity: 0.6;
        }
        .dashboard-tile-disabled .dashboard-tile-title {
          color: #9ca3af;
        }
        .dashboard-tile-disabled .dashboard-tile-description {
          color: #9ca3af;
        }

        /* Agreement wrapper */
        .agreement-wrapper {
          margin-bottom: 40px;
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 18px;
          overflow: hidden;
          box-shadow: 0 12px 30px rgba(15, 23, 42, 0.06);
        }
        .agreement-header-bar {
          background: #111827;
          color: #f9fafb;
          padding: 20px 28px;
        }
        .agreement-header-bar h2 {
          margin: 0 0 6px;
          font-size: 20px;
          font-weight: 700;
        }
        .agreement-header-bar p {
          margin: 0;
          font-size: 14px;
          opacity: 0.85;
        }

        /* Scrollable document */
        .agreement-scroll {
          max-height: 600px;
          overflow-y: auto;
          padding: 32px 36px;
          font-family: "Times New Roman", Georgia, serif;
          font-size: 14px;
          line-height: 1.7;
          color: #1f2937;
        }
        .agreement-scroll h1 {
          font-size: 22px;
          font-weight: 700;
          margin: 0 0 4px;
          text-align: left;
          font-family: "Times New Roman", Georgia, serif;
          letter-spacing: 0;
        }
        .agreement-scroll h2 {
          font-size: 17px;
          font-weight: 700;
          margin: 28px 0 8px;
          text-transform: uppercase;
        }
        .agreement-scroll h3 {
          font-size: 15px;
          font-weight: 700;
          margin: 20px 0 6px;
        }
        .agreement-scroll p {
          margin: 6px 0;
        }
        .agreement-scroll ul {
          padding-left: 22px;
          margin: 8px 0;
        }
        .agreement-scroll li {
          margin-bottom: 6px;
        }
        .agreement-scroll table {
          width: 100%;
          border-collapse: collapse;
          margin: 12px 0;
        }
        .agreement-scroll th,
        .agreement-scroll td {
          border: 1px solid #d1d5db;
          padding: 6px 10px;
          text-align: left;
          font-size: 13px;
        }
        .agreement-scroll th {
          background: #f3f4f6;
          font-weight: 600;
        }
        .info-box {
          border: 1px solid #d1d5db;
          border-radius: 6px;
          padding: 12px 16px;
          margin: 8px 0 16px;
          background: #fafafa;
        }
        .info-box p {
          margin: 3px 0;
        }
        .field-value {
          font-weight: 700;
        }
        .inline-field {
          border: none;
          border-bottom: 1px solid #999;
          background: transparent;
          font-family: inherit;
          font-size: inherit;
          font-weight: 700;
          color: #111;
          padding: 2px 4px;
          width: 280px;
          max-width: 60%;
          outline: none;
        }
        .inline-field:focus {
          border-bottom-color: #111;
          background: #fff;
        }
        .inline-field::placeholder {
          color: #999;
          font-weight: 400;
          font-style: italic;
        }
        .sig-block {
          display: flex;
          gap: 48px;
          margin-top: 32px;
        }
        .sig-col {
          flex: 1;
        }

        /* Accept area */
        .agreement-accept-area {
          border-top: 2px solid #e5e7eb;
          padding: 24px 36px 28px;
          background: #fafafa;
        }
        .agreement-form-row {
          display: flex;
          flex-direction: column;
          gap: 4px;
          margin-bottom: 14px;
        }
        .agreement-form-row label {
          font-size: 13px;
          color: #374151;
        }
        .agreement-input {
          width: 100%;
          max-width: 400px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          padding: 8px 12px;
          font-size: 14px;
          color: #111;
        }
        .agreement-input:focus {
          outline: none;
          border-color: #111;
        }
        .agreement-check-row {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          margin: 16px 0;
        }
        .agreement-check-row input[type="checkbox"] {
          margin-top: 3px;
          width: 18px;
          height: 18px;
          accent-color: #111827;
        }
        .agreement-check-row label {
          font-size: 14px;
          color: #374151;
          line-height: 1.4;
        }
        .agreement-buttons {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }
        .agreement-accept-btn {
          padding: 12px 32px;
          border: none;
          border-radius: 999px;
          background: #111827;
          color: #fff;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.2s;
        }
        .agreement-accept-btn:hover {
          opacity: 0.9;
        }
        .agreement-accept-btn:disabled {
          opacity: 0.5;
          cursor: default;
        }
        .agreement-download-btn {
          padding: 12px 32px;
          border: 1px solid #d1d5db;
          border-radius: 999px;
          background: #fff;
          color: #374151;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: border-color 0.2s;
        }
        .agreement-download-btn:hover {
          border-color: #111;
        }
        .agreement-error {
          background: #fef2f2;
          color: #b91c1c;
          border-radius: 8px;
          padding: 10px;
          font-size: 13px;
          margin-bottom: 14px;
        }
        .agreement-email-note {
          margin-top: 14px;
          font-size: 12px;
          color: #6b7280;
        }

        @media (max-width: 768px) {
          .agreement-scroll {
            padding: 20px 18px;
            max-height: 500px;
          }
          .agreement-accept-area {
            padding: 20px 18px;
          }
          .sig-block {
            flex-direction: column;
            gap: 24px;
          }
          .agreement-buttons {
            flex-direction: column;
          }
          .agreement-accept-btn,
          .agreement-download-btn {
            width: 100%;
            text-align: center;
          }
        }
      `}</style>
    </>
  );
}
