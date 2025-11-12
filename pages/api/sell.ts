import Head from "next/head";
import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { FormEvent, useState, useEffect } from "react";
import firebaseApp from "../utils/firebaseClient";
import { getFirestore, collection, getDocs } from "firebase/firestore";

const db = getFirestore(firebaseApp);

type Designer = {
  id: string;
  name: string;
  isTop?: boolean;
  isUpcoming?: boolean;
  active?: boolean;
};

export default function Sell() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [designers, setDesigners] = useState<Designer[]>([]);
  const [loadingDesigners, setLoadingDesigners] = useState(true);
  const [designerError, setDesignerError] = useState<string | null>(null);

  useEffect(() => {
    const fetchClient = async (): Promise<Designer[] | null> => {
      try {
        const snap = await getDocs(collection(db, "designers"));
        const list: Designer[] = [];
        snap.forEach((docSnap) => {
          const data = docSnap.data() as any;
            if (!data) return;
            if (data.active === false) return;
            list.push({
              id: docSnap.id,
              name: data.name || "",
              isTop: !!data.isTop,
              isUpcoming: !!data.isUpcoming,
              active: data.active !== false,
            });
        });
        list.sort((a, b) => {
          if (a.isTop && !b.isTop) return -1;
          if (!a.isTop && b.isTop) return 1;
          return a.name.localeCompare(b.name);
        });
        return list;
      } catch {
        return null;
      }
    };

    const fetchFallback = async (): Promise<Designer[] | null> => {
      try {
        const res = await fetch("/api/designers");
        if (!res.ok) return null;
        const json = await res.json();
        if (!json?.ok) return null;
        const list: Designer[] = (json.items || []).filter((d: any) => d?.name);
        list.sort((a, b) => {
          if (a.isTop && !b.isTop) return -1;
          if (!a.isTop && b.isTop) return 1;
          return a.name.localeCompare(b.name);
        });
        return list;
      } catch {
        return null;
      }
    };

    (async () => {
      setLoadingDesigners(true);
      setDesignerError(null);
      const clientList = await fetchClient();
      if (clientList && clientList.length) {
        setDesigners(clientList);
        setLoadingDesigners(false);
        return;
      }
      const apiList = await fetchFallback();
      if (apiList && apiList.length) {
        setDesigners(apiList);
        setLoadingDesigners(false);
        return;
      }
      setDesignerError(
        "Unable to load approved designers. You can still request a new designer below."
      );
      setLoadingDesigners(false);
    })();
  }, []);

  async function uploadImageIfNeeded(formData: FormData): Promise<string | null> {
    const file = formData.get("image_file");
    if (!file || !(file instanceof File) || !file.size) return null;

    setUploadingImage(true);
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `listing-images/${Date.now()}-${safeName}`;
      const { getStorage, ref, uploadBytes, getDownloadURL } = await import("firebase/storage");
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
    const selectedDesignerId = (formData.get("brand_select") || "").toString().trim();
    const requestedDesigner = (formData.get("brand_request") || "").toString().trim();

    if (!selectedDesignerId && !requestedDesigner) {
      alert("Please select an approved designer from the list or request a new designer.");
      return;
    }

    let brandName = requestedDesigner;
    if (selectedDesignerId) {
      const match = designers.find((d) => d.id === selectedDesignerId);
      brandName = match?.name || brandName;
      formData.set("designer_id", selectedDesignerId);
      if (match?.isTop) formData.set("designer_is_top", "true");
    }
    formData.set("brand", brandName || "");

    if (requestedDesigner) {
      formData.set("designer_request", requestedDesigner);
      const requestReason = (formData.get("designer_request_reason") || "").toString().trim();
      if (requestReason) formData.set("designer_request_reason", requestReason);
    }
    // --- END BRAND / DESIGNER LOGIC ---

    setSubmitting(true);
    try {
      const imageUrl = await uploadImageIfNeeded(formData);
      if (imageUrl) formData.set("image_url", imageUrl);

      const res = await fetch("/api/sell", { method: "POST", body: formData });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json?.error || "Something went wrong");

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
    if (!file) return setImagePreview(null);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="dark-theme-page">
      <Head><title>Sell on Famous Finds</title></Head>
      <Header />
      <main className="section">
        <div className="section-header">
          <div>
            <h1>Sell your luxury items</h1>
            <p style={{ opacity: 0.8, marginTop: 4 }}>
              Submit a high–level description. A member of our team will follow up to help you create a full listing.
            </p>
          </div>
          <Link href="/" className="cta">← Back to browsing</Link>
        </div>

        <div className="sell-grid">
          <section className="sell-card">
            <h2>Tell us about your item</h2>
            <p className="muted">Include brand, model, condition, original purchase details, and any flaws. Prices are in USD.</p>

            <form onSubmit={onSubmit} className="sell-form">
              <label> Your name
                <input name="name" type="text" placeholder="First and last name" required />
              </label>

              <label> Email
                <input name="email" type="email" placeholder="you@example.com" required />
              </label>

              {/* BRAND / DESIGNER DROPDOWN */}
              <label> Brand / Designer
                {loadingDesigners ? (
                  <div className="dropdown-help">Loading approved designers…</div>
                ) : (
                  <select name="brand_select" defaultValue="" disabled={!designers.length}>
                    <option value="">Select an approved designer from the directory…</option>
                    {designers.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}{d.isTop ? " (Top)" : d.isUpcoming ? " (Upcoming)" : ""}
                      </option>
                    ))}
                  </select>
                )}
                {designerError && <div className="field-warning">{designerError}</div>}
                <div className="dropdown-help">
                  Famous-Finds only accepts approved designers. Select from the list or request a new designer below.
                </div>
              </label>

              <label> Request a new designer (if not listed)
                <input name="brand_request" type="text" placeholder="e.g. Dan Trousers" />
                <span className="file-help">If your designer is not in the list, type the name here and our management team will review it.</span>
              </label>

              <label> Notes to management about this designer (optional)
                <textarea name="designer_request_reason" rows={3}
                  placeholder="Tell us why this designer should be accepted (reputation, where it sells, price level, etc.)" />
              </label>
              {/* END DESIGNER BLOCK */}

              <label> Item name / model
                <input name="title" type="text" placeholder="e.g. Classic Flap Bag, Speedy 30" required />
              </label>

              <label> Condition
                <input name="condition" type="text" placeholder="e.g. New with tags, Gently used" required />
              </label>

              <label> Size (if applicable)
                <input name="size" type="text" placeholder="e.g. EU 39, Medium, 36mm" />
              </label>

              <label> Color / material
                <input name="color" type="text" placeholder="e.g. Black caviar leather, Gold hardware" />
              </label>

              <label> Desired price (USD)
                <input name="price" type="number" placeholder="Price (USD)" required />
              </label>

              <label> Serial Number (if applicable)
                <input name="serial_number" type="text" placeholder="e.g. 12345-ABCD" />
              </label>

              <label className="file-label">
                <span>Item photo</span>
                <input type="file" name="image_file" accept="image/*" onChange={handleImageFileChange} />
                <span className="file-help">Optional, but strongly recommended. JPEG or PNG.</span>
              </label>

              <label className="file-label">
                <span>Proof of Purchase (Optional)</span>
                <input name="purchase_proof" type="text" placeholder="e.g. Original receipt, PDF invoice, Bank statement" />
                <span className="file-help">Helps speed up authentication.</span>
              </label>

              {imagePreview && (
                <div className="image-preview">
                  <span>Preview</span>
                  <img src={imagePreview} alt="Preview" />
                </div>
              )}

              <label> Additional details
                <textarea name="details" rows={4}
                  placeholder="Tell us more about the item, original purchase location, proof of authenticity, packaging, etc." />
              </label>

              <div className="seller-responsibility">
                <strong>Seller's Responsibility</strong>
                <p>By submitting this item, you declare, under penalty of law, that this item is <strong>authentic</strong> and that all details provided are true and accurate.</p>
                <p>As a seller on this peer-to-peer platform, you are solely responsible for any and all claims, damages, or liabilities arising from the sale of your item, including any claims of non-authenticity.</p>
              </div>

              <button type="submit" disabled={submitting || uploadingImage}>
                {submitting ? "Submitting…" : uploadingImage ? "Uploading image…" : "Submit for review"}
              </button>

              {submitted && (
                <p className="banner success">
                  Thank you! We&apos;ve received your submission in USD. A team member will be in touch.
                </p>
              )}
            </form>

            <p className="note">By submitting, you confirm that the item is authentic and that you agree to Famous Finds&apos; terms.</p>
          </section>

          <aside className="sell-aside">
            <div className="sell-card">
              <h3>How it works</h3>
              <ol>
                <li>Tell us about your item and upload a photo.</li>
                <li>Our team reviews the details and may ask follow–up.</li>
                <li>If approved, we help you create a polished listing in USD.</li>
                <li>Once it sells and is delivered, you get paid via secure payout.</li>
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
        .sell-grid{display:grid;grid-template-columns:minmax(0,2fr) minmax(0,1.3fr);gap:24px;}
        @media (max-width:900px){.sell-grid{grid-template-columns:minmax(0,1fr);}}
        .sell-card{background:#111827;border-radius:16px;padding:18px 18px 20px;border:1px solid #1f2937;}
        .sell-card h2,.sell-card h3{margin:0 0 6px;font-size:18px;}
        .sell-card p{margin:0 0 8px;font-size:14px;line-height:1.4;}
        .muted{color:#9ca3af;font-size:13px;}
        .sell-form{margin-top:14px;display:flex;flex-direction:column;gap:10px;}
        label{display:flex;flex-direction:column;gap:4px;font-size:13px;}
        input,textarea,select{background:#020617;border-radius:8px;border:1px solid #374151;padding:8px 10px;color:#e5e7eb;font-size:14px;}
        input::placeholder,textarea::placeholder{color:#6b7280;}
        textarea{resize:vertical;}
        select{cursor:pointer;}
        .file-label{margin-top:4px;}
        .file-help{font-size:12px;color:#9ca3af;}
        .dropdown-help{font-size:12px;color:#9ca3af;margin-top:2px;}
        .field-warning{margin-top:4px;font-size:12px;color:#fbbf24;}
        .image-preview{margin-top:8px;border:1px dashed #374151;padding:8px;border-radius:8px;font-size:12px;color:#d1d5db;}
        .image-preview span{display:block;margin-bottom:4px;}
        .image-preview img{max-width:200px;border-radius:8px;border:1px solid #374151;}
        button{margin-top:10px;background:white;color:black;border:none;padding:10px 16px;border-radius:8px;font-weight:600;cursor:pointer;}
        button[disabled]{opacity:.7;cursor:default;}
        .sell-aside{display:flex;flex-direction:column;gap:16px;}
        .sell-aside ol,.sell-aside ul{padding-left:18px;margin:6px 0 0;font-size:13px;color:#e5e7eb;}
        .banner{margin-top:12px;padding:8px 10px;border-radius:6px;font-size:13px;}
        .success{background:#065f46;color:#d1fae5;}
        .note{margin-top:16px;font-size:12px;color:#9ca3af;}
        .seller-responsibility{margin-top:12px;padding:12px;border-radius:8px;border:1px solid #ca8a04;background:#422006;font-size:12px;color:#fef08a;line-height:1.5;}
        .seller-responsibility strong{color:#fef9c3;display:block;margin-bottom:4px;}
        .seller-responsibility p{font-size:12px;margin-bottom:8px;}
        .seller-responsibility p:last-child{margin-bottom:0;}
      `}</style>
    </div>
  );
}
