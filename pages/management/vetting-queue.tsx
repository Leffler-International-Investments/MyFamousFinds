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
  const { loading } = useRequireAdmin();
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

  if (loading) return <div className="dashboard-page" />; // Use light theme skeleton

  return (
    <>
      <Head>
        <title>Seller Vetting Queue — Admin</title>
      </Head>
      {/* Use light theme classes from globals.css */}
      <div className="dashboard-page">
        <Header />
        <main className="dashboard-main">
          {/* Use light theme classes from globals.css */}
          <div className="dashboard-header">
            <div>
              <h1>Seller Vetting Queue</h1>
              <p>
                One row per seller application. Once a seller is approved,
                new products go to{" "}
                <strong>Listing Review Queue</strong>, not this page.
              </p>
            </div>
            <Link href="/management/dashboard" className="btn-primary-dark">
              ← Back to admin home
            </Link>
          </div>

          <div className="filters-bar">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by business, email, or ID…"
              className="form-input"
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
                    <td>{s.businessName || "—"}</td>
                    <td>{s.contactEmail || "—"}</td>
                    <td>{s.submittedAt || "—"}</td>
                    <td>{s.status}</td>
                    <td>
                      <div className="actions-cell">
                        <button
                          onClick={() => handleAction(s.id, "approve")}
                          disabled={
                            actionLoading === s.id || s.status === "Approved"
                          }
                          className="btn-table btn-approve"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleAction(s.id, "reject")}
                          disabled={
                            actionLoading === s.id || s.status === "Rejected"
                          }
                          className="btn-table btn-reject"
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {visible.length === 0 && (
                  <tr>
                    <td colSpan={5} className="table-message">
                      No seller applications pending review.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </main>
        <Footer />
      </div>

      {/* Styles for the light theme table and forms */}
      <style jsx>{`
        .filters-bar {
          margin-bottom: 16px;
          display: flex;
          gap: 12px;
        }
        .form-input {
          width: 100%;
          max-width: 320px;
          border-radius: 6px;
          border: 1px solid #d1d5db; /* gray-300 */
          padding: 8px 12px;
          font-size: 14px;
        }
        .form-input:focus {
          border-color: #111827; /* gray-900 */
          outline: none;
        }

        .btn-primary-dark {
          border-radius: 999px;
          background: #111827; /* gray-900 */
          padding: 8px 16px;
          font-size: 12px;
          font-weight: 500;
          color: #ffffff;
          text-decoration: none;
        }
        .btn-primary-dark:hover {
          background: #000;
        }
        
        .table-wrapper {
          overflow-x: auto;
          border-radius: 8px;
          border: 1px solid #e5e7eb; /* gray-200 */
          background: #ffffff;
          box-shadow: 0 1px 2px 0 rgba(0,0,0,0.05);
        }
        .data-table {
          min-width: 100%;
          border-collapse: collapse;
          font-size: 14px;
        }
        .data-table thead {
          background: #f9fafb; /* gray-50 */
        }
        .data-table th {
          padding: 8px 12px;
          text-align: left;
          font-weight: 500;
          color: #374151; /* gray-700 */
        }
        .data-table tbody tr {
          border-bottom: 1px solid #f3f4f6; /* gray-100 */
        }
        .data-table tbody tr:last-child {
          border-bottom: none;
        }
        .data-table td {
          padding: 8px 12px;
          color: #111827; /* gray-900 */
        }
        .data-table td:first-child {
          font-weight: 500;
        }
        .table-message {
          padding: 24px;
          text-align: center;
          color: #6b7280; /* gray-500 */
        }

        .actions-cell {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .btn-table {
          border-radius: 999px;
          padding: 4px 12px;
          font-size: 12px;
          font-weight: 600;
          border: none;
          cursor: pointer;
        }
        .btn-table:disabled {
          opacity: 0.5;
        }
        .btn-approve {
          background: #059669; /* green-600 */
          color: white;
        }
        .btn-reject {
          background: #dc2626; /* red-600 */
          color: white;
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
