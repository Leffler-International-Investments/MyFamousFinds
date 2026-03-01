// FILE: /pages/seller/bulk-upload.tsx
import Head from "next/head";
import Link from "next/link";
import { useState } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { sellerFetch } from "../../utils/sellerClient";
import { useRequireSeller } from "../../hooks/useRequireSeller";

type ParsedRow = {
  title: string;
  brand: string;
  category: string;
  condition: string;
  size: string;
  color: string;
  price: string;
  source: string;
  proof: string;
  serial: string;
  details: string;
  colorswatch: string;
  material: string;
};

export default function SellerBulkUploadPage() {
  const { loading: authLoading } = useRequireSeller();
  const [raw, setRaw] = useState("");
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [errors, setErrors] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const requiredHeaders = [
    "title",
    "brand",
    "category",
    "condition",
    "size",
    "color",
    "price",
    "source",
    "proof",
    "serial",
  ];

  function parseCsv() {
    setErrors(null);
    setSuccessMsg(null);
    setRows([]);

    const lines = raw
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length === 0) {
      setErrors("Nothing to parse. Paste your CSV first.");
      return;
    }

    const headerLine = lines[0];
    const headerParts = headerLine.split(",").map((h) => h.trim().toLowerCase());

    const headerIndex: Record<string, number> = {};
    headerParts.forEach((h, i) => {
      headerIndex[h] = i;
    });

    const missing = requiredHeaders.filter((h) => headerIndex[h] == null);
    if (missing.length > 0) {
      setErrors(
        `Missing required columns: ${missing.join(
          ", "
        )}. Please download the Format / Details Form and use that header row.`
      );
      return;
    }

    const parsed: ParsedRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;

      const parts = line.split(",").map((p) => p.trim());

      const row: ParsedRow = {
        title: parts[headerIndex["title"]] || "",
        brand: parts[headerIndex["brand"]] || "",
        category: parts[headerIndex["category"]] || "",
        condition: parts[headerIndex["condition"]] || "",
        size: parts[headerIndex["size"]] || "",
        color: parts[headerIndex["color"]] || "",
        price: parts[headerIndex["price"]] || "",
        source: parts[headerIndex["source"]] || "",
        proof: parts[headerIndex["proof"]] || "",
        serial: parts[headerIndex["serial"]] || "",
        details: headerIndex["details"] != null ? (parts[headerIndex["details"]] || "") : "",
        colorswatch: headerIndex["colorswatch"] != null ? (parts[headerIndex["colorswatch"]] || "") : "",
        material: headerIndex["material"] != null ? (parts[headerIndex["material"]] || "") : "",
      };

      const nonEmpty = Object.values(row).some((v) => v && v.length > 0);
      if (!nonEmpty) continue;

      parsed.push(row);
    }

    if (parsed.length === 0) {
      setErrors("No valid item rows found under the header.");
      return;
    }

    setRows(parsed);
  }

  async function handleSubmit() {
    if (rows.length === 0) {
      setErrors("Nothing to submit. Parse your CSV first.");
      return;
    }

    setIsSubmitting(true);
    setErrors(null);
    setSuccessMsg(null);

    try {
      const res = await sellerFetch("/api/seller/bulk-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Bulk upload failed");
      }

      setSuccessMsg(
        `Created ${json.count || rows.length} listings in the review queue.`
      );
      setRows([]);
      setRaw("");
    } catch (err: any) {
      setErrors(err?.message || "Something went wrong while submitting.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (authLoading) {
    return (
      <>
        <Head><title>Bulk Upload Listings — Seller</title></Head>
        <div className="dashboard-page">
          <Header />
          <main className="dashboard-main"><p>Checking seller access…</p></main>
          <Footer />
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Bulk Upload Listings — Seller</title>
      </Head>
      <div className="dashboard-page">
        <Header />
        <main className="dashboard-main">
          <div className="dashboard-header">
            <div>
              <h1>Bulk Upload Listings</h1>
              <p>Paste multiple items in one go. All prices are treated as USD.</p>
            </div>
            <Link href="/seller/dashboard">← Back to Seller Dashboard</Link>
          </div>

          {/* STEP 1 */}
          <section className="section-card">
            <h2 className="section-title">1. Paste your items (CSV)</h2>

            <p className="section-subtitle">
              Download the ready-made CSV, fill it in (one row per item), then
              paste the rows below.
            </p>

            <div className="section-top-row">
              <span className="section-note">
                Need the correct headings and spelling?
              </span>

              {/* UPDATED BUTTON */}
              <a
                href="/bulk-upload-template (1).csv"
                className="btn-primary-dark"
                download
              >
                Format / Details Form (CSV)
              </a>
            </div>

            {/* NEW - HOW TO COMPLETE FORM */}
            <div className="help-box">
              <strong>How to complete the CSV form</strong>
              <ol>
                <li>Download the CSV and open it in Excel or Google Sheets.</li>
                <li>One item = one row only.</li>
                <li>Do NOT change the header spellings.</li>
                <li>Do NOT use commas inside any cell.</li>
                <li>Use clean text: “Black leather”, NOT “Black, leather”.</li>
                <li>Price = numbers only, no symbols.</li>
                <li>When done, copy all rows including header and paste below.</li>
              </ol>
            </div>

            <textarea
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              rows={8}
              className="form-textarea"
              placeholder="Paste the CSV rows here including the header..."
            />

            <button
              type="button"
              onClick={parseCsv}
              className="btn-primary-dark"
              style={{ marginTop: 12 }}
            >
              Parse Items
            </button>
          </section>

          {/* STEP 2 */}
          <section className="section-card">
            <h2 className="section-title">2. Review parsed items</h2>

            {rows.length === 0 && (
              <p className="muted">Nothing parsed yet.</p>
            )}

            {/* DESKTOP: review table */}
            {rows.length > 0 && (
              <div className="table-wrapper desktop-table">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Brand</th>
                      <th>Category</th>
                      <th>Condition</th>
                      <th>Size</th>
                      <th>Color</th>
                      <th>Material</th>
                      <th>Details</th>
                      <th>Price</th>
                      <th>Source</th>
                      <th>Proof</th>
                      <th>Serial</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, idx) => (
                      <tr key={idx}>
                        <td>{row.title}</td>
                        <td>{row.brand}</td>
                        <td>{row.category}</td>
                        <td>{row.condition}</td>
                        <td>{row.size}</td>
                        <td>{row.color}</td>
                        <td>{row.material}</td>
                        <td>{row.details}</td>
                        <td>{row.price}</td>
                        <td>{row.source}</td>
                        <td>{row.proof}</td>
                        <td>{row.serial}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* MOBILE: review cards */}
            {rows.length > 0 && (
              <div className="mobile-cards">
                {rows.map((row, idx) => (
                  <div key={idx} className="mobile-bulk-card">
                    <div className="mobile-bulk-header">
                      <span className="mobile-bulk-num">#{idx + 1}</span>
                      <strong className="mobile-bulk-title">{row.title || "Untitled"}</strong>
                      {row.price && <span className="mobile-bulk-price">${row.price}</span>}
                    </div>
                    <div className="mobile-bulk-rows">
                      {row.brand && <div className="mobile-bulk-row"><span className="mb-label">Brand</span><span className="mb-val">{row.brand}</span></div>}
                      {row.category && <div className="mobile-bulk-row"><span className="mb-label">Category</span><span className="mb-val">{row.category}</span></div>}
                      {row.condition && <div className="mobile-bulk-row"><span className="mb-label">Condition</span><span className="mb-val">{row.condition}</span></div>}
                      {row.size && <div className="mobile-bulk-row"><span className="mb-label">Size</span><span className="mb-val">{row.size}</span></div>}
                      {row.color && <div className="mobile-bulk-row"><span className="mb-label">Color</span><span className="mb-val">{row.color}</span></div>}
                      {row.material && <div className="mobile-bulk-row"><span className="mb-label">Material</span><span className="mb-val">{row.material}</span></div>}
                      {row.details && <div className="mobile-bulk-row"><span className="mb-label">Details</span><span className="mb-val">{row.details}</span></div>}
                      {row.source && <div className="mobile-bulk-row"><span className="mb-label">Source</span><span className="mb-val">{row.source}</span></div>}
                      {row.proof && <div className="mobile-bulk-row"><span className="mb-label">Proof</span><span className="mb-val">{row.proof}</span></div>}
                      {row.serial && <div className="mobile-bulk-row"><span className="mb-label">Serial</span><span className="mb-val">{row.serial}</span></div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* STEP 3 */}
          <section className="section-card">
            <h2 className="section-title">3. Confirm & Submit</h2>

            {errors && (
              <div className="form-message error">
                <strong>Error:</strong> {errors}
              </div>
            )}

            {successMsg && (
              <div className="form-message success">
                <strong>Done:</strong> {successMsg}
              </div>
            )}

            <button
              type="button"
              className="btn-primary-dark"
              disabled={isSubmitting || rows.length === 0}
              onClick={handleSubmit}
            >
              {isSubmitting
                ? "Creating listings…"
                : `Create ${rows.length} listing(s)`}
            </button>
          </section>
        </main>

        <Footer />

        <style jsx>{`
          .mobile-cards { display: none; }

          @media (max-width: 700px) {
            .desktop-table { display: none; }
            .mobile-cards { display: block; }

            .section-top-row {
              flex-direction: column;
              gap: 8px;
            }
          }

          .mobile-bulk-card {
            background: #fff;
            border: 1px solid #e5e7eb;
            border-radius: 10px;
            padding: 14px;
            margin-bottom: 10px;
          }

          .mobile-bulk-header {
            display: flex;
            align-items: baseline;
            gap: 8px;
            padding-bottom: 8px;
            border-bottom: 1px solid #f3f4f6;
            flex-wrap: wrap;
          }

          .mobile-bulk-num {
            font-size: 11px;
            color: #9ca3af;
            font-weight: 600;
          }

          .mobile-bulk-title {
            flex: 1;
            font-size: 14px;
            color: #111827;
            min-width: 0;
            word-break: break-word;
          }

          .mobile-bulk-price {
            font-size: 14px;
            font-weight: 700;
            color: #111827;
            white-space: nowrap;
          }

          .mobile-bulk-rows {
            display: flex;
            flex-direction: column;
            gap: 4px;
            padding-top: 8px;
          }

          .mobile-bulk-row {
            display: flex;
            justify-content: space-between;
            gap: 12px;
          }

          .mb-label {
            font-size: 11px;
            text-transform: uppercase;
            color: #6b7280;
            font-weight: 600;
            flex-shrink: 0;
          }

          .mb-val {
            font-size: 13px;
            color: #111827;
            text-align: right;
            word-break: break-word;
          }
        `}</style>
      </div>
    </>
  );
}
