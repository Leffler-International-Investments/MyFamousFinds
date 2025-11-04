// FILE: /pages/sell.tsx
import Layout from "@/components/Layout";
import { FormEvent, useState } from "react";

export default function Sell() {
  const [sent, setSent] = useState(false);
  const [imgUrl, setImgUrl] = useState("");
  const [cleaned, setCleaned] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function cleanBg() {
    if (!imgUrl) return;
    setBusy(true);
    setErr("");

    try {
      const r = await fetch("/api/images/clean", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: imgUrl }),
      });
      const j = await r.json();
      if (!j.ok) throw new Error(j.error || "clean_failed");
      setCleaned(j.cleanedDataUrl);
    } catch (e: any) {
      setErr(e.message || "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    // include cleaned image if available
    if (cleaned) fd.set("cleanedImageDataUrl", cleaned);

    await fetch("/api/sell", { method: "POST", body: fd });
    setSent(true);
  }

  return (
    <Layout title="Sell — Famous Finds">
      <div className="flex justify-center">
        <div className="w-full max-w-xl py-10 px-4">
          <h1 className="text-2xl font-semibold">Sell an Item</h1>

          {sent ? (
            <p className="mt-6 text-sm">
              Thanks! Your item was submitted for review (demo). Our US team
              will vet it shortly.
            </p>
          ) : (
            <form onSubmit={onSubmit} className="mt-6 space-y-4 text-sm">
              <input
                required
                name="title"
                placeholder="Title"
                className="w-full rounded border border-neutral-700 bg-neutral-900 p-3 outline-none"
              />

              <select
                required
                name="category"
                className="w-full rounded border border-neutral-700 bg-neutral-900 p-3 outline-none"
              >
                <option value="party-dresses">Party Dresses</option>
                <option value="shoes">Shoes</option>
                <option value="bags">Bags</option>
                <option value="jewelry">Jewelry</option>
                <option value="women">Women</option>
                <option value="men">Men</option>
              </select>

              <select
                required
                name="condition"
                className="w-full rounded border border-neutral-700 bg-neutral-900 p-3 outline-none"
              >
                <option>New</option>
                <option>Like New</option>
                <option>Good</option>
                <option>Fair</option>
              </select>

              <input
                required
                type="number"
                step="0.01"
                name="price"
                placeholder="Price (USD)"
                className="w-full rounded border border-neutral-700 bg-neutral-900 p-3 outline-none"
              />

              <div className="space-y-2">
                <input
                  required
                  name="image"
                  placeholder="Image URL (https://...)"
                  className="w-full rounded border border-neutral-700 bg-neutral-900 p-3 outline-none"
                  value={imgUrl}
                  onChange={(e) => setImgUrl(e.target.value)}
                />
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={cleanBg}
                    disabled={!imgUrl || busy}
                    className="rounded border border-neutral-600 px-4 py-2 text-xs hover:border-neutral-400 disabled:opacity-60"
                  >
                    {busy ? "Cleaning…" : "AI Clean Background"}
                  </button>
                  {err && (
                    <span className="text-xs text-red-400">Error: {err}</span>
                  )}
                </div>
              </div>

              {imgUrl && (
                <div className="grid grid-cols-2 gap-4 items-start text-xs">
                  <div>
                    <div className="mb-1 font-medium">Original</div>
                    <img
                      src={imgUrl}
                      alt="original"
                      className="rounded border border-neutral-700"
                    />
                  </div>
                  {cleaned && (
                    <div>
                      <div className="mb-1 font-medium">
                        Cleaned (white background)
                      </div>
                      <img
                        src={cleaned}
                        alt="cleaned"
                        className="rounded border border-neutral-700 bg-white"
                      />
                    </div>
                  )}
                </div>
              )}

              <textarea
                required
                name="description"
                placeholder="Description"
                rows={4}
                className="w-full rounded border border-neutral-700 bg-neutral-900 p-3 text-sm outline-none"
              />

              <button className="w-full rounded bg-white p-3 text-sm font-semibold text-black hover:bg-gray-100">
                Submit for Review
              </button>

              <p className="text-xs text-gray-400">
                Submissions are reviewed for US sale only. Payouts via Stripe
                Connect.
              </p>
            </form>
          )}
        </div>
      </div>
    </Layout>
  );
}
