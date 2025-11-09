// FILE: /pages/sell.tsx
import Head from "next/head";
import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { FormEvent, useState } from "react";
import firebaseApp from "../utils/firebaseClient";

export default function Sell() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

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

      // Import Firebase Storage only on the client
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
    setSubmitting(true);

    try {
      const imageUrl = await uploadImageIfNeeded(formData);
      if (imageUrl) {
        formData.set("image_url", imageUrl);
      }

      const res = await fetch("/api/sell", {
        method: "POST",
        body: formData,
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
    <div className="dark-theme-page">
      <Head>
        <title>Sell on Famous Finds</title>
      </Head>

      <Header />

      <main className="section">
        <div className="section-header">
          <div>
            <h1>Sell your luxury items</h1>
            <p style={{ opacity: 0.8, marginTop: 4 }}>
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

              <label>
                Brand
                <input
                  name="brand"
                  type="text"
                  placeholder="e.g. Chanel, Louis Vuitton, Rolex"
                  required
                />
              </label>

              <label>
                Item name / model
                <input
                  name="title"
                  type="text"
                  placeholder="e.g. Classic Flap Bag, Speedy 30"
                  required
                />
              </label>

              <label>
                Condition
                <input
                  name="condition"
                  type="text"
                  placeholder="e.g. New with tags, Gently used"
                  required
                />
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
            <div className="sell-card">
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

            <div className="sell-card">
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
        .sell-grid {
          display: grid;
          grid-template-columns: minmax(0, 2fr) minmax(0, 1.3fr);
          gap: 24px;
        }
        @media (max-width: 900px) {
          .sell-grid {
            grid-template-columns: minmax(0, 1fr);
          }
        }
        .sell-card {
          background: #111827;
          border-radius: 16px;
          padding: 18px 18px 20px;
          border: 1px solid #1f2937;
        }
        .sell-card h2,
        .sell-card h3 {
          margin: 0 0 6px;
          font-size: 18px;
        }
        .sell-card p {
          margin: 0 0 8px;
          font-size: 14px;
          line-height: 1.4;
        }
        .muted {
          color: #9ca3af;
          font-size: 13px;
        }
        .sell-form {
          margin-top: 14px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        label {
          display: flex;
          flex-direction: column;
          gap: 4px;
          font-size: 13px;
        }
        input,
        textarea {
          background: #020617;
          border-radius: 8px;
          border: 1px solid #374151;
          padding: 8px 10px;
          color: #e5e7eb;
          font-size: 14px;
        }
        input::placeholder,
        textarea::placeholder {
          color: #6b7280;
        }
        textarea {
          resize: vertical;
        }
        .file-label {
          margin-top: 4px;
        }
        .file-help {
          font-size: 12px;
          color: #9ca3af;
        }
        .image-preview {
          margin-top: 8px;
          border: 1px dashed #374151;
          padding: 8px;
          border-radius: 8px;
          font-size: 12px;
          color: #d1d5db;
        }
        .image-preview span {
          display: block;
          margin-bottom: 4px;
        }
        .image-preview img {
          max-width: 200px;
          border-radius: 8px;
          border: 1px solid #374151;
        }
        button {
          margin-top: 10px;
          background: white;
          color: black;
          border: none;
          padding: 10px 16px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
        }
        button[disabled] {
          opacity: 0.7;
          cursor: default;
        }
        .sell-aside {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .sell-aside ol,
        .sell-aside ul {
          padding-left: 18px;
          margin: 6px 0 0;
          font-size: 13px;
          color: #e5e7eb;
        }
        .banner {
          margin-top: 12px;
          padding: 8px 10px;
          border-radius: 6px;
          font-size: 13px;
        }
        .success {
          background: #065f46;
          color: #d1fae5;
        }
        .note {
          margin-top: 16px;
          font-size: 12px;
          color: #9ca3af;
        }
      `}</style>
    </div>
  );
}
