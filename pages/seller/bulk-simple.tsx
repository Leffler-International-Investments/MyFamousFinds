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
  condition?: string;
  size?: string;
  color?: string;
  priceUSD?: string;
  serial?: string;
  purchaseSource?: string;
  purchaseProof?: string;
  images?: File[];
  // NEW: first image as data URL, sent to API -> Firestore.image_url
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
  "Bags",
  "Shoes",
  "Jewelry",
  "Watches",
  "Clothing",
  "Accessories",
];

const SOURCES = [
  "Boutique / Brand",
  "Department Store",
  "Resale",
  "Gift",
  "Other",
];

const PROOFS = ["Receipt", "Bank statement", "Certificate", "Other"];

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
      // Clear images + data URL if user removed them
      update(idx, { images: [], imageDataUrl: undefined });
      return;
    }

    // Keep previews as before, and ALSO store first image as data URL
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
          condition: it.condition || "",
          size: it.size || "",
          color: it.color || "",
          price: numericPrice,
          purchase_source: it.purchaseSource || "",
          purchase_proof: it.purchaseProof || "",
          serial_number: it.serial || "",
          // NEW: send first image data URL to API
          imageDataUrl: it.imageDataUrl || null,
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

        {submitError && <p className="banner error">⚠ {submitError}</p>}
        {submitMessage && !submitError && (
          <p className="banner">✅ {submitMessage}</p>
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
        .dropzone {
          margin-top: 4px;
          border-radius: 10px;
          border: 1px dashed #2563eb; /* BLUE */
          padding: 10px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          background: #020617;
        }
        .dropzone-text {
          font-size: 11px;
          color: #bfdbfe; /* light blue text */
          text-align: center;
        }
        .thumbs {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        .thumb {
          width: 52px;
          height: 52px;
          border-radius: 6px;
          overflow: hidden;
          border: 1px solid #1d4ed8;
          background: #020617;
        }
        .thumb img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
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
      `}</style>
    </div>
  );
}
