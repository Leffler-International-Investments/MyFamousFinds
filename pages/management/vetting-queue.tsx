// FILE: /pages/management/vetting-queue.tsx
import { useMemo, useState } from "react";
import type { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useRequireAdmin } from "../../hooks/useRequireAdmin";
import { adminDb } from "../../utils/firebaseAdmin";

type SellerApplication = {
  id: string;
  businessName: string;
  contactEmail: string;
  submittedAt: string;
  status: "Pending" | "Approved" | "Rejected";
};

type Props = { items: SellerApplication[] };

export default function ManagementVettingQueue({ items }: Props) {
  const { loading } } = useRequireAdmin();
  const [query, setQuery] = useState("");
  const [localItems, setLocalItems] = useState(items);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return localItems;
    return localItems.filter((s) => {
      return (
        s.businessName.toLowerCase().includes(q) ||
        s.contactEmail.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q)
      );
    });
  }, [localItems, query]);

  const handleAction = async (
    id: string,
    action: "approve" | "reject"
  ) => {
    if (actionLoading) return;
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/${action}-seller/${id}`, {
        method: "POST",
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || "Failed to update seller");
      }
      setLocalItems((prev) =>
        prev.map((s) =>
          s.id === id
            ? {
                ...s,
                status: action === "approve" ? "Approved" : "Rejected",
              }
            : s
        )
      );
    } catch (err: any) {
      alert(err?.message || "Error updating seller status.");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return <div className="dashboard-page"></div>;

  return (
    <>
      <Head>
        <title>Seller Vetting Queue — Admin</title>
      </Head>
      <div className="dashboard-page">
        <Header />
        <main className="dashboard-main">
          <div className="dashboard-header">
            <div>
              <h1>Seller Vetting Queue</h1>
              <p>
                Approve or deny new seller applications.
              </p>
            </div>
            <Link
              href="/management/dashboard"
              className="action-button-dark"
            >
              ← Back to admin home
            </Link>
          </div>

          <section className="dashboard-section">
             <div className="controls">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by business, email, or ID…"
                className="search-input"
              />
            </div>

            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Business</th>
                    <th>Contact email</th>
                    <th>Submitted</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((s) => (
                    <tr key={s.id}>
                      <td className="font-medium">
                        {s.businessName || "—"}
                      </td>
                      <td>{s.contactEmail || "—"}</td>
                      <td>{s.submittedAt || "—"}</td>
                      <td>
                        <span
                          className={`status-badge ${
                            s.status === "Approved"
                              ? "status-live"
                              : s.status === "Pending"
                              ? "status-pending"
                              : "status-rejected"
                          }`}
                        >
                          {s.status}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            onClick={() => handleAction(s.id, "approve")}
                            disabled={
                              actionLoading === s.id || s.status === "Approved"
                            }
                            className="action-button button-approve"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleAction(s.id, "reject")}
                            disabled={
                              actionLoading === s.id || s.status === "Rejected"
                            }
                            className="action-button button-reject"
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {visible.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center">
                        No seller applications pending review.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </main>
        <Footer />
      </div>
      <style jsx>{`
        .action-button-dark {
          border-radius: 999px;
          background-color: #1f2937; /* gray-800 */
          color: #f9fafb; /* gray-50 */
          padding: 8px 16px;
          font-size: 12px;
          font-weight: 500;
          text-decoration: none;
          white-space: nowrap;
        }
        .action-button-dark:hover {
          background-color: #111827; /* gray-900 */
        }
        .controls {
          margin-bottom: 16px;
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
        }
        .search-input {
          border-radius: 6px;
          border: 1px solid #d1d5db; /* gray-300 */
          padding: 8px 12px;
          font-size: 14px;
          background: #ffffff;
          width: 100%;
          max-width: 320px;
        }
        .search-input:focus {
          outline: none;
          border-color: #3b82f6; /* blue-500 */
          box-shadow: 0 0 0 1px #3b82f6;
        }
        .table-wrapper {
          overflow-x: auto;
          width: 100%;
          border: 1px solid #e5e7eb; /* gray-200 */
          border-radius: 8px;
        }
        .data-table {
          width: 100%;
          min-width: 600px;
          font-size: 14px;
          border-collapse: collapse;
        }
        .data-table thead {
          background-color: #f9fafb; /* gray-50 */
        }
        .data-table th,
        .data-table td {
          padding: 10px 14px;
          text-align: left;
          border-bottom: 1px solid #e5e7eb; /* gray-200 */
          white-space: nowrap;
        }
        .data-table th {
          font-weight: 600;
          color: #374151; /* gray-700 */
          font-size: 12px;
          text-transform: uppercase;
        }
        .data-table td {
          color: #4b5563; /* gray-600 */
        }
        .data-table td.font-medium {
          font-weight: 500;
          color: #111827; /* gray-900 */
        }
        .data-table tbody tr:last-child td {
          border-bottom: none;
        }
        .text-center {
          text-align: center;
          padding: 24px;
          color: #6b7280; /* gray-500 */
        }
        .action-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .action-button {
          border-radius: 999px;
          padding: 4px 12px;
          font-size: 12px;
          font-weight: 500;
          border: none;
          cursor: pointer;
          white-space: nowrap;
        }
        .action-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .button-approve {
          background-color: #16a34a; /* green-600 */
          color: white;
        }
        .button-approve:hover:not(:disabled) {
          background-color: #15803d; /* green-700 */
        }
        .button-reject {
          background-color: #dc2626; /* red-600 */
          color: white;
        }
        .button-reject:hover:not(:disabled) {
          background-color: #b91c1c; /* red-700 */
        }
        .status-badge {
          display: inline-flex;
          border-radius: 999px;
          padding: 2px 8px;
          font-size: 12px;
          font-weight: 500;
        }
        .status-live {
          background-color: #dcfce7; /* green-100 */
          color: #166534; /* green-800 */
        }
        .status-pending {
          background-color: #fef9c3; /* yellow-100 */
          color: #854d0e; /* yellow-800 */
        }
        .status-rejected {
          background-color: #fee2e2; /* red-100 */
          color: #991b1b; /* red-800 */
        }
      `}</style>
    </>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async () => {
  try {
    const snap = await adminDb
      .collection("sellers")
      .orderBy("createdAt", "desc")
      .limit(200)
      .get();

    const items: SellerApplication[] = snap.docs.map((doc) => {
      const d: any = doc.data() || {};
      const rawStatus = String(d.status || "Pending");
      let status: SellerApplication["status"] = "Pending";
      if (/approve/i.test(rawStatus)) status = "Approved";
      else if (/reject/i.test(rawStatus)) status = "Rejected";

      return {
        id: doc.id,
        businessName: d.businessName || d.name || "Seller",
        contactEmail: d.email || d.contactEmail || "",
        submittedAt: d.createdAt?.toDate?.().toLocaleString("en-US") || "",
        status,
      };
    });

    return { props: { items } };
  } catch (err) {
    console.error("Error loading vetting queue", err);
    return { props: { items: [] } };
  }
};
