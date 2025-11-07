// FILE: /pages/sell.tsx
import Head from "next/head";
import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { FormEvent, useState } from "react";
import { storage } from "../utils/firebaseClient";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function Sell() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  async function uploadImageIfNeeded(formData: FormData): Promise<string | null> {
    const file = formData.get("image_file");
    if (!file || !(file instanceof File) || !file.size) {
      return null;
    }

    setUploadingImage(true);
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `listing-images/${Date.now()}-${safeName}`;
      const storageRef = ref(storage, path);
      const snapshot = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(snapshot.ref);
      return url;
    } finally {
      setUploadingImage(false);
    }
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setSubmitted(false);

    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      // 1) Upload image file (if present) to Firebase Storage
      const uploadedImageUrl = await uploadImageIfNeeded(formData);

      // 2) Build JSON body
      const body: any = {};
      formData.forEach((value, key) => {
        if (key === "image_file") return; // don't send raw file
        body[key] = value;
      });

      // API expects the image URL in `image`
      if (uploadedImageUrl) {
        body.image = uploadedImageUrl;
      }

      const res = await fetch("/api/sell", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
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
      alert("Something went wrong submitting your listing. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleImageFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      setImagePreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setImagePreview(url);
  }

  const disabled = submitting || uploadingImage;

  return (
    <div className="dark-theme-page">
      <Head>
        <title>Sell an item – Famous Finds</title>
      </Head>

      <Header />

      <main className="wrap">
        <h1>Sell an item</h1>
        <p className="intro">
          This form is for casual, passing-by sellers who want to list a single
          item or a small number of pieces. All items are manually vetted and
          must be authentic. Your listing will not go live until it is reviewed.
        </p>

        {submitted && (
          <div className="msg success">
            ✅ Your listing has been received for review.
          </div>
        )}

        <form onSubmit={onSubmit} className="form">
          <input name="title" placeholder="Title" required />
          <input name="brand" placeholder="Brand" />
          <input
            name="category"
            placeholder="Category (bags, shoes, etc.)"
          />
          <input
            name="price"
            type="number"
            placeholder="Price (AUD)"
            required
          />

          {/* Image upload */}
          <label className="file-label">
            <span>Item photo</span>
            <input
              type="file"
              name="image_file"
              accept="image/*"
              onChange={handleImageFileChange}
            />
          </label>
          {imagePreview && (
            <div className="image-preview">
              <img src={imagePreview} alt="Preview" />
            </div>
          )}

          {/* Optional direct image URL as backup */}
          <input
            name="image"
            placeholder="Image URL (optional, used if no file is uploaded)"
          />

          <textarea
            name="description"
            rows={4}
            placeholder="Description"
            required
          />

          {/* AUTHENTICITY FIELDS */}
          <input
            name="purchase_source"
            placeholder="Purchased from (store / website / original owner)"
            required
          />
          <select name="purchase_proof" required>
            <option value="">Proof of authenticity</option>
            <option value="original_receipt">Original receipt available</option>
            <option value="certificate">Certificate of authenticity</option>
            <option value="trusted_seller">
              Purchased from trusted verified seller
            </option>
            <option value="none">No proof available</option>
          </select>
          <input
            name="serial_number"
            placeholder="Serial number / code (if applicable)"
          />
          <input
            name="auth_photos"
            placeholder="Proof photo URL (receipt / certificate / serial label)"
          />

          <button type="submit" disabled={disabled}>
            {disabled ? "Submitting..." : "Submit Listing"}
          </button>
        </form>

        <p className="note">
          Listings will appear as <strong>Pending Review</strong> until
          authenticated and approved. By submitting, you confirm the item is
          authentic and you agree to our{" "}
          <Link href="/terms-of-sale">Terms of Sale</Link> and{" "}
          <Link href="/authenticity-policy">Authenticity Policy</Link>.
        </p>
      </main>

      <Footer />

      <style jsx>{`
        .wrap {
          max-width: 600px;
          margin: 0 auto;
          padding: 24px 16px 80px;
        }
        h1 {
          font-size: 26px;
          margin-bottom: 8px;
        }
        .intro {
          font-size: 14px;
          color: #d1d5db;
          margin-bottom: 20px;
        }
        .form {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        input,
        textarea,
        select {
          border-radius: 8px;
          border: 1px solid #374151;
          background: #111827;
          color: white;
          padding: 8px 10px;
          font-size: 14px;
        }
        .file-label {
          display: flex;
          flex-direction: column;
          gap: 6px;
          font-size: 13px;
          color: #d1d5db;
        }
        .file-label input[type="file"] {
          border-radius: 8px;
          border: 1px dashed #4b5563;
          padding: 6px;
          background: #020617;
        }
        .image-preview {
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
        button:disabled {
          opacity: 0.6;
          cursor: default;
        }
        .msg {
          margin-bottom: 16px;
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
