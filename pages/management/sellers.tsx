// FILE: /pages/management/sellers.tsx
import { useMemo, useState } from "react";
import type { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { adminDb } from "../../utils/firebaseAdmin";
import { useRequireAdmin } from "../../hooks/useRequireAdmin";

type SellerRow = {
  id: string;
  name: string;
  email: string;
  status: string;
  totalListings: number;
  createdAt: string;
};

type Props = {
  sellers: SellerRow[];
};

export default function ManagementSellers({ sellers }: Props) {
  const { loading } } = useRequireAdmin();
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sellers;
    return sellers.filter((s) => {
      return (
        s.name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q)
      );
    });
  }, [sellers, query]);

  if (loading) return <div className="dashboard-page"></div>;

  return (
    <>
      <Head>
        <title>Seller Directory — Admin</title>
      </Head>
      <div className="dashboard-page">
        <Header />

        <main className="dashboard-main">
          <div className="dashboard-header">
            <div>
              <h1>Seller Directory</h1>
              <p>View and manage all active sellers on Famous-Finds.</p>
            </div>
            <Link href="/management/dashboard">
              ← Back to Management Dashboard
            </Link>
          </div>

          <section className="dashboard-section">
            <div className="controls">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by seller name, email, or ID…"
                className="search-input"
              />
            </div>

            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Seller</th>
                    <th>Email</th>
                    <th>Status</th>
                    <th className="text-right">Listings</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((s) => (
                    <tr key={s.id}>
                      <td className="font-medium">{s.name}</td>
                      <td>{s.email}</td>
                      <td>{s.status}</td>
                      <td className="text-right">
                        {s.totalListings.toLocaleString("en-US")}
                      </td>
                      <td>{s.createdAt}</td>
                    </tr>
                  ))}
                  {visible.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center">
                        No sellers match this search.
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
        .controls {
          margin-bottom: 16px;
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
        }
        .search-input,
        .filter-select {
          border-radius: 6px;
          border: 1px solid #d1d5db; /* gray-300 */
          padding: 8px 12px;
          font-size: 14px;
          background: #ffffff;
        }
        .search-input {
          width: 100%;
          max-width: 320px;
        }
        .search-input:focus,
        .filter-select:focus {
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
        .text-right {
          text-align: right;
        }
        .text-center {
          text-align: center;
          padding: 24px;
          color: #6b7280; /* gray-500 */
        }
      `}</style>
    </>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async () => {
  try {
    const [sellersSnap, listingsSnap] = await Promise.all([
      adminDb.collection("sellers").get(),
      adminDb.collection("listings").get(),
    ]);

    const listingsBySeller: Record<string, number> = {};
    listingsSnap.docs.forEach((doc) => {
      const d: any = doc.data() || {};
      const sellerId = d.sellerId || d.seller || "";
      if (!sellerId) return;
      listingsBySeller[sellerId] = (listingsBySeller[sellerId] || 0) + 1;
    });

    const sellers: SellerRow[] = sellersSnap.docs.map((doc) => {
      const d: any = doc.data() || {};
      const id = doc.id;
      return {
        id,
        name: d.name || d.businessName || "Seller",
        email: d.email || "",
        status: d.status || "Active",
        totalListings: listingsBySeller[id] || 0,
        createdAt:
          d.createdAt?.toDate?.().toLocaleString("en-US") || "",
      };
    });

    return { props: { sellers } };
  } catch (err) {
    console.error("Error loading sellers", err);
    return { props: { sellers: [] } };
  }
};
