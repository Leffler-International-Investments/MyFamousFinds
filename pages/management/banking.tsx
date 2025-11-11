// FILE: /pages/management/banking.tsx

import Head from "next/head";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { auth } from "../../utils/firebaseClient";
import { useRequireAdmin } from "../../hooks/useRequireAdmin";

const STRIPE_CONNECT_MGMT_URL =
  process.env.NEXT_PUBLIC_STRIPE_CONNECT_MANAGEMENT_URL || "";

type MgmtBankingPrefs = {
  legalName?: string;
  roleTitle?: string;
  employmentType?: "employee" | "contractor";
  dateOfBirth?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  phone?: string;
  pauseSalary?: boolean;
  amountUsd?: number | null;
  frequency?: string;
  startDate?: string;
  notes?: string;
  confirmAccuracy?: boolean;
  consentElectronic?: boolean;
};

export default function ManagementBankingPage() {
  const { loading } = useRequireAdmin();

  const [email, setEmail] = useState("");
  const [prefs, setPrefs] = useState<MgmtBankingPrefs>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stripeBusy, setStripeBusy] = useState(false);

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
        const res = await fetch(
          `/api/admin/banking?email=${encodeURIComponent(lower)}`
        );
        if (!res.ok) return;
        const json = await res.json();
        if (json && json.prefs) {
          setPrefs({
            legalName: json.prefs.legalName || "",
            roleTitle: json.prefs.roleTitle || "",
            employmentType: json.prefs.employmentType || "employee",
            dateOfBirth: json.prefs.dateOfBirth || "",
            addressLine1: json.prefs.addressLine1 || "",
            addressLine2: json.prefs.addressLine2 || "",
            city: json.prefs.city || "",
            state: json.prefs.state || "",
            postalCode: json.prefs.postalCode || "",
            country: json.prefs.country || "United States",
            phone: json.prefs.phone || "",
            pauseSalary: Boolean(json.prefs.pauseSalary),
            amountUsd:
              typeof json.prefs.amountUsd === "number"
                ? json.prefs.amountUsd
                : null,
            frequency: json.prefs.frequency || "Monthly",
            startDate: json.prefs.startDate || "",
            notes: json.prefs.notes || "",
            confirmAccuracy: Boolean(json.prefs.confirmAccuracy),
            consentElectronic: Boolean(json.prefs.consentElectronic),
          });
        } else {
          setPrefs((prev) => ({
            employmentType: "employee",
            country: "United States",
            frequency: "Monthly",
            ...prev,
          }));
        }
      } catch (err) {
        console.error("load_admin_banking_error", err);
      }
    }

    loadPrefs();
  }, []);

  function update<K extends keyof MgmtBankingPrefs>(
    key: K,
    value: MgmtBankingPrefs[K]
  ) {
    setPrefs((prev) => ({ ...prev, [key]: value }));
  }

  function handleStripeClick() {
    if (!STRIPE_CONNECT_MGMT_URL) {
      alert(
        "Stripe Connect for management payouts is not configured yet. The owner must set this up in Stripe first."
      );
      return;
    }
    setStripeBusy(true);
    try {
      window.open(STRIPE_CONNECT_MGMT_URL, "_blank", "noopener,noreferrer");
    } finally {
      setStripeBusy(false);
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      if (!prefs.confirmAccuracy || !prefs.consentElectronic) {
        throw new Error(
          "Please confirm your details are accurate and that you consent to electronic salary payments."
        );
      }

      const res = await fetch("/api/admin/banking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          ...prefs,
        }),
      });

      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error || "Unable to save payout settings.");
      }

      setMessage("Management payout profile saved.");
    } catch (err: any) {
      console.error("save_admin_banking_error", err);
      setError(err?.message || "Unable to save payout settings.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="dashboard-page" />;

  return (
    <div className="dashboard-page">
      <Head>
        <title>Management Banking & Salary — Famous Finds</title>
      </Head>
      <Header />
      <main className="dashboard-main">
        <div className="dashboard-header">
          <div>
            <h1>Management Banking & Salary</h1>
            <p>
              Provide the details needed for U.S. payroll / contractor payments.
              Sensitive bank and tax information is collected only by Stripe or
              your payroll provider.
            </p>
          </div>
          <Link href="/management/dashboard">
            ← Back to Management Dashboard
          </Link>
        </div>

        {error && <p className="form-message error">{error}</p>}
        {message && <p className="form-message success">{message}</p>}

        <form onSubmit={handleSubmit} className="form-container">
          {/* Identity & employment */}
          <section className="form-card">
            <h2>Identity & employment</h2>
            <p className="form-subtitle">
              These details should match the information used on your W-4 / W-9
              and with your payroll provider.
            </p>

            <div className="form-field">
              <label>Admin email</label>
              <input
                type="email"
                value={email}
                readOnly
                className="form-input form-input-readonly"
              />
            </div>

            <div className="form-grid">
              <div className="form-field">
                <label>Legal full name</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  value={prefs.legalName || ""}
                  onChange={(e) => update("legalName", e.target.value)}
                  placeholder="First, middle, last"
                />
              </div>
              <div className="form-field">
                <label>Role / title</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  value={prefs.roleTitle || ""}
                  onChange={(e) => update("roleTitle", e.target.value)}
                  placeholder="e.g. Operations Manager, Buyer"
                />
              </div>
            </div>

            <div className="form-grid">
              <div className="form-field">
                <label>Employment type</label>
                <select
                  className="form-input"
                  value={prefs.employmentType || "employee"}
                  onChange={(e) =>
                    update(
                      "employmentType",
                      e.target.value === "contractor"
                        ? "contractor"
                        : "employee"
                    )
                  }
                >
                  <option value="employee">Employee (on payroll)</option>
                  <option value="contractor">
                    Independent contractor / consultant
                  </option>
                </select>
              </div>
              <div className="form-field">
                <label>Date of birth</label>
                <input
                  type="date"
                  className="form-input"
                  required
                  value={prefs.dateOfBirth || ""}
                  onChange={(e) => update("dateOfBirth", e.target.value)}
                />
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
                onChange={(e) => update("phone", e.target.value)}
                placeholder="+1 555 000 0000"
              />
            </div>
          </section>

          {/* Stripe / payroll connection */}
          <section className="form-card">
            <h2>Bank & tax details via Stripe / payroll</h2>
            <p className="form-subtitle">
              Stripe (or your payroll provider) collects bank account numbers,
              SSN/EIN, and tax forms (W-4 / W-9) as required by U.S. law.
              Famous Finds never stores these numbers in its own database.
            </p>

            <div className="form-field">
              <button
                type="button"
                onClick={handleStripeClick}
                disabled={stripeBusy}
                className="btn-primary-dark"
              >
                {stripeBusy
                  ? "Opening Stripe…"
                  : "Open secure payout / payroll setup"}
              </button>
              <p className="form-note">
                Use this to add or update bank and tax details for this admin
                user in Stripe / payroll.
              </p>
            </div>

            <div className="form-field form-field-inline">
              <label>
                <input
                  type="checkbox"
                  checked={!!prefs.confirmAccuracy}
                  onChange={(e) =>
                    update("confirmAccuracy", e.target.checked || false)
                  }
                />{" "}
                I confirm these profile details match my legal and payroll
                records.
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
                I consent to receive salary / contractor payments electronically
                via Stripe or the designated payroll provider.
              </label>
            </div>
          </section>

          {/* Salary / payout settings for owner control */}
          <section className="form-card">
            <h2>Salary / payout settings</h2>
            <p className="form-subtitle">
              These settings help the owner control when and how much this admin
              is paid. Actual payments are executed via Stripe or payroll.
            </p>

            <div className="form-field form-field-inline">
              <label>
                <input
                  type="checkbox"
                  checked={!!prefs.pauseSalary}
                  onChange={(e) => update("pauseSalary", e.target.checked)}
                />{" "}
                Pause payments for this admin
              </label>
              <p className="form-note">
                Use this if the owner wants to temporarily stop salary or fee
                payments.
              </p>
            </div>

            <div className="form-grid">
              <div className="form-field">
                <label>Base payout amount (USD)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="form-input"
                  value={
                    typeof prefs.amountUsd === "number"
                      ? String(prefs.amountUsd)
                      : ""
                  }
                  onChange={(e) =>
                    update(
                      "amountUsd",
                      e.target.value ? Number(e.target.value) : null
                    )
                  }
                  placeholder="e.g. 1500.00"
                />
              </div>
              <div className="form-field">
                <label>Payout frequency</label>
                <select
                  className="form-input"
                  value={prefs.frequency || "Monthly"}
                  onChange={(e) => update("frequency", e.target.value)}
                >
                  <option>Monthly</option>
                  <option>Bi-weekly</option>
                  <option>Weekly</option>
                  <option>Per order / variable</option>
                </select>
              </div>
            </div>

            <div className="form-field">
              <label>Commence / next payment date</label>
              <input
                type="date"
                className="form-input"
                value={prefs.startDate || ""}
                onChange={(e) => update("startDate", e.target.value)}
              />
            </div>

            <div className="form-field">
              <label>Owner notes (optional)</label>
              <textarea
                className="form-input"
                rows={2}
                value={prefs.notes || ""}
                onChange={(e) => update("notes", e.target.value)}
              />
              <p className="form-note">
                For internal use only — e.g. bonus rules, probation dates,
                custom arrangements.
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
