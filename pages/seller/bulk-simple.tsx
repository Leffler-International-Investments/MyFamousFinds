// FILE: /pages/seller/bulk-simple.tsx

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

type Designer = { id: string; name: string };

type Item = {
  designerId?: string;
  otherDesignerName?: string;
  title?: string;
  category?: string;
  material?: string;
  condition?: string;
  size?: string;
  color?: string;
  priceUSD?: string;
  serial?: string;
  purchaseSource?: string;
  purchaseProof?: string;
  images?: File[];
  imageDataUrl?: string;
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
  "Women",
  "Bags",
  "Men",
  "Jewelry",
  "Watches",
];

const MATERIALS = [
  "Leather",
  "Exotic Leather",
  "Silk",
  "Cashmere",
  "Wool",
  "Linen",
  "Cotton",
  "Cotton Blend",
  "Denim",
  "Velvet",
  "Suede",
  "Canvas",
  "Metal",
  "Gold",
  "Silver",
  "Plated Metal",
  "Ceramic",
  "Crystal",
  "Resin",
  "Synthetic",
  "Other",
];

const SOURCES = [
  "Boutique / Brand",
  "Department Store",
  "Resale",
  "Gift",
  "Other",
];

const PROOFS = ["Receipt", "Bank statement", "Certificate", "Other"];

function getSellerIdHeader(): string {
  if (typeof window === "undefined") return "";
  return String(window.localStorage.getItem("ff-seller-id") || "").trim();
}

export default function BulkSimple() {
  const [items, setItems] = useState<Item[]>([{}]);
  const [designers, setDesigners] = useState<Designer[]>([]);
  const [loadingDesigners, setLoadingDesigners] = useState(false);
  const [designerError, setDesignerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);

  const fileInputsRef = useRef<(HTMLInputElement | null)[]>([]);

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

  const addItem = () => setItems((prev) => [...prev, {}]);

  const removeItem = (idx: number) =>
    setItems((prev) => prev.filter((_, i) => i !== idx));

  const update = (idx: number, patch: Partial<Item>) =>
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));

  const totalReady = useMemo(
    () =>
      items.filter((it) => {
        const hasDesigner =
          (it.designerId && it.designerId !== "__other__") ||
          (it.otherDesignerName && it.otherDesignerName.trim().length > 0);
        return (
          hasDesigner &&
          it.title &&
          it.category &&
          it.condition &&
          it.priceUSD
        );
      }).length,
    [items]
  );

  const handleFilesChange = (idx: number, fileList: FileList | null) => {
    const files = Array.from(fileList || [])
      .filter((f) => f.type.startsWith("image/"))
      .slice(0, 8);

    if (!files.length) {
      update(idx, { images: [], imageDataUrl: undefined });
      return;
    }

    const first = files[0];
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl =
        typeof reader.result === "string" ? reader.result : undefined;
      update(idx, { images: files, imageDataUrl: dataUrl });
    };
    reader.readAsDataURL(first);
  };

  const handleDrop = (idx: number, e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    handleFilesChange(idx, e.dataTransfer.files);
  };

  const onCreate = async () => {
    setSubmitError(null);
    setSubmitMessage(null);

    const readyItems = items.filter((it) => {
      const hasDesigner =
        (it.designerId && it.designerId !== "__other__") ||
        (it.otherDesignerName && it.otherDesignerName.trim().length > 0);
      return (
        hasDesigner &&
        it.title &&
        it.category &&
        it.condition &&
        it.priceUSD
      );
    });

    if (!readyItems.length) {
      setSubmitError("Please fill in at least one complete item before submitting.");
      return;
    }

    const rows = readyItems
      .map((it) => {
        let brand = "";

        if (it.designerId && it.designerId !== "__other__") {
          const designer = designers.find((d) => d.id === it.designerId);
          brand = designer?.name?.trim() || "";
        } else if (it.otherDesignerName) {
          brand = it.otherDesignerName.trim();
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
          material: it.material || "",
          condition: it.condition || "",
          size: it.size || "",
          color: it.color || "",
          price: numericPrice,
          purchase_source: it.purchaseSource || "",
          purchase_proof: it.purchaseProof || "", 
          serial_number: it.serial || "",
          imageDataUrl: it.imageDataUrl || null,
        };
      })
      .filter(Boolean) as {
      title: string;
      brand: string;
      category: string;
      material?: string;
      condition: string;
      size?: string;
      color?: string;
      price: number;
      purchase_source?: string;
      purchase_proof?: string;
      serial_number?: string;
      imageDataUrl?: string | null;
    }[];

    if (!rows.length) {
      setSubmitError(
        "None of the items were valid. Please check designer/brand and price fields."
      );
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/seller/bulk-commit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(getSellerIdHeader() ? { "x-seller-id": getSellerIdHeader() } : {}),
        },
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
    <div className="page-container">
      <Head>
        <title>Quick Add — Multi-Item Form | Famous Finds</title>
      </Head>
      <Header />

      <main className="section">
        <div className="back-link">
          <Link href="/seller/dashboard">← Back to Dashboard</Link>
        </div>

        <div className="header-row">
          <div>
            <h1>Quick Add — Multi-Item Form</h1>
            <p className="hint">
              Add several listings at once. Prices are in USD.
            </p>
          </div>
        </div>

        {submitError && <p className="banner error">⚠ {submitError}</p>}
        {submitMessage && !submitError && (
          <p className="banner success">✅ {submitMessage}</p>
        )}

        {designerError && <p className="banner error">⚠ {designerError}</p>}
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
              <label>
                <span>Designer</span>
                <select
                  value={it.designerId || ""}
                  onChange={(e) =>
                    update(idx, {
                      designerId: e.target.value,
                      otherDesignerName:
                        e.target.value === "__other__"
                          ? it.otherDesignerName
                          : "",
                    })
                  }
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
                  <option value="__other__">Other designer (not listed)</option>
                </select>
              </label>

              {it.designerId === "__other__" && (
                <label>
                  <span>Designer name (not in list)</span>
                  <input
                    value={it.otherDesignerName || ""}
                    onChange={(e) =>
                      update(idx, { otherDesignerName: e.target.value })
                    }
                    placeholder="e.g., New Designer Name"
                  />
                </label>
              )}

              <label>
                <span>Title</span>
                <input
                  value={it.title || ""}
                  onChange={(e) => update(idx, { title: e.target.value })}
                  placeholder="e.g., Classic Flap Bag"
                />
              </label>

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

              <label>
                <span>Material</span>
                <input
                  list="materials-list"
                  value={it.material || ""}
                  onChange={(e) => update(idx, { material: e.target.value })}
                  placeholder="Select or type (e.g., Silk, Leather, Alpaca)"
                />
                <datalist id="materials-list">
                  {MATERIALS.map((m) => (
                    <option key={m} value={m} />
                  ))}
                </datalist>
              </label>

              <label>
                <span>Condition</span>
                <select
                  value={it.condition || ""}
                  onChange={(e) =>
                    update(idx, { condition: e.target.value })
                  }
                >
                  <option value="">— Pick a condition —</option>
                  {CONDITIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>Size</span>
                <input
                  value={it.size || ""}
                  onChange={(e) => update(idx, { size: e.target.value })}
                  placeholder="e.g., M / 38 / 95 cm"
                />
              </label>

              <label>
                <span>Color</span>
                <input
                  value={it.color || ""}
                  onChange={(e) => update(idx, { color: e.target.value })}
                  placeholder="e.g., Black"
                />
              </label>

              <label>
                <span>Price (USD)</span>
                <input
                  inputMode="numeric"
                  value={it.priceUSD || ""}
                  onChange={(e) =>
                    update(idx, { priceUSD: e.target.value })
                  }
                  placeholder="e.g., 5200"
                />
              </label>

              <label>
                <span>Serial / Reference</span>
                <input
                  value={it.serial || ""}
                  onChange={(e) => update(idx, { serial: e.target.value })}
                  placeholder="e.g., 12345-ABCD"
                />
              </label>

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

              {/* Images box */}
              <label className="full">
                <span>Images (drag & drop or select — up to 8)</span>
                <div
                  className="dropzone"
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onDrop={(e) => handleDrop(idx, e)}
                  onClick={() => {
                    const input = fileInputsRef.current[idx];
                    if (input) input.click();
                  }}
                >
                  <span className="dropzone-text">
                    Click to choose images or drop them here
                  </span>

                  {it.images && it.images.length > 0 && (
                    <div className="thumbs">
                      {it.images.map((file, i) => (
                        <div className="thumb" key={i}>
                          <img
                            src={URL.createObjectURL(file)}
                            alt={`Image ${i + 1}`}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <input
                  ref={(el) => {
                    fileInputsRef.current[idx] = el;
                  }}
                  type="file"
                  accept="image/*"
                  multiple
                  style={{ display: "none" }}
                  onChange={(e) => handleFilesChange(idx, e.target.files)}
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
          >
            {submitting
              ? "Submitting…"
              : `Create ${totalReady} listing(s)`}
          </button>
        </div>
      </main>

      <Footer />

      <style jsx>{`
        .page-container {
          background-color: #f9fafb;
          color: #111827;
          min-height: 100vh;
        }
        .section {
          max-width: 1200px;
          margin: 0 auto;
          padding: 24px 16px 80px;
        }
        h1 {
          color: #111827;
          font-size: 24px;
          font-weight: 700;
          margin: 0;
        }
        .hint {
          color: #4b5563;
          font-size: 14px;
          margin-top: 4px;
        }
        .header-row {
          margin-top: 16px;
          margin-bottom: 24px;
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
        }
        .banner {
          margin: 16px 0;
          padding: 12px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
        }
        .banner.error {
          background: #fee2e2;
          color: #991b1b;
          border: 1px solid #fca5a5;
        }
        .banner.success {
          background: #dcfce7;
          color: #166534;
          border: 1px solid #86efac;
        }
        
        .card {
          margin-bottom: 24px;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 20px;
          background: #ffffff;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
        .row.head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }
        .item-title {
          color: #111827;
          font-weight: 700;
          font-size: 16px;
        }
        .remove {
          background: #ffffff;
          color: #b91c1c;
          border: 1px solid #fca5a5;
          border-radius: 999px;
          padding: 6px 12px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
        }
        .remove:hover {
          background: #fef2f2;
        }
        .grid {
          display: grid;
          gap: 16px;
          grid-template-columns: 1fr;
        }
        @media (min-width: 768px) {
          .grid {
            grid-template-columns: repeat(3, 1fr);
          }
          .full {
            grid-column: 1 / -1;
          }
        }
        label span {
          display: block;
          font-size: 13px;
          font-weight: 500;
          color: #374151;
          margin-bottom: 6px;
        }
        input,
        select {
          background: #ffffff;
          color: #111827;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          padding: 10px;
          font-size: 14px;
          width: 100%;
        }
        input:focus,
        select:focus {
          outline: none;
          border-color: #000;
          box-shadow: 0 0 0 1px #000;
        }
        
        .dropzone {
          border-radius: 8px;
          border: 1px dashed #d1d5db;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          background: #f9fafb;
          transition: border-color 0.2s;
        }
        .dropzone:hover {
          border-color: #2563eb;
        }
        .dropzone-text {
          font-size: 13px;
          color: #6b7280;
          font-weight: 500;
          text-align: center;
        }
        .thumbs {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .thumb {
          width: 64px;
          height: 64px;
          border-radius: 6px;
          overflow: hidden;
          border: 1px solid #e5e7eb;
          background: #ffffff;
        }
        .thumb img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        
        .actions {
          display: flex;
          gap: 12px;
          margin: 24px 0 40px;
        }
        .btn-dark {
          background: #ffffff;
          color: #111827;
          border: 1px solid #d1d5db;
          border-radius: 99px;
          padding: 10px 20px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
        }
        .btn-dark:hover {
          background: #f3f4f6;
        }
        .btn-primary {
          background: #111827;
          color: #ffffff;
          border: none;
          border-radius: 99px;
          padding: 10px 24px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
        }
        .btn-primary:hover {
          opacity: 0.9;
        }
        .btn-primary:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }
        .back-link a {
          color: #4b5563;
          font-size: 13px;
          text-decoration: none;
        }
        .back-link a:hover {
          color: #111827;
        }
      `}</style>
    </div>
  );
}
