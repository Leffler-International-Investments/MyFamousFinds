// FILE: /pages/seller/bulk-upload.tsx
import Head from "next/head";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import {
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
  imageUrls?: string[]; // <-- UPDATED
  status: "ready" | "missing" | "error";
};

// --- ADDED: Lists for dropdowns ---
const TOP_BRANDS = [
  "Prada",
  "Gucci",
  "Chanel",
  "Rolex",
  "Hermès",
  "Louis Vuitton",
  "Dior",
  "Cartier",
  "Fendi",
  "Saint Laurent",
  "Other"
];

const CATEGORIES = [
  "Bags",
  "Watches",
  "Kids",
  "Clothing",
  "Jewelry",
  "Home",
  "Shoes",
  "Men",
  "Beauty",
  "Accessories",
  "Women",
  "Sale",
];
// ---------------------------------

export default function SellerBulkUpload() {
  const [fileName, setFileName] = useState<string | null>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [rows, setRows] = useState<UploadRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [committing, setCommitting] = useState(false);

  // Quick single-listing state (no CSV required)
  const [singleTitle, setSingleTitle] = useState("");
  const [singleBrand, setSingleBrand] = useState("");
  const [singleCategory, setSingleCategory] = useState("");
  const [singlePrice, setSinglePrice] = useState("");
  const [singleBusy, setSingleBusy] = useState(false);
  const [singleMessage, setSingleMessage] = useState<string | null>(null);
  const [singleError, setSingleError] = useState<string | null>(null);

  // --- UPDATED: Image state for MULTIPLE images ---
  const [singleImageFiles, setSingleImageFiles] = useState<File[]>([]);
  const [singleImagePreviews, setSingleImagePreviews] = useState<string[]>([]);
  const [singleUploadingImage, setSingleUploadingImage] = useState(false);


  // ---------------- CSV BULK UPLOAD ----------------
  // (Your existing CSV logic is unchanged)
  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
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

      const parsed = (json.rows || []).map((r: any, idx: number) => {
        const price = String(r.price ?? "").trim();
        let status: UploadRow["status"] = "ready";
        if (!price) status = "missing";
        return {
          id: String(r.id ?? idx + 1),
          title: String(r.title || "Untitled"),
          brand: String(r.brand || ""),
          price,
          category: String(r.category || ""),
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
      alert("There are no rows marked as ready.");
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
  // ----------------------------------------------------

  // ---------------- SINGLE LISTING + IMAGE ----------------

  // --- UPDATED: Handle multiple files ---
  function handleSingleImageSelect(files: FileList | null) {
    if (!files || files.length === 0) {
      setSingleImageFiles([]);
      setSingleImagePreviews([]);
      return;
    }
    
    const newFiles = Array.from(files);
    setSingleImageFiles(newFiles);
    
    const newPreviews = newFiles.map(file => URL.createObjectURL(file));
    setSingleImagePreviews(newPreviews);
  }

  const handleSingleImageInputChange = (
    e: ChangeEvent<HTMLInputElement>
  ) => {
    const files = e.target.files;
    setSingleError(null);
    if (files) {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) {
          setSingleError("Please choose image files (jpg, png, etc.)");
          return;
        }
      }
    }
    handleSingleImageSelect(files);
  };

  const handleSingleImageDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    setSingleError(null);
    if (files) {
       for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) {
          setSingleError("Please drop image files (jpg, png, etc.)");
          return;
        }
      }
    }
    handleSingleImageSelect(files);
  };

  const handleSingleImageDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  // --- UPDATED: Upload MULTIPLE images ---
  async function uploadSingleImagesIfNeeded(
    timeoutMs = 60000 // Increased timeout
  ): Promise<string[] | null> {
    if (singleImageFiles.length === 0) return null;

    setSingleUploadingImage(true);
    try {
      // Create an array of upload promises
      const uploadPromises = singleImageFiles.map(file => {
        return new Promise<string>(async (resolve, reject) => {
          const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
          const path = `listing-images/${uuidv4()}-${safeName}`;
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

      // Add a timeout for the entire batch
      const timeoutPromise = new Promise<never>((_, reject) => {
        const err: any = new Error(
          "Image upload timed out before Firebase responded."
        );
        err.code = "local/timeout";
        setTimeout(() => reject(err), timeoutMs);
      });

      // Wait for all uploads to finish or for the timeout
      const urls = await Promise.race([Promise.all(uploadPromises), timeoutPromise]);
      return urls as string[];

    } catch (err: any) {
      console.error("Image upload failed:", err);
      if (err.code === "storage/unauthorized") {
        throw new Error("Image upload failed: Permission denied. Check your Firebase Storage rules.");
      }
      throw new Error("One or more image uploads failed. Please try again.");
    } finally {
      setSingleUploadingImage(false);
    }
  }


  // Quick single listing without CSV
  const handleSingleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSingleError(null);
    setSingleMessage(null);

    if (!singleTitle.trim() || !singlePrice.trim()) {
      setSingleError("Title and price are required.");
      return;
    }
    
    // --- ADDED: Check if brand/category are selected ---
    if (!singleBrand) {
      setSingleError("Please select a brand.");
      return;
    }
    if (!singleCategory) {
      setSingleError("Please select a category.");
      return;
    }
    // --------------------------------------------------

    setSingleBusy(true);

    try {
      // 1) Try to upload the image(s)
      let imageUrls: string[] | null = null; // <-- UPDATED

      if (singleImageFiles.length > 0) { // <-- UPDATED
        try {
          imageUrls = await uploadSingleImagesIfNeeded(); // <-- UPDATED
        } catch (err: any) {
          console.error("single_image_upload_error", err);
          const code = err?.code;
          const msg = String(err?.message || "").toLowerCase();

          if (
            code === "storage/retry-limit-exceeded" ||
            code === "local/timeout" ||
            msg.includes("retry time for operation exceeded")
          ) {
            setSingleError(
              "The photo upload took too long. The listing will be created without a photo—you can add it later from your catalogue."
            );
          } else if (code === "storage/unauthorized") {
            setSingleError(
              "Image upload failed: permission denied. The listing will be created without a photo. Check your Firebase Storage rules."
            );
          } else {
            setSingleError(
              "We couldn't upload the photo. The listing will be created without a photo."
            );
          }

          // Soft-fail: continue with no image
          imageUrls = null;
        }
      }

      // 2) Create the listing via bulk-commit
      const row: UploadRow = {
        id: "manual-" + Date.now(),
        title: singleTitle.trim(),
        brand: singleBrand.trim(),
        category: singleCategory.trim(),
        price: singlePrice.trim(),
        imageUrls: imageUrls || undefined, // <-- UPDATED
        status: "ready",
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

      // Success
      setSingleTitle("");
      setSingleBrand("");
      setSingleCategory("");
      setSinglePrice("");
      handleSingleImageSelect(null); // <-- UPDATED

      setSingleMessage(
        imageUrls
          ? `Listing created with ${imageUrls.length} image(s).` // <-- UPDATED
          : "Listing created (without photo). You can add a photo later from your catalogue."
      );
    } catch (err: any) {
      console.error("single_listing_error", err);
      setSingleError(
        err?.message || "Unable to create listing. Please try again."
      );
    } finally {
      // Always clear both flags so the UI never stays stuck
      setSingleBusy(false);
      setSingleUploadingImage(false);
    }
  };

  const singleDisabled = singleBusy || singleUploadingImage;
  
  // Style for the dropdowns
  const selectInputStyle = "mt-1 w-full rounded-md border border-neutral-700 bg-black/40 px-3 py-2 text-xs text-gray-100 focus:border-gray-200 focus:outline-none";


  // ---------------- RENDER ----------------

  return (
    <div className="min-h-screen bg-black text-gray-100">
      <Head>
        <title>Seller — Bulk Upload | Famous Finds</title>
      </Head>

      <Header />

      <main className="mx-auto max-w-5xl px-4 pb-16 pt-6 text-sm">
        <Link
          href="/seller/dashboard"
          className="text-xs text-gray-400 hover:text-gray-200"
        >
          ← Back to Dashboard
        </Link>

        <h1 className="mt-4 text-2xl font-semibold text-white">
          Bulk upload listings
        </h1>
        <p className="mt-1 text-sm text-gray-400">
          Upload a spreadsheet to create many listings at once, or use the
          quick form below to create a single listing. Each listing is created
          as a draft or pending review before going live.
        </p>

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
            <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-6">
              <h2 className="text-sm font-semibold">1. CSV structure</h2>
              <p className="mt-2 text-xs text-gray-400">
                The parser expects columns like <code>title</code>,{" "}
                <code>brand</code>, <code>category</code>, <code>price</code>,
                etc. Download the template for the exact column names and
                export your spreadsheet as CSV.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <a
                  href="/api/seller/bulk-template"
                  className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-black hover:bg-gray-100"
                >
                  Download CSV template
                </a>
              </div>

              {/* Quick single listing form */}
              <div className="mt-8 border-t border-neutral-800 pt-5">
                <h3 className="text-sm font-semibold">
                  Or add a single listing (no CSV)
                </h3>
                <p className="mt-1 text-xs text-gray-400">
                  Use this form to add one item with multiple photos. {/* <-- UPDATED TEXT */}
                </p>

                <form
                  onSubmit={handleSingleSubmit}
                  className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2"
                >
                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-medium text-gray-300">
                      Title *
                    </label>
                    <input
                      type="text"
                      value={singleTitle}
                      onChange={(e) => setSingleTitle(e.target.value)}
                      className="mt-1 w-full rounded-md border border-neutral-700 bg-black/40 px-3 py-2 text-xs text-gray-100 focus:border-gray-200 focus:outline-none"
                    />
                  </div>
                  
                  {/* --- Brand Dropdown (Unchanged) --- */}
                  <div>
                    <label className="block text-[11px] font-medium text-gray-300">
                      Brand *
                    </label>
                    <select
                      value={singleBrand}
                      onChange={(e) => setSingleBrand(e.target.value)}
                      className={selectInputStyle}
                    >
                      <option value="">Select a brand</option>
                      {TOP_BRANDS.map((brand) => (
                        <option key={brand} value={brand}>{brand}</option>
                      ))}
                    </select>
                  </div>
                  
                  {/* --- Category Dropdown (Unchanged) --- */}
                  <div>
                    <label className="block text-[11px] font-medium text-gray-300">
                      Category *
                    </label>
                    <select
                      value={singleCategory}
                      onChange={(e) => setSingleCategory(e.target.value)}
                      className={selectInputStyle}
                    >
                      <option value="">Select a category</option>
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-gray-300">
                      Price (USD) * {/* <-- UPDATED CURRENCY */}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={singlePrice}
                      onChange={(e) => setSinglePrice(e.target.value)}
                      className="mt-1 w-full rounded-md border border-neutral-700 bg-black/40 px-3 py-2 text-xs text-gray-100 focus:border-gray-200 focus:outline-none"
                    />
                  </div>

                  {/* --- UPDATED: Image drop / upload for MULTIPLE --- */}
                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-medium text-gray-300">
                      Photos (optional)
                    </label>
                    <div
                      onDragOver={handleSingleImageDragOver}
                      onDrop={handleSingleImageDrop}
                      className="mt-1 flex flex-col items-center justify-center rounded-md border border-dashed border-neutral-700 bg-black/40 px-3 py-4 text-center text-[11px] text-gray-400"
                    >
                      <p className="mb-1">
                        Drag &amp; drop images here, or click to browse.
                      </p>
                      <label className="cursor-pointer rounded-full border border-neutral-600 px-3 py-1 text-[11px] hover:border-neutral-400">
                        Choose files
                        <input
                          type="file"
                          accept="image/*"
                          multiple // <-- UPDATED
                          className="hidden"
                          onChange={handleSingleImageInputChange}
                        />
                      </label>
                      {singleUploadingImage && (
                        <p className="mt-2 text-[11px] text-gray-300">
                          Uploading {singleImageFiles.length} image(s)…
                        </p>
                      )}
                      {/* --- UPDATED: Show multiple previews --- */}
                      {singleImagePreviews.length > 0 && (
                        <div className="mt-3 flex flex-wrap justify-center gap-2">
                          {singleImagePreviews.map((previewUrl, i) => (
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

                  <div className="flex items-end">
                    <button
                      type="submit"
                      disabled={singleDisabled}
                      className="rounded-full bg-white px-4 py-2 text-xs font-medium text-black hover:bg-gray-100 disabled:opacity-60"
                    >
                      {singleDisabled ? "Creating…" : "Create listing"}
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

            {/* CSV Dropzone (Unchanged) */}
            <div className="rounded-xl border border-dashed border-neutral-700 bg-neutral-950/60 p-6">
              <h2 className="text-sm font-semibold">2. Upload your file</h2>
              <p className="mt-2 text-xs text-gray-400">
                CSV file exported from Excel/Sheets, up to 5,000 rows.
              </p>

              <label className="mt-5 flex cursor-pointer flex-col items-center justify-center rounded-lg border border-neutral-700 bg-black/40 px-4 py-10 text-center text-xs text-neutral-400 hover:border-neutral-500">
                <span className="mb-2 text-sm text-gray-100">
                  Drop CSV here or click to browse
                </span>
                <span className="text-[11px]">
                  We&apos;ll parse it and highlight any rows that need fixes.
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

        {/* STEP 2 (Unchanged) */}
        {step === 2 && (
          <section className="mt-8 rounded-xl border border-neutral-800 bg-neutral-950 p-6">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-sm font-semibold">
                  Review detected rows
                </h2>
                <p className="text-xs text-gray-400">
                  Only rows marked as <strong>Ready</strong> will be created.
                  You can cancel and upload a corrected file at any time.
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
                    <th className="px-3 py-2 text-left">Brand</th>
                    <th className="px-3 py-2 text-left">Category</th>
                    <th className="px-3 py-2 text-left">Price (USD)</th>
                    <th className="px-3 py-2 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <tr>
                      <td
                        className="py-4 text-center text-xs text-gray-400"
                        colSpan={5}
                      >
                        Parsing file…
                      </td>
                    </tr>
                  )}

                  {!loading && error && (
                    <tr>
                      <td
                        className="py-4 text-center text-xs text-red-400"
                        colSpan={5}
                      >
                        {error}
                      </td>
                    </tr>
                  )}

                  {!loading && !error && rows.length === 0 && (
                    <tr>
                      <td
                        className="py-4 text-center text-xs text-gray-400"
                        colSpan={5}
                      >
                        No rows detected in this file.
                      </td>
                    </tr>
                  )}

                  {!loading &&
                    !error &&
                    rows.map((row) => (
                      <tr
                        key={row.id}
                        className="border-b border-neutral-900 last:border-0"
                      >
                        <td className="py-2 pr-3">{row.title}</td>
                        <td className="px-3 py-2">{row.brand}</td>
                        <td className="px-3 py-2">{row.category}</td>
                        <td className="px-3 py-2">
                          {row.price || (
                            <span className="text-amber-300">Missing</span>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          {row.status === "ready" && (
                            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] text-emerald-300">
                              Ready
                            </span>
                          )}
                          {row.status === "missing" && (
                            <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] text-amber-300">
                              Needs price
                            </span>
                          )}
                          {row.status === "error" && (
                            <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-[11px] text-red-300">
                              Error
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
                We will create listings only for rows marked as Ready. You can
                re-upload a corrected file whenever you need.
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
                  disabled={committing || !rows.length}
                >
                  {committing ? "Creating listings…" : "Create listings"}
                </button>
              </div>
            </div>
          </section>
        )}

        {/* STEP 3 (Unchanged) */}
        {step === 3 && (
          <section className="mt-8 rounded-xl border border-neutral-800 bg-neutral-950 p-6 text-sm">
            <h2 className="text-base font-semibold">Listings created</h2>
            <p className="mt-2 text-sm text-gray-300">
              Your file has been processed and draft listings have been created
              in your catalogue. Items may still require review before going
              live.
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
