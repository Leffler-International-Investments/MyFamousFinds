// FILE: /pages/seller/bulk-simple.tsx
// Quick Add — Multi-Item Form (Seller)
// - Loads designers from Firestore (same as /sell).
// - Sends items to /api/seller/bulk-commit (same payload as bulk-upload).
// - Allows "Other designer" (free text).
// - Adds real drag & drop image zone (click or drop).

import { useEffect, useMemo, useRef, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { db } from "../../utils/firebaseClient";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  DocumentData,
} from "firebase/firestore";

// ---- Types ----
type Designer = { id: string; name: string };

type Item = {
  designerId?: string;
  otherDesigner?: string;
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

type BulkCommitOk = {
  ok: true;
  created: number;
  skipped: number;
};

type BulkCommitErr = {
  ok: false;
  error: string;
};

type BulkCommitResult = BulkCommitOk | BulkCommitErr;

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

const OTHER_DESIGNER_ID = "__other";

export default function BulkSimple() {
  const [items, setItems] = useState<Item[]>([{}]);
  const [designers, setDesigners] = useState<Designer[]>([]);
  const [loadingDesigners, setLoadingDesigners] = useState(false);
  const [designerError, setDesignerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);

  // one hidden file input per item for click + drag/drop
  const fileInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // ---------- LOAD DESIGNERS ----------
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoadingDesigners(true);
      setDesignerError(null);
      try {
        const q = query(
          collection(db, "designers"),
          where("active", "==", true),
          orderBy("name", "asc")
        );
        const snap = await getDocs(q);
        const list = snap.docs.map((d) => ({
          id: d.id,
          name: String((d.data() as DocumentData).name ?? d.id),
        }));
        if (!cancelled) setDesigners(list);
      } catch {
        // fallback: all designers, filter active on client
        try {
          const snap = await getDocs(collection(db, "designers"));
          const list = snap.docs
            .map((d) => {
              const data = d.data() as DocumentData;
              return {
                id: d.id,
                name: String(data?.name ?? d.id),
                active: Boolean(data?.active ?? true),
              };
            })
            .filter((d) => d.active)
            .sort((a, b) => a.name.localeCompare(b.name))
            .map(({ id, name }) => ({ id, name }));
          if (!cancelled) setDesigners(list);
        } catch {
          if (!cancelled) {
            setDesignerError("Couldn't load designers list from server.");
          }
        }
      } finally {
        if (!cancelled) setLoadingDesigners(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // ---------- Helpers ----------
  const addItem = () => setItems((prev) => [...prev, {}]);

  const removeItem = (idx: number) =>
    setItems((prev) => prev.filter((_, i) => i !== idx));

  const update = (idx: number, patch: Partial<Item>) =>
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));

  const handleFiles = (idx: number, files: FileList | null) => {
    const arr = Array.from(files || []).slice(0, 8);
    update(idx, { images: arr });
  };

  const hasBrand = (it: Item) => {
    if (!it.designerId) return false;
    if (it.designerId === OTHER_DESIGNER_ID) {
      return Boolean(it.otherDesigner && it.otherDesigner.trim());
    }
    return true;
  };

  const totalReady = useMemo(
    () =>
      items.filter(
        (it) =>
          hasBrand(it) && it.title && it.category && it.condition && it.priceUSD
      ).length,
    [items]
  );

  // ---------- Submit ----------
  const onCreate = async () => {
    setSubmitError(null);
    setSubmitMessage(null);

    const readyItems = items.filter(
      (it) =>
        hasBrand(it) && it.title && it.category && it.condition && it.priceUSD
    );

    if (!readyItems.length) {
      setSubmitError("Please fill in at least one complete item before submitting.");
      return;
    }

    const rows = readyItems
      .map((it) => {
        let brand = "";
        if (it.designerId === OTHER_DESIGNER_ID) {
          brand = (it.otherDesigner || "").trim();
        } else {
          const designer = designers.find((d) => d.id === it.designerId);
          brand = designer?.name?.trim() || "";
        }

        const numericPrice = Number(
          String(it.priceUSD).replace(/[^0-9.]/g, "")
        );

        if (!brand || !Number.isFinite(numericPrice) || numericPrice <= 0) {
          return null;
        }

        return {
          title: it.title?.trim() || "",
          brand,
          category: it.category || "",
          condition: it.condition || "",
          size: it.size || "",
          color: it.color || "",
          price: numericPrice,
          purchase_source: it.purchaseSource || "",
          purchase_proof: it.purchaseProof || "",
          serial_number: it.serial || "",
        };
      })
      .filter(Boolean) as {
      title: string;
      brand: string;
      category: string;
      condition: string;
      size?: string;
      color?: string;
      price: number;
      purchase_source?: string;
      purchase_proof?: string;
      serial_number?: string;
    }[];

    if (!rows.length) {
      setSubmitError(
        "None of the items were valid. Please check brand and price fields."
      );
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/seller/bulk-commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows }),
      });

      const json: BulkCommitResult = await res
        .json()
        .catch(
          () =>
            ({
              ok: false,
              error: "Invalid server response",
            } as BulkCommitErr)
        );

      if (!res.ok || !json.ok) {
        const message =
          "error" in json && json.error
            ? json.error
            : "Unable to create listings.";
        throw new Error(message);
      }

      setSubmitMessage(
        `Created ${json.created} listing(s)${
          json.skipped ? `, skipped ${json.skipped}.` : "."
        }`
      );
      setItems([{}]);
    } catch (err: any) {
      console.error(err);
      setSubmitError(err?.message || "Unable to create listings.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="dark-theme-page">
      <Head>
        <title>Quick Add — Multi-Item Form | Famous Finds</title>
      </Head>
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
        <p className="hint">
          Add several listings at once with dropdowns and image uploads.
        </p>

        {submitError && <p className="banner error">⚠️ {submitError}</p>}
        {submitMessage && !submitError && (
          <p className="banner">✅ {submitMessage}</p>
        )}

        {designerError && <p className="banner error">⚠️ {designerError}</p>}
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
              {/* Designer select */}
              <label>
                <span>Designer</span>
                <select
                  value={it.designerId || ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === OTHER_DESIGNER_ID) {
                      update(idx, { designerId: value });
                    } else {
                      // clear custom name when switching back to normal designer
                      update(idx, { designerId: value, otherDesigner: "" });
                    }
                  }}
                  disabled={
                    loadingDesigners || !!designerError || designers.length === 0
                  }
                >
                  <option value="">
                    {designerError
                      ? "Couldn't load designers"
                      : designers.length
                      ? "— Select designer —"
                      : "No designers configured"}
                  </option>
                  {designers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                  <option value={OTHER_DESIGNER_ID}>
                    Other designer (not listed)
                  </option>
                </select>
              </label>

              {/* Custom designer name when "Other" selected */}
              {it.designerId === OTHER_DESIGNER_ID && (
                <label>
                  <span>Designer name (other)</span>
                  <input
                    value={it.otherDesigner || ""}
                    onChange={(e) =>
                      update(idx, { otherDesigner: e.target.value })
                    }
                    placeholder="Type designer / brand name"
                  />
                </label>
              )}

              {/* Title */}
              <label>
                <span>Title</span>
                <input
                  value={it.title || ""}
                  onChange={(e) => update(idx, { title: e.target.value })}
                  placeholder="e.g., Classic Flap Bag"
                />
              </label>

              {/* Category */}
              <label>
                <span>Category</span>
                <select
                  value={it.category || ""}
                  onChange={(e) => update(idx, { category: e.target.value })}
                >
                  <option value="">— Pick a category —</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>

              {/* Condition */}
              <label>
                <span>Condition</span>
                <select
                  value={it.condition || ""}
                  onChange={(e) => update(idx, { condition: e.target.value })}
                >
                  <option value="">— Pick a condition —</option>
                  {CONDITIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>

              {/* Size */}
              <label>
                <span>Size</span>
                <input
                  value={it.size || ""}
                  onChange={(e) => update(idx, { size: e.target.value })}
                  placeholder="e.g., M / 38 / 95 cm"
                />
              </label>

              {/* Color */}
              <label>
                <span>Color</span>
                <input
                  value={it.color || ""}
                  onChange={(e) => update(idx, { color: e.target.value })}
                  placeholder="e.g., Black"
                />
              </label>

              {/* Price */}
              <label>
                <span>Price (USD)</span>
                <input
                  inputMode="numeric"
                  value={it.priceUSD || ""}
                  onChange={(e) => update(idx, { priceUSD: e.target.value })}
                  placeholder="e.g., 5200"
                />
              </label>

              {/* Serial */}
              <label>
                <span>Serial / Reference</span>
                <input
                  value={it.serial || ""}
                  onChange={(e) => update(idx, { serial: e.target.value })}
                  placeholder="e.g., 12345-ABCD"
                />
              </label>

              {/* Purchase Source */}
              <label>
                <span>Purchase Source</span>
                <select
                  value={it.purchaseSource || ""}
                  onChange={(e) =>
                    update(idx, { purchaseSource: e.target.value })
                  }
                >
                  <option value="">— Select —</option>
                  {SOURCES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>

              {/* Purchase Proof */}
              <label>
                <span>Purchase Proof</span>
                <select
                  value={it.purchaseProof || ""}
                  onChange={(e) =>
                    update(idx, { purchaseProof: e.target.value })
                  }
                >
                  <option value="">— Select —</option>
                  {PROOFS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </label>

              {/* Images drag & drop */}
              <label className="full">
                <span>Images (drag & drop or select — up to 8)</span>
                <div
                  className="dropzone"
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleFiles(idx, e.dataTransfer.files);
                  }}
                  onClick={() => {
                    const input = fileInputsRef.current[idx];
                    if (input) input.click();
                  }}
                >
                  <p>
                    {it.images?.length
                      ? `${it.images.length} file${
                          it.images.length > 1 ? "s" : ""
                        } selected`
                      : "Click or drop images here"}
                  </p>
                </div>
                <input
                  ref={(el) => {
                    fileInputsRef.current[idx] = el;
                  }}
                  type="file"
                  accept="image/*"
                  multiple
                  style={{ display: "none" }}
                  onChange={(e) => handleFiles(idx, e.target.files)}
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
            disabled={totalReady === 0 || submitting}
            title={
              totalReady === 0
                ? "Fill required fields to enable"
                : submitting
                ? "Submitting listings…"
                : ""
            }
          >
            {submitting ? "Submitting…" : `Create ${totalReady} listing(s)`}
          </button>
        </div>
      </main>

      <Footer />

      <style jsx>{`
        h1 {
          color: #fff;
          font-size: 20px;
          margin: 8px 0;
        }
        .hint {
          color: #9ca3af;
          font-size: 12px;
          margin-bottom: 8px;
        }
        .header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }
        .alt-link {
          color: #9ca3af;
          font-size: 12px;
          text-decoration: underline;
        }
        .banner {
          margin: 10px 0;
          padding: 10px 12px;
          border-radius: 8px;
          background: #0b0b0b;
          color: #e5e7eb;
        }
        .banner.error {
          border: 1px solid #7f1d1d;
          color: #fecaca;
          background: #190c0c;
        }
        .card {
          margin-top: 16px;
          border: 1px solid #ffffff1a;
          border-radius: 12px;
          padding: 12px;
          background: #0a0a0a;
        }
        .row.head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        .item-title {
          color: #e5e7eb;
          font-weight: 700;
        }
        .remove {
          background: #3b0b0b;
          color: #fca5a5;
          border: 1px solid #7f1d1d;
          border-radius: 999px;
          padding: 6px 10px;
          cursor: pointer;
        }
        .grid {
          display: grid;
          gap: 10px;
          grid-template-columns: 1fr;
        }
        @media (min-width: 920px) {
          .grid {
            grid-template-columns: repeat(3, 1fr);
          }
          .full {
            grid-column: 1 / -1;
          }
        }
        label span {
          display: block;
          font-size: 12px;
          color: #9ca3af;
          margin: 4px 0;
        }
        input,
        select {
          background: #00000066;
          color: #fff;
          border: 1px solid #ffffff1a;
          border-radius: 6px;
          padding: 10px;
          font-size: 12px;
          width: 100%;
        }
        .actions {
          display: flex;
          gap: 10px;
          margin: 16px 0 32px;
        }
        .btn-dark,
        .btn-primary {
          border: none;
          border-radius: 999px;
          padding: 10px 16px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
        }
        .btn-dark {
          background: #111827;
          color: #e5e7eb;
          border: 1px solid #374151;
        }
        .btn-primary {
          background: #fff;
          color: #000;
        }
        .back-link a {
          color: #9ca3af;
          font-size: 12px;
        }
        .dropzone {
          border: 1px dashed #4b5563;
          border-radius: 8px;
          padding: 16px;
          text-align: center;
          cursor: pointer;
          font-size: 12px;
          color: #9ca3af;
          background: #020617;
        }
        .dropzone:hover {
          border-color: #e5e7eb;
          color: #e5e7eb;
        }
      `}</style>
    </div>
  );
}
