// FILE: /pages/sell.tsx

import Head from "next/head";
import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { FormEvent, useState, useEffect } from "react";
import firebaseApp from "../utils/firebaseClient";
import {
  getFirestore,
  collection,
  getDocs,
} from "firebase/firestore";

const db = getFirestore(firebaseApp);

type Designer = {
  id: string;
  name: string;
  isTop?: boolean;
  isUpcoming?: boolean;
  active?: boolean;
};

// ✅ STANDARD LISTS (Matches seller/bulk-simple and Filters)
const CATEGORIES = [
  "Bags",
  "Shoes",
  "Jewelry",
  "Watches",
  "Clothing",
  "Accessories",
];

const CONDITIONS = [
  "New with tags",
  "New (never used)",
  "Excellent",
  "Very good",
  "Good",
  "Fair",
];

export default function Sell() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [designers, setDesigners] = useState<Designer[]>([]);
  const [loadingDesigners, setLoadingDesigners] = useState(true);
  const [designerError, setDesignerError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const snap = await getDocs(collection(db, "designers"));
        const list: Designer[] = snap.docs
          .map((d) => ({ id: d.id, ...(d.data() as any) }))
          .filter((d) => d?.name && d?.active !== false)
          .map((d) => ({
            id: d.id,
            name: d.name,
            isTop: !!d.isTop,
            isUpcoming: !!d.isUpcoming,
            active: d.active !== false,
          }))
          .sort((a, b) => {
            if (a.isTop && !b.isTop) return -1;
            if (!a.isTop && b.isTop) return 1;
            return a.name.localeCompare(b.name);
          });
        if (isMounted) setDesigners(list);
      } catch (e) {
        if (isMounted) setDesignerError(
          "Unable to load approved designers. You can still request a new designer below."
        );
      } finally {
        if (isMounted) setLoadingDesigners(false);
      }
    })();
    return () => { isMounted = false; };
  }, []);

  async function uploadImageIfNeeded(
    formData: FormData
  ): Promise<string | null> {
    const file = formData.get("image_file");
    if (!file || !(file instanceof File) || !file.size) {
      return null;
    }

    setUploadingImage(true);
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `listing-images/${Date.now()}-${safeName}`;

      const {
        getStorage,
        ref,
        uploadBytes,
        getDownloadURL,
      } = await import("firebase/storage");
      const storage = getStorage(firebaseApp);

      const storageRef = ref(storage, path);
      const snapshot = await uploadBytes(storageRef, file as File);
      const url = await getDownloadURL(snapshot.ref);
      return url;
    } finally {
      setUploadingImage(false);
    }
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;

    const form = e.currentTarget;
    const formData = new FormData(form);

    // --- BRAND / DESIGNER LOGIC ---
    const selectedDesignerId = (formData.get("brand_select") || "")
      .toString()
      .trim();
    const requestedDesigner = (formData.get("brand_request") || "")
      .toString()
      .trim();

    if (!selectedDesignerId && !requestedDesigner) {
      alert(
        "Please select an approved designer from the list or request a new designer."
      );
      return;
    }

    let brandName = requestedDesigner;
    if (selectedDesignerId) {
      const match = designers.find((d) => d.id === selectedDesignerId);
      brandName = match?.name || brandName;
      formData.set("designer_id", selectedDesignerId);
      if (match?.isTop) {
        formData.set("designer_is_top", "true");
      }
    }

    formData.set("brand", brandName || "");
    if (requestedDesigner) {
      formData.set("designer_request", requestedDesigner);
      const requestReason = (formData.get("designer_request_reason") || "")
        .toString()
        .trim();
      if (requestReason) {
        formData.set("designer_request_reason", requestReason);
      }
    }
    // --- END BRAND / DESIGNER LOGIC ---

    setSubmitting(true);
    try {
      const imageUrl = await uploadImageIfNeeded(formData);
      if (imageUrl) {
        formData.set("image_url", imageUrl);
      }

      const payload: Record<string, any> = {};
      formData.forEach((value, key) => {
        if (value instanceof File) {
          return;
        }
        payload[key] = value;
      });

      const res = await fetch("/api/sell", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json?.error || "Something went wrong");
      }

      setSubmitted(true);
      form.reset();
      setImagePreview(null);
    } catch (err) {
      console.error(err);
      alert(
        "Something went wrong submitting your listing. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  function handleImageFileChange(
    e: React.ChangeEvent<HTMLInputElement>
  ): void {
    const file = e.target.files?.[0];
    if (!file) {
      setImagePreview(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setImagePreview(reader.result);
      }
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="page-container">
      <Head>
        <title>Sell on Famous Finds</title>
      </Head>

      <Header />

      <main className="section">
        <div className="section-header">
          <div>
            <h1>Sell your luxury items</h1>
            <p className="page-subtitle">
              Submit a high–level description. A member of our team will follow
              up to help you create a full listing.
            </p>
          </div>
          <Link href="/" className="cta">
            ← Back to browsing
          </Link>
        </div>

        <div className="sell-grid">
          <section className="sell-card">
            <h2>Tell us about your item</h2>
            <p className="muted">
              Include brand, model, condition, original purchase details, and
              any flaws. Prices are in USD.
            </p>

            <form onSubmit={onSubmit} className="sell-form">
              <label>
                Your name
                <input
                  name="name"
                  type="text"
                  placeholder="First and last name"
                  required
                />
              </label>

              <label>
                Email
                <input
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  required
                />
              </label>

              {/* BRAND / DESIGNER DROPDOWN */}
              <label>
                Brand / Designer
                {loadingDesigners ? (
                  <div className="dropdown-help">
                    Loading approved designers…
                  </div>
                ) : (
                  <select name="brand_select" defaultValue="">
                    <option value="">
                      Select an approved designer from the directory…
                    </option>
                    {designers.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                        {d.isTop ? " (Top)" : d.isUpcoming ? " (Upcoming)" : ""}
                      </option>
                    ))}
                  </select>
                )}
                {designerError && (
                  <div className="field-warning">{designerError}</div>
                )}
                <div className="dropdown-help">
                  Famous-Finds only accepts approved designers. Select from the
                  list or request a new designer below.
                </div>
              </label>

              <label>
                Request a new designer (if not listed)
                <input
                  name="brand_request"
                  type="text"
                  placeholder="e.g. Dan Trousers"
                />
                <span className="file-help">
                  If your designer is not in the list, type the name here and
                  our management team will review it.
                </span>
              </label>

              <label>
                Notes to management about this designer (optional)
                <textarea
                  name="designer_request_reason"
                  rows={3}
                  placeholder="Tell us why this designer should be accepted (reputation, where it sells, price level, etc.)"
                />
              </label>
              {/* END DESIGNER BLOCK */}

              <label>
                Item name / model
                <input
                  name="title"
                  type="text"
                  placeholder="e.g. Classic Flap Bag, Speedy 30"
                  required
                />
              </label>

              {/* ✅ UPDATED: Category Dropdown */}
              <label>
                Category
                <select name="category" required defaultValue="">
                  <option value="">— Pick a category —</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </label>

              {/* ✅ UPDATED: Condition Dropdown */}
              <label>
                Condition
                <select name="condition" required defaultValue="">
                  <option value="">— Pick a condition —</option>
                  {CONDITIONS.map((cond) => (
                    <option key={cond} value={cond}>
                      {cond}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Size (if applicable)
                <input
                  name="size"
                  type="text"
                  placeholder="e.g. EU 39, Medium, 36mm"
                />
              </label>

              <label>
                Color / material
                <input
                  name="color"
                  type="text"
                  placeholder="e.g. Black caviar leather, Gold hardware"
                />
              </label>

              <label>
                Desired price (USD)
                <input
                  name="price"
                  type="number"
                  placeholder="Price (USD)"
                  required
                />
              </label>

              <label>
                Serial Number (if applicable)
                <input
                  name="serial_number"
                  type="text"
                  placeholder="e.g. 12345-ABCD"
                />
              </label>

              {/* Image upload */}
              <label className="file-label">
                <span>Item photo</span>
                <input
                  type="file"
                  name="image_file"
                  accept="image/*"
                  onChange={handleImageFileChange}
                />
                <span className="file-help">
                  Optional, but strongly recommended. JPEG or PNG.
                </span>
              </label>

              <label className="file-label">
                <span>Proof of Purchase (Optional)</span>
                <input
                  name="purchase_proof"
                  type="text"
                  placeholder="e.g. Original receipt, PDF invoice, Bank statement"
                />
                <span className="file-help">
                  Helps speed up authentication.
                </span>
              </label>

              {imagePreview && (
                <div className="image-preview">
                  <span>Preview</span>
                  <img src={imagePreview} alt="Preview" />
                </div>
              )}

              <label>
                Additional details
                <textarea
                  name="details"
                  rows={4}
                  placeholder="Tell us more about the item, original purchase location, proof of authenticity, packaging, etc."
                />
              </label>

              <div className="seller-responsibility">
                <strong>Seller's Responsibility</strong>
                <p>
                  By submitting this item, you declare, under penalty of law,
                  that this item is <strong>authentic</strong> and that all
                  details provided are true and accurate.
                </p>
                <p>
                  As a seller on this peer-to-peer platform, you are solely
                  responsible for any and all claims, damages, or liabilities
                  arising from the sale of your item, including any claims of
                  non-authenticity.
                </p>
              </div>

              <button type="submit" disabled={submitting || uploadingImage}>
                {submitting
                  ? "Submitting…"
                  : uploadingImage
                  ? "Uploading image…"
                  : "Submit for review"}
              </button>

              {submitted && (
                <p className="banner success">
                  Thank you! We&apos;ve received your submission in USD. A team
                  member will be in touch.
                </p>
              )}
            </form>

            <p className="note">
              By submitting, you confirm that the item is authentic and that you
              agree to Famous Finds&apos; terms.
            </p>
          </section>

          <aside className="sell-aside">
            <div className="sell-card info-card">
              <h3>How it works</h3>
              <ol>
                <li>Tell us about your item and upload a photo.</li>
                <li>Our team reviews the details and may ask follow–up.</li>
                <li>
                  If approved, we help you create a polished listing in USD.
                </li>
                <li>
                  Once it sells and is delivered, you get paid via secure
                  payout.
                </li>
              </ol>
            </div>

            <div className="sell-card info-card">
              <h3>What sells best</h3>
              <ul>
                <li>Current–season or iconic handbags</li>
                <li>Limited–edition sneakers and streetwear</li>
                <li>Fine jewelry and watches</li>
                <li>Excellent condition, with proof of purchase</li>
              </ul>
            </div>
          </aside>
        </div>
      </main>

      <Footer />

      <style jsx>{`
        .page-container {
          background-color: #f9fafb;
          color: #111827;
          min-height: 100vh;
        }
        .page-subtitle {
          opacity: 0.8;
          margin-top: 4px;
          color: #4b5563;
        }
        .cta {
          font-size: 13px;
          color: #4b5563;
          text-decoration: none;
          font-weight: 500;
        }
        .cta:hover {
          color: #111827;
        }
        .sell-grid {
          display: grid;
          grid-template-columns: minmax(0, 2fr) minmax(0, 1.3fr);
          gap: 24px;
          margin-top: 20px;
        }
        @media (max-width: 900px) {
          .sell-grid {
            grid-template-columns: minmax(0, 1fr);
          }
        }
        .sell-card {
          background: #ffffff;
          border-radius: 16px;
          padding: 24px;
          border: 1px solid #e5e7eb;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
        .sell-card h2,
        .sell-card h3 {
          margin: 0 0 8px;
          font-size: 18px;
          font-weight: 600;
          color: #111827;
        }
        .muted {
          color: #6b7280;
          font-size: 14px;
          margin-bottom: 16px;
          line-height: 1.5;
        }
        .sell-form {
          margin-top: 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        label {
          display: flex;
          flex-direction: column;
          gap: 6px;
          font-size: 13px;
          font-weight: 600;
          color: #374151;
        }
        input,
        textarea,
        select {
          background: #ffffff;
          border-radius: 8px;
          border: 1px solid #d1d5db;
          padding: 10px 12px;
          color: #111827;
          font-size: 14px;
        }
        input:focus,
        textarea:focus,
        select:focus {
          outline: none;
          border-color: #111827;
          box-shadow: 0 0 0 1px #111827;
        }
        input::placeholder,
        textarea::placeholder {
          color: #9ca3af;
        }
        textarea {
          resize: vertical;
        }
        select {
          cursor: pointer;
        }
        .file-label {
          margin-top: 4px;
        }
        .file-help {
          font-size: 12px;
          color: #6b7280;
          font-weight: 400;
        }
        .dropdown-help {
          font-size: 12px;
          color: #6b7280;
          font-weight: 400;
          margin-top: 2px;
        }
        .field-warning {
          margin-top: 4px;
          font-size: 12px;
          color: #d97706;
        }
        .image-preview {
          margin-top: 8px;
          border: 1px dashed #d1d5db;
          padding: 12px;
          border-radius: 8px;
          background: #f9fafb;
          font-size: 12px;
          color: #4b5563;
        }
        .image-preview span {
          display: block;
          margin-bottom: 6px;
          font-weight: 600;
        }
        .image-preview img {
          max-width: 200px;
          border-radius: 6px;
          border: 1px solid #e5e7eb;
          display: block;
        }
        button {
          margin-top: 12px;
          background: #111827;
          color: white;
          border: none;
          padding: 12px 20px;
          border-radius: 99px;
          font-weight: 600;
          cursor: pointer;
          font-size: 14px;
          transition: opacity 0.2s;
        }
        button:hover {
          opacity: 0.9;
        }
        button[disabled] {
          background: #9ca3af;
          cursor: not-allowed;
        }
        .sell-aside {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .info-card {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
        }
        .sell-aside ol,
        .sell-aside ul {
          padding-left: 20px;
          margin: 8px 0 0;
          font-size: 13px;
          color: #4b5563;
          line-height: 1.5;
        }
        .sell-aside li {
          margin-bottom: 6px;
        }
        .banner {
          margin-top: 16px;
          padding: 12px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
        }
        .success {
          background: #ecfdf5;
          color: #065f46;
          border: 1px solid #a7f3d0;
        }
        .note {
          margin-top: 16px;
          font-size: 12px;
          color: #6b7280;
          text-align: center;
        }
        .seller-responsibility {
          margin-top: 16px;
          padding: 16px;
          border-radius: 8px;
          border: 1px solid #fed7aa;
          background: #fff7ed;
          font-size: 12px;
          color: #9a3412;
          line-height: 1.5;
        }
        .seller-responsibility strong {
          color: #9a3412;
          display: block;
          margin-bottom: 6px;
          font-size: 13px;
        }
        .seller-responsibility p {
          font-size: 12px;
          margin-bottom: 8px;
          color: #7c2d12;
        }
        .seller-responsibility p:last-child {
          margin-bottom: 0;
        }
      `}</style>
    </div>
  );
}
