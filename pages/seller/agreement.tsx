// FILE: /pages/seller/agreement.tsx
// Seller Agreement with pricing clauses and proof of purchase requirements

import Head from "next/head";
import { FormEvent, useState } from "react";
import { useRouter } from "next/router";
import Header from "../../components/Header";
import Footer from "../../components/Footer";

export default function SellerAgreementPage() {
  const router = useRouter();
  const [consignorName, setConsignorName] = useState("");
  const [consignorAddress, setConsignorAddress] = useState("");
  const [consignorPhone, setConsignorPhone] = useState("");
  const [acceptPricingClause, setAcceptPricingClause] = useState(false);
  const [acceptProofRequirement, setAcceptProofRequirement] = useState(false);
  const [acceptGeneral, setAcceptGeneral] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!consignorName.trim()) {
      setError("Please enter your full name.");
      return;
    }
    if (!acceptPricingClause) {
      setError("You must accept the pricing adjustment clause.");
      return;
    }
    if (!acceptGeneral) {
      setError("You must accept the general seller terms.");
      return;
    }

    setLoading(true);
    try {
      const email =
        typeof window !== "undefined"
          ? window.localStorage.getItem("ff-email") || ""
          : "";

      const res = await fetch("/api/seller/agreement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          consignorName: consignorName.trim(),
          consignorAddress: consignorAddress.trim(),
          consignorPhone: consignorPhone.trim(),
          acceptPricingClause,
          acceptProofRequirement,
        }),
      });

      const json = await res.json();
      if (!json.ok) {
        setError(json.message || json.error || "Failed to save agreement.");
        return;
      }

      router.push("/seller/dashboard");
    } catch (err: any) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Head>
        <title>Seller Agreement - Famous Finds</title>
      </Head>
      <div className="page">
        <Header />
        <main className="main">
          <div className="card">
            <h1>Seller Agreement</h1>
            <p className="subtitle">
              Please review and accept the following terms before listing items
              on Famous Finds.
            </p>

            {error && <div className="error-box">{error}</div>}

            <form onSubmit={handleSubmit} className="form">
              <div className="field">
                <label>Full Name (Consignor) *</label>
                <input
                  type="text"
                  className="input"
                  value={consignorName}
                  onChange={(e) => setConsignorName(e.target.value)}
                  required
                  placeholder="Your legal name"
                />
              </div>

              <div className="field">
                <label>Address (optional)</label>
                <input
                  type="text"
                  className="input"
                  value={consignorAddress}
                  onChange={(e) => setConsignorAddress(e.target.value)}
                  placeholder="Street address, city, state"
                />
              </div>

              <div className="field">
                <label>Phone (optional)</label>
                <input
                  type="tel"
                  className="input"
                  value={consignorPhone}
                  onChange={(e) => setConsignorPhone(e.target.value)}
                  placeholder="+1 555 000 0000"
                />
              </div>

              {/* Pricing Clause */}
              <div className="clause-section">
                <h2>Pricing Adjustment Clause</h2>
                <div className="clause-text">
                  <p>
                    Famous Finds reserves the right to suggest pricing
                    adjustments based on current market conditions. If a pricing
                    adjustment is suggested:
                  </p>
                  <ul>
                    <li>
                      You will be notified via email with the suggested new
                      price.
                    </li>
                    <li>
                      You have a <strong>24-hour window</strong> to accept,
                      decline, or counter-propose.
                    </li>
                    <li>
                      If no response is received within 24 hours, the suggested
                      price may be applied.
                    </li>
                    <li>
                      There are no seller incentives for intentional mispricing.
                    </li>
                  </ul>
                </div>
                <div className="checkbox-row">
                  <input
                    id="pricingClause"
                    type="checkbox"
                    checked={acceptPricingClause}
                    onChange={(e) => setAcceptPricingClause(e.target.checked)}
                  />
                  <label htmlFor="pricingClause">
                    I accept the pricing adjustment clause including the 24-hour
                    response window. *
                  </label>
                </div>
              </div>

              {/* Proof of Purchase Clause */}
              <div className="clause-section">
                <h2>Proof of Purchase Requirements</h2>
                <div className="clause-text">
                  <p>
                    Items priced over <strong>$499</strong> require proof of
                    purchase documentation during listing creation.
                  </p>
                  <ul>
                    <li>
                      Acceptable documents: receipts, certificates of
                      authenticity, or store purchase history.
                    </li>
                    <li>
                      Documentation must be uploaded when creating the listing.
                    </li>
                    <li>
                      Listings flagged with missing or suspicious provenance
                      will be reviewed by our team.
                    </li>
                  </ul>
                </div>
                <div className="checkbox-row">
                  <input
                    id="proofClause"
                    type="checkbox"
                    checked={acceptProofRequirement}
                    onChange={(e) =>
                      setAcceptProofRequirement(e.target.checked)
                    }
                  />
                  <label htmlFor="proofClause">
                    I understand and accept the proof of purchase requirements.
                  </label>
                </div>
              </div>

              {/* General Terms */}
              <div className="checkbox-row general">
                <input
                  id="generalTerms"
                  type="checkbox"
                  checked={acceptGeneral}
                  onChange={(e) => setAcceptGeneral(e.target.checked)}
                />
                <label htmlFor="generalTerms">
                  I confirm that all items I list are authentic, I have the
                  right to sell them, and I accept the Famous Finds seller
                  terms. *
                </label>
              </div>

              <button
                type="submit"
                className="btn-submit"
                disabled={loading}
              >
                {loading ? "Saving..." : "Accept & Continue"}
              </button>
            </form>
          </div>
        </main>
        <Footer />
      </div>

      <style jsx>{`
        .page {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: #f8fafc;
        }
        .main {
          flex: 1;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding: 40px 16px;
        }
        .card {
          width: 100%;
          max-width: 600px;
          background: #ffffff;
          border-radius: 24px;
          border: 1px solid #e5e7eb;
          padding: 32px 28px;
          box-shadow: 0 20px 40px rgba(15, 23, 42, 0.08);
        }
        h1 {
          font-family: ui-serif, "Times New Roman", serif;
          font-size: 26px;
          font-weight: 700;
          margin: 0 0 8px;
          text-align: center;
          color: #111827;
        }
        .subtitle {
          margin: 0 0 24px;
          font-size: 14px;
          color: #6b7280;
          text-align: center;
          line-height: 1.5;
        }
        .error-box {
          background: #fef2f2;
          color: #b91c1c;
          border-radius: 12px;
          padding: 10px;
          margin-bottom: 14px;
          font-size: 13px;
          text-align: center;
        }
        .form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .field label {
          display: block;
          font-size: 13px;
          font-weight: 500;
          color: #374151;
          margin-bottom: 4px;
        }
        .input {
          width: 100%;
          border-radius: 14px;
          border: 1px solid #d1d5db;
          background: #f9fafb;
          padding: 10px 14px;
          font-size: 14px;
          color: #111827;
        }
        .input:focus {
          outline: none;
          border-color: #111827;
          background: #ffffff;
        }
        .clause-section {
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 16px;
          background: #fafafa;
        }
        .clause-section h2 {
          font-size: 15px;
          font-weight: 600;
          margin: 0 0 8px;
          color: #111827;
        }
        .clause-text {
          font-size: 13px;
          color: #374151;
          line-height: 1.6;
          margin-bottom: 12px;
        }
        .clause-text ul {
          margin: 8px 0 0;
          padding-left: 18px;
        }
        .clause-text li {
          margin-bottom: 4px;
        }
        .checkbox-row {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          font-size: 13px;
          color: #374151;
        }
        .checkbox-row input {
          margin-top: 2px;
          flex-shrink: 0;
        }
        .checkbox-row.general {
          padding: 12px;
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          border-radius: 12px;
        }
        .btn-submit {
          width: 100%;
          border-radius: 999px;
          border: none;
          padding: 12px;
          font-size: 14px;
          font-weight: 600;
          background: #111827;
          color: #ffffff;
          cursor: pointer;
        }
        .btn-submit:disabled {
          opacity: 0.6;
          cursor: default;
        }
        .btn-submit:hover:not(:disabled) {
          opacity: 0.9;
        }
      `}</style>
    </>
  );
}
