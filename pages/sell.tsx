// FILE: /pages/sell.tsx

import Head from "next/head";
import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { FormEvent, useState, useEffect } from "react";
import { db } from "../utils/firebaseClient";
import {
  collection,
  getDocs,
} from "firebase/firestore";

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

  const [agreedToConsignment, setAgreedToConsignment] = useState(false);

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

  // Compress image client-side to stay within Vercel body-size limits
  function compressImage(file: File, maxDim = 2000, quality = 0.85): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          const ratio = Math.min(maxDim / width, maxDim / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas not supported"));
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => (blob ? resolve(blob) : reject(new Error("Compression failed"))),
          "image/jpeg",
          quality
        );
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = URL.createObjectURL(file);
    });
  }

  async function uploadImageIfNeeded(
    formData: FormData
  ): Promise<{ imageUrl: string; displayImageUrl: string } | null> {
    const file = formData.get("image_file");
    if (!file || !(file instanceof File) || !file.size) {
      return null;
    }

    setUploadingImage(true);
    try {
      // Compress client-side to avoid Vercel body-size limits
      const compressed = await compressImage(file);

      const uploadData = new FormData();
      uploadData.append("image", compressed, file.name || "photo.jpg");

      const res = await fetch("/api/seller/upload-with-processing", {
        method: "POST",
        body: uploadData,
      });

      let json: any;
      try {
        json = await res.json();
      } catch {
        throw new Error(`Upload server error (status ${res.status})`);
      }

      if (!res.ok || !json.ok) {
        throw new Error(json?.error || "Upload failed");
      }

      return {
        imageUrl: json.imageUrl,
        displayImageUrl: json.displayImageUrl,
      };
    } finally {
      setUploadingImage(false);
    }
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;

    if (!agreedToConsignment) {
      alert("Please read and accept the Consignment Agreement before submitting.");
      return;
    }

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
      brandName = match?.name || brandName || selectedDesignerId;
      formData.set("designer_id", selectedDesignerId);
      if (match?.isTop) {
        formData.set("designer_is_top", "true");
      }
    }

    if (!brandName) {
      alert("Please select a designer or type a designer name.");
      return;
    }

    formData.set("brand", brandName);
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
      // Image upload is optional — if it fails, continue without image
      let imageWarning = "";
      try {
        const uploaded = await uploadImageIfNeeded(formData);
        if (uploaded) {
          formData.set("image_url", uploaded.imageUrl);
          formData.set("display_image_url", uploaded.displayImageUrl);
        }
      } catch (imgErr: any) {
        console.warn("Image upload failed, continuing without image:", imgErr);
        imageWarning =
          "\n\n(Note: Image upload failed — your listing was submitted without the photo. You can add it later.)";
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

      let json: any;
      try {
        json = await res.json();
      } catch {
        throw new Error(
          `Server returned an unexpected response (status ${res.status}). Please try again.`
        );
      }

      if (!res.ok || !json.ok) {
        throw new Error(json?.error || `Server error (status ${res.status})`);
      }

      // Generate and download the Consignment Agreement PDF
      try {
        const pdfRes = await fetch("/api/consignment-agreement", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sellerName: payload.name,
            sellerEmail: payload.email,
            itemTitle: payload.title,
            itemBrand: payload.brand,
            itemCondition: payload.condition,
            itemPrice: payload.price,
            itemSerialNumber: payload.serial_number,
            itemDetails: payload.details,
            submissionId: json.id,
          }),
        });
        if (pdfRes.ok) {
          const blob = await pdfRes.blob();
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `FamousFinds-Consignment-Agreement.pdf`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
      } catch (pdfErr) {
        console.warn("Failed to generate consignment PDF:", pdfErr);
      }

      setSubmitted(true);
      form.reset();
      setImagePreview(null);
      setAgreedToConsignment(false);

      if (imageWarning) {
        alert("Your listing was submitted successfully!" + imageWarning);
      }
    } catch (err: any) {
      console.error("Listing submission error:", err);
      const msg = err?.message || "Unknown error";
      alert(
        `Something went wrong submitting your listing: ${msg}\n\nPlease try again.`
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

              {/* Consignment Agreement */}
              <div className="consignment-agreement">
                <strong>Consignment Agreement</strong>
                <p>
                  By checking the box below, you enter into a Consignment
                  Agreement with Famous Finds, authorizing the platform to
                  list, market, and sell the above-described item on your
                  behalf.
                </p>
                <div className="agreement-summary">
                  <p><strong>Key terms:</strong></p>
                  <ul>
                    <li>You confirm you are the lawful owner and the item is authentic.</li>
                    <li>Famous Finds will list and sell the item on your behalf.</li>
                    <li>A platform commission applies (see current fee schedule).</li>
                    <li>Payout occurs after delivery confirmation and cooling period.</li>
                    <li>You are responsible for any authenticity claims or disputes.</li>
                    <li>Either party may terminate before the item sells.</li>
                  </ul>
                  <p className="agreement-note">
                    A full PDF copy of the Consignment Agreement will be
                    auto-generated and downloaded after submission.
                  </p>
                </div>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={agreedToConsignment}
                    onChange={(e) => setAgreedToConsignment(e.target.checked)}
                  />
                  <span>
                    I have read and agree to the{" "}
                    <strong>Consignment Agreement</strong> and confirm that I
                    am the lawful owner of this item and that it is authentic.
                  </span>
                </label>
              </div>

              <div className="seller-responsibility">
                <strong>Seller&apos;s Responsibility</strong>
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

              <button
                type="submit"
                disabled={submitting || uploadingImage || !agreedToConsignment}
              >
                {submitting
                  ? "Submitting…"
                  : uploadingImage
                  ? "Uploading image…"
                  : !agreedToConsignment
                  ? "Accept agreement to submit"
                  : "Submit for review"}
              </button>

              {submitted && (
                <p className="banner success">
                  Thank you! We&apos;ve received your submission in USD. Your
                  Consignment Agreement PDF has been downloaded. A team member
                  will be in touch.
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
          background: #ffffff;
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
        .consignment-agreement {
          margin-top: 20px;
          padding: 16px;
          border-radius: 8px;
          border: 1px solid #bfdbfe;
          background: #eff6ff;
          font-size: 12px;
          color: #1e3a5f;
          line-height: 1.5;
        }
        .consignment-agreement > strong {
          color: #1e40af;
          display: block;
          margin-bottom: 8px;
          font-size: 14px;
        }
        .consignment-agreement p {
          font-size: 12px;
          margin-bottom: 8px;
          color: #1e3a5f;
        }
        .agreement-summary {
          margin: 8px 0 12px;
          padding: 10px 12px;
          background: #ffffff;
          border-radius: 6px;
          border: 1px solid #dbeafe;
        }
        .agreement-summary ul {
          margin: 6px 0 8px;
          padding-left: 18px;
          font-size: 11px;
          line-height: 1.6;
          color: #374151;
        }
        .agreement-summary li {
          margin-bottom: 2px;
        }
        .agreement-note {
          font-size: 11px;
          color: #6b7280;
          font-style: italic;
          margin-bottom: 0;
        }
        .checkbox-label {
          display: flex;
          flex-direction: row;
          align-items: flex-start;
          gap: 8px;
          cursor: pointer;
          font-weight: 400;
        }
        .checkbox-label input[type="checkbox"] {
          margin-top: 2px;
          width: 18px;
          height: 18px;
          flex-shrink: 0;
          accent-color: #2563eb;
        }
        .checkbox-label span {
          font-size: 12px;
          color: #374151;
          line-height: 1.5;
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
