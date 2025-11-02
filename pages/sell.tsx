// FILE: pages/sell.tsx
import Layout from "@/components/Layout";
import { useState } from "react";

export default function Sell() {
  const [sent, setSent] = useState(false);
  const [imgUrl, setImgUrl] = useState("");
  const [cleaned, setCleaned] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function cleanBg() {
    setBusy(true); setErr("");
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
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function onSubmit(e: any) {
    e.preventDefault();
    const fd = new FormData(e.target);
    // include cleaned image if available
    if (cleaned) fd.set("cleanedImageDataUrl", cleaned);
    await fetch("/api/sell", { method: "POST", body: fd });
    setSent(true);
  }

  return (
    <Layout title="Sell — FamousFinds">
      <div className="max-w-xl mx-auto p-6">
        <h1 className="text-2xl font-semibold">Sell an Item</h1>
        {sent ? (
          <p className="mt-6">
            Thanks! Your item was submitted for review (simulation). Our US team will vet it shortly.
          </p>
        ) : (
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <input required name="title" placeholder="Title" className="w-full border p-3 rounded" />
            <select required name="category" className="w-full border p-3 rounded">
              <option value="party-dresses">Party Dresses</option>
              <option value="shoes">Shoes</option>
              <option value="bags">Bags</option>
              <option value="jewelry">Jewelry</option>
              <option value="women">Women</option>
              <option value="men">Men</option>
            </select>
            <select required name="condition" className="w-full border p-3 rounded">
              <option>New</option>
              <option>Like New</option>
              <option>Good</option>
              <option>Fair</option>
            </select>
            <input required type="number" name="price" placeholder="Price (USD)" className="w-full border p-3 rounded" />

            <div className="space-y-2">
              <input
                required
                name="image"
                placeholder="Image URL (https://...)"
                className="w-full border p-3 rounded"
                value={imgUrl}
                onChange={(e) => setImgUrl(e.target.value)}
              />
              <div className="flex gap-2">
                <button type="button" onClick={cleanBg} disabled={!imgUrl || busy} className="border rounded px-4 py-2">
                  {busy ? "Cleaning…" : "AI Clean Background"}
                </button>
                {err && <span className="text-red-600 text-sm">{err}</span>}
              </div>
            </div>

            {imgUrl && (
              <div className="grid grid-cols-2 gap-4 items-start">
                <div>
                  <div className="text-sm font-medium mb-1">Original</div>
                  <img src={imgUrl} alt="original" className="border rounded" />
                </div>
                {cleaned && (
                  <div>
                    <div className="text-sm font-medium mb-1">Cleaned (white bg)</div>
                    <img src={cleaned} alt="cleaned" className="border rounded bg-white" />
                  </div>
                )}
              </div>
            )}

            <textarea required name="description" placeholder="Description" className="w-full border p-3 rounded" rows={4} />
            <button className="w-full border rounded p-3">Submit for Review</button>
            <p className="text-xs text-gray-500">
              Submissions are reviewed for US sale only. Payouts via Stripe Connect.
            </p>
          </form>
        )}
      </div>
    </Layout>
  );
}
