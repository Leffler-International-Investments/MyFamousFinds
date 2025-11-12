// FILE: /pages/seller/bulk-upload.tsx
import { useState, useRef, useMemo } from "react";
import Head from "next/head";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useRequireSeller } from "../../hooks/useRequireSeller";

type RawRow = {
  id?: string;
  title?: string;
  brand?: string;
  category?: string;
  condition?: string;
  size?: string;
  color?: string;
  price?: string | number;
  purchase_source?: string;
  purchase_proof?: string;
  serial_number?: string;
  authenticity_confirmed?: string | boolean;
  imageUrls?: string[];
};

type ParsedRow = RawRow & {
  _row: number;
  _status: "ok" | "missing_field" | "invalid_price" | "auth_missing";
  _reason?: string;
};

type ApiResult = {
  ok: boolean;
  created: number;
  skipped: number;
  error?: string;
};

export default function SellerBulkUpload() {
  const { loading } = useRequireSeller();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [rawText, setRawText] = useState("");
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ApiResult | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const okRows = useMemo(
    () => rows.filter((r) => r._status === "ok"),
    [rows]
  );

  if (loading) return <div className="dark-theme-page"></div>;

  const handleParse = () => {
    setError(null);
    setResult(null);

    const trimmed = rawText.trim();
    if (!trimmed) {
      setRows([]);
      setStep(2);
      return;
    }

    const lines = trimmed
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    const parsed: ParsedRow[] = [];
    lines.forEach((line, idx) => {
      const parts = line.split(",").map((p) => p.trim());
      if (parts.length < 10) {
        parsed.push({
          _row: idx + 1,
          _status: "missing_field",
          _reason:
            "Expected 10 fields: title,brand,category,condition,size,color,price,purchase_source,purchase_proof,serial_number",
        });
        return;
      }

      const [
        title,
        brand,
        category,
        condition,
        size,
        color,
        price,
        purchase_source,
        purchase_proof,
        serial_number,
      ] = parts;

      const priceNum = Number(price);
      if (!price || !isFinite(priceNum) || priceNum <= 0) {
        parsed.push({
          _row: idx + 1,
          _status: "invalid_price",
          _reason: "Price must be a positive number in USD.",
        });
        return;
      }

      parsed.push({
        _row: idx + 1,
        _status: "ok",
        title,
        brand,
        category,
        condition,
        size,
        color,
        price: priceNum,
        purchase_source,
        purchase_proof,
        serial_number,
      });
    });

    setRows(parsed);
    setStep(2);
  };

  const handleCommit = async () => {
    setError(null);
    setResult(null);
    setCommitting(true);

    try {
      const res = await fetch("/api/seller/bulk-commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: okRows }),
      });
      const json: ApiResult = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || "Unable to create listings.");
      }
      setResult(json);
      setStep(3);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Unable to create listings.");
    } finally {
      setCommitting(false);
    }
  };

  const exampleLines = [
    "Chanel Classic Flap Bag,Chanel,bags,Like New,M,Black,5200,Neiman Marcus,Original receipt,12345-ABCD",
    "Gucci Marmont Belt,Gucci,accessories,Good,M,Black,480,Saks,PDF invoice,GG-778899",
  ];

  return (
    <div className="dark-theme-page">
      <Head>
        <title>Seller — Bulk Upload | Famous Finds</title>
      </Head>

      <Header />

      <main className="section">
        <div className="back-link">
          <Link href="/seller/dashboard">← Back to Dashboard</Link>
        </div>

        <div className="page-header">
          <div>
            <h1>Bulk upload listings</h1>
            <p className="subtitle">
              Paste multiple items in one go. All prices are treated as USD.
            </p>
          </div>
        </div>

        <ol className="steps-grid">
          <li className={step >= 1 ? "step-active" : ""}>
            1. Paste your items
          </li>
          <li className={step >= 2 ? "step-active" : ""}>
            2. Review and fix issues
          </li>
          <li className={step >= 3 ? "step-active" : ""}>
            3. Confirm and submit
          </li>
        </ol>

        <section className="card">
          <h2>1. Paste your items (USD)</h2>
          <p className="card-subtitle">
            One item per line, fields separated by commas:
          </p>
          <p className="card-subtitle">
            <code>
              title, brand, category, condition, size, color, price (USD),
              purchase_source, purchase_proof, serial_number
            </code>
          </p>

          <div className="example-box">
            <p>Example (copy/paste):</p>
            {exampleLines.map((line) => (
              <p key={line} className="example-mono">
                {line}
              </p>
            ))}
          </div>

          <textarea
            ref={textareaRef}
            className="form-textarea"
            placeholder="Paste your items here…"
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
          />

          <div className="button-row">
            <button
              onClick={handleParse}
              disabled={busy}
              className="btn-primary"
            >
              Parse items
            </button>
          </div>
        </section>

        <section className="card">
          <h2>2. Review parsed items</h2>

          {!rows.length ? (
            <p className="card-subtitle">
              Nothing parsed yet. Paste your items above and click{" "}
              <strong>Parse items</strong>.
            </p>
          ) : (
            <>
              <p className="card-subtitle">
                Parsed <strong>{rows.length}</strong> lines. Valid rows in
                USD: <strong className="text-ok">{okRows.length}</strong>.
              </p>

              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Row</th>
                      <th>Title</th>
                      <th>Brand</th>
                      <th>Category</th>
                      <th>Price (USD)</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row._row}>
                        <td>{row._row}</td>
                        <td>{row.title || "—"}</td>
                        <td>{row.brand || "—"}</td>
                        <td>{row.category || "—"}</td>
                        <td>
                          {typeof row.price === "number"
                            ? `$${row.price.toLocaleString("en-US", {
                                maximumFractionDigits: 2,
                              })}`
                            : "—"}
                        </td>
                        <td>
                          {row._status === "ok" ? (
                            <span className="status-badge status-ok">
                              OK
                            </span>
                          ) : (
                            <span className="status-badge status-error">
                              {row._reason || row._status}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>

        <section className="card">
          <h2>3. Confirm and submit</h2>
          <p className="card-subtitle">
            When you confirm, we will create listings for all{" "}
            <strong className="text-ok">valid rows in USD</strong> and send
            them to the vetting queue.
          </p>
          {error && <p className="banner error">{error}</p>}
          {result && (
            <p className="banner success">
              Created {result.created} listings. Skipped {result.skipped} rows.
            </p>
          )}

          <div className="button-row">
            <button
              onClick={handleCommit}
              disabled={committing || !okRows.length}
              className="btn-primary"
            >
              {committing ? "Submitting…" : "Create listings in USD"}
            </button>
          </div>
        </section>
      </main>

      <Footer />

      <style jsx>{`
        .back-link a {
          font-size: 12px;
          color: #9ca3af; /* gray-400 */
        }
        .back-link a:hover {
          color: #e5e7eb; /* gray-200 */
        }
        
        .page-header {
          margin-top: 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        h1 {
          font-size: 20px;
          font-weight: 600;
          color: white;
        }
        .subtitle {
          margin-top: 4px;
          font-size: 12px;
          color: #9ca3af; /* gray-400 */
        }
        
        .steps-grid {
          margin-top: 24px;
          display: grid;
          gap: 12px;
          font-size: 12px;
          color: #d1d5db; /* gray-300 */
        }
        @media (min-width: 768px) {
          .steps-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
        .step-active {
          font-weight: 600;
          color: white;
        }
        
        .card {
          margin-top: 24px;
          border-radius: 16px;
          border: 1px solid #ffffff1a; /* white/10 */
          background: #ffffff0d; /* white/5 */
          padding: 16px;
          font-size: 12px;
        }
        .card h2 {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.16em;
          color: #9ca3af; /* gray-400 */
        }
        .card-subtitle {
          margin-top: 8px;
          color: #d1d5db; /* gray-300 */
        }
        .card-subtitle code {
          font-family: monospace;
        }
        .card-subtitle strong {
          font-weight: 600;
          color: white;
        }
        .card-subtitle .text-ok {
          color: #6ee7b7; /* emerald-300 */
        }
        
        .example-box {
          margin-top: 12px;
          border-radius: 6px;
          background: #00000066; /* black/40 */
          padding: 12px;
          font-size: 11px;
          color: #9ca3af; /* gray-400 */
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .example-box p {
          font-weight: 600;
          color: #d1d5db; /* gray-200 */
        }
        .example-box .example-mono {
          font-family: monospace;
          font-weight: 400;
        }
        
        .form-textarea {
          margin-top: 16px;
          height: 192px;
          width: 100%;
          border-radius: 6px;
          border: 1px solid #ffffff1a; /* white/10 */
          background: #00000066; /* black/40 */
          padding: 12px;
          font-size: 12px;
          color: white;
        }
        .form-textarea:focus {
          border-color: white;
          outline: none;
        }
        
        .button-row {
          margin-top: 12px;
          display: flex;
          gap: 8px;
        }
        .btn-primary {
          border-radius: 999px;
          background: white;
          padding: 8px 16px;
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
          cursor: not-allowed;
        }
        
        .table-wrapper {
          margin-top: 12px;
          overflow-x: auto;
          border-radius: 6px;
          border: 1px solid #ffffff1a; /* white/10 */
        }
        .data-table {
          min-width: 100%;
          text-align: left;
          font-size: 11px;
          color: #f3f4f6; /* gray-100 */
        }
        .data-table thead {
          background: #ffffff0d; /* white/5 */
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.16em;
          color: #9ca3af; /* gray-400 */
        }
        .data-table th, .data-table td {
          padding: 8px 12px;
        }
        .data-table tr {
          border-bottom: 1px solid #ffffff1a; /* white/10 */
        }
        .data-table tr:last-child {
          border-bottom: 0;
        }
        
        .status-badge {
          display: inline-flex;
          border-radius: 999px;
          padding: 4px 8px;
          font-size: 10px;
          font-weight: 600;
        }
        .status-ok {
          background: #065f46; /* green-900 */
          color: #6ee7b7; /* emerald-300 */
        }
        .status-error {
          background: #991b1b; /* red-900 */
          color: #fca5a5; /* red-300 */
        }
        
        .banner {
          margin-top: 8px;
          font-weight: 600;
        }
        .banner.error {
          color: #f87171; /* red-400 */
        }
        .banner.success {
          color: #6ee7b7; /* emerald-300 */
        }
      `}</style>
    </div>
  );
}
