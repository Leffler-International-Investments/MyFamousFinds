// FILE: /pages/seller/bulk-upload.tsx
import Head from "next/head";
import { useState } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";

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
};

export default function SellerBulkUploadPage() {
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

    // First non-empty row is header
    const headerLine = lines[0];
    const headerParts = headerLine.split(",").map((h) => h.trim().toLowerCase());

    // Map of header index → field key
    const headerIndex: Record<string, number> = {};
    headerParts.forEach((h, i) => {
      headerIndex[h] = i;
    });

    const missing = requiredHeaders.filter((h) => headerIndex[h] == null);
    if (missing.length > 0) {
      setErrors(
        `Missing required columns: ${missing.join(
          ", "
        )}. Please download the Format/Details CSV and use that header row.`
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
      };

      // Skip completely empty rows
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
      const res = await fetch("/api/seller/bulk-upload", {
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
          </div>

          {/* STEP 1 */}
          <section className="section-card">
            <h2 className="section-title">1. Paste your items (CSV)</h2>
            <p className="section-subtitle">
              Download the ready-made CSV, fill it in, then paste the rows below.
              Do not use commas inside any single field.
            </p>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
                gap: 16,
                flexWrap: "wrap",
              }}
            >
              <span style={{ fontSize: 14, color: "#4b5563" }}>
                Need the correct headings and options?
              </span>
              <a
                href="/bulk-upload-template.csv"
                className="btn-primary-dark"
                download
              >
                Format / Details Form (CSV)
              </a>
            </div>

            <textarea
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              rows={8}
              className="form-textarea"
              placeholder="Paste the CSV rows here, including the header line (title,brand,category,condition,size,color,price,source,proof,serial)…"
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
              <p style={{ fontSize: 14, color: "#6b7280" }}>
                Nothing parsed yet. Paste your items above and click{" "}
                <strong>Parse Items</strong>.
              </p>
            )}

            {rows.length > 0 && (
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Brand / Designer</th>
                      <th>Category</th>
                      <th>Condition</th>
                      <th>Size</th>
                      <th>Color</th>
                      <th>Price (USD)</th>
                      <th>Source</th>
                      <th>Proof</th>
                      <th>Serial / Ref</th>
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
          </section>

          {/* STEP 3 */}
          <section className="section-card">
            <h2 className="section-title">3. Confirm and submit</h2>
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
                ? "Creating listings..."
                : `Create ${rows.length} listing(s)`}
            </button>
          </section>
        </main>
        <Footer />
      </div>

      <style jsx>{`
        .section-card {
          background: #ffffff;
          border-radius: 16px;
          padding: 20px;
          margin-bottom: 24px;
          box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06);
        }
        .section-title {
          font-size: 18px;
          margin-bottom: 4px;
        }
        .section-subtitle {
          font-size: 14px;
          color: #6b7280;
          margin-bottom: 16px;
        }
        .form-textarea {
          width: 100%;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
          padding: 10px 12px;
          font-size: 14px;
          font-family: inherit;
          resize: vertical;
        }
        .table-wrapper {
          margin-top: 16px;
          overflow-x: auto;
        }
        .data-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }
        .data-table th,
        .data-table td {
          padding: 8px 10px;
          border-bottom: 1px solid #e5e7eb;
          text-align: left;
        }
        .data-table thead th {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #6b7280;
          background: #f9fafb;
        }
        .form-message {
          margin-top: 12px;
          margin-bottom: 12px;
          padding: 10px 12px;
          border-radius: 10px;
          font-size: 14px;
        }
        .form-message.error {
          background: #fef2f2;
          color: #b91c1c;
        }
        .form-message.success {
          background: #ecfdf3;
          color: #166534;
        }
        .btn-primary-dark {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 8px 16px;
          border-radius: 999px;
          background: #111827;
          color: #ffffff;
          font-size: 14px;
          border: none;
          cursor: pointer;
          text-decoration: none;
        }
        .btn-primary-dark:disabled {
          opacity: 0.6;
          cursor: default;
        }
      `}</style>
    </>
  );
}
