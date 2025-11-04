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

const sampleRows: UploadRow[] = [
  {
    id: "1",
    title: "Gucci Marmont Mini Bag",
    brand: "GUCCI",
    price: "2450",
    category: "Bags",
    status: "ready",
  },
  {
    id: "2",
    title: "Chanel Slingbacks 37.5",
    brand: "CHANEL",
    price: "1250",
    category: "Shoes",
    status: "ready",
  },
  {
    id: "3",
    title: "Rolex Datejust 36",
    brand: "ROLEX",
    price: "",
    category: "Watches",
    status: "missing",
  },
];

export default function SellerBulkUpload() {
  const [fileName, setFileName] = useState<string | null>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const handleFileChange = (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setStep(2);
  };

  const handleConfirm = () => {
    setStep(3);
    alert(
      "In a full version this would upload the file, validate rows and create draft listings for review."
    );
  };

  return (
    <>
      <Head>
        <title>Seller — Bulk Upload | Famous Finds</title>
      </Head>
      <div className="min-h-screen bg-black text-gray-100">
        <Header />

        <main className="mx-auto max-w-5xl px-4 pb-16 pt-6">
          <div className="mb-4">
            <Link
              href="/"
              className="text-sm text-gray-400 hover:text-gray-200"
            >
              ← Back to Dashboard
            </Link>
          </div>

          <h1 className="text-2xl font-semibold">Bulk upload listings</h1>
          <p className="mt-1 text-sm text-gray-400">
            Upload many items at once using a spreadsheet. We&apos;ll create
            drafts for review before anything goes live.
          </p>

          {/* Steps indicator */}
          <ol className="mt-6 flex flex-wrap gap-3 text-xs">
            {[
              "Upload file",
              "Review & fix issues",
              "Submit for review",
            ].map((label, i) => {
              const n = (i + 1) as 1 | 2 | 3;
              const active = step === n;
              const done = step > n;
              return (
                <li
                  key={label}
                  className="flex items-center gap-2 text-xs"
                >
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
                  <span
                    className={
                      active ? "text-white" : "text-neutral-400"
                    }
                  >
                    {label}
                  </span>
                </li>
              );
            })}
          </ol>

          {/* Step 1: upload */}
          {step === 1 && (
            <section className="mt-8 grid gap-8 md:grid-cols-[minmax(0,2fr)_minmax(0,1.5fr)]">
              <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-6">
                <h2 className="text-sm font-semibold">
                  1. Download the template
                </h2>
                <p className="mt-2 text-xs text-gray-400">
                  Use our CSV template so column names match exactly. You can
                  duplicate it for each seller if you manage stock for
                  multiple boutiques.
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-black hover:bg-gray-100"
                    onClick={() =>
                      alert(
                        "In a full version this would download bulk-upload-template.csv."
                      )
                    }
                  >
                    Download CSV template
                  </button>
                  <button
                    type="button"
                    className="rounded-full border border-neutral-700 px-3 py-1.5 text-xs hover:border-neutral-500"
                    onClick={() =>
                      alert(
                        "In a full version this would open detailed formatting help."
                      )
                    }
                  >
                    View formatting guide
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-dashed border-neutral-700 bg-neutral-950/60 p-6">
                <h2 className="text-sm font-semibold">
                  2. Upload your completed file
                </h2>
                <p className="mt-2 text-xs text-gray-400">
                  CSV or Excel, up to 5,000 rows at a time.
                </p>

                <label className="mt-5 flex cursor-pointer flex-col items-center justify-center rounded-lg border border-neutral-700 bg-black/40 px-4 py-10 text-center text-xs text-neutral-400 hover:border-neutral-500">
                  <span className="mb-2 text-sm text-gray-100">
                    Drop file here or click to browse
                  </span>
                  <span className="text-[11px]">
                    We&apos;ll parse it and show you any issues before
                    submitting.
                  </span>
                  <input
                    type="file"
                    accept=".csv, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
              </div>
            </section>
          )}

          {/* Step 2: review */}
          {step === 2 && (
            <section className="mt-8 rounded-xl border border-neutral-800 bg-neutral-950 p-6">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-sm font-semibold">
                    Review sample of your upload
                  </h2>
                  <p className="text-xs text-gray-400">
                    We&apos;ve scanned the file{" "}
                    <span className="font-medium text-gray-200">
                      {fileName}
                    </span>{" "}
                    and highlighted any rows that need attention.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(1)}
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
                      <th className="px-3 py-2 text-left">Price (USD)</th>
                      <th className="px-3 py-2 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sampleRows.map((row) => (
                      <tr
                        key={row.id}
                        className="border-b border-neutral-900 last:border-0"
                      >
                        <td className="py-2 pr-3">{row.title}</td>
                        <td className="px-3 py-2">{row.brand}</td>
                        <td className="px-3 py-2">{row.category}</td>
                        <td className="px-3 py-2">
                          {row.price || (
                            <span className="text-amber-300">
                              Missing
                            </span>
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
                  In a production version you&apos;d be able to scroll all
                  rows, edit inline or download an error report.
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="rounded-full border border-neutral-700 px-3 py-1.5 text-xs hover:border-neutral-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirm}
                    className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-black hover:bg-gray-100"
                  >
                    Looks good — continue
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* Step 3: confirmation */}
          {step === 3 && (
            <section className="mt-8 rounded-xl border border-neutral-800 bg-neutral-950 p-6 text-sm">
              <h2 className="text-base font-semibold">
                Draft listings created
              </h2>
              <p className="mt-2 text-sm text-gray-300">
                Your file has been processed and draft listings would now be
                waiting in the review queue. Once approved by Famous Finds,
                they&apos;ll appear in your catalogue and in the store.
              </p>
              <p className="mt-4 text-xs text-gray-500">
                This is a demo only — no real items have been created yet.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                <Link
                  href="/seller/orders"
                  className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-black hover:bg-gray-100"
                >
                  Go to seller dashboard
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setFileName(null);
                  }}
                  className="rounded-full border border-neutral-700 px-3 py-1.5 text-xs hover:border-neutral-500"
                >
                  Upload another file
                </button>
              </div>
            </section>
          )}
        </main>

        <Footer />
      </div>
    </>
  );
}
