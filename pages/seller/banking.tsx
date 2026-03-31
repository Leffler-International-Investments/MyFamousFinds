// FILE: /pages/seller/banking.tsx

import Head from "next/head";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { auth } from "../../utils/firebaseClient";
import { useRequireSeller } from "../../hooks/useRequireSeller";
import { autoPrefixPhone } from "../../utils/phoneFormat";
import { sellerFetch } from "../../utils/sellerClient";

const US_BANKS = [
  "Bank of America",
  "Chase (JPMorgan Chase)",
  "Wells Fargo",
  "Citibank",
  "U.S. Bank",
  "PNC Bank",
  "Truist Bank",
  "Goldman Sachs",
  "Capital One",
  "TD Bank",
  "Fifth Third Bank",
  "Citizens Bank",
  "KeyBank",
  "Huntington National Bank",
  "Regions Bank",
  "M&T Bank",
  "Ally Bank",
  "BMO Harris Bank",
  "First Republic Bank",
  "HSBC Bank USA",
  "Discover Bank",
  "Charles Schwab Bank",
  "Synchrony Bank",
  "American Express National Bank",
  "USAA Federal Savings Bank",
  "Navy Federal Credit Union",
  "Silicon Valley Bank",
  "Comerica Bank",
  "Zions Bancorporation",
  "Popular Bank",
];

type SellerBankingPrefs = {
  legalName?: string;
  sellingAs?: "individual" | "business";
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  phone?: string;
  // Bank account details (required for manual payouts by MFF)
  bankName?: string;
  bankRoutingNumber?: string;
  bankAccountNumber?: string;
  bankAccountType?: "checking" | "savings";
  // PayPal email (optional — only for auto payouts)
  paypalEmail?: string;
  pausePayouts?: boolean;
  payoutSchedule?: string;
  notes?: string;
  confirmAccuracy?: boolean;
  consentElectronic?: boolean;
};

export default function SellerBankingPage() {
  const { loading: authLoading } = useRequireSeller();

  const [email, setEmail] = useState("");
  const [prefs, setPrefs] = useState<SellerBankingPrefs>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [paypalEmailField, setPaypalEmailField] = useState("");
  const [bankAccountNumberConfirm, setBankAccountNumberConfirm] = useState("");
  const [customBankName, setCustomBankName] = useState("");
  const [bankSelectValue, setBankSelectValue] = useState("");

  // Load email + any saved prefs
  useEffect(() => {
    const currentEmail =
      auth.currentUser?.email ||
      (typeof window !== "undefined"
        ? window.localStorage.getItem("ff-email")
        : "");
    if (!currentEmail) return;

    const lower = currentEmail.toLowerCase();
    setEmail(lower);

    async function loadPrefs() {
      try {
        const res = await sellerFetch(
          `/api/seller/banking?email=${encodeURIComponent(lower)}`
        );
        if (!res.ok) return;
        const json = await res.json();
        if (json && json.prefs) {
          setPrefs({
            legalName: json.prefs.legalName || "",
            sellingAs: json.prefs.sellingAs || "individual",
            addressLine1: json.prefs.addressLine1 || "",
            addressLine2: json.prefs.addressLine2 || "",
            city: json.prefs.city || "",
            state: json.prefs.state || "",
            postalCode: json.prefs.postalCode || "",
            country: json.prefs.country || "United States",
            phone: json.prefs.phone || "",
            bankName: json.prefs.bankName || "",
            bankRoutingNumber: json.prefs.bankRoutingNumber || "",
            bankAccountNumber: json.prefs.bankAccountNumber || "",
            bankAccountType: json.prefs.bankAccountType || "checking",
            paypalEmail: json.prefs.paypalEmail || "",
            pausePayouts: Boolean(json.prefs.pausePayouts),
            payoutSchedule: "Monthly",
            notes: json.prefs.notes || "",
            confirmAccuracy: Boolean(json.prefs.confirmAccuracy),
            consentElectronic: Boolean(json.prefs.consentElectronic),
          });
          // Initialize bank dropdown state
          const savedBank = json.prefs.bankName || "";
          if (savedBank && US_BANKS.includes(savedBank)) {
            setBankSelectValue(savedBank);
          } else if (savedBank) {
            setBankSelectValue("Other");
            setCustomBankName(savedBank);
          }
          // Initialize account number confirm to match saved value
          setBankAccountNumberConfirm(json.prefs.bankAccountNumber || "");
        } else {
          setPrefs((prev) => ({
            sellingAs: "individual",
            country: "United States",
            payoutSchedule: "Monthly",
            ...prev,
          }));
        }
      } catch (err) {
        console.error("load_seller_banking_error", err);
      }
    }

    loadPrefs();
  }, []);

  function update<K extends keyof SellerBankingPrefs>(
    key: K,
    value: SellerBankingPrefs[K]
  ) {
    setPrefs((prev) => ({ ...prev, [key]: value }));
  }

  // PayPal email is saved as part of the onboard form below

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      if (prefs.bankAccountNumber && prefs.bankAccountNumber !== bankAccountNumberConfirm) {
        throw new Error(
          "Account numbers do not match. Please re-enter your account number to confirm."
        );
      }

      if (!prefs.confirmAccuracy || !prefs.consentElectronic) {
        throw new Error(
          "Please confirm that your details are accurate and that you consent to electronic payouts."
        );
      }

      const res = await sellerFetch("/api/seller/banking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          ...prefs,
        }),
      });

      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error || "Unable to save payout details.");
      }

      setMessage(
        "Your payout profile has been saved. Payouts will be processed by My Famous Finds management after the 14-day cooling period."
      );
    } catch (err: any) {
      console.error("save_seller_banking_error", err);
      setError(err?.message || "Unable to save payout details.");
    } finally {
      setSaving(false);
    }
  }

  if (authLoading) {
    return <div className="dashboard-page" />;
  }

  return (
    <div className="dashboard-page">
      <Head>
        <title>Banking & Payouts — Seller | Famous Finds</title>
      </Head>
      <Header />
      <main className="dashboard-main">
        <div className="dashboard-header">
          <div>
            <h1>Banking & Payouts</h1>
            <p>
              Provide your bank account details for payouts and the basic details we
              need for U.S. reporting. Your information is stored securely. Payouts
              are processed by My Famous Finds management after a 14-day cooling
              period following delivery confirmation.
            </p>
          </div>
          <Link href="/seller/dashboard">← Back to Seller Dashboard</Link>
        </div>

        {error && <p className="form-message error">{error}</p>}
        {message && <p className="form-message success">{message}</p>}

        <form onSubmit={handleSubmit} className="form-container">
          {/* Identity & legal details */}
          <section className="form-card">
            <h2>Payee identity</h2>
            <p className="form-subtitle">
              These details help match your Famous Finds account with your
              PayPal payout profile and IRS records.
            </p>

            <div className="form-field">
              <label>Account email (for payouts)</label>
              <input
                type="email"
                value={email}
                readOnly
                className="form-input form-input-readonly"
              />
              <p className="form-note">
                If this email is incorrect, contact support before continuing.
              </p>
            </div>

            <div className="form-grid">
              <div className="form-field">
                <label>Legal full name / business name</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  value={prefs.legalName || ""}
                  onChange={(e) => update("legalName", e.target.value)}
                  placeholder="Exactly as it appears for tax and banking"
                />
              </div>
              <div className="form-field">
                <label>Selling as</label>
                <select
                  className="form-input"
                  value={prefs.sellingAs || "individual"}
                  onChange={(e) =>
                    update(
                      "sellingAs",
                      e.target.value === "business" ? "business" : "individual"
                    )
                  }
                >
                  <option value="individual">Individual / sole proprietor</option>
                  <option value="business">
                    Business entity (LLC, corporation, partnership)
                  </option>
                </select>
              </div>
            </div>

            <div className="form-grid">
              <div className="form-field">
                <label>Street address</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  value={prefs.addressLine1 || ""}
                  onChange={(e) => update("addressLine1", e.target.value)}
                  placeholder="Street and number"
                />
              </div>
              <div className="form-field">
                <label>Apartment / suite (optional)</label>
                <input
                  type="text"
                  className="form-input"
                  value={prefs.addressLine2 || ""}
                  onChange={(e) => update("addressLine2", e.target.value)}
                />
              </div>
            </div>

            <div className="form-grid">
              <div className="form-field">
                <label>City</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  value={prefs.city || ""}
                  onChange={(e) => update("city", e.target.value)}
                />
              </div>
              <div className="form-field">
                <label>State / region</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  value={prefs.state || ""}
                  onChange={(e) => update("state", e.target.value)}
                />
              </div>
            </div>

            <div className="form-grid">
              <div className="form-field">
                <label>Postal / ZIP code</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  value={prefs.postalCode || ""}
                  onChange={(e) => update("postalCode", e.target.value)}
                />
              </div>
              <div className="form-field">
                <label>Country</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  value={prefs.country || "United States"}
                  onChange={(e) => update("country", e.target.value)}
                />
              </div>
            </div>

            <div className="form-field">
              <label>Mobile phone</label>
              <input
                type="tel"
                className="form-input"
                required
                value={prefs.phone || ""}
                onChange={(e) => update("phone", autoPrefixPhone(e.target.value))}
                placeholder="+1 555 000 0000"
              />
            </div>
          </section>

          {/* Bank Account Details */}
          <section className="form-card">
            <h2>Bank Account Details</h2>
            <p className="form-subtitle">
              Your payout will be processed by My Famous Finds management after
              a 14-day cooling period following delivery confirmation. Please
              provide your bank details so we can transfer your funds.
            </p>

            <div className="form-grid">
              <div className="form-field">
                <label>Bank name</label>
                <select
                  className="form-input"
                  required
                  value={bankSelectValue}
                  onChange={(e) => {
                    const val = e.target.value;
                    setBankSelectValue(val);
                    if (val === "Other") {
                      update("bankName", customBankName);
                    } else {
                      update("bankName", val);
                      setCustomBankName("");
                    }
                  }}
                >
                  <option value="" disabled>Select your bank</option>
                  {US_BANKS.map((bank) => (
                    <option key={bank} value={bank}>{bank}</option>
                  ))}
                  <option value="Other">Other</option>
                </select>
                {bankSelectValue === "Other" && (
                  <input
                    type="text"
                    className="form-input"
                    required
                    style={{ marginTop: 8 }}
                    value={customBankName}
                    onChange={(e) => {
                      setCustomBankName(e.target.value);
                      update("bankName", e.target.value);
                    }}
                    placeholder="Enter your bank name"
                  />
                )}
              </div>
              <div className="form-field">
                <label>Account type</label>
                <select
                  className="form-input"
                  value={prefs.bankAccountType || "checking"}
                  onChange={(e) =>
                    update(
                      "bankAccountType",
                      e.target.value === "savings" ? "savings" : "checking"
                    )
                  }
                >
                  <option value="checking">Checking</option>
                  <option value="savings">Savings</option>
                </select>
              </div>
            </div>

            <div className="form-grid">
              <div className="form-field">
                <label>Routing number (ABA)</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  value={prefs.bankRoutingNumber || ""}
                  onChange={(e) => update("bankRoutingNumber", e.target.value.replace(/[^0-9]/g, ""))}
                  placeholder="9-digit routing number"
                  maxLength={9}
                  inputMode="numeric"
                />
              </div>
              <div className="form-field">
                <label>Account number</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  value={prefs.bankAccountNumber || ""}
                  onChange={(e) => update("bankAccountNumber", e.target.value.replace(/[^0-9]/g, ""))}
                  placeholder="Account number"
                  inputMode="numeric"
                />
              </div>
            </div>

            <div className="form-grid">
              <div className="form-field" />
              <div className="form-field">
                <label>Confirm account number</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  value={bankAccountNumberConfirm}
                  onChange={(e) => setBankAccountNumberConfirm(e.target.value.replace(/[^0-9]/g, ""))}
                  placeholder="Re-enter account number"
                  inputMode="numeric"
                  style={
                    bankAccountNumberConfirm &&
                    prefs.bankAccountNumber &&
                    bankAccountNumberConfirm !== prefs.bankAccountNumber
                      ? { borderColor: "#dc2626" }
                      : {}
                  }
                />
                {bankAccountNumberConfirm &&
                  prefs.bankAccountNumber &&
                  bankAccountNumberConfirm !== prefs.bankAccountNumber && (
                    <p className="form-note" style={{ color: "#dc2626" }}>
                      Account numbers do not match.
                    </p>
                  )}
              </div>
            </div>

            <p className="form-note" style={{ marginTop: 12 }}>
              Your bank details are stored securely and used only for payout
              transfers by My Famous Finds management.
            </p>
          </section>

          {/* Optional PayPal email for auto payouts */}
          <section className="form-card">
            <h2>PayPal Email (Optional)</h2>
            <p className="form-subtitle">
              If My Famous Finds enables automatic payouts for your account,
              funds will be sent to this PayPal email. This is optional — by
              default payouts are processed manually by management.
            </p>

            <div className="form-field">
              <label>PayPal email address (optional)</label>
              <input
                type="email"
                className="form-input"
                value={paypalEmailField || prefs.paypalEmail || ""}
                onChange={(e) => {
                  setPaypalEmailField(e.target.value);
                  update("paypalEmail", e.target.value);
                }}
                placeholder="your-paypal@email.com"
              />
            </div>
          </section>

          {/* Consent */}
          <section className="form-card">
            <h2>Confirmation</h2>

            <div className="form-field form-field-inline">
              <label>
                <input
                  type="checkbox"
                  checked={!!prefs.confirmAccuracy}
                  onChange={(e) =>
                    update("confirmAccuracy", e.target.checked || false)
                  }
                />{" "}
                I confirm that the information above is true and correct to the
                best of my knowledge.
              </label>
            </div>

            <div className="form-field form-field-inline">
              <label>
                <input
                  type="checkbox"
                  checked={!!prefs.consentElectronic}
                  onChange={(e) =>
                    update("consentElectronic", e.target.checked || false)
                  }
                />{" "}
                I agree to receive payouts electronically and understand that
                tax forms (e.g. 1099-K) may be issued to me as required by
                U.S. law.
              </label>
            </div>
          </section>

          {/* Payout preferences */}
          <section className="form-card">
            <h2>Payout preferences</h2>
            <p className="form-subtitle">
              These settings control how your payouts are scheduled.
            </p>

            <div className="form-field form-field-inline">
              <label>
                <input
                  type="checkbox"
                  checked={!!prefs.pausePayouts}
                  onChange={(e) => update("pausePayouts", e.target.checked)}
                />{" "}
                Pause payouts for this seller
              </label>
              <p className="form-note">
                When paused, funds remain in your Famous Finds wallet until
                payouts are resumed.
              </p>
            </div>

            <div className="form-grid">
              <div className="form-field">
                <label>Payout schedule</label>
                <select
                  className="form-input"
                  value="Monthly"
                  disabled
                >
                  <option>Monthly</option>
                </select>
              </div>
            </div>

            <div className="form-field">
              <label>Internal notes (optional)</label>
              <textarea
                className="form-input"
                rows={2}
                value={prefs.notes || ""}
                onChange={(e) => update("notes", e.target.value)}
              />
              <p className="form-note">
                Visible only to Famous Finds management. Use for risk flags,
                special arrangements, etc.
              </p>
            </div>
          </section>

          <div className="form-save-bar">
            <button
              type="submit"
              disabled={saving}
              className="btn-submit-blue"
            >
              {saving ? "Saving…" : "Save payout profile"}
            </button>
          </div>
        </form>
      </main>
      <Footer />

      <style jsx>{`
        .form-container {
          display: flex;
          flex-direction: column;
          gap: 32px;
        }
        .form-card {
          border-radius: 8px;
          border: 1px solid #e5e7eb;
          background: #ffffff;
          padding: 24px;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        }
        .form-card h2 {
          font-size: 18px;
          font-weight: 600;
          color: #111827;
        }
        .form-subtitle {
          margin-top: 4px;
          font-size: 14px;
          color: #4b5563;
        }
        .form-grid {
          margin-top: 16px;
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
        }
        @media (min-width: 768px) {
          .form-grid {
            grid-template-columns: 1fr 1fr;
          }
        }
        .form-field {
          margin-top: 16px;
        }
        .form-field-inline {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .form-field label {
          font-size: 13px;
          font-weight: 500;
          color: #374151;
        }
        .form-input {
          margin-top: 4px;
          width: 100%;
          border-radius: 6px;
          border: 1px solid #d1d5db;
          padding: 8px 12px;
          font-size: 14px;
        }
        .form-input-readonly {
          background: #f9fafb;
        }
        .form-note {
          margin-top: 6px;
          font-size: 12px;
          color: #6b7280;
        }
        .btn-primary-dark {
          border-radius: 6px;
          background: #111827;
          padding: 8px 16px;
          font-size: 14px;
          font-weight: 500;
          color: #ffffff;
          border: none;
          cursor: pointer;
        }
        .btn-primary-dark:disabled {
          opacity: 0.6;
        }
        .form-save-bar {
          margin-top: 8px;
        }
        .btn-submit-blue {
          border-radius: 6px;
          background: #2563eb;
          padding: 8px 20px;
          font-size: 14px;
          font-weight: 500;
          color: #ffffff;
          border: none;
          cursor: pointer;
        }
        .btn-submit-blue:disabled {
          opacity: 0.6;
        }
        .form-message {
          font-size: 14px;
          margin-bottom: 8px;
        }
        .form-message.success {
          color: #059669;
        }
        .form-message.error {
          color: #dc2626;
        }
      `}</style>
    </div>
  );
}
