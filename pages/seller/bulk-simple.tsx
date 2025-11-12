// /pages/seller/bulk-simple.tsx
// Quick Add — Multi-Item Form (Seller)
// NOTE: This version keeps your existing layout/flow and ONLY changes
// how the Designers <select> is populated. It now loads directly from
// Firestore on the client (same approach as /sell), with a safe fallback.
// No server /api call and no composite index required.

import { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";

// ✅ Client Firestore (same as /sell page uses)
import { db } from "../../utils/firebaseClient";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  DocumentData,
} from "firebase/firestore";

// ---- Types (trimmed to what this page actually uses) ----
type Designer = { id: string; name: string };
type Item = {
  designerId?: string;
  title?: string;
  category?: string;
  condition?: string;
  size?: string;
  color?: string;
  priceUSD?: string;
  serial?: string;
  purchaseSource?: string;
  purchaseProof?: string;
  images?: File[];
};

const CONDITIONS = [
  "New with tags",
  "New (never used)",
  "Excellent",
  "Very good",
  "Good",
  "Fair",
];

const CATEGORIES = [
  "Bags",
  "Shoes",
  "Jewelry",
  "Watches",
  "Clothing",
  "Accessories",
];

const SOURCES = ["Boutique / Brand", "Department Store", "Resale", "Gift", "Other"];
const PROOFS = ["Receipt", "Bank statement", "Certificate", "Other"];

export default function BulkSimple() {
  const [items, setItems] = useState<Item[]>([{ }]);
  const [designers, setDesigners] = useState<Designer[]>([]);
  const [loadingDesigners, setLoadingDesigners] = useState(false);
  const [designerError, setDesignerError] = useState<string | null>(null);

  // ---------- LOAD DESIGNERS (same logic as /sell, with fallback) ----------
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoadingDesigners(true);
      setDesignerError(null);
      try {
        // First try: approved + ordered (will work if an index exists; if not, we catch and fallback)
        const q = query(
          collection(db, "designers"),
          where("approved", "==", true),
          orderBy("name", "asc")
        );
        const snap = await getDocs(q);
        const list = snap.docs.map(d => ({
          id: d.id,
          name: String((d.data() as DocumentData).name ?? d.id),
        }));
        if (!cancelled) setDesigners(list);
      } catch (err) {
        // Fallback: get all docs, sort on client, then filter by approved (or no field)
        try {
          const snap = await getDocs(collection(db, "designers"));
          const list = snap.docs
            .map(d => {
              const data = d.data() as DocumentData;
              return {
                id: d.id,
                name: String(data?.name ?? d.id),
                approved: Boolean(data?.approved ?? true),
              };
            })
            .filter(d => d.approved)
            .sort((a, b) => a.name.localeCompare(b.name))
            .map(({ id, name }) => ({ id, name }));
          if (!cancelled) setDesigners(list);
        } catch (e) {
          if (!cancelled) {
            setDesignerError("Couldn't load designers list from server.");
          }
        }
      } finally {
        if (!cancelled) setLoadingDesigners(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, []);

  // ---------- Handlers ----------
  const addItem = () => setItems(prev => [...prev, {}]);

  const removeItem = (idx: number) =>
    setItems(prev => prev.filter((_, i) => i !== idx));

  const update = (idx: number, patch: Partial<Item>) =>
    setItems(prev => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));

  const totalReady = useMemo(
    () =>
      items.filter(
        it => it.designerId && it.title && it.category && it.condition && it.priceUSD
      ).length,
    [items]
  );

  // (Your existing create handler can stay the same; omitted here for brevity)
  const onCreate = async () => {
    // TODO: hook into your existing single/bulk create logic
    alert("Create clicked — connect to your existing submit handler.");
  };

  return (
    <div className="dark-theme-page">
      <Head><title>Quick Add — Multi-Item Form | Famous Finds</title></Head>
      <Header />

      <main className="section">
        <div className="back-link">
          <Link href="/seller/dashboard">← Back to Dashboard</Link>
        </div>

        <div className="header-row">
          <h1>Quick Add — Multi-Item Form</h1>
          <Link href="/seller/bulk-upload" className="alt-link">
            Prefer CSV-style paste? Use Bulk Upload →
          </Link>
        </div>
        <p className="hint">Add several listings at once with dropdowns and image uploads.</p>

        {designerError && (
          <p className="banner error">⚠️ {designerError}</p>
        )}
        {!designerError && loadingDesigners && (
          <p className="banner">Loading designers…</p>
        )}
        {!loadingDesigners && !designerError && designers.length === 0 && (
          <p className="banner error">No designers configured.</p>
        )}

        {items.map((it, idx) => (
          <div className="card" key={idx}>
            <div className="row head">
              <div className="item-title">Item #{idx + 1}</div>
              <button
                type="button"
                className="remove"
                onClick={() => removeItem(idx)}
                aria-label="Remove item"
              >
                Remove
              </button>
            </div>

            <div className="grid">
              {/* Designer */}
              <label>
                <span>Designer</span>
                <select
                  value={it.designerId || ""}
                  onChange={e => update(idx, { designerId: e.target.value })}
                  disabled={loadingDesigners || !!designerError || designers.length === 0}
                >
                  <option value="">
                    {designerError
                      ? "Couldn't load designers"
                      : designers.length ? "— Select designer —" : "No designers configured"}
                  </option>
                  {designers.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </label>

              {/* Title */}
              <label>
                <span>Title</span>
                <input
                  value={it.title || ""}
                  onChange={e => update(idx, { title: e.target.value })}
                  placeholder="e.g., Classic Flap Bag"
                />
              </label>

              {/* Category */}
              <label>
                <span>Category</span>
                <select
                  value={it.category || ""}
                  onChange={e => update(idx, { category: e.target.value })}
                >
                  <option value="">— Pick a category —</option>
                  {CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </label>

              {/* Condition */}
              <label>
                <span>Condition</span>
                <select
                  value={it.condition || ""}
                  onChange={e => update(idx, { condition: e.target.value })}
                >
                  <option value="">— Pick a condition —</option>
                  {CONDITIONS.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </label>

              {/* Size */}
              <label>
                <span>Size</span>
                <input
                  value={it.size || ""}
                  onChange={e => update(idx, { size: e.target.value })}
                  placeholder="e.g., M / 38 / 95 cm"
                />
              </label>

              {/* Color */}
              <label>
                <span>Color</span>
                <input
                  value={it.color || ""}
                  onChange={e => update(idx, { color: e.target.value })}
                  placeholder="e.g., Black"
                />
              </label>

              {/* Price */}
              <label>
                <span>Price (USD)</span>
                <input
                  inputMode="numeric"
                  value={it.priceUSD || ""}
                  onChange={e => update(idx, { priceUSD: e.target.value })}
                  placeholder="e.g., 5200"
                />
              </label>

              {/* Serial */}
              <label>
                <span>Serial / Reference</span>
                <input
                  value={it.serial || ""}
                  onChange={e => update(idx, { serial: e.target.value })}
                  placeholder="e.g., 12345-ABCD"
                />
              </label>

              {/* Purchase Source */}
              <label>
                <span>Purchase Source</span>
                <select
                  value={it.purchaseSource || ""}
                  onChange={e => update(idx, { purchaseSource: e.target.value })}
                >
                  <option value="">— Select —</option>
                  {SOURCES.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </label>

              {/* Purchase Proof */}
              <label>
                <span>Purchase Proof</span>
                <select
                  value={it.purchaseProof || ""}
                  onChange={e => update(idx, { purchaseProof: e.target.value })}
                >
                  <option value="">— Select —</option>
                  {PROOFS.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </label>

              {/* Images */}
              <label className="full">
                <span>Images (drag & drop or select — up to 8)</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={e => {
                    const files = Array.from(e.target.files || []).slice(0, 8);
                    update(idx, { images: files });
                  }}
                />
              </label>
            </div>
          </div>
        ))}

        <div className="actions">
          <button type="button" className="btn-dark" onClick={addItem}>
            + Add another item
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={onCreate}
            disabled={totalReady === 0}
            title={totalReady === 0 ? "Fill required fields to enable" : ""}
          >
            Create {totalReady} listing(s)
          </button>
        </div>
      </main>

      <Footer />

      <style jsx>{`
        h1 { color: #fff; font-size: 20px; margin: 8px 0; }
        .hint { color:#9ca3af; font-size:12px; margin-bottom:8px; }
        .header-row { display:flex; align-items:center; justify-content:space-between; gap:12px; }
        .alt-link { color:#9ca3af; font-size:12px; text-decoration:underline; }
        .banner { margin: 10px 0; padding:10px 12px; border-radius:8px; background:#0b0b0b; color:#e5e7eb; }
        .banner.error { border:1px solid #7f1d1d; color:#fecaca; background:#190c0c; }
        .card { margin-top:16px; border:1px solid #ffffff1a; border-radius:12px; padding:12px; background:#0a0a0a; }
        .row.head { display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; }
        .item-title { color:#e5e7eb; font-weight:700; }
        .remove { background:#3b0b0b; color:#fca5a5; border:1px solid #7f1d1d; border-radius:999px; padding:6px 10px; cursor:pointer; }
        .grid { display:grid; gap:10px; grid-template-columns: 1fr; }
        @media(min-width:920px){ .grid { grid-template-columns: repeat(3, 1fr); } .full { grid-column: 1 / -1; } }
        label span { display:block; font-size:12px; color:#9ca3af; margin: 4px 0; }
        input, select {
          background:#00000066; color:#fff; border:1px solid #ffffff1a;
          border-radius:6px; padding:10px; font-size:12px; width:100%;
        }
        .actions { display:flex; gap:10px; margin:16px 0 32px; }
        .btn-dark, .btn-primary {
          border:none; border-radius:999px; padding:10px 16px; font-size:12px; font-weight:700; cursor:pointer;
        }
        .btn-dark { background:#111827; color:#e5e7eb; border:1px solid #374151; }
        .btn-primary { background:#fff; color:#000; }
        .back-link a { color:#9ca3af; font-size:12px; }
      `}</style>
    </div>
  );
}
