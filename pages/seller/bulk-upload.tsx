// pages/seller/bulk-upload.tsx

import { useState, useRef, useMemo, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useRequireSeller } from "../../hooks/useRequireSeller";
import firebaseApp from "../../utils/firebaseClient";
import { getFirestore, collection, getDocs } from "firebase/firestore";

const db = getFirestore(firebaseApp);

type RawRow = {
  title?: string;
  brand?: string;
  category?: string;
  condition?: string;
  size?: string;
  color?: string;
  price?: number;
  purchase_source?: string;
  purchase_proof?: string;
  serial_number?: string;
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

  const [designerNames, setDesignerNames] = useState<string[]>([]);
  const [designersLoaded, setDesignersLoaded] = useState(false);
  const [designerError, setDesignerError] = useState<string | null>(null);

  // Load approved designers from Designers Directory (Firestore)
  useEffect(() => {
    let cancelled = false;

    const loadDesigners = async () => {
      try {
        const snap = await getDocs(collection(db, "designers"));
        if (cancelled) return;

        const names: string[] = [];
        snap.forEach((docSnap) => {
          const data = docSnap.data() as any;
          if (!data) return;
          if (data.active === false) return;
          if (data.name) {
            names.push(String(data.name));
          }
        });

        setDesignerNames(names);
      } catch (err) {
        console.error("Failed to load designers", err);
        setDesignerError(
          "Could not load the approved Designers Directory. Brand checks may be limited for this upload."
        );
      } finally {
        if (!cancelled) {
          setDesignersLoaded(true);
        }
      }
    };

    loadDesigners();

    return () => {
      cancelled = true;
    };
  }, []);

  const okRows = useMemo(
    () => rows.filter((r) => r._status === "ok"),
    [rows]
  );

  const counts = useMemo(
    () => ({
      total: rows.length,
      ok: rows.filter((r) => r._status === "ok").length,
      missing: rows.filter((r) => r._status === "missing_field").length,
      invalidPrice: rows.filter((r) => r._status === "invalid_price").length,
      authMissing: rows.filter((r) => r._status === "auth_missing").length,
    }),
    [rows]
  );

  const hasBlockingAuthIssues = counts.authMissing > 0;

  const handleParse = () => {
    setError(null);
    setResult(null);
    setBusy(true);

    try {
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

      const approvedSet =
        designersLoaded && designerNames.length
          ? new Set(
              designerNames.map((n) =>
                n.toString().trim().toLowerCase()
              )
            )
          : null;

      lines.forEach((line, idx) => {
        const parts = line.split(",").map((p) => p.trim());

        if (parts.length !== 10) {
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

        let status: ParsedRow["_status"] = "ok";
        let reason: string | undefined;

        // Designers Directory check
        if (designersLoaded && approvedSet && approvedSet.size > 0) {
          const brandName = (brand || "").toString().trim().toLowerCase();
          if (!brandName || !approvedSet.has(brandName)) {
            status = "auth_missing";
            reason =
              "Brand/designer is not in the approved Designers Directory. Please contact management or request this designer before bulk uploading.";
          }
        }

        parsed.push({
          _row: idx + 1,
          _status: status,
          _reason: reason,
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
    } finally {
      setBusy(false);
    }
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

  if (loading) {
    return null;
  }

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
            <p className="subtitle">
              Brands must match the approved{" "}
              <strong>Designers Directory</strong>. Unknown designers will be
              blocked until management reviews them.
            </p>
            {designerError && (
              <p className="subtitle warning">{designerError}</p>
            )}
          </div>
        </div>

        <ol className="steps-grid">
          <li className={step >= 1 ? "step-active" : ""}>
            <span className="step-label">1. Paste your items</span>
            <p>One item per line, with 10 comma-separated fields.</p>
          </li>
          <li className={step >= 2 ? "step-active" : ""}>
            <span className="step-label">
              2. Check for errors &amp; designers
            </span>
            <p>Fix any missing fields or brands not in the directory.</p>
          </li>
          <li className={step >= 3 ? "step-active" : ""}>
            <span className="step-label">3. Confirm &amp; submit</span>
            <p>Create listings only for validated items.</p>
          </li>
        </ol>

        <div className="grid">
          {/* STEP 1 - INPUT */}
          <section className="card">
            <h2>Step 1 — Paste your items</h2>
            <p className="helper">
              Each line represents one item, in this exact order:
            </p>
            <ul className="field-list">
              <li>title</li>
              <li>brand (must match Designers Directory)</li>
              <li>category</li>
              <li>condition</li>
              <li>size</li>
              <li>color</li>
              <li>price (USD)</li>
              <li>purchase_source</li>
              <li>purchase_proof</li>
              <li>serial_number</li>
            </ul>

            <p className="helper">
              Example (you can copy/paste and adapt):
            </p>
            <pre className="example">
              {exampleLines.join("\n")}
            </pre>

            <textarea
              ref={textareaRef}
              className="bulk-textarea"
              rows={14}
              placeholder="Paste one item per line, fields separated by commas…"
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
            />

            <div className="actions">
              <button
                type="button"
                onClick={handleParse}
                disabled={busy}
                className="btn primary"
              >
                {busy ? "Parsing…" : "Step 2 — Validate items"}
              </button>
              <span className="hint">
                You can always edit and re-parse until everything is correct.
              </span>
            </div>
          </section>

          {/* STEP 2 - PREVIEW & ERRORS */}
          <section className="card">
            <h2>Step 2 — Validation & preview</h2>

            {rows.length === 0 ? (
              <p className="helper">
                No rows parsed yet. Paste your items on the left and click{" "}
                <strong>Validate items</strong>.
              </p>
            ) : (
              <>
                <div className="summary">
                  <p>
                    <strong>Total rows:</strong> {counts.total}
                  </p>
                  <p>
                    <span className="badge ok">OK: {counts.ok}</span>
                    <span className="badge warn">
                      Missing fields: {counts.missing}
                    </span>
                    <span className="badge warn">
                      Invalid price: {counts.invalidPrice}
                    </span>
                    <span className="badge error">
                      Designer not approved: {counts.authMissing}
                    </span>
                  </p>
                  {hasBlockingAuthIssues && (
                    <p className="warning">
                      Items with designers not in the{" "}
                      <strong>Designers Directory</strong> cannot be created.
                      Please contact management or request the designer to be
                      added.
                    </p>
                  )}
                </div>

                <div className="table-wrapper">
                  <table className="preview-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Status</th>
                        <th>Reason</th>
                        <th>Title</th>
                        <th>Brand</th>
                        <th>Category</th>
                        <th>Condition</th>
                        <th>Size</th>
                        <th>Color</th>
                        <th>Price (USD)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row) => (
                        <tr key={row._row} className={`row-${row._status}`}>
                          <td>{row._row}</td>
                          <td>{row._status}</td>
                          <td>{row._reason || "—"}</td>
                          <td>{row.title}</td>
                          <td>{row.brand}</td>
                          <td>{row.category}</td>
                          <td>{row.condition}</td>
                          <td>{row.size}</td>
                          <td>{row.color}</td>
                          <td>
                            {row.price != null
                              ? `$${row.price.toFixed(2)}`
                              : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </section>
        </div>

        {/* STEP 3 - COMMIT */}
        <section className="card final-card">
          <h2>Step 3 — Confirm & submit</h2>

          {error && <p className="error-message">{error}</p>}
          {result && (
            <p className="success-message">
              Created {result.created} listings. Skipped {result.skipped}.
            </p>
          )}

          <p className="helper">
            Only rows with status <strong>ok</strong> will be submitted.
            Designers that are not in the directory will be skipped until
            management approves them.
          </p>

          <button
            type="button"
            onClick={handleCommit}
            className="btn primary"
            disabled={committing || okRows.length === 0}
          >
            {committing
              ? "Submitting…"
              : `Step 3 — Create ${okRows.length} listing${
                  okRows.length === 1 ? "" : "s"
                }`}
          </button>
        </section>
      </main>

      <Footer />

      <style jsx>{`
        .dark-theme-page {
          min-height: 100vh;
          background: radial-gradient(circle at top, #1f2937 0, #020617 55%);
          color: #f9fafb;
          display: flex;
          flex-direction: column;
        }

        .section {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem 1.5rem 4rem;
        }

        .back-link {
          margin-bottom: 1rem;
          font-size: 0.9rem;
        }

        .back-link :global(a) {
          color: #9ca3af;
          text-decoration: none;
        }

        .back-link :global(a:hover) {
          color: #e5e7eb;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        h1 {
          font-size: 1.9rem;
          margin: 0 0 0.35rem;
        }

        .subtitle {
          margin: 0.15rem 0;
          color: #9ca3af;
          font-size: 0.95rem;
        }

        .warning {
          color: #fbbf24;
        }

        .steps-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 1rem;
          list-style: none;
          padding: 0;
          margin: 0 0 1.75rem;
        }

        .steps-grid li {
          border-radius: 0.75rem;
          border: 1px solid #374151;
          padding: 0.85rem 0.9rem;
          font-size: 0.85rem;
          background: rgba(17, 24, 39, 0.75);
          color: #9ca3af;
        }

        .steps-grid li.step-active {
          border-color: #4b5563;
          background: radial-gradient(circle at top, #0f172a, #020617);
          color: #e5e7eb;
        }

        .step-label {
          display: block;
          font-weight: 600;
          margin-bottom: 0.25rem;
        }

        .grid {
          display: grid;
          grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr);
          gap: 1.5rem;
          margin-bottom: 1.5rem;
        }

        .card {
          background: rgba(15, 23, 42, 0.95);
          border-radius: 1rem;
          border: 1px solid #111827;
          padding: 1.25rem 1.4rem;
          box-shadow: 0 18px 40px rgba(0, 0, 0, 0.55);
        }

        .final-card {
          margin-top: 0.5rem;
        }

        h2 {
          font-size: 1.05rem;
          margin: 0 0 0.75rem;
        }

        .helper {
          font-size: 0.9rem;
          color: #9ca3af;
          margin: 0.25rem 0 0.75rem;
        }

        .field-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.4rem;
          padding: 0;
          margin: 0 0 0.75rem;
          list-style: none;
        }

        .field-list li {
          font-size: 0.8rem;
          border-radius: 999px;
          border: 1px dashed #374151;
          padding: 0.2rem 0.55rem;
          color: #9ca3af;
        }

        .example {
          background: #020617;
          border-radius: 0.75rem;
          border: 1px solid #111827;
          padding: 0.6rem 0.7rem;
          font-size: 0.78rem;
          color: #9ca3af;
          overflow-x: auto;
          margin-bottom: 0.75rem;
        }

        .bulk-textarea {
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid #1f2937;
          background: #020617;
          color: #e5e7eb;
          padding: 0.75rem 0.8rem;
          font-size: 0.85rem;
          resize: vertical;
          outline: none;
        }

        .bulk-textarea:focus {
          border-color: #4b5563;
          box-shadow: 0 0 0 1px #4b5563;
        }

        .actions {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-top: 0.8rem;
        }

        .hint {
          font-size: 0.8rem;
          color: #6b7280;
        }

        .btn {
          border-radius: 999px;
          padding: 0.55rem 1.4rem;
          font-size: 0.85rem;
          border: none;
          cursor: pointer;
          font-weight: 500;
        }

        .btn.primary {
          background: linear-gradient(to right, #10b981, #22c55e);
          color: #022c22;
        }

        .btn[disabled] {
          opacity: 0.6;
          cursor: default;
        }

        .summary {
          margin-bottom: 0.75rem;
          font-size: 0.9rem;
        }

        .badge {
          display: inline-block;
          padding: 0.12rem 0.5rem;
          border-radius: 999px;
          font-size: 0.75rem;
          margin-right: 0.3rem;
        }

        .badge.ok {
          background: rgba(16, 185, 129, 0.12);
          color: #6ee7b7;
        }

        .badge.warn {
          background: rgba(234, 179, 8, 0.12);
          color: #fbbf24;
        }

        .badge.error {
          background: rgba(239, 68, 68, 0.15);
          color: #fecaca;
        }

        .table-wrapper {
          max-height: 420px;
          overflow: auto;
          border-radius: 0.75rem;
          border: 1px solid #111827;
        }

        .preview-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.78rem;
        }

        .preview-table th,
        .preview-table td {
          padding: 0.45rem 0.55rem;
          border-bottom: 1px solid #0b1120;
          white-space: nowrap;
        }

        .preview-table th {
          position: sticky;
          top: 0;
          background: #020617;
          z-index: 1;
          text-align: left;
          font-weight: 500;
          color: #9ca3af;
        }

        .row-ok {
          background: rgba(15, 118, 110, 0.15);
        }

        .row-missing_field {
          background: rgba(234, 179, 8, 0.04);
        }

        .row-invalid_price {
          background: rgba(239, 68, 68, 0.04);
        }

        .row-auth_missing {
          background: rgba(153, 27, 27, 0.08);
        }

        .error-message {
          color: #fecaca;
          background: rgba(127, 29, 29, 0.4);
          border-radius: 0.75rem;
          padding: 0.6rem 0.8rem;
          font-size: 0.85rem;
          margin-bottom: 0.5rem;
        }

        .success-message {
          color: #bbf7d0;
          background: rgba(6, 95, 70, 0.4);
          border-radius: 0.75rem;
          padding: 0.6rem 0.8rem;
          font-size: 0.85rem;
          margin-bottom: 0.5rem;
        }

        @media (max-width: 900px) {
          .grid {
            grid-template-columns: minmax(0, 1fr);
          }

          .steps-grid {
            grid-template-columns: minmax(0, 1fr);
          }

          .page-header {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  );
}
