// FILE: /pages/management/listing-queue.tsx
import Head from "next/head";
import Link from "next/link";
import type { GetServerSideProps } from "next";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { adminDb } from "../../utils/firebaseAdmin";
import { useRequireAdmin } from "../../hooks/useRequireAdmin";
import { useState, useEffect } from "react";

type Listing = {
  id: string;
  title: string;
  brand: string;
  seller: string;
  category: string;
  price: number;
  status: "Pending" | "Live" | "Rejected";
  purchase_source?: string;
  purchase_proof?: string;
  proof_doc_url?: string;
  details?: string;
  serial_number?: string;
  auth_photos?: string[];
  submittedAt?: string;
  sellerImageUrl?: string;   // first uploaded image by seller
  aiImageUrl?: string;       // AI-found original designer product image
  aiImageLoading?: boolean;
  aiImageError?: string;
};

type Props = { items: Listing[] };

function ManagementListingQueue({ items: initialItems }: Props) {
  const { loading } = useRequireAdmin();
  const [items, setItems] = useState(initialItems);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchAiImage = async (id: string, title: string, brand: string) => {
    setItems((prev) =>
      prev.map((x) => (x.id === id ? { ...x, aiImageLoading: true } : x))
    );
    try {
      const res = await fetch("/api/admin/ai-find-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId: id, title, brand }),
      });
      const json = await res.json();
      if (res.ok && json.imageUrl) {
        setItems((prev) =>
          prev.map((x) =>
            x.id === id ? { ...x, aiImageUrl: json.imageUrl, aiImageLoading: false } : x
          )
        );
      } else {
        setItems((prev) =>
          prev.map((x) =>
            x.id === id ? { ...x, aiImageLoading: false, aiImageError: "Not found" } : x
          )
        );
      }
    } catch {
      setItems((prev) =>
        prev.map((x) =>
          x.id === id ? { ...x, aiImageLoading: false, aiImageError: "Error" } : x
        )
      );
    }
  };

  // Fetch AI images for pending items on mount
  useEffect(() => {
    initialItems.forEach((item) => {
      if (item.status === "Pending" && item.title) {
        fetchAiImage(item.id, item.title, item.brand || item.seller);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Rejection reason modal state
  const [rejectModal, setRejectModal] = useState<string | null>(null); // listing id
  const [rejectReason, setRejectReason] = useState("");

  const REJECTION_REASONS = [
    "Bad photo",
    "Verification document - poor image",
    "Verification document - not acceptable",
    "Pricing needs to be reviewed",
  ];

  // Modal state for proof document viewing
  const [proofModal, setProofModal] = useState<Listing | null>(null);
  const [proofDocData, setProofDocData] = useState<string>("");
  const [proofLoading, setProofLoading] = useState(false);

  function openProofModal(listing: any) {
    setProofModal(listing);
    setProofDocData("");
    setProofLoading(true);
    fetch(`/api/admin/proof-doc/${listing.id}`)
      .then((r) => r.json())
      .then((data) => setProofDocData(data.proof_doc_url || ""))
      .catch(() => setProofDocData(""))
      .finally(() => setProofLoading(false));
  }

  // Modal state for details viewing
  const [detailsModal, setDetailsModal] = useState<Listing | null>(null);

  if (loading) return <div className="dashboard-page" />;

  const handleAction = async (
    id: string,
    action: "approve" | "reject" | "request-proof" | "delete",
    body?: Record<string, any>
  ) => {
    if (actionLoading) return;
    setActionLoading(id);
    setError(null);

    try {
      const res = await fetch(`/api/admin/${action}/${id}`, {
        method: "POST",
        headers: body ? { "Content-Type": "application/json" } : {},
        body: body ? JSON.stringify(body) : undefined,
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.error || `Failed to ${action} item`);
      }

      if (action === "request-proof") {
        // Only update the proof column
        setItems((prev) =>
          prev.map((x) =>
            x.id === id ? { ...x, purchase_proof: "Requested" } : x
          )
        );
      } else if (action === "delete") {
        // Remove from table completely
        setItems((prev) => prev.filter((x) => x.id !== id));
      } else {
        const nextStatus: Listing["status"] =
          action === "approve" ? "Live" : "Rejected";
        setItems((prev) =>
          prev.map((x) =>
            x.id === id ? { ...x, status: nextStatus } : x
          )
        );
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Something went wrong.");
    } finally {
      setActionLoading(null);
    }
  };

  const hasAny = items.length > 0;

  return (
    <>
      <Head>
        <title>Listing Review Queue — Admin</title>
      </Head>

      <div className="dashboard-page">
        <Header />
        <main className="dashboard-main" style={{ maxWidth: "100%" }}>
          <div className="dashboard-header">
            <div>
              <h1>Listing Review Queue</h1>
              <p>
                Pending submissions from all sellers. Check authenticity before
                approval. Your Prada bag and LV sneakers both show here when
                status is Pending.
              </p>
            </div>
            <Link href="/management/dashboard" className="btn-primary-dark">
              ← Back to Management Dashboard
            </Link>
          </div>

          {error && (
            <div
              className="form-message error"
              style={{ marginBottom: "16px" }}
            >
              <strong>Error:</strong> {error}
            </div>
          )}

          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Images</th>
                  <th>Listing</th>
                  <th>Seller</th>
                  <th>Price</th>
                  <th>Category</th>
                  <th>Purchased From</th>
                  <th>Proof</th>
                  <th>Proof Document</th>
                  <th>Serial #</th>
                  <th>Details</th>
                  <th>Submitted</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {hasAny ? (
                  items.map((item) => (
                    <tr key={item.id}>
                      <td style={{ minWidth: 220 }}>
                        <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                          {/* Seller image */}
                          <div style={{ textAlign: "center" }}>
                            <div style={{ fontSize: 10, color: "#6b7280", marginBottom: 3, fontWeight: 600, textTransform: "uppercase" }}>Seller</div>
                            {item.sellerImageUrl ? (
                              <a href={item.sellerImageUrl} target="_blank" rel="noopener noreferrer">
                                <img
                                  src={item.sellerImageUrl}
                                  alt="Seller"
                                  style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 6, border: "1px solid #e5e7eb", display: "block" }}
                                />
                              </a>
                            ) : (
                              <div style={{ width: 80, height: 80, borderRadius: 6, border: "1px dashed #d1d5db", background: "#f9fafb", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#9ca3af" }}>No image</div>
                            )}
                          </div>
                          {/* AI-found original designer image */}
                          <div style={{ textAlign: "center" }}>
                            <div style={{ fontSize: 10, color: "#6b7280", marginBottom: 3, fontWeight: 600, textTransform: "uppercase" }}>AI / Original</div>
                            {item.aiImageLoading ? (
                              <div style={{ width: 80, height: 80, borderRadius: 6, border: "1px dashed #d1d5db", background: "#f0f9ff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#3b82f6" }}>Finding…</div>
                            ) : item.aiImageUrl ? (
                              <a href={item.aiImageUrl} target="_blank" rel="noopener noreferrer">
                                <img
                                  src={item.aiImageUrl}
                                  alt="AI original"
                                  crossOrigin="anonymous"
                                  referrerPolicy="no-referrer"
                                  style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 6, border: "1px solid #bfdbfe", display: "block" }}
                                  onError={(e) => {
                                    const el = e.target as HTMLImageElement;
                                    el.style.display = "none";
                                    const parent = el.parentElement?.parentElement;
                                    if (parent) {
                                      const div = document.createElement("div");
                                      div.style.cssText = "width:80px;height:80px;border-radius:6px;border:1px dashed #d1d5db;background:#f9fafb;display:flex;align-items:center;justify-content:center;font-size:10px;color:#9ca3af;text-align:center;padding:4px;";
                                      div.textContent = "Blocked";
                                      parent.appendChild(div);
                                    }
                                  }}
                                />
                              </a>
                            ) : (
                              <div style={{ width: 80, height: 80, borderRadius: 6, border: "1px dashed #d1d5db", background: "#f9fafb", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#9ca3af", textAlign: "center", padding: "4px" }}>
                                {item.aiImageError || "—"}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>{item.title}</td>
                      <td>{item.seller}</td>
                      <td>
                        {item.price
                          ? `US$${item.price.toLocaleString("en-US")}`
                          : "—"}
                      </td>
                      <td>{item.category || "—"}</td>
                      <td>{item.purchase_source || "—"}</td>
                      <td>
                        {item.purchase_proof === "Requested" ? (
                          <span className="proof-requested">Requested</span>
                        ) : (
                          item.purchase_proof || "—"
                        )}
                      </td>
                      <td>
                        {item.proof_doc_url ? (
                          <button
                            type="button"
                            className="btn-table btn-proof-view"
                            onClick={() => openProofModal(item)}
                          >
                            View proof
                          </button>
                        ) : (
                          <span className="no-proof">Not uploaded</span>
                        )}
                      </td>
                      <td>{item.serial_number || "—"}</td>
                      <td>
                        {item.details ? (
                          <button
                            type="button"
                            className="btn-table btn-details-view"
                            onClick={() => setDetailsModal(item)}
                          >
                            View details
                          </button>
                        ) : (
                          <span className="no-proof">—</span>
                        )}
                      </td>
                      <td>{item.submittedAt || "—"}</td>
                      <td>{item.status}</td>
                      <td>
                        <div className="table-actions">
                          <Link
                            href={`/product/${item.id}`}
                            className="btn-table btn-view"
                          >
                            View
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleAction(item.id, "approve")}
                            disabled={actionLoading === item.id}
                            className="btn-table btn-approve"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setRejectReason("");
                              setRejectModal(item.id);
                            }}
                            disabled={actionLoading === item.id}
                            className="btn-table btn-reject"
                          >
                            Reject
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleAction(item.id, "request-proof")
                            }
                            disabled={actionLoading === item.id}
                            className="btn-table btn-request"
                          >
                            Request proof
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (
                                window.confirm(
                                  "Delete this listing permanently?"
                                )
                              ) {
                                handleAction(item.id, "delete");
                              }
                            }}
                            disabled={actionLoading === item.id}
                            className="btn-table btn-delete"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={13} className="table-message">
                      No pending listings – go enjoy a coffee
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </main>

        <Footer />
      </div>

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
              {proofLoading ? (
                <p style={{ textAlign: "center", color: "#6b7280" }}>Loading proof document...</p>
              ) : proofDocData ? (
                proofDocData.startsWith("data:image") ? (
                  <img
                    src={proofDocData}
                    alt="Proof document"
                    style={{ maxWidth: "100%", borderRadius: 8 }}
                  />
                ) : proofDocData.startsWith("data:application/pdf") ? (
                  <iframe
                    src={proofDocData}
                    style={{ width: "100%", height: 500, border: "none", borderRadius: 8 }}
                    title="Proof PDF"
                  />
                ) : (
                  <a
                    href={proofDocData}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-proof-download"
                  >
                    Open / Download proof document
                  </a>
                )
              ) : (
                <p style={{ textAlign: "center", color: "#9ca3af" }}>No proof document available.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* DETAILS MODAL */}
      {detailsModal && (
        <div className="modal-overlay" onClick={() => setDetailsModal(null)}>
          <div className="modal-box" onClick={(ev) => ev.stopPropagation()}>
            <div className="modal-header">
              <h3>Details — {detailsModal.title}</h3>
              <button type="button" className="modal-close" onClick={() => setDetailsModal(null)}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.6, whiteSpace: "pre-wrap", wordBreak: "break-word", margin: 0 }}>
                {detailsModal.details}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* REJECTION REASON MODAL */}
      {rejectModal && (
        <div className="modal-overlay" onClick={() => setRejectModal(null)}>
          <div className="modal-box" onClick={(ev) => ev.stopPropagation()}>
            <div className="modal-header">
              <h3>Reject Listing — Select Reason</h3>
              <button type="button" className="modal-close" onClick={() => setRejectModal(null)}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 14, color: "#374151", marginBottom: 12 }}>
                Select a reason for rejection. The seller will be notified by email.
              </p>
              <select
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  fontSize: 14,
                  borderRadius: 8,
                  border: "1px solid #d1d5db",
                  marginBottom: 16,
                  background: "#fff",
                }}
              >
                <option value="">-- Select a reason --</option>
                {REJECTION_REASONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => setRejectModal(null)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 8,
                    border: "1px solid #d1d5db",
                    background: "#fff",
                    cursor: "pointer",
                    fontSize: 13,
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!rejectReason}
                  onClick={() => {
                    const listingId = rejectModal;
                    setRejectModal(null);
                    handleAction(listingId, "reject", { reason: rejectReason });
                  }}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 8,
                    border: "none",
                    background: rejectReason ? "#dc2626" : "#d1d5db",
                    color: "#fff",
                    cursor: rejectReason ? "pointer" : "not-allowed",
                    fontWeight: 700,
                    fontSize: 13,
                  }}
                >
                  Reject Listing
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .table-wrapper {
          margin-top: 24px;
          overflow-x: auto;
        }
        .data-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 14px;
        }
        .data-table th,
        .data-table td {
          padding: 10px 12px;
          border-bottom: 1px solid #e5e7eb;
          text-align: left;
        }
        .data-table thead th {
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          color: #6b7280;
          background: #f9fafb;
        }
        .table-message {
          text-align: center;
          padding: 24px;
          color: #6b7280;
        }
        .table-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        .btn-table {
          border-radius: 999px;
          padding: 4px 10px;
          border: none;
          font-size: 12px;
          cursor: pointer;
          white-space: nowrap;
        }
        .btn-view {
          background: #111827;
          color: #ffffff;
          text-decoration: none;
        }
        .btn-approve {
          background: #16a34a;
          color: white;
        }
        .btn-reject {
          background: #dc2626;
          color: white;
        }
        .btn-request {
          background: #f59e0b;
          color: black;
        }
        .btn-delete {
          background: #4b5563;
          color: #f9fafb;
        }
        .btn-proof-view {
          background: #2563eb;
          color: #ffffff;
          text-decoration: none;
          display: inline-block;
        }
        .btn-proof-view:hover {
          background: #1d4ed8;
        }
        .btn-details-view {
          background: #111827;
          color: #ffffff;
        }
        .btn-details-view:hover {
          background: #1f2937;
        }
        .proof-requested {
          color: #d97706;
          font-weight: 600;
          font-size: 12px;
        }
        .no-proof {
          color: #9ca3af;
          font-size: 12px;
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
        .btn-proof-download {
          display: inline-block;
          background: #2563eb;
          color: #fff;
          border-radius: 999px;
          padding: 10px 20px;
          font-size: 14px;
          font-weight: 600;
          text-decoration: none;
        }
        .btn-proof-download:hover {
          background: #1d4ed8;
        }
      `}</style>
    </>
  );
}

export default ManagementListingQueue;

export const getServerSideProps: GetServerSideProps<Props> = async () => {
  if (!adminDb) return { props: { items: [] } };

  try {
    const snap = await adminDb
      .collection("listings")
      .limit(200)
      .get();

    const all: Listing[] = snap.docs.map((doc) => {
      const d: any = doc.data() || {};
      const rawStatus = (d.status || "").toString();
      let status: Listing["status"] = "Live";
      if (/pending/i.test(rawStatus)) status = "Pending";
      else if (/reject/i.test(rawStatus)) status = "Rejected";

      return {
        id: doc.id,
        title: d.title || "Untitled listing",
        brand: d.brand || d.sellerName || "",
        seller: d.sellerName || d.sellerDisplayName || d.sellerId || "Seller",
        category: d.category || "",
        price: Number(d.price || 0),
        status,
        purchase_source: d.purchase_source || "",
        purchase_proof: d.purchase_proof || "",
        proof_doc_url: d.proof_doc_url ? "has_proof" : "",
        details: d.details || "",
        serial_number: d.serial_number || "",
        auth_photos: d.auth_photos || [],
        submittedAt:
          d.createdAt?.toDate?.().toLocaleString("en-US") || "",
        sellerImageUrl: (() => {
          // Only pass real HTTP URLs — base64 data URLs bloat SSR props and break the page
          const candidates = [
            Array.isArray(d.images) ? d.images[0] : null,
            d.imageUrl,
            d.displayImageUrl,
            Array.isArray(d.imageUrls) ? d.imageUrls[0] : null,
          ];
          for (const c of candidates) {
            if (c && typeof c === "string" && c.startsWith("http")) return c;
          }
          return "";
        })(),
      };
    });

    all.sort((a, b) => {
      if (!a.submittedAt && !b.submittedAt) return 0;
      if (!a.submittedAt) return 1;
      if (!b.submittedAt) return -1;
      return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
    });

    const items = all.filter((i) => i.status === "Pending");
    return { props: { items } };
  } catch (err) {
    console.error("Error loading listing queue", err);
    return { props: { items: [] } };
  }
};
