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

            {rows.length > 0 && (
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Brand</th>
                      <th>Category</th>
                      <th>Condition</th>
                      <th>Size</th>
                      <th>Color</th>
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
      </div>
    </>
  );
}
