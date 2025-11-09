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
  const { loading, seller } = useRequireSeller();
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

  if (loading) return null;

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

        <div className="mt-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-white">
              Bulk upload listings
            </h1>
            <p className="mt-1 text-xs text-gray-400">
              Paste multiple items in one go. All prices are treated as USD.
            </p>
          </div>
        </div>

        <ol className="mt-6 grid gap-3 text-xs text-gray-300 md:grid-cols-3">
          <li className={step >= 1 ? "font-semibold text-white" : ""}>
            1. Paste your items
          </li>
          <li className={step >= 2 ? "font-semibold text-white" : ""}>
            2. Review and fix issues
          </li>
          <li className={step >= 3 ? "font-semibold text-white" : ""}>
            3. Confirm and submit
          </li>
        </ol>

        <section className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-xs">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400">
            1. Paste your items (USD)
          </h2>
          <p className="mt-2 text-gray-300">
            One item per line, fields separated by commas:
          </p>
          <p className="mt-1 text-gray-300">
            <code>
              title, brand, category, condition, size, color, price (USD),
              purchase_source, purchase_proof, serial_number
            </code>
          </p>

          <div className="mt-3 space-y-2 rounded-md bg-black/40 p-3 text-[11px] text-gray-400">
            <p className="font-semibold text-gray-200">Example (copy/paste):</p>
            {exampleLines.map((line) => (
              <p key={line} className="font-mono">
                {line}
              </p>
            ))}
          </div>

          <textarea
            ref={textareaRef}
            className="mt-4 h-48 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-xs text-white focus:border-white focus:outline-none"
            placeholder="Paste your items here…"
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
          />

          <div className="mt-3 flex gap-2">
            <button
              onClick={handleParse}
              disabled={busy}
              className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-black hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Parse items
            </button>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-xs">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400">
            2. Review parsed items
          </h2>

          {!rows.length ? (
            <p className="mt-2 text-gray-400">
              Nothing parsed yet. Paste your items above and click{" "}
              <span className="font-semibold text-gray-200">Parse items</span>.
            </p>
          ) : (
            <>
              <p className="mt-2 text-gray-300">
                Parsed{" "}
                <span className="font-semibold text-white">
                  {rows.length}
                </span>{" "}
                lines. Valid rows in USD:{" "}
                <span className="font-semibold text-emerald-300">
                  {okRows.length}
                </span>
                .
              </p>

              <div className="mt-3 overflow-x-auto rounded-md border border-white/10">
                <table className="min-w-full text-left text-[11px] text-gray-100">
                  <thead className="bg-white/5 text-[10px] uppercase tracking-[0.16em] text-gray-400">
                    <tr>
                      <th className="px-3 py-2 text-left">Row</th>
                      <th className="px-3 py-2 text-left">Title</th>
                      <th className="px-3 py-2 text-left">Brand</th>
                      <th className="px-3 py-2 text-left">Category</th>
                      <th className="px-3 py-2 text-left">Price (USD)</th>
                      <th className="px-3 py-2 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr
                        key={row._row}
                        className="border-b border-white/10 last:border-0"
                      >
                        <td className="px-3 py-2 text-gray-400">
                          {row._row}
                        </td>
                        <td className="px-3 py-2 text-gray-100">
                          {row.title || "—"}
                        </td>
                        <td className="px-3 py-2 text-gray-200">
                          {row.brand || "—"}
                        </td>
                        <td className="px-3 py-2 text-gray-200">
                          {row.category || "—"}
                        </td>
                        <td className="px-3 py-2 text-gray-200">
                          {typeof row.price === "number"
                            ? `$${row.price.toLocaleString("en-US", {
                                maximumFractionDigits: 2,
                              })}`
                            : "—"}
                        </td>
                        <td className="px-3 py-2">
                          {row._status === "ok" ? (
                            <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-[10px] font-semibold text-emerald-300">
                              OK
                            </span>
                          ) : (
                            <span className="rounded-full bg-red-500/10 px-2 py-1 text-[10px] font-semibold text-red-300">
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

        <section className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-xs">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400">
            3. Confirm and submit
          </h2>
          <p className="mt-2 text-gray-300">
            When you confirm, we will create listings for all{" "}
            <span className="font-semibold text-emerald-300">
              valid rows in USD
            </span>{" "}
            and send them to the vetting queue.
          </p>
          {error && (
            <p className="mt-2 text-red-400">
              {error}
            </p>
          )}
          {result && (
            <p className="mt-2 text-emerald-300">
              Created {result.created} listings. Skipped {result.skipped} rows.
            </p>
          )}

          <div className="mt-3 flex gap-2">
            <button
              onClick={handleCommit}
              disabled={committing || !okRows.length}
              className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-black hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {committing ? "Submitting…" : "Create listings in USD"}
            </button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
