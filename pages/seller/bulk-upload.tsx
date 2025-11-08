// FILE: /pages/seller/bulk-upload.tsx
import Head from "next/head";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import React, { // <-- UPDATED: Added 'React'
  useState,
  FormEvent,
  ChangeEvent,
  DragEvent,
} from "react";
import { storage } from "../../utils/firebaseClient";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

// --- ADDED: Manually added uuidv4 function ---
function uuidv4() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
// -------------------------------------------

type UploadRow = {
  id: string;
  title: string;
  brand: string;
  price: string;
  category: string;
  imageUrls?: string[];
  // --- ADDED: New fields ---
  purchase_source: string;
  purchase_proof: string;
  serial_number?: string;
  auth_photos?: string[];
  authenticity_confirmed: boolean;
  // -------------------------
  status: "ready" | "missing" | "error";
};

// (Dropdown lists are unchanged)
const TOP_BRANDS = [
  "Prada", "Gucci", "Chanel", "Rolex", "Hermès", "Louis Vuitton",
  "Dior", "Cartier", "Fendi", "Saint Laurent", "Other"
];
const CATEGORIES = [
  "Bags", "Watches", "Kids", "Clothing", "Jewelry", "Home",
  "Shoes", "Men", "Beauty", "Accessories", "Women", "Sale",
];
const PROOF_TYPES = [
  "Original Receipt",
  "Certificate of Authenticity",
  "Brand Service Record",
  "Third-party Authenticator Report",
  "Other Documented Proof",
  "N/A"
];
// ----------------------------------

export default function SellerBulkUpload() {
  const [fileName, setFileName] = useState<string | null>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [rows, setRows] = useState<UploadRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [committing, setCommitting] = useState(false);

  // --- State for new single-listing fields ---
  const [singleTitle, setSingleTitle] = useState("");
  const [singleBrand, setSingleBrand] = useState("");
  const [singleCategory, setSingleCategory] = useState("");
  const [singlePrice, setSinglePrice] = useState("");
  const [singlePurchaseSource, setSinglePurchaseSource] = useState("");
  const [singlePurchaseProof, setSinglePurchaseProof] = useState("");
  const [singleSerialNumber, setSingleSerialNumber] = useState("");
  const [authConfirm, setAuthConfirm] = useState(false); // Legal checkbox
  const [singleBusy, setSingleBusy] = useState(false);
  const [singleMessage, setSingleMessage] = useState<string | null>(null);
  const [singleError, setSingleError] = useState<string | null>(null);
  
  const [singleImageFiles, setSingleImageFiles] = useState<File[]>([]);
  const [singleImagePreviews, setSingleImagePreviews] = useState<string[]>([]);
  const [singleUploadingImage, setSingleUploadingImage] = useState(false);
  
  const [proofImageFiles, setProofImageFiles] = useState<File[]>([]);
  const [proofImagePreviews, setProofImagePreviews] = useState<string[]>([]);
  const [uploadingProofImages, setUploadingProofImages] = useState(false);
  // --------------------------------------------------

  // (CSV logic is unchanged)
  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    /* ... existing code from your file ... */
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setLoading(true);
    setError(null);
    setRows([]);

    try {
      const text = await file.text();
      const res = await fetch("/api/seller/bulk-parse", {
        method: "POST",
        headers: { "Content-Type": "text/csv" },
        body: text,
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || "Failed to parse file");
      }

      // --- PARSE ALL FIELDS FROM CSV ---
      const parsed = (json.rows || []).map((r: any, idx: number) => {
        const price = String(r.price ?? "").trim();
        const confirmed = String(r.authenticity_confirmed || "").toUpperCase() === "YES";
        
        let status: UploadRow["status"] = "ready";
        if (!r.title || !price || !r.purchase_source || !r.purchase_proof || !r.serial_number || !confirmed) {
          status = "missing";
        }

        return {
          id: String(r.id ?? idx + 1),
          title: String(r.title || ""),
          brand: String(r.brand || ""),
          price,
          category: String(r.category || ""),
          imageUrls: r.imageUrls ? String(r.imageUrls).split(',').map((url:string) => url.trim()) : [],
          purchase_source: String(r.purchase_source || ""),
          purchase_proof: String(r.purchase_proof || ""),
          serial_number: String(r.serial_number || ""),
          auth_photos: r.auth_photos ? String(r.auth_photos).split(',').map((url:string) => url.trim()) : [],
          authenticity_confirmed: confirmed,
          status,
        } as UploadRow;
      });

      setRows(parsed);
      setStep(2);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Unable to read this file.");
    } finally {
      setLoading(false);
    }
  };
  
  const handleConfirm = async () => {
    const ready = rows.filter((r) => r.status === "ready");
    if (!ready.length) {
      alert("There are no rows marked as 'Ready'. Please check for missing fields and re-upload.");
      return;
    }

    setCommitting(true);
    setError(null);

    try {
      const res = await fetch("/api/seller/bulk-commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: ready }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || "Failed to create listings");
      }
      setStep(3);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Unable to create listings.");
    } finally {
      setCommitting(false);
    }
  };
  
  // ---------------- SINGLE LISTING + IMAGE ----------------

  // --- THIS IS THE FIX ---
  // The type for setPreviews was wrong.
  function handleImageSelect(
    files: FileList | null, 
    setFiles: React.Dispatch<React.SetStateAction<File[]>>, 
    setPreviews: React.Dispatch<React.SetStateAction<string[]>> // <-- Corrected Type
  ) {
  // -----------------------
    if (!files || files.length === 0) {
      setFiles([]);
      setPreviews([]);
      return;
    }
    const newFiles = Array.from(files);
    setFiles(newFiles);
    // Revoke old preview URLs
    setPreviews((oldPreviews) => {
      oldPreviews.forEach(URL.revokeObjectURL);
      return newFiles.map(file => URL.createObjectURL(file));
    });
  }

  // (All other handle... functions are unchanged)
  const handleSingleImageInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    handleImageSelect(e.target.files, setSingleImageFiles, setSingleImagePreviews);
  };
  const handleProofImageInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    handleImageSelect(e.target.files, setProofImageFiles, setProofImagePreviews);
  };
  const handleSingleImageDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    handleImageSelect(e.dataTransfer.files, setSingleImageFiles, setSingleImagePreviews);
  };
  const handleProofImageDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    handleImageSelect(e.dataTransfer.files, setProofImageFiles, setProofImagePreviews);
  };
  const handleSingleImageDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  // Reusable upload function (unchanged)
  async function uploadImages(
    files: File[], 
    pathPrefix: string,
    setLoading: (loading: boolean) => void,
    timeoutMs = 60000
  ): Promise<string[] | null> {
    if (files.length === 0) return null;

    setLoading(true);
    try {
      const uploadPromises = files.map(file => {
        return new Promise<string>(async (resolve, reject) => {
          const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
          const path = `${pathPrefix}/${uuidv4()}-${safeName}`;
          const storageRef = ref(storage, path);
          try {
            const snap = await uploadBytes(storageRef, file);
            const url = await getDownloadURL(snap.ref);
            resolve(url);
          } catch (err) {
            reject(err);
          }
        });
      });

      const timeoutPromise = new Promise<never>((_, reject) => {
        const err: any = new Error("Image upload timed out.");
        err.code = "local/timeout";
        setTimeout(() => reject(err), timeoutMs);
      });

      const urls = await Promise.race([Promise.all(uploadPromises), timeoutPromise]);
      return urls as string[];

    } catch (err: any) {
      console.error("Image upload failed:", err);
      if (err.code === "storage/unauthorized") {
        throw new Error("Image upload failed: Permission denied. Check Firebase Storage rules.");
      }
      throw new Error("One or more image uploads failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }


  // handleSingleSubmit function (unchanged)
  const handleSingleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSingleError(null);
    setSingleMessage(null);

    if (!singleTitle.trim() || !singlePrice.trim() || !singleBrand || !singleCategory || !singlePurchaseSource || !singlePurchaseProof || !singleSerialNumber) {
      setSingleError("Please fill out all required fields marked with *.");
      return;
    }
    
    if (!authConfirm) {
      setSingleError("You must confirm the item's authenticity to submit.");
      return;
    }

    setSingleBusy(true);

    try {
      let imageUrls: string[] | null = null;
      if (singleImageFiles.length > 0) {
        try {
          imageUrls = await uploadImages(singleImageFiles, "listing-images", setSingleUploadingImage);
        } catch (err: any) {
          setSingleError(err.message + " The listing will be created without product photos.");
          imageUrls = null;
        }
      }

      let authPhotoUrls: string[] | null = null;
      if (proofImageFiles.length > 0) {
         try {
          authPhotoUrls = await uploadImages(proofImageFiles, "auth-proof-images", setUploadingProofImages);
        } catch (err: any) {
          setSingleError(err.message + " Proof photos failed to upload, but listing will be created.");
          authPhotoUrls = null;
        }
      }

      const row: UploadRow = {
        id: "manual-" + Date.now(),
        title: singleTitle.trim(),
        brand: singleBrand.trim(),
        category: singleCategory.trim(),
        price: singlePrice.trim(),
        imageUrls: imageUrls || undefined,
        status: "ready", 
        purchase_source: singlePurchaseSource,
        purchase_proof: singlePurchaseProof,
        serial_number: singleSerialNumber,
        auth_photos: authPhotoUrls || undefined,
        authenticity_confirmed: authConfirm,
      };

      const res = await fetch("/api/seller/bulk-commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: [row] }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || "Failed to create listing");
      }

      // Success: Clear form
      setSingleTitle("");
      setSingleBrand("");
      setSingleCategory("");
      setSinglePrice("");
      setSinglePurchaseSource("");
      setSinglePurchaseProof("");
      setSingleSerialNumber("");
      setAuthConfirm(false);
      handleImageSelect(null, setSingleImageFiles, setSingleImagePreviews);
      handleImageSelect(null, setProofImageFiles, setProofImagePreviews);

      setSingleMessage("Listing created and submitted for review.");
      
    } catch (err: any) {
      console.error("single_listing_error", err);
      setSingleError(err?.message || "Unable to create listing.");
    } finally {
      setSingleBusy(false);
      setSingleUploadingImage(false); 
      setUploadingProofImages(false);
    }
  };

  const singleDisabled = singleBusy || singleUploadingImage || uploadingProofImages;
  const selectInputStyle = "mt-1 w-full rounded-md border border-neutral-700 bg-black/40 px-3 py-2 text-xs text-gray-100 focus:border-gray-200 focus:outline-none";

  // Reusable image uploader component (unchanged)
  const ImageUploaderBox = ({ label, onDrop, onDragOver, onChange, previews, uploading, filesLength }: any) => (
    <div className="md:col-span-2">
      <label className="block text-[11px] font-medium text-gray-300">
        {label}
      </label>
      <div
        onDragOver={onDragOver}
        onDrop={onDrop}
        className="mt-1 flex flex-col items-center justify-center rounded-md border border-dashed border-neutral-700 bg-black/40 px-3 py-4 text-center text-[11px] text-gray-400"
      >
        <p className="mb-1">Drag & drop images here, or click to browse.</p>
        <label className="cursor-pointer rounded-full border border-neutral-600 px-3 py-1 text-[11px] hover:border-neutral-400">
          Choose files
          <input
            type="file"
            accept="image/png, image/jpeg, image/webp"
            multiple
            className="hidden"
            onChange={onChange}
          />
        </label>
        {uploading && (
          <p className="mt-2 text-[11px] text-gray-300">
            Uploading {filesLength} image(s)…
          </p>
        )}
        {previews.length > 0 && (
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {previews.map((previewUrl: string, i: number) => (
              <img
                key={i}
                src={previewUrl}
                alt="Preview"
                className="h-16 w-16 rounded-md border border-neutral-700 object-cover"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
  // ---------------------------------------------

  // --- RENDER function (All JSX is unchanged) ---
  return (
    <div className="min-h-screen bg-black text-gray-100">
      <Head>
        <title>Seller — Upload Listings | Famous Finds</title>
      </Head>

      <Header />

      <main className="mx-auto max-w-5xl px-4 pb-16 pt-6 text-sm">
        <Link
          href="/seller/dashboard"
          className="text-xs text-gray-400 hover:text-gray-200"
        >
          ← Back to Dashboard
        </Link>

        {/* --- UPDATED: Instructions --- */}
        <h1 className="mt-4 text-2xl font-semibold text-white">
          Upload Your Listings
        </h1>
        <p className="mt-1 text-sm text-gray-400">
          You can add items one-by-one or upload many at once with a CSV.
          All submissions are held for admin review before going live.
        </p>
        {/* ----------------------------- */}

        {/* Steps indicator (Unchanged) */}
        <ol className="mt-6 flex flex-wrap gap-3 text-xs">
          {["Upload file", "Review rows", "Create listings"].map(
            (label, i) => {
              const n = (i + 1) as 1 | 2 | 3;
              const active = step === n;
              const done = step > n;
              return (
                <li key={label} className="flex items-center gap-2 text-xs">
                  <span
                    className={
                      "flex h-5 w-5 items-center justify-center rounded-full border text-[10px] " +
                      (done
                        ? "border-emerald-400 bg-emerald-500/20 text-emerald-200"
                        : active
                        ? "border-white text-white"
                        : "border-neutral-600 text-neutral-500")
                    }
                  >
                    {done ? "✓" : n}
                  </span>
                  <span className={active ? "text-white" : "text-neutral-400"}>
                    {label}
                  </span>
                </li>
              );
            }
          )}
        </ol>

        {/* STEP 1 */}
        {step === 1 && (
          <section className="mt-8 grid gap-8 md:grid-cols-[minmax(0,2fr)_minmax(0,1.5fr)]">
            {/* --- UPDATED: Single Listing Form --- */}
            <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-6">
              <div>
                <h3 className="text-lg font-semibold">
                  Option 1: Add a Single Listing
                </h3>
                <p className="mt-1 text-xs text-gray-400">
                  Use this form for one item. All fields marked with * are required.
                </p>

                <form
                  onSubmit={handleSingleSubmit}
                  className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2"
                >
                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-medium text-gray-300">
                      Title *
                    </label>
                    <input
                      type="text"
                      value={singleTitle}
                      onChange={(e) => setSingleTitle(e.target.value)}
                      className={selectInputStyle}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-gray-300">
                      Brand *
                    </label>
                    <select
                      value={singleBrand}
                      onChange={(e) => setSingleBrand(e.target.value)}
                      className={selectInputStyle}
                      required
                    >
                      <option value="">Select a brand</option>
                      {TOP_BRANDS.map((brand) => (
                        <option key={brand} value={brand}>{brand}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-gray-300">
                      Category *
                    </label>
                    <select
                      value={singleCategory}
                      onChange={(e) => setSingleCategory(e.target.value)}
                      className={selectInputStyle}
                      required
                    >
                      <option value="">Select a category</option>
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-medium text-gray-300">
                      Price (USD) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={singlePrice}
                      onChange={(e) => setSinglePrice(e.target.value)}
                      className={selectInputStyle}
                      required
                    />
                  </div>
                  
                  {/* --- ADDED: Authenticity Fields --- */}
                  <div className="md:col-span-2 mt-4 border-t border-neutral-800 pt-4">
                    <h4 className="text-sm font-semibold text-white">
                      Authenticity & Proof *
                    </h4>
                    <p className="text-[11px] text-gray-400 mb-2">
                      To protect buyers and your reputation, we require authenticity details for all items.
                    </p>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-gray-300">
                      Purchase Source *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Gucci Store, NYC"
                      value={singlePurchaseSource}
                      onChange={(e) => setSinglePurchaseSource(e.target.value)}
                      className={selectInputStyle}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-gray-300">
                      Type of Proof *
                    </label>
                    <select
                      value={singlePurchaseProof}
                      onChange={(e) => setSinglePurchaseProof(e.target.value)}
                      className={selectInputStyle}
                      required
                    >
                      <option value="">Select proof type</option>
                      {PROOF_TYPES.map((proof) => (
                        <option key={proof} value={proof}>{proof}</option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-medium text-gray-300">
                      Serial Number *
                    </label>
                    <input
                      type="text"
                      placeholder="Enter 'N/A' if not applicable"
                      value={singleSerialNumber}
                      onChange={(e) => setSingleSerialNumber(e.target.value)}
                      className={selectInputStyle}
                      required
                    />
                  </div>
                  
                  {/* Product Image Uploader */}
                  <ImageUploaderBox
                    label="Product Photos (Highly Recommended)"
                    onDrop={handleSingleImageDrop}
                    onDragOver={handleSingleImageDragOver}
                    onChange={handleSingleImageInputChange}
                    previews={singleImagePreviews}
                    uploading={singleUploadingImage}
                    filesLength={singleImageFiles.length}
                  />

                  {/* Proof Image Uploader */}
                  <ImageUploaderBox
                    label="Authenticity Photos (e.g., receipt, serial number)"
                    onDrop={handleProofImageDrop}
                    onDragOver={handleSingleImageDragOver}
                    onChange={handleProofImageInputChange}
                    previews={proofImagePreviews}
                    uploading={uploadingProofImages}
                    filesLength={proofImageFiles.length}
                  />
                  
                  {/* Legal Checkbox */}
                  <div className="md:col-span-2 mt-4 border-t border-neutral-800 pt-4">
                     <label className="flex items-start gap-2">
                      <input
                        type="checkbox"
                        checked={authConfirm}
                        onChange={(e) => setAuthConfirm(e.target.checked)}
                        className="mt-[1px] h-4 w-4 rounded border-gray-500 bg-black/40 text-yellow-400 focus:ring-yellow-400"
                        required
                      />
                      <span className="text-[11px] text-gray-300">
                        I confirm this item is authentic to the best of my knowledge, and I
                        understand I am legally responsible for any counterfeit or misrepresented
                        goods listed on Famous-Finds.
                      </span>
                    </label>
                  </div>
                  
                  <div className="flex items-end md:col-span-2">
                    <button
                      type="submit"
                      disabled={singleDisabled}
                      className="rounded-full bg-white px-4 py-2 text-xs font-medium text-black hover:bg-gray-100 disabled:opacity-60"
                    >
                      {singleDisabled ? "Submitting..." : "Submit Listing for Review"}
                    </button>
                  </div>
                </form>
                {singleError && (
                  <p className="mt-2 text-xs text-red-400">{singleError}</p>
                )}
                {singleMessage && (
                  <p className="mt-2 text-xs text-emerald-300">
                    {singleMessage}
                  </p>
                )}
              </div>
            </div>

            {/* --- UPDATED: CSV Uploader --- */}
            <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-6">
              <h2 className="text-lg font-semibold">Option 2: Upload CSV File</h2>
              <p className="mt-2 text-xs text-gray-400">
                1. Download our template to see all required columns (including authenticity fields).
              </p>
               <a
                  href="/api/seller/bulk-template"
                  className="mt-2 inline-block rounded-full bg-white px-3 py-1.5 text-xs font-medium text-black hover:bg-gray-100"
                >
                  Download CSV template
                </a>
              <p className="mt-4 text-xs text-gray-400">
                2. Upload your completed CSV here. All items will be submitted for review.
              </p>
              <label className="mt-2 flex cursor-pointer flex-col items-center justify-center rounded-lg border border-neutral-700 bg-black/40 px-4 py-10 text-center text-xs text-neutral-400 hover:border-neutral-500">
                <span className="mb-2 text-sm text-gray-100">
                  Drop CSV here or click to browse
                </span>
                <span className="text-[11px]">
                  We'll parse it and highlight any rows that need fixes.
                </span>
                <input
                  type="file"
                  accept=".csv, text/csv"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>

              {fileName && !loading && !error && (
                <p className="mt-3 text-xs text-gray-400">
                  Selected file: <span className="font-medium">{fileName}</span>
                </p>
              )}

              {loading && (
                <p className="mt-3 text-xs text-gray-400">
                  Parsing file, please wait…
                </p>
              )}
              {error && !loading && (
                <p className="mt-3 text-xs text-red-400">{error}</p>
              )}
            </div>
          </section>
        )}

        {/* --- UPDATED: Step 2 Review Table --- */}
        {step === 2 && (
          <section className="mt-8 rounded-xl border border-neutral-800 bg-neutral-950 p-6">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-semibold">
                  Review Detected Rows
                </h2>
                <p className="text-xs text-gray-400">
                  Only rows marked as <strong>Ready</strong> (all required fields present) will be created.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setRows([]);
                  setFileName(null);
                }}
                className="self-start rounded-full border border-neutral-700 px-3 py-1 text-xs hover:border-neutral-500"
              >
                Choose a different file
              </button>
            </div>

            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[640px] text-xs">
                <thead className="border-b border-neutral-800 text-[11px] uppercase tracking-wide text-gray-400">
                  <tr>
                    <th className="py-2 pr-3 text-left">Title</th>
                    <th className="px-3 py-2 text-left">Price (USD)</th>
                    <th className="px-3 py-2 text-left">Serial #</th>
                    <th className="px-3 py-2 text-left">Proof Source</th>
                    <th className="px-3 py-2 text-left">Proof Type</th>
                    <th className="px-3 py-2 text-left">Confirmed</th>
                    <th className="px-3 py-2 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && ( <tr><td colSpan={7} className="py-4 text-center text-xs text-gray-400">Loading...</td></tr> )}
                  {!loading && error && ( <tr><td colSpan={7} className="py-4 text-center text-xs text-red-400">{error}</td></tr> )}
                  {!loading && !error && rows.length === 0 && ( <tr><td colSpan={7} className="py-4 text-center text-xs text-gray-400">No rows detected.</td></tr> )}

                  {!loading &&
                    !error &&
                    rows.map((row) => (
                      <tr
                        key={row.id}
                        className="border-b border-neutral-900 last:border-0"
                      >
                        <td className="py-2 pr-3">{row.title}</td>
                        <td className="px-3 py-2">{row.price}</td>
                        <td className="px-3 py-2">{row.serial_number}</td>
                        <td className="px-3 py-2">{row.purchase_source}</td>
                        <td className="px-3 py-2">{row.purchase_proof}</td>
                        <td className="px-3 py-2">{row.authenticity_confirmed ? "YES" : "NO"}</td>
                        <td className="px-3 py-2">
                          {row.status === "ready" && (
                            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] text-emerald-300">
                              Ready
                            </span>
                          )}
                          {row.status === "missing" && (
                            <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-[11px] text-red-300">
                              Missing Fields
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            <div className="mt-5 flex flex-col gap-3 border-t border-neutral-800 pt-4 text-xs text-gray-400 md:flex-row md:items-center md:justify-between">
              <p>
                We will create listings only for rows marked as Ready.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setRows([]);
                    setFileName(null);
                  }}
                  className="rounded-full border border-neutral-700 px-3 py-1.5 text-xs hover:border-neutral-500"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-black hover:bg-gray-100 disabled:opacity-60"
                  disabled={committing || !rows.filter(r => r.status === 'ready').length}
                >
                  {committing ? "Submitting..." : `Submit ${rows.filter(r => r.status === 'ready').length} listings`}
                </button>
              </div>
            </div>
          </section>
        )}

        {/* STEP 3 (Unchanged) */}
        {step === 3 && (
          <section className="mt-8 rounded-xl border border-neutral-800 bg-neutral-950 p-6 text-sm">
            <h2 className="text-base font-semibold">Listings Submitted</h2>
            <p className="mt-2 text-sm text-gray-300">
              Your listings have been submitted for review. You can track their
              status in your catalogue.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Link
                href="/seller/catalogue"
                className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-black hover:bg-gray-100"
              >
                Go to my catalogue
              </Link>
              <Link
                href="/seller/dashboard"
                className="rounded-full border border-neutral-700 px-3 py-1.5 text-xs hover:border-neutral-500"
              >
                Back to seller dashboard
              </Link>
            </div>
          </section>
        )}

        {error && step === 3 && (
          <p className="mt-3 text-xs text-red-400">{error}</p>
        )}
      </main>

      <Footer />
    </div>
  );
}
