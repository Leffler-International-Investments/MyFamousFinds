// FILE: /pages/management/stripe-settings.tsx
import { FormEvent, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useRequireAdmin } from "../../hooks/useRequireAdmin";
import { mgmtFetch } from "../../utils/managementClient";

export default function ManagementStripe() {
  const { loading: authLoading } = useRequireAdmin();

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);

    const fd = new FormData(e.currentTarget);
    const payload = {
      publishableKey: String(fd.get("publishableKey") || ""),
      secretKey: String(fd.get("secretKey") || ""),
      platformCommission: Number(fd.get("platformCommission") || 0),
      minPayout: Number(fd.get("minPayout") || 0),
      testMode: fd.get("testMode") === "on",
    };

    try {
      const res = await mgmtFetch("/api/management/stripe-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`Request failed: ${res.status}`);
      }

      setMessage("Payment settings saved.");
    } catch (err: any) {
      console.error(err);
      setError("Failed to save settings.");
    } finally {
      setSaving(false);
    }
  }

  if (authLoading) return <div className="dashboard-page" />; // Light theme skeleton

  return (
    <>
      <Head>
        <title>Stripe & Payment Settings — Admin</title>
      </Head>
      {/* Use light theme classes from globals.css */}
      <div className="dashboard-page">
        <Header />
        <main className="dashboard-main" style={{maxWidth: "768px"}}>
          {/* Use light theme classes from globals.css */}
          <div className="dashboard-header">
            <div>
              <h1>Stripe & Payment Settings</h1>
              <p>
                Configure Stripe Connect, platform fees, and payout rules.
              </p>
            </div>
            <Link href="/management/dashboard">
              ← Back to Management Dashboard
            </Link>
          </div>

          <form className="form-card" onSubmit={handleSubmit}>
            <div className="form-field">
              <label htmlFor="publishableKey">Stripe Publishable Key</label>
              <input
                id="publishableKey"
                name="publishableKey"
                type="text"
                placeholder="pk_live_..."
              />
            </div>

            <div className="form-field">
              <label htmlFor="secretKey">Stripe Secret Key</label>
              <input
                id="secretKey"
                name="secretKey"
                type="password"
                placeholder="sk_live_..."
              />
            </div>

            <div className="form-grid">
              <div className="form-field">
                <label htmlFor="platformCommission">Platform Commission (%)</label>
                <input
                  id="platformCommission"
                  name="platformCommission"
                  type="number"
                  defaultValue={15}
                />
              </div>
              <div className="form-field">
                <label htmlFor="minPayout">Minimum Payout (USD)</label>
                <input
                  id="minPayout"
                  name="minPayout"
                  type="number"
                  defaultValue={50}
                />
              </div>
            </div>

            <div className="form-check">
              <input
                id="test-mode"
                name="testMode"
                type="checkbox"
              />
              <label htmlFor="test-mode">
                Enable test mode (sandbox keys)
              </label>
            </div>

            {message && <p className="form-message success">{message}</p>}
            {error && <p className="form-message error">{error}</p>}

            <button type="submit" disabled={saving} className="btn-submit">
              {saving ? "Saving…" : "Save Payment Settings"}
            </button>

            <p className="form-note">
              Backend TODO: implement{" "}
              <code>/api/management/stripe-settings</code> to validate and
              persist these values securely (env/config store).
            </p>
          </form>
        </main>
        <Footer />
      </div>

      {/* Styles for the light theme form */}
      <style jsx>{`
        .form-card {
          display: flex;
          flex-direction: column;
          gap: 20px;
          border-radius: 8px;
          border: 1px solid #e5e7eb; /* gray-200 */
          background: #ffffff;
          padding: 24px;
          box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
        }

        .form-field {
          display: flex;
          flex-direction: column;
        }
        .form-field label {
          display: block;
          font-size: 12px;
          font-weight: 500;
          color: #374151; /* gray-700 */
          margin-bottom: 4px;
        }
        .form-field input {
          width: 100%;
          border-radius: 6px;
          border: 1px solid #d1d5db; /* gray-300 */
          padding: 8px 12px;
          font-size: 14px;
          box-shadow: 0 1px 2px 0 rgba(0,0,0,0.05);
        }
        .form-field input:focus {
          border-color: #111827; /* gray-900 */
          outline: none;
        }
        
        .form-grid {
          display: grid;
          gap: 16px;
        }
        @media (min-width: 768px) {
          .form-grid {
            grid-template-columns: 1fr 1fr;
          }
        }
        
        .form-check {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .form-check label {
          font-size: 12px;
          color: #374151; /* gray-700 */
        }
        
        .form-message {
          font-size: 12px;
        }
        .form-message.success {
          color: #065f46; /* green-700 */
        }
        .form-message.error {
          color: #b91c1c; /* red-600 */
        }
        
        .btn-submit {
          border-radius: 6px;
          background: #111827; /* gray-900 */
          padding: 8px 16px;
          font-size: 14px;
          font-weight: 500;
          color: #ffffff;
          border: none;
          cursor: pointer;
          align-self: flex-start; /* Don't stretch */
        }
        .btn-submit:disabled {
          opacity: 0.6;
        }

        .form-note {
          font-size: 12px;
          color: #6b7280; /* gray-500 */
        }
      `}</style>
    </>
  );
}
