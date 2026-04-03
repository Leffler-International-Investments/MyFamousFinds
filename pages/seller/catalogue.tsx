// FILE: /pages/seller/catalogue.tsx

import Head from "next/head";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useEffect, useRef, useState } from "react";
import { useRequireSeller } from "../../hooks/useRequireSeller";
import { sellerFetch } from "../../utils/sellerClient";

// NEW: use client Firestore to toggle allowOffers
import { db } from "../../utils/firebaseClient";
import { doc, updateDoc } from "firebase/firestore";

type CatalogueItem = {
  id: string;
  title: string;
  price: number;
  status: string;
  purchase_proof: string;
  proof_doc_url: string;
  details: string;
  allowOffers?: boolean;
  rejectionReason?: string;
};

export default function SellerCatalogue() {
  const { loading: authLoading } = useRequireSeller();

  const [items, setItems] = useState<CatalogueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [proofModal, setProofModal] = useState<CatalogueItem | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await sellerFetch("/api/seller/listings");
        const json = await res.json();
        if (!json.ok) {
          throw new Error(json.error || "Failed to load catalogue");
        }
        if (!cancelled) {
          setItems(json.items || []);
        }
      } catch (err: any) {
        console.error(err);
        if (!cancelled) {
          setError(err?.message || "Unable to load catalogue.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleDelete = async (id: string) => {
    if (deletingId) return;
    if (
      !window.confirm("Are you sure you want to permanently delete this listing?")
    ) {
      return;
    }
    setDeletingId(id);
    setError(null);
    try {
      const res = await sellerFetch(`/api/seller/listings/${id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to delete item");
      }
      setItems((prevItems) => prevItems.filter((item) => item.id !== id));
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  // TOGGLE "MAKE AN OFFER" USING FIRESTORE DIRECTLY
  const handleToggleOffers = async (item: CatalogueItem) => {
    if (togglingId) return;

    const current = !!item.allowOffers;
    setTogglingId(item.id);
    setError(null);

    try {
      const ref = doc(db, "listings", item.id);
      await updateDoc(ref, { allowOffers: !current });

      // update local UI state
      setItems((prev) =>
        prev.map((x) =>
          x.id === item.id ? { ...x, allowOffers: !current } : x
        )
      );
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Unable to update offer setting.");
    } finally {
      setTogglingId(null);
    }
  };

  // ---- Proof document upload ----
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const handleProofUpload = async (item: CatalogueItem, file: File) => {
    if (uploadingId) return;

    const allowed = ["image/jpeg", "image/png", "image/jpg", "image/webp", "application/pdf"];
    if (!allowed.includes(file.type)) {
      setError("Please upload a JPG, PNG, or PDF file.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("File too large. Maximum size is 10 MB.");
      return;
    }

    setUploadingId(item.id);
    setError(null);
    setUploadSuccess(null);

    try {
      // Read file as data URL
      const dataUrl: string = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () =>
          resolve(typeof reader.result === "string" ? reader.result : "");
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Upload via proof-upload API
      const res = await sellerFetch("/api/seller/proof-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId: item.id,
          proofType: "other",
          proofUrl: dataUrl,
          proofDescription: file.name,
          purchaseSource: item.purchase_proof || "",
        }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || "Upload failed");

      // Update local state to show the new doc immediately
      setItems((prev) =>
        prev.map((x) =>
          x.id === item.id
            ? { ...x, proof_doc_url: dataUrl, purchase_proof: x.purchase_proof === "Requested" ? "Submitted" : x.purchase_proof }
            : x
        )
      );
      setUploadSuccess(item.id);
      setTimeout(() => setUploadSuccess(null), 3000);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Failed to upload proof document.");
    } finally {
      setUploadingId(null);
      const input = fileInputRefs.current[item.id];
      if (input) input.value = "";
    }
  };

  // ---- Listing photo re-upload (for "Bad photo" rejections) ----
  const [photoUploadingId, setPhotoUploadingId] = useState<string | null>(null);
  const [photoUploadSuccess, setPhotoUploadSuccess] = useState<string | null>(null);
  const photoInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const handlePhotoReupload = async (item: CatalogueItem, file: File) => {
    if (photoUploadingId) return;

    const allowed = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
    if (!allowed.includes(file.type)) {
      setError("Please upload a JPG, PNG, or WebP image.");
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      setError("File too large. Maximum size is 25 MB.");
      return;
    }

    setPhotoUploadingId(item.id);
    setError(null);
    setPhotoUploadSuccess(null);

    try {
      const formData = new FormData();
      formData.append("image", file);

      const uploadRes = await fetch("/api/seller/upload-with-processing", {
        method: "POST",
        body: formData,
      });
      const uploadJson = await uploadRes.json();
      if (!uploadJson.ok) throw new Error(uploadJson.error || "Photo upload failed");

      // Update listing in Firestore with new photo and reset to Pending
      const ref = doc(db, "listings", item.id);
      await updateDoc(ref, {
        imageUrl: uploadJson.imageUrl,
        displayImageUrl: uploadJson.displayImageUrl,
        status: "Pending",
        rejectionReason: null,
        rejectedAt: null,
      });

      // Update local state
      setItems((prev) =>
        prev.map((x) =>
          x.id === item.id
            ? { ...x, status: "Pending", rejectionReason: undefined }
            : x
        )
      );
      setPhotoUploadSuccess(item.id);
      setTimeout(() => setPhotoUploadSuccess(null), 3000);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Failed to upload new photo.");
    } finally {
      const input = photoInputRefs.current[item.id];
      if (input) input.value = "";
      setPhotoUploadingId(null);
    }
  };

  if (authLoading) {
    return <div className="dark-theme-page"></div>;
  }

  return (
    <div className="dark-theme-page">
      <Head>
        <title>My Listings - Famous Finds</title>
      </Head>

      <Header />

      <main className="section">
        <div className="section-header">
          <div>
            <h1>My Listings</h1>
            <p style={{ opacity: 0.8, marginTop: 4 }}>
              Live view of all listings under your seller account.
            </p>
          </div>
          <Link href="/seller/dashboard" className="cta">
            ← Back to Dashboard
          </Link>
        </div>

        <div className="actions-bar">
          <Link href="/seller/bulk-upload" className="btn-secondary">
            Bulk upload CSV
          </Link>
          <Link href="/seller/bulk-simple" className="btn-primary">
            Add single item
          </Link>
        </div>

        {error && <p className="banner error">{error}</p>}

        {/* DESKTOP TABLE VIEW */}
        <section className="sell-card desktop-table">
          <div className="table-overflow-wrapper">
            <table className="catalogue-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th>Details</th>
                  <th>Proof</th>
                  <th>Proof Doc</th>
                  <th>Make an offer</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={8} className="table-message">
                      Loading your listings…
                    </td>
                  </tr>
                )}

                {!loading && !error && items.length === 0 && (
                  <tr>
                    <td colSpan={8} className="table-message">
                      You don&apos;t have any listings yet.
                    </td>
                  </tr>
                )}

                {!loading &&
                  !error &&
                  items.map((x) => {
                    const offersOn = !!x.allowOffers;
                    return (
                      <tr key={x.id} id={`listing-${x.id}`}>
                        <td>{x.title}</td>
                        <td>
                          US$
                          {x.price.toLocaleString("en-US", {
                            maximumFractionDigits: 0,
                          })}
                        </td>
                        <td>
                          <span className={x.status === "Rejected" ? "status-rejected" : ""}>
                            {x.status}
                          </span>
                          {x.status === "Rejected" && x.rejectionReason && (
                            <div className="rejection-reason">
                              {x.rejectionReason}
                            </div>
                          )}
                        </td>
                        <td className="cell-details">{x.details || "—"}</td>
                        <td>
                          {x.purchase_proof === "Requested" ? (
                            <span className="proof-requested">Proof requested</span>
                          ) : (
                            x.purchase_proof || "—"
                          )}
                        </td>
                        <td>
                          <div className="proof-doc-cell">
                            {x.proof_doc_url && (
                              <button
                                type="button"
                                className="btn-proof-open"
                                onClick={() => setProofModal(x)}
                              >
                                View
                              </button>
                            )}
                            <button
                              type="button"
                              className={`btn-proof-upload${uploadSuccess === x.id ? " upload-ok" : ""}`}
                              disabled={uploadingId === x.id}
                              onClick={() => {
                                const input = fileInputRefs.current[x.id];
                                if (input) input.click();
                              }}
                            >
                              {uploadingId === x.id
                                ? "Uploading…"
                                : uploadSuccess === x.id
                                ? "Uploaded!"
                                : x.proof_doc_url
                                ? "Update"
                                : "Upload"}
                            </button>
                            <input
                              ref={(el) => { fileInputRefs.current[x.id] = el; }}
                              type="file"
                              accept=".jpg,.jpeg,.png,.pdf"
                              style={{ display: "none" }}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleProofUpload(x, file);
                              }}
                            />
                          </div>
                        </td>
                        <td>
                          <button
                            className={`btn-offer-toggle ${
                              offersOn ? "on" : "off"
                            }`}
                            disabled={togglingId === x.id}
                            onClick={() => handleToggleOffers(x)}
                          >
                            {togglingId === x.id
                              ? "Updating..."
                              : offersOn
                              ? "Enabled"
                              : "Disabled"}
                          </button>
                        </td>
                        <td className="actions-cell">
                          <Link
                            href={`/product/${x.id}`}
                            className="btn-table-view"
                          >
                            View
                          </Link>
                          {x.status === "Rejected" && x.rejectionReason?.toLowerCase().includes("bad photo") && (
                            <>
                              <button
                                type="button"
                                className={`btn-photo-reupload${photoUploadSuccess === x.id ? " upload-ok" : ""}`}
                                disabled={photoUploadingId === x.id}
                                onClick={() => {
                                  const input = photoInputRefs.current[x.id];
                                  if (input) input.click();
                                }}
                              >
                                {photoUploadingId === x.id
                                  ? "Uploading…"
                                  : photoUploadSuccess === x.id
                                  ? "Resubmitted!"
                                  : "Upload New Photo"}
                              </button>
                              <input
                                ref={(el) => { photoInputRefs.current[x.id] = el; }}
                                type="file"
                                accept=".jpg,.jpeg,.png,.webp"
                                style={{ display: "none" }}
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handlePhotoReupload(x, file);
                                }}
                              />
                            </>
                          )}
                          <button
                            onClick={() => handleDelete(x.id)}
                            disabled={deletingId === x.id}
                            className="btn-table-delete"
                          >
                            {deletingId === x.id ? "Deleting..." : "Delete"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </section>

        {/* MOBILE CARD VIEW */}
        <section className="mobile-cards">
          {loading && (
            <p className="mobile-message">Loading your listings…</p>
          )}

          {!loading && !error && items.length === 0 && (
            <p className="mobile-message">
              You don&apos;t have any listings yet.
            </p>
          )}

          {!loading &&
            !error &&
            items.map((x) => {
              const offersOn = !!x.allowOffers;
              return (
                <div key={x.id} id={`listing-${x.id}`} className="mobile-item-card">
                  <div className="mobile-card-header">
                    <h3 className="mobile-card-title">{x.title}</h3>
                    <span className="mobile-card-price">
                      US$
                      {x.price.toLocaleString("en-US", {
                        maximumFractionDigits: 0,
                      })}
                    </span>
                  </div>

                  <div className="mobile-card-rows">
                    <div className="mobile-card-row">
                      <span className="mobile-label">Status</span>
                      <span className="mobile-value">
                        <span className={x.status === "Rejected" ? "status-rejected" : ""}>
                          {x.status}
                        </span>
                      </span>
                    </div>

                    {x.status === "Rejected" && x.rejectionReason && (
                      <div className="mobile-card-row">
                        <span className="mobile-label">Reason</span>
                        <span className="mobile-value rejection-reason">
                          {x.rejectionReason}
                        </span>
                      </div>
                    )}

                    {x.details && (
                      <div className="mobile-card-row mobile-card-row--stacked">
                        <span className="mobile-label">Details</span>
                        <span className="mobile-value mobile-details">
                          {x.details}
                        </span>
                      </div>
                    )}

                    <div className="mobile-card-row">
                      <span className="mobile-label">Proof</span>
                      <span className="mobile-value">
                        {x.purchase_proof === "Requested" ? (
                          <span className="proof-requested">
                            Proof requested
                          </span>
                        ) : (
                          x.purchase_proof || "—"
                        )}
                      </span>
                    </div>

                    <div className="mobile-card-row">
                      <span className="mobile-label">Proof Doc</span>
                      <span className="mobile-value">
                        <div className="proof-doc-cell">
                          {x.proof_doc_url && (
                            <button
                              type="button"
                              className="btn-proof-open"
                              onClick={() => setProofModal(x)}
                            >
                              View
                            </button>
                          )}
                          <button
                            type="button"
                            className={`btn-proof-upload${uploadSuccess === x.id ? " upload-ok" : ""}`}
                            disabled={uploadingId === x.id}
                            onClick={() => {
                              const input = fileInputRefs.current[`m-${x.id}`];
                              if (input) input.click();
                            }}
                          >
                            {uploadingId === x.id
                              ? "Uploading…"
                              : uploadSuccess === x.id
                              ? "Uploaded!"
                              : x.proof_doc_url
                              ? "Update"
                              : "Upload"}
                          </button>
                          <input
                            ref={(el) => { fileInputRefs.current[`m-${x.id}`] = el; }}
                            type="file"
                            accept=".jpg,.jpeg,.png,.pdf"
                            style={{ display: "none" }}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleProofUpload(x, file);
                            }}
                          />
                        </div>
                      </span>
                    </div>

                    <div className="mobile-card-row">
                      <span className="mobile-label">Make an offer</span>
                      <span className="mobile-value">
                        <button
                          className={`btn-offer-toggle ${
                            offersOn ? "on" : "off"
                          }`}
                          disabled={togglingId === x.id}
                          onClick={() => handleToggleOffers(x)}
                        >
                          {togglingId === x.id
                            ? "Updating..."
                            : offersOn
                            ? "Enabled"
                            : "Disabled"}
                        </button>
                      </span>
                    </div>
                  </div>

                  <div className="mobile-card-actions">
                    <Link
                      href={`/product/${x.id}`}
                      className="btn-table-view"
                    >
                      View
                    </Link>
                    {x.status === "Rejected" && x.rejectionReason?.toLowerCase().includes("bad photo") && (
                      <>
                        <button
                          type="button"
                          className={`btn-photo-reupload${photoUploadSuccess === x.id ? " upload-ok" : ""}`}
                          disabled={photoUploadingId === x.id}
                          onClick={() => {
                            const input = photoInputRefs.current[`m-photo-${x.id}`];
                            if (input) input.click();
                          }}
                        >
                          {photoUploadingId === x.id
                            ? "Uploading…"
                            : photoUploadSuccess === x.id
                            ? "Resubmitted!"
                            : "Upload New Photo"}
                        </button>
                        <input
                          ref={(el) => { photoInputRefs.current[`m-photo-${x.id}`] = el; }}
                          type="file"
                          accept=".jpg,.jpeg,.png,.webp"
                          style={{ display: "none" }}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handlePhotoReupload(x, file);
                          }}
                        />
                      </>
                    )}
                    <button
                      onClick={() => handleDelete(x.id)}
                      disabled={deletingId === x.id}
                      className="btn-table-delete"
                    >
                      {deletingId === x.id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </div>
              );
            })}
        </section>
      </main>

      <Footer />

      {/* PROOF DOCUMENT MODAL */}
      {proofModal && (
        <div className="modal-overlay" onClick={() => setProofModal(null)}>
          <div className="modal-box" onClick={(ev) => ev.stopPropagation()}>
            <div className="modal-header">
              <h3>Proof Document — {proofModal.title}</h3>
              <button type="button" className="modal-close" onClick={() => setProofModal(null)}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              {proofModal.proof_doc_url.startsWith("data:image") ? (
                <img
                  src={proofModal.proof_doc_url}
                  alt="Proof document"
                  style={{ maxWidth: "100%", borderRadius: 8 }}
                />
              ) : proofModal.proof_doc_url.startsWith("data:application/pdf") ? (
                <iframe
                  src={proofModal.proof_doc_url}
                  style={{ width: "100%", height: 500, border: "none", borderRadius: 8 }}
                  title="Proof PDF"
                />
              ) : (
                <a
                  href={proofModal.proof_doc_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-proof-dl"
                >
                  Open / Download proof document
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        /* ---- Full-width left-aligned layout ---- */
        .section {
          max-width: 1400px;
          margin: 28px 0 28px 0;
          padding: 0 32px;
        }

        .section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }

        /* ---- Section header mobile ---- */
        @media (max-width: 700px) {
          .section {
            padding: 0 16px;
          }
          .section-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }
        }

        .sell-card {
          background: #111827;
          border-radius: 16px;
          padding: 18px 18px 20px;
          border: 1px solid #1f2937;
          width: 100%;
        }

        .actions-bar {
          display: flex;
          gap: 12px;
          margin-bottom: 20px;
        }

        .btn-primary,
        .btn-secondary {
          display: inline-block;
          padding: 10px 16px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          font-size: 14px;
          text-decoration: none;
        }

        .btn-primary {
          background: white;
          color: black;
          border: none;
        }

        .btn-secondary {
          border: 1px solid #fff;
          color: #fff;
        }

        @media (max-width: 700px) {
          .actions-bar {
            flex-direction: column;
          }
          .btn-primary,
          .btn-secondary {
            text-align: center;
          }
        }

        .table-overflow-wrapper {
          overflow-x: auto;
        }

        .catalogue-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 14px;
          color: #e5e7eb;
          table-layout: fixed;
        }

        .catalogue-table th,
        .catalogue-table td {
          padding: 10px 12px;
          text-align: left;
          border-bottom: 1px solid #374151;
          vertical-align: middle;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .catalogue-table th:nth-child(1),
        .catalogue-table td:nth-child(1) {
          width: 22%;
        }
        .catalogue-table th:nth-child(2),
        .catalogue-table td:nth-child(2) {
          width: 10%;
        }
        .catalogue-table th:nth-child(3),
        .catalogue-table td:nth-child(3) {
          width: 10%;
        }
        .catalogue-table th:nth-child(4),
        .catalogue-table td:nth-child(4) {
          width: 16%;
        }
        .catalogue-table th:nth-child(5),
        .catalogue-table td:nth-child(5) {
          width: 10%;
        }
        .catalogue-table th:nth-child(6),
        .catalogue-table td:nth-child(6) {
          width: 12%;
        }
        .catalogue-table th:nth-child(7),
        .catalogue-table td:nth-child(7) {
          width: 11%;
        }
        .catalogue-table th:nth-child(8),
        .catalogue-table td:nth-child(8) {
          width: 13%;
        }

        .catalogue-table th {
          font-size: 12px;
          text-transform: uppercase;
          color: #9ca3af;
          font-weight: 500;
          white-space: nowrap;
        }

        .catalogue-table tr:last-child td {
          border-bottom: none;
        }

        .table-message {
          text-align: center;
          color: #9ca3af;
          padding: 24px;
        }

        .actions-cell {
          display: flex;
          justify-content: flex-start;
          gap: 12px;
        }

        .btn-table-view,
        .btn-table-delete {
          padding: 4px 10px;
          font-size: 12px;
          font-weight: 500;
          border-radius: 999px;
          text-decoration: none;
          cursor: pointer;
        }

        .btn-table-view {
          border: 1px solid #374151;
          color: #e5e7eb;
          background: #1f2937;
        }
        .btn-table-view:hover {
          border-color: #6b7280;
        }

        .btn-table-delete {
          border: 1px solid #b91c1c;
          color: #fca5a5;
          background: #7f1d1d;
        }
        .btn-table-delete:hover {
          opacity: 0.8;
        }
        .btn-table-delete:disabled {
          opacity: 0.5;
        }

        .btn-offer-toggle {
          padding: 4px 10px;
          font-size: 12px;
          font-weight: 500;
          border-radius: 999px;
          border: 1px solid #374151;
          background: #111827;
          color: #e5e7eb;
          cursor: pointer;
        }
        .btn-offer-toggle.on {
          border-color: #10b981;
          background: #064e3b;
          color: #a7f3d0;
        }
        .btn-offer-toggle.off {
          border-color: #4b5563;
          background: #111827;
          color: #9ca3af;
        }
        .btn-offer-toggle:disabled {
          opacity: 0.6;
          cursor: default;
        }

        .cell-details {
          max-width: 160px;
          font-size: 12px;
          color: #9ca3af;
          white-space: pre-wrap;
          word-break: break-word;
        }
        .proof-requested {
          color: #f59e0b;
          font-weight: 600;
          font-size: 12px;
        }
        .no-proof {
          color: #6b7280;
          font-size: 12px;
        }
        .btn-proof-open {
          display: inline-block;
          background: #2563eb;
          color: #fff;
          border: none;
          border-radius: 999px;
          padding: 4px 10px;
          font-size: 12px;
          text-decoration: none;
          white-space: nowrap;
          cursor: pointer;
        }
        .btn-proof-open:hover {
          background: #1d4ed8;
        }
        .proof-doc-cell {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
        }
        .btn-proof-upload {
          display: inline-block;
          background: #065f46;
          color: #a7f3d0;
          border: 1px solid #10b981;
          border-radius: 999px;
          padding: 4px 10px;
          font-size: 12px;
          font-weight: 500;
          white-space: nowrap;
          cursor: pointer;
          transition: background 0.15s, border-color 0.15s;
        }
        .btn-proof-upload:hover {
          background: #047857;
          border-color: #34d399;
        }
        .btn-proof-upload:disabled {
          opacity: 0.6;
          cursor: default;
        }
        .btn-proof-upload.upload-ok {
          background: #064e3b;
          border-color: #34d399;
          color: #6ee7b7;
        }

        /* ---- Desktop table / Mobile cards toggle ---- */
        .mobile-cards {
          display: none;
        }

        @media (max-width: 700px) {
          .desktop-table {
            display: none;
          }
          .mobile-cards {
            display: block;
          }
        }

        /* ---- Mobile card styles ---- */
        .mobile-message {
          text-align: center;
          color: #9ca3af;
          padding: 32px 16px;
          font-size: 14px;
          background: #111827;
          border-radius: 16px;
          border: 1px solid #1f2937;
        }

        .mobile-item-card {
          background: #111827;
          border: 1px solid #1f2937;
          border-radius: 14px;
          padding: 16px;
          margin-bottom: 12px;
        }

        .mobile-card-header {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-bottom: 12px;
          padding-bottom: 10px;
          border-bottom: 1px solid #1f2937;
        }

        .mobile-card-title {
          margin: 0;
          font-size: 15px;
          font-weight: 600;
          color: #e5e7eb !important;
          line-height: 1.3;
          word-break: break-word;
        }

        .mobile-card-price {
          font-size: 17px;
          font-weight: 700;
          color: #ffffff !important;
        }

        .mobile-card-rows {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 14px;
        }

        .mobile-card-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
        }

        .mobile-card-row.mobile-card-row--stacked {
          flex-direction: column;
          gap: 4px;
        }

        .mobile-label {
          font-size: 12px;
          text-transform: uppercase;
          color: #9ca3af !important;
          font-weight: 500;
          flex-shrink: 0;
        }

        .mobile-value {
          font-size: 13px;
          color: #e5e7eb !important;
          text-align: right;
          word-break: break-word;
        }

        .mobile-card-row--stacked .mobile-value {
          text-align: left;
        }

        .mobile-details {
          font-size: 12px;
          color: #9ca3af !important;
          white-space: pre-wrap;
          line-height: 1.5;
        }

        .mobile-card-actions {
          display: flex;
          gap: 10px;
          padding-top: 12px;
          border-top: 1px solid #1f2937;
        }

        .mobile-card-actions .btn-table-view,
        .mobile-card-actions .btn-table-delete {
          flex: 1;
          text-align: center;
          padding: 8px 12px;
          font-size: 13px;
        }

        /* Modal overlay */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
        }
        .modal-box {
          background: #ffffff;
          border-radius: 16px;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
          max-width: 700px;
          width: 100%;
          max-height: 80vh;
          display: flex;
          flex-direction: column;
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          border-bottom: 1px solid #e5e7eb;
        }
        .modal-header h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 700;
          color: #111827;
        }
        .modal-close {
          background: none;
          border: none;
          font-size: 18px;
          cursor: pointer;
          color: #6b7280;
          padding: 4px;
        }
        .modal-close:hover {
          color: #111827;
        }
        .modal-body {
          padding: 20px;
          overflow-y: auto;
        }
        .btn-proof-dl {
          display: inline-block;
          background: #2563eb;
          color: #fff;
          border-radius: 999px;
          padding: 10px 20px;
          font-size: 14px;
          font-weight: 600;
          text-decoration: none;
        }
        .btn-proof-dl:hover {
          background: #1d4ed8;
        }

        @media (max-width: 700px) {
          .modal-overlay {
            padding: 12px;
          }
          .modal-header h3 {
            font-size: 14px;
          }
        }

        .status-rejected {
          color: #fca5a5;
          font-weight: 600;
        }
        .rejection-reason {
          font-size: 11px;
          color: #f59e0b;
          margin-top: 2px;
          line-height: 1.4;
        }
        .btn-photo-reupload {
          display: inline-block;
          background: #1e40af;
          color: #bfdbfe;
          border: 1px solid #3b82f6;
          border-radius: 999px;
          padding: 4px 10px;
          font-size: 12px;
          font-weight: 500;
          white-space: nowrap;
          cursor: pointer;
          transition: background 0.15s, border-color 0.15s;
        }
        .btn-photo-reupload:hover {
          background: #1d4ed8;
          border-color: #60a5fa;
        }
        .btn-photo-reupload:disabled {
          opacity: 0.6;
          cursor: default;
        }
        .btn-photo-reupload.upload-ok {
          background: #064e3b;
          border-color: #34d399;
          color: #6ee7b7;
        }

        .banner {
          margin-bottom: 16px;
          padding: 8px 10px;
          border-radius: 6px;
          font-size: 13px;
        }
        .error {
          background: #7f1d1d;
          color: #fee2e2;
        }
      `}</style>
    </div>
  );
}
