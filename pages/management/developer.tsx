// FILE: /pages/management/developer.tsx
import Head from "next/head";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useRequireAdmin } from "../../hooks/useRequireAdmin";

export default function ManagementDeveloper() {
  const { loading } = useRequireAdmin();
  if (loading) return <div className="dashboard-page" />; // Light theme skeleton

  return (
    <>
      <Head>
        <title>Developer / Integrations — Admin</title>
      </Head>
      {/* Use light theme classes from globals.css */}
      <div className="dashboard-page">
        <Header />
        {/* Use dashboard-main but with a max-width override */}
        <main className="dashboard-main" style={{maxWidth: "768px"}}>
          {/* Use light theme classes from globals.css */}
          <div className="dashboard-header">
            <div>
              <h1>Developer / Integrations</h1>
              <p>
                API keys, webhooks, and integration settings for partners.
              </p>
            </div>
            <Link href="/management/dashboard">
              ← Back to Management Dashboard
            </Link>
          </div>

          <form className="form-card">
            <div className="form-field">
              <label htmlFor="api-key">Public API Key</label>
              <input
                id="api-key"
                type="text"
                placeholder="ff_public_..."
              />
            </div>

            <div className="form-field">
              <label htmlFor="webhook-url">Webhook Endpoint URL</label>
              <input
                id="webhook-url"
                type="url"
                placeholder="https://your-backend.com/webhooks/famous-finds"
              />
            </div>

            <div className="form-check">
              <input id="sandbox-webhooks" type="checkbox" />
              <label htmlFor="sandbox-webhooks">
                Enable sandbox webhooks for testing
              </label>
            </div>

            <button type="submit" className="btn-submit">
              Save Integration Settings
            </button>

            <p className="form-note">
              Later you can connect this page to your real integration config storage.
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
        
        .form-check {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .form-check label {
          font-size: 12px;
          color: #374151; /* gray-700 */
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
        .btn-submit:hover {
          background: #000;
        }

        .form-note {
          font-size: 12px;
          color: #6b7280; /* gray-500 */
        }
      `}</style>
    </>
  );
}
