// FILE: /pages/management/disputes.tsx
import type { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { adminDb } from "../../utils/firebaseAdmin";
import { useRequireAdmin } from "../../hooks/useRequireAdmin";

type Dispute = {
  id: string;
  orderId: string;
  buyerEmail: string;
  sellerEmail: string;
  reason: string;
  status: string;
  createdAt: string;
};

type Props = {
  disputes: Dispute[];
};

export default function ManagementDisputes({ disputes }: Props) {
  const { loading } = useRequireAdmin();
  if (loading) return <div className="dashboard-page" />; // Light theme skeleton

  return (
    <>
      <Head>
        <title>Returns &amp; Disputes — Admin</title>
      </Head>
      {/* Use light theme classes from globals.css */}
      <div className="dashboard-page">
        <Header />
        <main className="dashboard-main">
          {/* Use light theme classes from globals.css */}
          <div className="dashboard-header">
            <div>
              <h1>Returns &amp; Disputes</h1>
              <p>
                Review active disputes between buyers and sellers and track their
                outcomes.
              </p>
            </div>
            <Link href="/management/dashboard">
              ← Back to Management Dashboard
            </Link>
          </div>

          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Dispute ID</th>
                  <th>Order</th>
                  <th>Buyer</th>
                  <th>Seller</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {disputes.map((d) => (
                  <tr key={d.id}>
                    <td>{d.id}</td>
                    <td>{d.orderId}</td>
                    <td>{d.buyerEmail || "—"}</td>
                    <td>{d.sellerEmail || "—"}</td>
                    <td>{d.reason}</td>
                    <td>{d.status}</td>
                    <td>{d.createdAt}</td>
                  </tr>
                ))}
                {disputes.length === 0 && (
                  <tr>
                    <td colSpan={7} className="table-message">
                      No disputes recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </main>
        <Footer />
      </div>

      {/* Styles for the light theme table */}
      <style jsx>{`
        .table-wrapper {
          overflow-x: auto;
          border-radius: 8px;
          border: 1px solid #e5e7eb; /* gray-200 */
          background: #ffffff;
          box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
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
      `}</style>
    </>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async () => {
  try {
    const snap = await adminDb
      .collection("disputes")
      .orderBy("createdAt", "desc")
      .limit(200)
      .get();

    const disputes: Dispute[] = snap.docs.map((doc) => {
      const d: any = doc.data() || {};
      return {
        id: doc.id,
        orderId: d.orderId || "",
        buyerEmail: d.buyerEmail || d.buyer || "",
        sellerEmail: d.sellerEmail || d.seller || "",
        reason: d.reason || "",
        status: d.status || "Open",
        createdAt:
          d.createdAt?.toDate?.().toLocaleString("en-US") || "",
      };
    });

    return { props: { disputes } };
  } catch (err) {
    console.error("Error loading disputes", err);
    return { props: { disputes: [] } };
  }
};
