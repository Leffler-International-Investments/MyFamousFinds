// FILE: /pages/seller/bulk-simple.tsx
import { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useRequireSeller } from "../../hooks/useRequireSeller";

// Firebase client (must export auth, db, storage)
import { auth, db, storage } from "../../utils/firebaseClient";
import {
  collection,
  getDocs,
  query,
  orderBy,
  limit as qLimit,
} from "firebase/firestore";
import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";

type Designer = { id: string; name: string; slug?: string };

type ItemForm = {
  title: string;
  brand: string; // will be set from designer dropdown
  designerId?: string;
  category: string;
  condition: string;
  size: string;
  color: string;
  price: string; // typed as string in inputs, converted to number before submit
  purchase_source: string;
  purchase_proof: string;
  serial_number: string;
  images: File[];
  imageUrls?: string[];
  status?: "idle" | "uploading" | "ready" | "error";
  errorMsg?: string;
};

const CATEGORIES = [
  "bags",
  "shoes",
  "accessories",
  "watches",
  "jewelry",
  "apparel",
];

const CONDITIONS = [
  "New",
  "Like New",
  "Excellent",
  "Very Good",
  "Good",
  "Fair",
];

const PURCHASE_SOURCES = [
  "Neiman Marcus",
  "Saks",
  "Nordstrom",
  "Selfridges",
  "Harrods",
  "Official Boutique",
  "Private",
  "Other",
];

const PURCHASE_PROOFS = [
  "Original receipt",
  "PDF invoice",
  "Boutique stamp",
  "Certificate",
  "No proof",
];

export default function SellerBulkSimple() {
  const { loading } = useRequireSeller();

  const [designers, setDesigners] = useState<Designer[]>([]);
  const [items, setItems] = useState<ItemForm[]>([
    mkEmptyItem(), // start with a single row
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [banner, setBanner] = useState<{ type: "ok" | "err"; msg: string }>();

  useEffect(() => {
    // Load approved designers for dropdown (ordered A→Z; limit large enough for your catalogue)
    (async () => {
      try {
        const q = query(
          collection(db, "designers"),
          orderBy("name", "asc"),
          qLimit(1000)
        );
        const snap = await getDocs(q);
        const list: Designer[] = [];
        snap.forEach((d) =>
          list.push({ id: d.id, ...(d.data() as any) } as Designer)
        );
        setDesigners(list);
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  const validCount = useMemo(
    () => items.filter((it) => validate(it).ok).length,
    [items]
  );

  if (loading) return <div className="dark-theme-page" />;

  function mkEmptyItem(): ItemForm {
    return {
      title: "",
      brand: "",
      designerId: undefined,
      category: "",
      condition: "",
      size: "",
      color: "",
      price: "",
      purchase_source: "",
      purchase_proof: "",
      serial_number: "",
      images: [],
      status: "idle",
    };
  }

  function update(idx: number, patch: Partial<ItemForm>) {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  }

  function addRow() {
    setItems((prev) => [...prev, mkEmptyItem()]);
  }

  function removeRow(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  function onDesignerChange(idx: number, value: string) {
    // value is designerId; map to brand name for row
    const d = designers.find((x) => x.id === value);
    update(idx, {
      designerId: value || undefined,
      brand: d?.name || "",
    });
  }

  function onFiles(idx: number, files: FileList | null) {
    if (!files?.length) return;
    const asArr = Array.from(files).slice(0, 8); // safety cap
    update(idx, { images: asArr });
  }

  function validate(row: ItemForm): { ok: boolean; msg?: string } {
    if (!row.title?.trim()) return { ok: false, msg: "Missing title" };
    if (!row.brand?.trim()) return { ok: false, msg: "Pick a designer" };
    if (!row.category) return { ok: false, msg: "Pick a category" };
    if (!row.condition) return { ok: false, msg: "Pick a condition" };
    if (!row.price || !isFinite(Number(row.price)) || Number(row.price) <= 0)
      return { ok: false, msg: "Invalid price" };
    // optional: require at least 1 image
    if (!row.images?.length) return { ok: false, msg: "Add at least one image" };
    return { ok: true };
  }

  async function uploadImagesForRow(idx: number): Promise<string[]> {
    const row = items[idx];
    const user = auth.currentUser;
    if (!user) throw new Error("Not authenticated");

    update(idx, { status: "uploading", errorMsg: undefined });

    const urls: string[] = [];
    for (const file of row.images) {
      const path = `uploads/sellers/${user.uid}/${Date.now()}_${file.name}`;
      const ref = storageRef(storage, path);
      await uploadBytes(ref, file);
      const url = await getDownloadURL(ref);
      urls.push(url);
    }

    update(idx, { status: "ready", imageUrls: urls });
    return urls;
  }

  async function handleSubmit() {
    setBanner(undefined);
    setSubmitting(true);

    try {
      // 1) Validate all rows
      const problems: string[] = [];
      items.forEach((it, i) => {
        const v = validate(it);
        if (!v.ok) problems.push(`Row ${i + 1}: ${v.msg}`);
      });
      if (problems.length) {
        setBanner({ type: "err", msg: problems.join(" • ") });
        setSubmitting(false);
        return;
      }

      // 2) Upload images (sequentially for simplicity & avoiding abuse)
      const rowsReady: any[] = [];
      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        const urls = it.imageUrls?.length ? it.imageUrls : await uploadImagesForRow(i);

        rowsReady.push({
          // match the server contract you already have:
          title: it.title.trim(),
          brand: it.brand.trim(), // API will validate brand in designers collection
          category: it.category,
          condition: it.condition,
          size: it.size,
          color: it.color,
          price: Number(it.price),
          purchase_source: it.purchase_source || "",
          purchase_proof: it.purchase_proof || "",
          serial_number: it.serial_number || "",
          imageUrls: urls,
        });
      }

      // 3) Commit via existing endpoint
      const res = await fetch("/api/seller/bulk-commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: rowsReady }),
      });
      const json = await res.json();
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || "Commit failed");
      }

      setBanner({
        type: "ok",
        msg: `Created ${json.created} listing(s). Skipped ${json.skipped}.`,
      });

      // 4) Reset the form on success
      setItems([mkEmptyItem()]);
    } catch (e: any) {
      console.error(e);
      setBanner({ type: "err", msg: e?.message || "Something went wrong." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="dark-theme-page">
      <Head>
        <title>Seller — Quick Add (Form) | Famous Finds</title>
      </Head>

      <Header />

      <main className="section">
        <div className="back-link">
          <Link href="/seller/dashboard">← Back to Dashboard</Link>
        </div>

        <div className="page-header">
          <div>
            <h1>Quick Add — Multi-Item Form</h1>
            <p className="subtitle">
              Add several listings at once with dropdowns and image uploads.
            </p>
          </div>
          <Link className="link-alt" href="/seller/bulk-upload">
            Prefer CSV-style paste? Use Bulk Upload →
          </Link>
        </div>

        {banner && (
          <p
            className={`banner ${
              banner.type === "ok" ? "success" : "error"
            }`}
          >
            {banner.msg}
          </p>
        )}

        <div className="rows">
          {items.map((it, idx) => {
            const v = validate(it);
            return (
              <section className="card" key={idx}>
                <div className="row-header">
                  <h2>Item #{idx + 1}</h2>
                  <button
                    className="chip danger"
                    onClick={() => removeRow(idx)}
                    disabled={items.length === 1 || submitting}
                    aria-label={`Remove row ${idx + 1}`}
                  >
                    Remove
                  </button>
                </div>

                {!v.ok && <p className="hint error">⚠ {v.msg}</p>}
                {it.status === "uploading" && (
                  <p className="hint">Uploading images…</p>
                )}

                <div className="grid">
                  <label>
                    <span>Designer</span>
                    <select
                      value={it.designerId || ""}
                      onChange={(e) => onDesignerChange(idx, e.target.value)}
                    >
                      <option value="">— Pick a designer —</option>
                      {designers.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    <span>Title</span>
                    <input
                      type="text"
                      value={it.title}
                      onChange={(e) => update(idx, { title: e.target.value })}
                      placeholder="e.g., Classic Flap Bag"
                    />
                  </label>

                  <label>
                    <span>Category</span>
                    <select
                      value={it.category}
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
                      value={it.condition}
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
                      type="text"
                      value={it.size}
                      onChange={(e) => update(idx, { size: e.target.value })}
                      placeholder="e.g., M / 38 / 95 cm"
                    />
                  </label>

                  <label>
                    <span>Color</span>
                    <input
                      type="text"
                      value={it.color}
                      onChange={(e) => update(idx, { color: e.target.value })}
                      placeholder="e.g., Black"
                    />
                  </label>

                  <label>
                    <span>Price (USD)</span>
                    <input
                      type="number"
                      inputMode="decimal"
                      min="0"
                      step="0.01"
                      value={it.price}
                      onChange={(e) => update(idx, { price: e.target.value })}
                      placeholder="e.g., 5200"
                    />
                  </label>

                  <label>
                    <span>Purchase source</span>
                    <select
                      value={it.purchase_source}
                      onChange={(e) =>
                        update(idx, { purchase_source: e.target.value })
                      }
                    >
                      <option value="">— Select —</option>
                      {PURCHASE_SOURCES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    <span>Purchase proof</span>
                    <select
                      value={it.purchase_proof}
                      onChange={(e) =>
                        update(idx, { purchase_proof: e.target.value })
                      }
                    >
                      <option value="">— Select —</option>
                      {PURCHASE_PROOFS.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    <span>Serial / Reference</span>
                    <input
                      type="text"
                      value={it.serial_number}
                      onChange={(e) =>
                        update(idx, { serial_number: e.target.value })
                      }
                      placeholder="e.g., 12345-ABCD"
                    />
                  </label>

                  <div className="uploader">
                    <span>Images (drag & drop or select — up to 8)</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => onFiles(idx, e.target.files)}
                    />
                    {!!it.images.length && (
                      <p className="hint">
                        Selected: {it.images.map((f) => f.name).join(", ")}
                      </p>
                    )}
                  </div>
                </div>
              </section>
            );
          })}
        </div>

        <div className="actions">
          <button className="btn-secondary" onClick={addRow} disabled={submitting}>
            + Add another item
          </button>
          <button
            className="btn-primary"
            onClick={handleSubmit}
            disabled={submitting || !validCount}
            title={!validCount ? "Fill required fields first" : ""}
          >
            {submitting ? "Submitting…" : `Create ${validCount} listing(s)`}
          </button>
        </div>
      </main>

      <Footer />

      <style jsx>{`
        .back-link a {
          font-size: 12px;
          color: #9ca3af;
        }
        .back-link a:hover { color: #e5e7eb; }
        .page-header {
          margin-top: 16px;
          display: flex; align-items: center; justify-content: space-between;
        }
        h1 { font-size: 20px; font-weight: 600; color: #fff; }
        .subtitle { margin-top: 4px; font-size: 12px; color: #9ca3af; }
        .link-alt {
          font-size: 12px; color: #93c5fd; text-decoration: underline;
        }
        .banner { margin: 12px 0; font-weight: 600; }
        .banner.success { color: #6ee7b7; }
        .banner.error { color: #f87171; }
        .rows { display: grid; gap: 16px; margin-top: 12px; }
        .card {
          border-radius: 16px; border: 1px solid #ffffff1a;
          background: #ffffff0d; padding: 16px; font-size: 12px;
        }
        .row-header { display: flex; justify-content: space-between; align-items: center; }
        .row-header h2 { font-size: 14px; color: #fff; }
        .chip {
          border-radius: 999px; padding: 6px 10px; font-size: 11px; font-weight: 600;
          background: #111827; color: #e5e7eb; border: 1px solid #374151; cursor: pointer;
        }
        .chip.danger { background: #7f1d1d; border-color: #fecaca; color: #fecaca; }
        .hint { margin-top: 6px; color: #d1d5db; }
        .hint.error { color: #fca5a5; }
        .grid {
          display: grid; gap: 12px; margin-top: 12px;
        }
        @media (min-width: 768px) {
          .grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }
        label { display: flex; flex-direction: column; gap: 6px; }
        label span { color: #9ca3af; font-size: 11px; letter-spacing: .02em; text-transform: uppercase; }
        input, select {
          background: #00000066; color: #fff; border: 1px solid #ffffff1a;
          border-radius: 6px; padding: 10px; font-size: 12px;
        }
        input:focus, select:focus { outline: none; border-color: #fff; }
        .uploader input[type="file"] {
          background: transparent; border: 0; padding: 0; color: #d1d5db;
        }
        .actions {
          margin-top: 16px; display: flex; gap: 10px; align-items: center;
        }
        .btn-primary, .btn-secondary {
          border-radius: 999px; padding: 10px 16px; font-size: 12px; font-weight: 700;
          border: none; cursor: pointer;
        }
        .btn-primary { background: #fff; color: #000; }
        .btn-primary:disabled { opacity: .6; cursor: not-allowed; }
        .btn-secondary { background: #111827; color: #e5e7eb; border: 1px solid #374151; }
      `}</style>
    </div>
  );
}
