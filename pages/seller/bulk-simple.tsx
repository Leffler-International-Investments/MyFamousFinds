// FILE: /pages/seller/bulk-simple.tsx

import { useEffect, useMemo, useRef, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { db } from "../../utils/firebaseClient";
import { sellerFetch } from "../../utils/sellerClient";
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
  colorSwatch?: string;
  colorName?: string;
  details?: string;
  priceUSD?: string;
  serial?: string;
  purchaseSource?: string;
  purchaseProof?: string;
  proofDoc?: File;
  proofDocDataUrl?: string;
  allowOffers?: boolean;
  images?: File[];
  imageDataUrl?: string;
  imageDataUrls?: string[];
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
  "Kids",
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

/** Crop a circular swatch from a data-URL image at the given (x,y) centre. */
const SWATCH_SIZE = 80;
function cropSwatch(
  dataUrl: string,
  cx: number,
  cy: number,
  srcW: number,
  srcH: number,
): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scaleX = img.naturalWidth / srcW;
      const scaleY = img.naturalHeight / srcH;
      const r = SWATCH_SIZE / 2;
      const canvas = document.createElement("canvas");
      canvas.width = SWATCH_SIZE;
      canvas.height = SWATCH_SIZE;
      const ctx = canvas.getContext("2d")!;
      ctx.beginPath();
      ctx.arc(r, r, r, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(
        img,
        cx * scaleX - r * scaleX,
        cy * scaleY - r * scaleY,
        SWATCH_SIZE * scaleX,
        SWATCH_SIZE * scaleY,
        0,
        0,
        SWATCH_SIZE,
        SWATCH_SIZE,
      );
      resolve(canvas.toDataURL("image/png"));
    };
    img.src = dataUrl;
  });
}

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
  const proofInputsRef = useRef<(HTMLInputElement | null)[]>([]);

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

  /**
   * Compress an image file in the browser using canvas so the base64 data URL
   * stays small enough for Firestore's 1 MB document limit.
   */
  const compressImageFile = (file: File, maxDim = 800, quality = 0.7): Promise<string> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w >= h) { h = Math.round(h * (maxDim / w)); w = maxDim; }
          else        { w = Math.round(w * (maxDim / h)); h = maxDim; }
        }
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d")!;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error("Image load failed")); };
      img.src = objectUrl;
    });

  const handleFilesChange = async (idx: number, fileList: FileList | null) => {
    const files = Array.from(fileList || [])
      .filter((f) => f.type.startsWith("image/"))
      .slice(0, 8);

    if (!files.length) {
      update(idx, { images: [], imageDataUrl: undefined, imageDataUrls: [] });
      return;
    }

    // Compress all selected images
    const dataUrls: string[] = [];
    for (const file of files) {
      try {
        const dataUrl = await compressImageFile(file);
        dataUrls.push(dataUrl);
      } catch {
        // Fallback: read raw file
        const raw = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(typeof reader.result === "string" ? reader.result : "");
          reader.readAsDataURL(file);
        });
        if (raw) dataUrls.push(raw);
      }
    }

    update(idx, {
      images: files,
      imageDataUrl: dataUrls[0] || undefined,
      imageDataUrls: dataUrls,
    });
  };

  const handleProofFile = async (idx: number, fileList: FileList | null) => {
    const file = Array.from(fileList || [])[0];
    if (!file) {
      update(idx, { proofDoc: undefined, proofDocDataUrl: undefined });
      return;
    }

    // For images, compress; for PDFs/docs, read as base64 directly
    if (file.type.startsWith("image/")) {
      try {
        const dataUrl = await compressImageFile(file, 1200, 0.8);
        update(idx, { proofDoc: file, proofDocDataUrl: dataUrl });
      } catch {
        const raw = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(typeof reader.result === "string" ? reader.result : "");
          reader.readAsDataURL(file);
        });
        update(idx, { proofDoc: file, proofDocDataUrl: raw || undefined });
      }
    } else {
      const raw = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(typeof reader.result === "string" ? reader.result : "");
        reader.readAsDataURL(file);
      });
      update(idx, { proofDoc: file, proofDocDataUrl: raw || undefined });
    }
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
          color: it.colorName || "",
          colorSwatch: it.colorSwatch || null,
          details: it.details?.trim() || "",
          price: numericPrice,
          purchase_source: it.purchaseSource || "",
          purchase_proof: it.purchaseProof || "",
          proof_doc_url: it.proofDocDataUrl || null,
          serial_number: it.serial || "",
          allowOffers: it.allowOffers !== false,
          imageDataUrl: it.imageDataUrl || null,
          imageDataUrls: it.imageDataUrls && it.imageDataUrls.length > 0
            ? it.imageDataUrls
            : null,
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
      imageDataUrls?: string[] | null;
    }[];

    if (!rows.length) {
      setSubmitError(
        "None of the items were valid. Please check designer/brand and price fields."
      );
      return;
    }

    setSubmitting(true);
    try {
      // Vercel serverless functions have a ~4.5 MB body limit.
      // Submit items in small batches to stay under the limit.
      const BATCH_SIZE = 3;
      let totalCreated = 0;
      let totalSkipped = 0;

      for (let i = 0; i < rows.length; i += BATCH_SIZE) {
        const batch = rows.slice(i, i + BATCH_SIZE);
        const body = JSON.stringify({ rows: batch });

        // Warn if a single batch is very large (> 4 MB)
        if (body.length > 4 * 1024 * 1024) {
          throw new Error(
            `Item ${i + 1} has images that are too large. Please use smaller or fewer photos and try again.`
          );
        }

        const res = await sellerFetch("/api/seller/bulk-commit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
        });

        // Surface meaningful errors based on HTTP status
        if (!res.ok) {
          if (res.status === 413) {
            throw new Error(
              "The images are too large for the server. Please use smaller or fewer photos per item."
            );
          }
          if (res.status === 401) {
            throw new Error(
              "Authentication failed. Please refresh the page and try again."
            );
          }
          if (res.status === 504 || res.status === 502) {
            throw new Error(
              "The server took too long to process your images. Please try fewer items at a time."
            );
          }
        }

        const json: BulkCommitResult = await res
          .json()
          .catch(
            () =>
              ({
                ok: false,
                error: `Server error (HTTP ${res.status}). Please try submitting fewer items or smaller images.`,
              } as BulkCommitErr)
          );

        if (!res.ok || !json.ok) {
          const message =
            "error" in json && json.error
              ? json.error
              : "Unable to create listings.";
          throw new Error(message);
        }

        totalCreated += json.created;
        totalSkipped += json.skipped;
      }

      setSubmitMessage(
        `Created ${totalCreated} listing(s)${
          totalSkipped ? `, skipped ${totalSkipped}.` : "."
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

              {/* Spot Color — pick from item image like Moss & Spy */}
              <div className="spot-color-field">
                <span className="field-label">Color</span>

                {it.colorSwatch ? (
                  <div className="swatch-preview">
                    <img className="swatch-circle" src={it.colorSwatch} alt="Color swatch" />
                    <input
                      className="swatch-name-input"
                      value={it.colorName || ""}
                      onChange={(e) => update(idx, { colorName: e.target.value })}
                      placeholder="Name this color (e.g., Midnight Blue)"
                    />
                    <button
                      type="button"
                      className="swatch-change-btn"
                      onClick={() => {
                        if (!it.imageDataUrls?.length) return;
                        const el = document.getElementById(`spot-picker-${idx}`);
                        if (el) el.style.display = "flex";
                        // Load first image into picker
                        const pickerImg = document.getElementById(`spot-img-${idx}`) as HTMLImageElement;
                        if (pickerImg) pickerImg.src = it.imageDataUrls![0];
                      }}
                    >
                      Change
                    </button>
                    <button
                      type="button"
                      className="swatch-remove-btn"
                      onClick={() => update(idx, { colorSwatch: undefined, colorName: undefined })}
                      aria-label="Remove swatch"
                    >
                      &times;
                    </button>
                  </div>
                ) : it.imageDataUrls && it.imageDataUrls.length > 0 ? (
                  <button
                    type="button"
                    className="pick-spot-btn"
                    onClick={() => {
                      const el = document.getElementById(`spot-picker-${idx}`);
                      if (el) el.style.display = "flex";
                      const pickerImg = document.getElementById(`spot-img-${idx}`) as HTMLImageElement;
                      if (pickerImg) pickerImg.src = it.imageDataUrls![0];
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>
                    Pick spot color from image
                  </button>
                ) : (
                  <div className="pick-spot-hint">Upload images first, then pick a spot color</div>
                )}

                {/* Spot-picker modal */}
                <div id={`spot-picker-${idx}`} className="spot-picker-overlay" style={{ display: "none" }}>
                  <div className="spot-picker-modal">
                    <div className="spot-picker-header">
                      <span>Click on the item to pick its color</span>
                      <button
                        type="button"
                        className="spot-picker-close"
                        onClick={() => {
                          const el = document.getElementById(`spot-picker-${idx}`);
                          if (el) el.style.display = "none";
                        }}
                      >
                        &times;
                      </button>
                    </div>

                    {it.imageDataUrls && it.imageDataUrls.length > 1 && (
                      <div className="spot-picker-thumbs">
                        {it.imageDataUrls.map((url, imgIdx) => (
                          <button
                            key={imgIdx}
                            type="button"
                            className="spot-picker-thumb"
                            onClick={() => {
                              const pickerImg = document.getElementById(`spot-img-${idx}`) as HTMLImageElement;
                              if (pickerImg) pickerImg.src = url;
                            }}
                          >
                            <img src={url} alt={`Image ${imgIdx + 1}`} />
                          </button>
                        ))}
                      </div>
                    )}

                    <div className="spot-picker-image-wrap">
                      <img
                        id={`spot-img-${idx}`}
                        className="spot-picker-image"
                        alt="Pick a spot"
                        onClick={async (e) => {
                          const img = e.currentTarget as HTMLImageElement;
                          const rect = img.getBoundingClientRect();
                          const cx = e.clientX - rect.left;
                          const cy = e.clientY - rect.top;
                          const swatch = await cropSwatch(
                            img.src,
                            cx,
                            cy,
                            rect.width,
                            rect.height,
                          );
                          update(idx, { colorSwatch: swatch });
                          const el = document.getElementById(`spot-picker-${idx}`);
                          if (el) el.style.display = "none";
                        }}
                      />
                    </div>
                    <div className="spot-picker-hint">Click directly on the fabric / surface to capture a genuine color swatch</div>
                  </div>
                </div>
              </div>

              <label className="full">
                <span>Details</span>
                <textarea
                  className="details-textarea"
                  value={it.details || ""}
                  onChange={(e) => update(idx, { details: e.target.value })}
                  placeholder="Describe the item — e.g., measurements, flaws, special features, history…"
                  rows={3}
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

              <label className="toggle-label">
                <span>Allow offers</span>
                <button
                  type="button"
                  className={`toggle${it.allowOffers !== false ? " toggle--on" : ""}`}
                  onClick={() => update(idx, { allowOffers: it.allowOffers === false ? true : false })}
                  aria-pressed={it.allowOffers !== false}
                >
                  <span className="toggle-knob" />
                </button>
                <span className="toggle-hint">
                  {it.allowOffers !== false ? "Buyers can make offers" : "Fixed price only"}
                </span>
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

              {/* Proof document upload */}
              <div className="proof-upload-field">
                <span className="field-label">
                  Upload Proof Document
                </span>
                <p className="proof-hint">
                  Upload a receipt, bank statement, certificate, or any document that proves authenticity.
                </p>
                {it.proofDoc ? (
                  <div className="proof-file-row">
                    {it.proofDocDataUrl && it.proofDoc.type.startsWith("image/") && (
                      <img className="proof-thumb" src={it.proofDocDataUrl} alt="Proof" />
                    )}
                    <span className="proof-file-name">{it.proofDoc.name}</span>
                    <button
                      type="button"
                      className="proof-remove-btn"
                      onClick={() => {
                        update(idx, { proofDoc: undefined, proofDocDataUrl: undefined });
                        const input = proofInputsRef.current[idx];
                        if (input) input.value = "";
                      }}
                    >
                      &times;
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="proof-upload-btn"
                    onClick={() => {
                      const input = proofInputsRef.current[idx];
                      if (input) input.click();
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                    Choose file…
                  </button>
                )}
                <input
                  ref={(el) => {
                    proofInputsRef.current[idx] = el;
                  }}
                  type="file"
                  accept="image/*,.pdf,.doc,.docx"
                  style={{ display: "none" }}
                  onChange={(e) => handleProofFile(idx, e.target.files)}
                />
              </div>

              {/* Images box — uses div (not label) to prevent double-trigger of file input */}
              <div className="full">
                <span className="field-label">Images (drag & drop or select — up to 8)</span>
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

                  {it.imageDataUrls && it.imageDataUrls.length > 0 && (
                    <div className="thumbs">
                      {it.imageDataUrls.map((dataUrl, i) => (
                        <div className="thumb" key={i}>
                          <img
                            src={dataUrl}
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
              </div>
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
        
        /* Spot Color Picker */
        .spot-color-field {
          display: flex;
          flex-direction: column;
        }
        .field-label {
          display: block;
          font-size: 13px;
          font-weight: 500;
          color: #374151;
          margin-bottom: 6px;
        }
        .swatch-preview {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .swatch-circle {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 2px solid #e5e7eb;
          object-fit: cover;
          flex-shrink: 0;
        }
        .swatch-name-input {
          flex: 1;
          min-width: 0;
        }
        .swatch-change-btn {
          background: #f3f4f6;
          color: #374151;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          padding: 6px 10px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
        }
        .swatch-change-btn:hover {
          background: #e5e7eb;
        }
        .swatch-remove-btn {
          background: none;
          border: none;
          color: #9ca3af;
          font-size: 18px;
          cursor: pointer;
          padding: 0 4px;
          line-height: 1;
        }
        .swatch-remove-btn:hover {
          color: #b91c1c;
        }
        .pick-spot-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          width: 100%;
          background: #ffffff;
          color: #374151;
          border: 1px dashed #d1d5db;
          border-radius: 8px;
          padding: 10px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: border-color 0.15s, background 0.15s;
        }
        .pick-spot-btn:hover {
          border-color: #2563eb;
          background: #eff6ff;
          color: #1d4ed8;
        }
        .pick-spot-hint {
          font-size: 13px;
          color: #9ca3af;
          padding: 10px 0;
        }

        /* Spot-picker modal overlay */
        .spot-picker-overlay {
          position: fixed;
          inset: 0;
          z-index: 100;
          background: rgba(0,0,0,0.6);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .spot-picker-modal {
          background: #fff;
          border-radius: 12px;
          padding: 20px;
          max-width: 520px;
          width: 92vw;
          box-shadow: 0 8px 32px rgba(0,0,0,0.25);
        }
        .spot-picker-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          font-size: 14px;
          font-weight: 600;
          color: #111827;
        }
        .spot-picker-close {
          background: none;
          border: none;
          font-size: 22px;
          cursor: pointer;
          color: #6b7280;
          padding: 0 4px;
          line-height: 1;
        }
        .spot-picker-close:hover {
          color: #111827;
        }
        .spot-picker-thumbs {
          display: flex;
          gap: 6px;
          margin-bottom: 10px;
          overflow-x: auto;
        }
        .spot-picker-thumb {
          width: 48px;
          height: 48px;
          border-radius: 6px;
          overflow: hidden;
          border: 2px solid #e5e7eb;
          background: #fff;
          cursor: pointer;
          padding: 0;
          flex-shrink: 0;
        }
        .spot-picker-thumb:hover {
          border-color: #2563eb;
        }
        .spot-picker-thumb img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .spot-picker-image-wrap {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          overflow: hidden;
          display: flex;
          justify-content: center;
          background: #f9fafb;
        }
        .spot-picker-image {
          cursor: crosshair;
          max-width: 100%;
          max-height: 60vh;
          display: block;
        }
        .spot-picker-hint {
          margin-top: 8px;
          font-size: 12px;
          color: #6b7280;
          text-align: center;
        }

        /* Proof document upload */
        .proof-upload-field {
          display: flex;
          flex-direction: column;
        }
        .proof-hint {
          font-size: 11px;
          color: #6b7280;
          margin: 0 0 8px;
          line-height: 1.4;
        }
        .proof-upload-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #ffffff;
          color: #374151;
          border: 1px dashed #d1d5db;
          border-radius: 8px;
          padding: 10px 14px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: border-color 0.15s, background 0.15s;
        }
        .proof-upload-btn:hover {
          border-color: #2563eb;
          background: #eff6ff;
          color: #1d4ed8;
        }
        .proof-file-row {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 8px 10px;
        }
        .proof-thumb {
          width: 40px;
          height: 40px;
          border-radius: 6px;
          object-fit: cover;
          border: 1px solid #e5e7eb;
          flex-shrink: 0;
        }
        .proof-file-name {
          flex: 1;
          font-size: 13px;
          color: #374151;
          font-weight: 500;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          min-width: 0;
        }
        .proof-remove-btn {
          background: none;
          border: none;
          color: #9ca3af;
          font-size: 18px;
          cursor: pointer;
          padding: 0 4px;
          line-height: 1;
          flex-shrink: 0;
        }
        .proof-remove-btn:hover {
          color: #b91c1c;
        }

        /* Details textarea */
        .details-textarea {
          background: #ffffff;
          color: #111827;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          padding: 10px;
          font-size: 14px;
          width: 100%;
          resize: vertical;
          font-family: inherit;
          line-height: 1.5;
        }
        .details-textarea:focus {
          outline: none;
          border-color: #000;
          box-shadow: 0 0 0 1px #000;
        }

        /* Allow offers toggle */
        .toggle-label {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .toggle {
          position: relative;
          width: 44px;
          height: 24px;
          border-radius: 999px;
          border: none;
          background: #d1d5db;
          cursor: pointer;
          padding: 0;
          transition: background 0.2s;
        }
        .toggle--on {
          background: #16a34a;
        }
        .toggle-knob {
          position: absolute;
          top: 2px;
          left: 2px;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #fff;
          transition: transform 0.2s;
          box-shadow: 0 1px 3px rgba(0,0,0,0.15);
        }
        .toggle--on .toggle-knob {
          transform: translateX(20px);
        }
        .toggle-hint {
          font-size: 11px !important;
          color: #6b7280 !important;
          font-weight: 400 !important;
          margin-bottom: 0 !important;
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
