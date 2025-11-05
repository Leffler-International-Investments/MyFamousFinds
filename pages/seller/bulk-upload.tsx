// FILE: /pages/seller/bulk-upload.tsx
import Head from "next/head";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useState } from "react";

type UploadRow = {
  id: string;
  title: string;
  brand: string;
  price: string;
  category: string;
  status: "ready" | "missing" | "error";
};

export default function SellerBulkUpload() {
  const [fileName, setFileName] = useState<string | null>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [rows, setRows] = useState<UploadRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [committing, setCommitting] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setLoading(true);
    setError(null);
    setRows([]);

    try {
      const text = await file.text();
      const res = await fetch("/api/seller/bulk-parse", {
        method: "POST",
        headers: { "Content-Type": "text/csv" },
        body: text,
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || "Failed to parse file");
      }

      const parsed = (json.rows || []).map((r: any, idx: number) => {
        const price = String(r.price ?? "").trim();
        let status: UploadRow["status"] = "ready";
        if (!price) status = "missing";
        return {
          id: String(r.id ?? idx + 1),
          title: String(r.title || "Untitled"),
          brand: String(r.brand || ""),
          price,
          category: String(r.category || ""),
          status,
        } as UploadRow;
      });

      setRows(parsed);
      setStep(2);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Unable to read this file.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    const ready = rows.filter((r) => r.status === "ready");
    if (!ready.length) {
      alert("There are no rows marked as ready.");
      return;
    }

    setCommitting(true);
    setError(null);

    try {
      const res = await fetch("/api/seller/bulk-commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: ready }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || "Failed to create listings");
      }
      setStep(3);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Unable to create listings.");
    } finally {
      setCommitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-gray-100">
      <Head>
        <title>Seller — Bulk Upload | Famous Finds</title>
      </Head>

      <Header />

      <main className="mx-auto max-w-5xl px-4 pb-16 pt-6 text-sm">
        <Link
          href="/seller/dashboard"
          className="text-xs text-gray-400 hover:text-gray-200"
        >
          ← Back to Dashboard
        </Link>

        <h1 className="mt-4 text-2xl font-semibold text-white">
          Bulk upload listings
        </h1>
        <p className="mt-1 text-sm text-gray-400">
          Upload a spreadsheet to create many listings at once. Each listing is
          created as a draft or pending review before going live.
        </p>

        {/* Steps indicator */}
        <ol className="mt-6 flex flex-wrap gap-3 text-xs">
          {["Upload file", "Review rows", "Create listings"].map(
            (label, i) => {
              const n = (i + 1) as 1 | 2 | 3;
              const active = step === n;
              const done = step > n;
              return (
                <li key={label} className="flex items-center gap-2 text-xs">
                  <span
                    className={
                      "flex h-5 w-5 items-center justify-center rounded-full border text-[10px] " +
                      (done
                        ? "border-emerald-400 bg-emerald-500/20 text-emerald-200"
                        : active
                        ? "border-white text-white"
                        : "border-neutral-600 text-neutral-500")
                    }
                  >
                    {done ? "✓" : n}
                  </span>
                  <span className={active ? "text-white" : "text-neutral-400"}>
                    {label}
                  </span>
                </li>
              );
            }
          )}
        </ol>

        {/* STEP 1 */}
        {step === 1 && (
          <section className="mt-8 grid gap-8 md:grid-cols-[minmax(0,2fr)_minmax(0,1.5fr)]">
            <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-6">
              <h2 className="text-sm font-semibold">1. CSV structure</h2>
              <p className="mt-2 text-xs text-gray-400">
                The parser expects columns like <code>title</code>,{" "}
                <code>brand</code>, <code>category</code>, <code>price</code>,
                etc. Download the template for the exact column names.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <a
                  href="/api/seller/bulk-template"
                  className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-black hover:bg-gray-100"
                >
                  Download CSV template
                </a>
              </div>
            </div>

            <div className="rounded-xl border border-dashed border-neutral-700 bg-neutral-950/60 p-6">
              <h2 className="text-sm font-semibold">2. Upload your file</h2>
              <p className="mt-2 text-xs text-gray-400">
                CSV or Excel exported as CSV, up to 5,000 rows.
              </p>

              <label className="mt-5 flex cursor-pointer flex-col items-center justify-center rounded-lg border border-neutral-700 bg-black/40 px-4 py-10 text-center text-xs text-neutral-400 hover:border-neutral-500">
                <span className="mb-2 text-sm text-gray-100">
                  Drop file here or click to browse
                </span>
                <span className="text-[11px]">
                  We&apos;ll parse it and highlight any rows that need fixes.
                </span>
                <input
                  type="file"
                  accept=".csv, text/csv"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>

              {fileName && !loading && !error && (
                <p className="mt-3 text-xs text-gray-400">
                  Selected file: <span className="font-medium">{fileName}</span>
                </p>
              )}

              {loading && (
                <p className="mt-3 text-xs text-gray-400">
                  Parsing file, please wait…
                </p>
              )}
              {error && !loading && (
                <p className="mt-3 text-xs text-red-400">{error}</p>
              )}
            </div>
          </section>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <section className="mt-8 rounded-xl border border-neutral-800 bg-neutral-950 p-6">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-sm font-semibold">
                  Review detected rows
                </h2>
                <p className="text-xs text-gray-400">
                  Only rows marked as <strong>Ready</strong> will be created.
                  You can cancel and upload a corrected file at any time.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setRows([]);
                  setFileName(null);
                }}
                className="self-start rounded-full border border-neutral-700 px-3 py-1 text-xs hover:border-neutral-500"
              >
                Choose a different file
              </button>
            </div>

            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[640px] text-xs">
                <thead className="border-b border-neutral-800 text-[11px] uppercase tracking-wide text-gray-400">
                  <tr>
                    <th className="py-2 pr-3 text-left">Title</th>
                    <th className="px-3 py-2 text-left">Brand</th>
                    <th className="px-3 py-2 text-left">Category</th>
                    <th className="px-3 py-2 text-left">Price (AUD)</th>
                    <th className="px-3 py-2 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <tr>
                      <td
                        className="py-4 text-center text-xs text-gray-400"
                        colSpan={5}
                      >
                        Parsing file…
                      </td>
                    </tr>
                  )}

                  {!loading && error && (
                    <tr>
                      <td
                        className="py-4 text-center text-xs text-red-400"
                        colSpan={5}
                      >
                        {error}
                      </td>
                    </tr>
                  )}

                  {!loading && !error && rows.length === 0 && (
                    <tr>
                      <td
                        className="py-4 text-center text-xs text-gray-400"
                        colSpan={5}
                      >
                        No rows detected in this file.
                      </td>
                    </tr>
                  )}

                  {!loading &&
                    !error &&
                    rows.map((row) => (
                      <tr
                        key={row.id}
                        className="border-b border-neutral-900 last:border-0"
                      >
                        <td className="py-2 pr-3">{row.title}</td>
                        <td className="px-3 py-2">{row.brand}</td>
                        <td className="px-3 py-2">{row.category}</td>
                        <td className="px-3 py-2">
                          {row.price || (
                            <span className="text-amber-300">Missing</span>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          {row.status === "ready" && (
                            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] text-emerald-300">
                              Ready
                            </span>
                          )}
                          {row.status === "missing" && (
                            <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] text-amber-300">
                              Needs price
                            </span>
                          )}
                          {row.status === "error" && (
                            <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-[11px] text-red-300">
                              Error
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            <div className="mt-5 flex flex-col gap-3 border-t border-neutral-800 pt-4 text-xs text-gray-400 md:flex-row md:items-center md:justify-between">
              <p>
                We will create listings only for rows marked as Ready. You can
                re-upload a corrected file whenever you need.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setRows([]);
                    setFileName(null);
                  }}
                  className="rounded-full border border-neutral-700 px-3 py-1.5 text-xs hover:border-neutral-500"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-black hover:bg-gray-100 disabled:opacity-60"
                  disabled={committing || !rows.length}
                >
                  {committing ? "Creating listings…" : "Create listings"}
                </button>
              </div>
            </div>
          </section>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <section className="mt-8 rounded-xl border border-neutral-800 bg-neutral-950 p-6 text-sm">
            <h2 className="text-base font-semibold">Listings created</h2>
            <p className="mt-2 text-sm text-gray-300">
              Your file has been processed and draft listings have been created
              in your catalogue. Items may still require review before going
              live.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Link
                href="/seller/catalogue"
                className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-black hover:bg-gray-100"
              >
                Go to my catalogue
              </Link>
              <Link
                href="/seller/dashboard"
                className="rounded-full border border-neutral-700 px-3 py-1.5 text-xs hover:border-neutral-500"
              >
                Back to seller dashboard
              </Link>
            </div>
          </section>
        )}

        {error && step === 3 && (
          <p className="mt-3 text-xs text-red-400">{error}</p>
        )}
      </main>

      <Footer />
    </div>
  );
}
