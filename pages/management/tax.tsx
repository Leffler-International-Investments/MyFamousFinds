// FILE: /pages/management/tax.tsx
import type { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useRequireAdmin } from "../../hooks/useRequireAdmin";
import { adminDb } from "../../utils/firebaseAdmin";

type TaxSummaryRow = {
  id: string;
  sellerName: string;
  year: number;
  grossSales: number;
  formsIssued: boolean;
};

type Props = {
  summaries: TaxSummaryRow[];
};

export default function ManagementTax({ summaries }: Props) {
  const { loading } = useRequireAdmin();
  if (loading) return <div className="dashboard-page" />; // Light theme skeleton

  const hasAny = summaries.length > 0;

  return (
    <>
      <Head>
        <title>Tax &amp; Compliance — US Reporting</title>
      </Head>
      {/* Use light theme classes from globals.css */}
      <div className="dashboard-page">
        <Header />
        <main className="dashboard-main">
          {/* Use light theme classes from globals.css */}
          <div className="dashboard-header">
            <div>
              <h1>Tax &amp; Compliance</h1>
              <p>
                View annual US-dollar sales totals and tax form issuance for
                sellers.
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
                  <th>Tax Year</th>
                  <th style={{ textAlign: "right" }}>Gross Sales (USD)</th>
                  <th>Form Issued</th>
                </tr>
              </thead>
              <tbody>
                {hasAny ? (
                  summaries.map((row) => (
                    <tr key={row.id}>
                      <td>{row.sellerName}</td>
                      <td>{row.year}</td>
                      <td style={{ textAlign: "right" }}>
                        {row.grossSales.toLocaleString("en-US", {
                          style: "currency",
                          currency: "USD",
                        })}
                      </td>
                      <td>
                        <span
                          className={
                            "status-badge " +
                            (row.formsIssued
                              ? "status-active"
                              : "status-hidden")
                          }
                        >
                          {row.formsIssued ? "Issued" : "Not yet issued"}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="table-message">
                      No tax summaries recorded yet.
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
        
        .status-badge {
          display: inline-flex;
          border-radius: 999px;
          padding: 2px 8px;
          font-size: 12px;
          font-weight: 500;
        }
        .status-active {
          background: #d1fae5; /* green-100 */
          color: #065f46; /* green-800 */
        }
        .status-hidden {
          background: #e5e7eb; /* gray-200 */
          color: #374151; /* gray-700 */
        }
      `}</style>
    </>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async () => {
  if (!adminDb) return { props: { summaries: [] } };

  try {
    const snap = await adminDb
      .collection("taxSummaries")
      .orderBy("year", "desc")
      .limit(200)
      .get();

    const summaries: TaxSummaryRow[] = snap.docs.map((doc) => {
      const d: any = doc.data() || {};
      const year =
        typeof d.year === "number"
          ? d.year
          : typeof d.year === "string"
          ? Number(d.year) || new Date().getFullYear()
          : new Date().getFullYear();
      const grossRaw = d.grossSales ?? d.totalGross ?? 0;
      const gross =
        typeof grossRaw === "number"
          ? grossRaw
          : typeof grossRaw === "string"
          ? Number(grossRaw) || 0
          : 0;

      return {
        id: doc.id,
        sellerName: d.sellerName || d.sellerId || "Seller",
        year,
        grossSales: gross,
        formsIssued: !!(d.formsIssued || d.formIssued),
      };
    });

    return { props: { summaries } };
  } catch (err) {
    console.error("Error loading tax summaries", err);
    return { props: { summaries: [] } };
  }
};
