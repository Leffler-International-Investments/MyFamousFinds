// FILE: /pages/management/banking.tsx

import Head from "next/head";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { auth } from "../../utils/firebaseClient";
import { useRouter } from "next/router";
import { useRequireAdmin } from "../../hooks/useRequireAdmin";

// PayPal doesn't require a Connect redirect — payouts use PayPal email
// Access control is handled by useRequireAdmin hook + server-side requireAdmin()

export default function ManagementBankingPage() {
  const { loading } = useRequireAdmin();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [unauthorized, setUnauthorized] = useState(false);
  const [prefs, setPrefs] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [paypalEmail, setPaypalEmail] = useState("");

  useEffect(() => {
    const userEmail =
      auth.currentUser?.email ||
      (typeof window !== "undefined"
        ? window.localStorage.getItem("ff-email")
        : "");

    if (userEmail) {
      const lower = userEmail.toLowerCase();
      setEmail(lower);

      async function loadPrefs() {
        try {
          const res = await fetch(
            `/api/admin/banking?email=${encodeURIComponent(lower)}`
          );
          if (!res.ok) return;
          const json = await res.json();
          if (json && json.prefs) {
            setPrefs(json.prefs);
          }
        } catch (err) {
          console.error("load_admin_banking_error", err);
        }
      }

      loadPrefs();
    }
  }, []);

  function update<K extends string>(key: K, value: any) {
    setPrefs((prev: any) => ({ ...prev, [key]: value }));
  }

  // PayPal email is saved as part of the form now — no external redirect needed

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);

    try {
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

      setMessage("Management payout profile saved successfully.");
    } catch (err: any) {
      console.error("save_admin_banking_error", err);
      setError(err?.message || "Unable to save payout settings.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="dashboard-page" />;

  if (unauthorized) {
    return (
      <div className="dashboard-page">
        <Head>
          <title>Access Restricted - Management Banking</title>
        </Head>
        <Header />
        <main className="dashboard-main">
          <div className="dashboard-header">
            <div>
              <h1>Access Restricted</h1>
              <p>
                You are not authorized to view this section. Only the business
                owner (Ariel) and developer (Dan) can access the Management
                Payout Setup.
              </p>
              <Link href="/management/dashboard">← Back to dashboard</Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

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
              Only Ariel and Dan are authorized to manage this section.
            </p>
          </div>
          <Link href="/management/dashboard">
            ← Back to Management Dashboard
          </Link>
        </div>

        {error && <p className="form-message error">{error}</p>}
        {message && <p className="form-message success">{message}</p>}

        <form onSubmit={handleSubmit} className="form-container">
          <section className="form-card">
            <h2>Bank & tax setup</h2>
            <p className="form-subtitle">
              Configure the management payout account. Payouts are sent via
              PayPal to the email address below.
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

            <div className="form-field">
              <label>Legal full name</label>
              <input
                type="text"
                className="form-input"
                required
                value={prefs.legalName || ""}
                onChange={(e) => update("legalName", e.target.value)}
              />
            </div>

            <div className="form-field">
              <label>Role / title</label>
              <input
                type="text"
                className="form-input"
                value={prefs.roleTitle || ""}
                onChange={(e) => update("roleTitle", e.target.value)}
              />
            </div>

            <div className="form-field">
              <label>PayPal payout email</label>
              <input
                type="email"
                className="form-input"
                value={paypalEmail || prefs.paypalEmail || ""}
                onChange={(e) => {
                  setPaypalEmail(e.target.value);
                  update("paypalEmail", e.target.value);
                }}
                placeholder="paypal@example.com"
              />
              <p className="form-subtitle" style={{ marginTop: 4 }}>
                Payouts will be sent to this PayPal email address.
              </p>
            </div>
          </section>

          <section className="form-card">
            <h2>Payout settings</h2>

            <div className="form-field">
              <label>Base payout amount (USD)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="form-input"
                value={prefs.amountUsd || ""}
                onChange={(e) =>
                  update("amountUsd", e.target.value ? Number(e.target.value) : 0)
                }
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
              </select>
            </div>

            <div className="form-field">
              <label>Next payment date</label>
              <input
                type="date"
                className="form-input"
                value={prefs.startDate || ""}
                onChange={(e) => update("startDate", e.target.value)}
              />
            </div>

            <div className="form-field">
              <label>Notes (optional)</label>
              <textarea
                className="form-input"
                rows={2}
                value={prefs.notes || ""}
                onChange={(e) => update("notes", e.target.value)}
              />
            </div>

            <div className="form-save-bar">
              <button
                type="submit"
                disabled={saving}
                className="btn-submit-blue"
              >
                {saving ? "Saving…" : "Save payout settings"}
              </button>
            </div>
          </section>
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

