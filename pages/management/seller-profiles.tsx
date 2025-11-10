// FILE: /pages/management/seller-profiles.tsx
import type { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { adminDb } from "../../utils/firebaseAdmin";
import { useRequireAdmin } from "../../hooks/useRequireAdmin";

type SellerProfile = {
  id: string;
  name: string;
  email: string;
  status: string;
  createdAt: string;
};

type Props = {
  sellers: SellerProfile[];
};

export default function ManagementSellerProfiles({ sellers }: Props) {
  const { loading } = useRequireAdmin();
  if (loading) return <div className="dashboard-page" />; // Light theme skeleton

  return (
    <>
      <Head>
        <title>Seller Profiles / Controls — Admin</title>
      </Head>
      {/* Use light theme classes from globals.css */}
      <div className="dashboard-page">
        <Header />
        <main className="dashboard-main">
          {/* Use light theme classes from globals.css */}
          <div className="dashboard-header">
            <div>
              <h1>Seller Profiles / Controls</h1>
              <p>
                View and edit seller details, statuses, and permissions.
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
                  <th>Seller</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {sellers.map((s) => (
                  <tr key={s.id}>
                    <td>{s.name}</td>
                    <td>{s.email}</td>
                    <td>{s.status}</td>
                    <td>{s.createdAt}</td>
                  </tr>
                ))}
                {sellers.length === 0 && (
                  <tr>
                    <td colSpan={4} className="table-message">
                      No sellers found.
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

    const sellers: SellerProfile[] = snap.docs.map((doc) => {
      const d: any = doc.data() || {};
      return {
        id: doc.id,
        name: d.name || d.businessName || "Seller",
        email: d.email || "",
        status: d.status || "Active",
        createdAt:
          d.createdAt?.toDate?.().toLocaleString("en-US") || "",
      };
    });

    return { props: { sellers } };
  } catch (err) {
    console.error("Error loading seller profiles", err);
    return { props: { sellers: [] } };
  }
};
