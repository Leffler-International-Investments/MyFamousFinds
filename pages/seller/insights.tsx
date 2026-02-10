// FILE: /pages/seller/insights.tsx
import Head from "next/head";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useEffect, useState } from "react";
// Import security hook
import { useRequireSeller } from "../../hooks/useRequireSeller";
import { sellerFetch } from "../../utils/sellerClient";

type Insight = {
  brand: string;
  avgPrice: number;
  sellThrough: number;
  timeToSellDays: number;
  volume: number;
};

type Suggest = {
  suggested: number;
  low: number;
  high: number;
  confidence: number;
  comps: number;
};

export default function SellerInsights() {
  const { loading: authLoading } = useRequireSeller(); // Add security
  const [brand, setBrand] = useState("Gucci");
  const [category, setCategory] = useState("Bags");
  const [insights, setInsights] = useState<Insight[]>([]);
  const [est, setEst] = useState<Suggest | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    const r = await sellerFetch(`/api/seller/insights`, { cache: "no-store" });
    const j = await r.json();
    setInsights(j.items || []);
  }

  async function estimate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);

    const fd = new FormData(e.currentTarget);
    const body: Record<string, string> = {};
    fd.forEach((value, key) => {
      body[key] = String(value);
    });

    const r = await fetch(`/api/price-estimator`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const j = await r.json();
    setEst(j);
    setBusy(false);
  }

  useEffect(() => {
    if (authLoading) return; // Wait for auth
    load();
  }, [authLoading]); // Add authLoading dependency

  if (authLoading) {
    return <div className="dark-theme-page"></div>;
  }

  return (
    <>
      <Head>
        <title>Seller — Insights | Famous Finds</title>
      </Head>
      <div className="dark-theme-page">
        <Header />
        <main className="section">
          <div className="back-link">
            {/* Link back to dashboard */}
            <Link href="/seller/dashboard">← Back to Dashboard</Link>
          </div>

          <h1 className="mt-4 text-2xl font-semibold text-white">
            Seller insights
          </h1>
          <p className="subtitle">
            Brand performance, sell-through and a pricing estimator to help you
            choose the right price.
          </p>

          <section className="metrics-grid">
            {insights.map((x) => (
              <div className="metric-card" key={x.brand}>
                <div className="metric-title">{x.brand}</div>
                <div className="metric-note">
                  Avg sold: ${x.avgPrice.toFixed(0)}
                </div>
                <div className="metric-note">
                  Sell-through: {(x.sellThrough * 100).toFixed(0)}%
                </div>
                <div className="metric-note">
                  Time to sell: {x.timeToSellDays} days
                </div>
                <div className="metric-note">
                  Volume (30d): {x.volume}
                </div>
              </div>
            ))}
          </section>

          <section className="sell-card" style={{ marginTop: "32px" }}>
            <h3>Pricing estimator</h3>
            <form className="estimator-form" onSubmit={estimate}>
              <label className="form-field">
                <span>Brand</span>
                <input
                  name="brand"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                />
              </label>
              <label className="form-field">
                <span>Category</span>
                <input
                  name="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                />
              </label>
              <label className="form-field">
                <span>Condition</span>
                <select name="condition" defaultValue="Excellent">
                  <option>New</option>
                  <option>Excellent</option>
                  <option>Good</option>
                  <option>Fair</option>
                </select>
              </label>
              <label className="form-field">
                <span>Original price (USD)</span>
                <input name="msrp" type="number" step="1" placeholder="3000" />
              </label>
              <div className="form-button-wrap">
                <button className="btn-primary" disabled={busy}>
                  {busy ? "Estimating…" : "Estimate price"}
                </button>
              </div>
            </form>

            {est && (
              <div className="estimator-result">
                <div>
                  <b>Suggested:</b> ${est.suggested.toFixed(0)} (range $
                  {est.low.toFixed(0)} – ${est.high.toFixed(0)})
                </div>
                <div className="result-note">
                  <b>Confidence:</b> {(est.confidence * 100).toFixed(0)}% •{" "}
                  <b>Comparables:</b> {est.comps}
                </div>
              </div>
            )}
          </section>
        </main>
        <Footer />
      </div>

      <style jsx>{`
        .back-link a {
          font-size: 12px;
          color: #9ca3af; /* gray-400 */
        }
        .back-link a:hover {
          color: #e5e7eb; /* gray-200 */
        }
        h1 {
          margin-top: 16px;
          font-size: 24px;
          font-weight: 600;
          color: white;
        }
        .subtitle {
          margin-top: 4px;
          font-size: 14px;
          color: #9ca3af; /* gray-400 */
        }

        .metrics-grid {
          margin-top: 24px;
          display: grid;
          gap: 12px;
        }
        @media (min-width: 768px) {
          .metrics-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
        
        .metric-card {
          border-radius: 12px;
          border: 1px solid #1f2937; /* neutral-800 */
          background: #030712; /* neutral-950 */
          padding: 16px;
        }
        .metric-title {
          font-size: 14px;
          font-weight: 600;
        }
        .metric-note {
          margin-top: 8px;
          font-size: 12px;
          color: #d1d5db; /* gray-200 */
        }
        
        /* Copied from sell.tsx */
        .sell-card {
          background: #111827;
          border-radius: 16px;
          padding: 18px 18px 20px;
          border: 1px solid #1f2937;
        }
        .sell-card h3 {
          margin: 0 0 16px;
          font-size: 14px;
          font-weight: 600;
        }
        
        .estimator-form {
          display: grid;
          gap: 12px;
        }
        @media (min-width: 768px) {
          .estimator-form {
            grid-template-columns: repeat(5, 1fr);
          }
        }
        
        .form-field {
          display: flex;
          flex-direction: column;
          gap: 4px;
          font-size: 12px;
          color: #d1d5db; /* gray-200 */
        }
        .form-field input,
        .form-field select {
          border-radius: 8px;
          border: 1px solid #374151; /* neutral-700 */
          background: #030712; /* neutral-900 */
          padding: 8px 10px;
          color: #e5e7eb;
          font-size: 14px;
        }
        .form-field input:focus,
        .form-field select:focus {
          outline: none;
          border-color: #ec4899; /* fuchsia-500 */
        }
        
        .form-button-wrap {
          display: flex;
          align-items: flex-end;
        }
        
        .btn-primary {
          width: 100%;
          border-radius: 8px;
          background: white;
          padding: 8px 12px;
          font-size: 12px;
          font-weight: 600;
          color: black;
          border: none;
          cursor: pointer;
        }
        .btn-primary:hover {
          background: #e5e7eb; /* gray-200 */
        }
        .btn-primary:disabled {
          opacity: 0.6;
        }
        
        .estimator-result {
          margin-top: 16px;
          border-radius: 8px;
          border: 1px solid #1f2937; /* neutral-800 */
          background: #00000066; /* black/40 */
          padding: 12px;
          font-size: 12px;
          color: #d1d5db; /* gray-200 */
        }
        .result-note {
          margin-top: 4px;
          color: #9ca3af; /* gray-400 */
        }
      `}</style>
    </>
  );
}
