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

  if (loading) return <div className="page-loading"></div>;

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
      // Note: content cannot contain commas
      const parts = line.split(",").map((p) => p.trim());
      
      // We need exactly 10 fields based on the instruction
      if (parts.length < 10) {
        parsed.push({
          _row: idx + 1,
          _status: "missing_field",
          _reason:
            "Expected 10 fields. Do not use commas inside titles or names.",
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
          _reason: "Price must be a positive number.",
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
    "Chanel Classic Flap,Chanel,bags,Like New,M,Black,5200,Neiman Marcus,Original receipt,12345-ABCD",
    "Gucci Marmont Belt,Gucci,accessories,Good,M,Black,480,Saks,PDF invoice,GG-778899",
  ];

  return (
    <div className="page-container">
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
            <h1>Bulk Upload Listings</h1>
            <p className="subtitle">
              Paste multiple items in one go. All prices are treated as USD.
            </p>
          </div>
        </div>

        <ol className="steps-grid">
          <li className={step >= 1 ? "step-active" : ""}>
            <span className="step-num">1</span> Paste your items
          </li>
          <li className={step >= 2 ? "step-active" : ""}>
            <span className="step-num">2</span> Review and fix
          </li>
          <li className={step >= 3 ? "step-active" : ""}>
            <span className="step-num">3</span> Confirm
          </li>
        </ol>

        <section className="card">
          <h2>1. Paste your items (USD)</h2>
          <p className="card-subtitle">
            One item per line, fields separated by commas. <strong>Do not use commas inside the product title or brand name.</strong>
          </p>
          <p className="card-subtitle">
            Format:<br/>
            <code>
              title, brand, category, condition, size, color, price,
              source, proof, serial
            </code>
          </p>

          <div className="example-box">
            <p>Example (Copy & Paste):</p>
            {exampleLines.map((line) => (
              <div key={line} className="example-mono">
                {line}
              </div>
            ))}
          </div>

          <textarea
            ref={textareaRef}
            className="form-textarea"
            placeholder="Paste your CSV data here..."
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
          />

          <div className="button-row">
            <button
              onClick={handleParse}
              disabled={busy}
              className="btn-primary"
            >
              Parse Items
            </button>
          </div>
        </section>

        <section className="card">
          <h2>2. Review parsed items</h2>

          {!rows.length ? (
            <p className="muted-text">
              Nothing parsed yet. Paste your items above and click{" "}
              <strong>Parse Items</strong>.
            </p>
          ) : (
            <>
              <p className="card-subtitle">
                Parsed <strong>{rows.length}</strong> lines. Valid rows:{" "}
                <strong className="text-ok">{okRows.length}</strong>.
              </p>

              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Row</th>
                      <th>Title</th>
                      <th>Brand</th>
                      <th>Category</th>
                      <th>Price</th>
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
            <strong className="text-ok">valid rows</strong> and send
            them to the vetting queue.
          </p>
          {error && <p className="banner error">{error}</p>}
          {result && (
            <p className="banner success">
              Success! Created {result.created} listings.
            </p>
          )}

          <div className="button-row">
            <button
              onClick={handleCommit}
              disabled={committing || !okRows.length}
              className="btn-primary"
            >
              {committing ? "Submitting..." : "Create Listings"}
            </button>
          </div>
        </section>
      </main>

      <Footer />

      <style jsx>{`
        .page-container {
          background-color: #f9fafb;
          color: #111827;
          min-height: 100vh;
        }
        .back-link a {
          font-size: 13px;
          color: #4b5563;
          text-decoration: none;
          font-weight: 500;
        }
        .back-link a:hover {
          color: #111827;
        }
        
        .page-header {
          margin-top: 20px;
          margin-bottom: 24px;
        }
        h1 {
          font-size: 24px;
          font-weight: 700;
          color: #111827;
          margin: 0;
        }
        .subtitle {
          margin-top: 6px;
          font-size: 14px;
          color: #6b7280;
        }
        
        .steps-grid {
          display: grid;
          gap: 12px;
          margin-bottom: 24px;
          padding: 0;
          list-style: none;
        }
        @media (min-width: 768px) {
          .steps-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
        .steps-grid li {
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 10px 12px;
          font-size: 13px;
          color: #9ca3af;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .steps-grid li.step-active {
          border-color: #111827;
          color: #111827;
          font-weight: 600;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        .step-num {
          background: #f3f4f6;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          font-size: 11px;
          font-weight: 700;
        }
        .step-active .step-num {
          background: #111827;
          color: #fff;
        }
        
        .card {
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 24px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
        .card h2 {
          font-size: 16px;
          font-weight: 700;
          color: #111827;
          margin: 0 0 12px 0;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .card-subtitle {
          font-size: 14px;
          color: #4b5563;
          margin-bottom: 12px;
          line-height: 1.5;
        }
        .card-subtitle code {
          background: #f3f4f6;
          padding: 2px 6px;
          border-radius: 4px;
          font-family: monospace;
          font-size: 12px;
          color: #db2777;
        }
        .text-ok {
          color: #059669;
        }
        .muted-text {
          color: #9ca3af;
          font-style: italic;
        }
        
        .example-box {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 12px;
          margin-bottom: 16px;
        }
        .example-box p {
          font-size: 12px;
          font-weight: 600;
          color: #64748b;
          margin: 0 0 8px 0;
        }
        .example-mono {
          font-family: monospace;
          font-size: 12px;
          color: #334155;
          margin-bottom: 4px;
          white-space: pre-wrap;
          word-break: break-all;
        }
        
        .form-textarea {
          width: 100%;
          height: 200px;
          padding: 12px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-family: monospace;
          font-size: 13px;
          color: #111827;
          background: #ffffff;
        }
        .form-textarea:focus {
          outline: none;
          border-color: #000;
          box-shadow: 0 0 0 1px #000;
        }
        
        .button-row {
          margin-top: 16px;
        }
        .btn-primary {
          background: #111827;
          color: #ffffff;
          border: none;
          border-radius: 99px;
          padding: 10px 24px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.2s;
        }
        .btn-primary:hover {
          opacity: 0.9;
        }
        .btn-primary:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }
        
        .table-wrapper {
          overflow-x: auto;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          margin-top: 16px;
        }
        .data-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
          text-align: left;
        }
        .data-table th {
          background: #f9fafb;
          padding: 10px 12px;
          font-weight: 600;
          color: #374151;
          border-bottom: 1px solid #e5e7eb;
        }
        .data-table td {
          padding: 10px 12px;
          border-bottom: 1px solid #e5e7eb;
          color: #111827;
        }
        .data-table tr:last-child td {
          border-bottom: none;
        }
        
        .status-badge {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 99px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
        }
        .status-ok {
          background: #d1fae5;
          color: #065f46;
        }
        .status-error {
          background: #fee2e2;
          color: #991b1b;
        }
        
        .banner {
          padding: 12px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          margin-top: 12px;
        }
        .banner.error {
          background: #fee2e2;
          color: #b91c1c;
          border: 1px solid #fca5a5;
        }
        .banner.success {
          background: #dcfce7;
          color: #166534;
          border: 1px solid #86efac;
        }
      `}</style>
    </div>
  );
}
