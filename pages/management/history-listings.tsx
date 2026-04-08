// FILE: /pages/management/history-listings.tsx
import { useMemo, useState } from "react";
import type { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useRequireAdmin } from "../../hooks/useRequireAdmin";
import { adminDb } from "../../utils/firebaseAdmin";

type HistoryEntry = {
  id: string;
  listingId: string;
  title: string;
  seller: string;
  brand: string;
  category: string;
  condition: string;
  details: string;
  price: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  soldAt: string;
  proof_doc_url: string;
  purchase_proof: string;
};

type Props = {
  entries: HistoryEntry[];
};

export default function HistoryListings({ entries }: Props) {
  const { loading } = useRequireAdmin();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Modal state for details and proof
  const [detailsModal, setDetailsModal] = useState<HistoryEntry | null>(null);
  const [proofModal, setProofModal] = useState<HistoryEntry | null>(null);
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

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return entries.filter((e) => {
      if (statusFilter !== "All" && e.status !== statusFilter) return false;
      if (!q) return true;
      return (
        e.title.toLowerCase().includes(q) ||
        e.seller.toLowerCase().includes(q) ||
        e.brand.toLowerCase().includes(q) ||
        e.listingId.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q)
      );
    });
  }, [entries, query, statusFilter]);

  if (loading) return <div className="dashboard-page" />;

  return (
    <>
      <Head>
        <title>Listing History — Admin</title>
      </Head>

      <div className="dashboard-page">
        <Header />

        <main className="dashboard-main">
          <div className="dashboard-header">
            <div>
              <h1>Listing History</h1>
              <p>Full audit trail of every listing — added, updated, sold, or deleted.</p>
            </div>
            <Link href="/management/dashboard">← Back to Management Dashboard</Link>
          </div>

          <div className="filters-bar">
            <input
              type="text"
              placeholder="Search by title, brand, seller, or ID…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="form-input"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="form-input"
              style={{ maxWidth: 200 }}
            >
              <option value="All">All statuses</option>
              <option value="Live">Live</option>
              <option value="Pending">Pending</option>
              <option value="Rejected">Rejected</option>
              <option value="Sold">Sold</option>
              <option value="Deleted">Deleted</option>
            </select>
            <span className="result-count">{visible.length} entries</span>
          </div>

          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Added</th>
                  <th>Listing</th>
                  <th>Seller</th>
                  <th>Brand</th>
                  <th>Category</th>
                  <th>Condition</th>
                  <th>Details</th>
                  <th>Proof</th>
                  <th>Price (US$)</th>
                  <th>Status</th>
                  <th>Updated</th>
                  <th>Sold</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((e) => (
                  <tr key={e.id} className={e.status === "Deleted" ? "row-deleted" : e.status === "Sold" ? "row-sold" : ""}>
                    <td className="cell-date">{e.createdAt || "—"}</td>
                    <td>
                      <div className="listing-title">{e.title}</div>
                      <div className="listing-id">ID: {e.listingId}</div>
                    </td>
                    <td>{e.seller || "—"}</td>
                    <td>{e.brand || "—"}</td>
                    <td>{e.category || "—"}</td>
                    <td>{e.condition || "—"}</td>
                    <td>
                      {e.details ? (
                        <button
                          type="button"
                          className="btn-modal-open"
                          onClick={() => setDetailsModal(e)}
                        >
                          View details
                        </button>
                      ) : (
                        <span className="no-data">—</span>
                      )}
                    </td>
                    <td>
                      {e.proof_doc_url ? (
                        <button
                          type="button"
                          className="btn-modal-open btn-proof"
                          onClick={() => openProofModal(e)}
                        >
                          View proof
                        </button>
                      ) : e.purchase_proof === "Requested" ? (
                        <span className="proof-requested">Requested</span>
                      ) : (
                        <span className="no-data">—</span>
                      )}
                    </td>
                    <td className="cell-price">{e.price ? `$${e.price.toLocaleString()}` : "—"}</td>
                    <td>
                      <span className={
                        "status-badge " +
                        (e.status === "Live" ? "status-active"
                          : e.status === "Pending" ? "status-pending"
                          : e.status === "Rejected" ? "status-rejected"
                          : e.status === "Sold" ? "status-sold"
                          : e.status === "Deleted" ? "status-deleted"
                          : "status-other")
                      }>
                        {e.status}
                      </span>
                    </td>
                    <td className="cell-date">{e.updatedAt || "—"}</td>
                    <td className="cell-date">{e.soldAt || "—"}</td>
                  </tr>
                ))}
                {visible.length === 0 && (
                  <tr>
                    <td colSpan={12} className="table-message">
                      No listing history entries found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </main>

        <Footer />
      </div>

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
              <p className="modal-text">{detailsModal.details}</p>
            </div>
          </div>
        </div>
      )}

      {/* PROOF MODAL */}
      {proofModal && (
        <div className="modal-overlay" onClick={() => setProofModal(null)}>
          <div className="modal-box modal-box-lg" onClick={(ev) => ev.stopPropagation()}>
            <div className="modal-header">
              <h3>Proof Document — {proofModal.title}</h3>
              <button type="button" className="modal-close" onClick={() => setProofModal(null)}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              {proofLoading ? (
                <p>Loading...</p>
              ) : proofDocData.startsWith("data:image") ? (
                <img
                  src={proofDocData}
                  alt="Proof document"
                  className="modal-proof-img"
                />
              ) : proofDocData.startsWith("data:application/pdf") ? (
                <iframe
                  src={proofDocData}
                  className="modal-proof-iframe"
                  title="Proof PDF"
                />
              ) : proofDocData ? (
                <a
                  href={proofDocData}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-proof-download"
                >
                  Open / Download proof document
                </a>
              ) : (
                <p>No proof document available</p>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .filters-bar {
          margin-bottom: 16px;
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          align-items: center;
        }
        .form-input {
          max-width: 320px;
          width: 100%;
          border-radius: 6px;
          border: 1px solid #d1d5db;
          padding: 8px 12px;
          font-size: 14px;
        }
        .form-input:focus {
          border-color: #111827;
          outline: none;
        }
        .result-count {
          font-size: 13px;
          color: #6b7280;
          font-weight: 500;
        }

        .table-wrapper {
          overflow-x: auto;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
          background: #ffffff;
          box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
        }
        .data-table {
          min-width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }
        .data-table thead {
          background: #f9fafb;
        }
        .data-table th {
          padding: 10px 12px;
          text-align: left;
          font-weight: 600;
          color: #374151;
          white-space: nowrap;
          font-size: 12px;
        }
        .data-table tbody tr {
          border-bottom: 1px solid #f3f4f6;
        }
        .data-table tbody tr:last-child {
          border-bottom: none;
        }
        .data-table td {
          padding: 8px 12px;
          color: #111827;
          vertical-align: top;
        }
        .listing-title {
          font-weight: 500;
          font-size: 13px;
        }
        .listing-id {
          font-size: 10px;
          color: #9ca3af;
          margin-top: 2px;
        }
        .cell-date {
          font-size: 12px;
          color: #6b7280;
          white-space: nowrap;
        }
        .cell-price {
          font-weight: 600;
          white-space: nowrap;
        }
        .no-data {
          color: #9ca3af;
          font-size: 12px;
        }
        .table-message {
          padding: 24px;
          text-align: center;
          color: #6b7280;
        }

        .row-deleted {
          background: #fef2f2;
        }
        .row-sold {
          background: #f9fafb;
        }

        .status-badge {
          display: inline-flex;
          border-radius: 999px;
          padding: 2px 8px;
          font-size: 11px;
          font-weight: 500;
          white-space: nowrap;
        }
        .status-active {
          background: #d1fae5;
          color: #065f46;
        }
        .status-pending {
          background: #fef3c7;
          color: #92400e;
        }
        .status-rejected {
          background: #fee2e2;
          color: #991b1b;
        }
        .status-sold {
          background: #e5e7eb;
          color: #4b5563;
        }
        .status-deleted {
          background: #fee2e2;
          color: #b91c1c;
        }
        .status-other {
          background: #f3f4f6;
          color: #6b7280;
        }

        .btn-modal-open {
          background: #111827;
          color: #fff;
          border: none;
          border-radius: 999px;
          padding: 4px 10px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          white-space: nowrap;
        }
        .btn-modal-open:hover {
          background: #1f2937;
        }
        .btn-proof {
          background: #2563eb;
        }
        .btn-proof:hover {
          background: #1d4ed8;
        }
        .proof-requested {
          color: #d97706;
          font-weight: 600;
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
          max-width: 520px;
          width: 100%;
          max-height: 80vh;
          display: flex;
          flex-direction: column;
        }
        .modal-box-lg {
          max-width: 700px;
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
        .modal-text {
          font-size: 14px;
          color: #374151;
          line-height: 1.6;
          white-space: pre-wrap;
          word-break: break-word;
          margin: 0;
        }
        .modal-proof-img {
          max-width: 100%;
          border-radius: 8px;
        }
        .modal-proof-iframe {
          width: 100%;
          height: 500px;
          border: none;
          border-radius: 8px;
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

export const getServerSideProps: GetServerSideProps<Props> = async () => {
  if (!adminDb) return { props: { entries: [] } };

  try {
    const snap = await adminDb
      .collection("listings")
      .limit(500)
      .get();

    const entries: HistoryEntry[] = snap.docs.map((doc) => {
      const d: any = doc.data() || {};

      const rawStatus = (d.status || "").toString();
      let status = rawStatus || "Unknown";
      if (/pending/i.test(rawStatus)) status = "Pending";
      else if (/reject/i.test(rawStatus)) status = "Rejected";
      else if (/sold/i.test(rawStatus)) status = "Sold";
      else if (/deleted|removed/i.test(rawStatus)) status = "Deleted";
      else if (/live/i.test(rawStatus)) status = "Live";

      return {
        id: doc.id,
        listingId: doc.id,
        title: d.title || "Untitled",
        seller: d.sellerName || d.sellerId || "—",
        brand: String(d.brand || d.designer || ""),
        category: String(d.category || ""),
        condition: String(d.condition || ""),
        details: String(d.details || ""),
        price: Number(d.price || d.priceUsd || 0),
        status,
        createdAt: d.createdAt?.toDate?.().toLocaleDateString("en-US") || "",
        updatedAt: d.updatedAt?.toDate?.().toLocaleDateString("en-US") || "",
        soldAt: d.soldAt?.toDate?.().toLocaleDateString("en-US") || "",
        proof_doc_url: d.proof_doc_url ? "has_proof" : "",
        purchase_proof: String(d.purchase_proof || ""),
      };
    });

    entries.sort((a, b) => {
      if (!a.createdAt && !b.createdAt) return 0;
      if (!a.createdAt) return 1;
      if (!b.createdAt) return -1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return { props: { entries } };
  } catch (err) {
    console.error("Error loading listing history", err);
    return { props: { entries: [] } };
  }
};
