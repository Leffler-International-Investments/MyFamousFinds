// FILE: /pages/management/categories.tsx
import { useState } from "react";
import type { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { adminDb } from "../../utils/firebaseAdmin";
import { useRequireAdmin } from "../../hooks/useRequireAdmin";

type Category = {
  id: string;
  name: string;
  slug: string;
  parent?: string;
  active: boolean;
};

type Props = {
  categories: Category[];
};

export default function ManagementCategories({ categories }: Props) {
  const { loading } = useRequireAdmin();
  const [items] = useState(categories);

  if (loading) return <div className="dashboard-page" />; // Light theme skeleton

  return (
    <>
      <Head>
        <title>Categories &amp; Attributes — Admin</title>
      </Head>

      {/* Use light theme classes from globals.css */}
      <div className="dashboard-page">
        <Header />

        <main className="dashboard-main">
          {/* Use light theme classes from globals.css */}
          <div className="dashboard-header">
            <div>
              <h1>Categories &amp; Attributes</h1>
              <p>
                Manage your top-level categories and how items are structured throughout
                Famous Finds.
              </p>
            </div>
            <Link href="/management/dashboard">
              ← Back to Management Dashboard
            </Link>
          </div>

          <div className="filters-bar">
            <button className="btn-primary-dark" disabled>
              + Add Category (coming soon)
            </button>
          </div>

          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Slug</th>
                  <th>Parent</th>
                  <th>Active</th>
                </tr>
              </thead>
              <tbody>
                {items.map((cat) => (
                  <tr key={cat.id}>
                    <td>{cat.name}</td>
                    <td>{cat.slug}</td>
                    <td>{cat.parent || "Top level"}</td>
                    <td>
                      <span
                        className={
                          "status-badge " +
                          (cat.active ? "status-active" : "status-hidden")
                        }
                      >
                        {cat.active ? "Active" : "Hidden"}
                      </span>
                    </td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={4} className="table-message">
                      No categories configured yet.
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
          justify-content: flex-end;
          gap: 12px;
        }
        
        .btn-primary-dark {
          border-radius: 999px;
          background: #111827; /* gray-900 */
          padding: 8px 16px;
          font-size: 12px;
          font-weight: 500;
          color: #ffffff;
          text-decoration: none;
          border: none;
        }
        .btn-primary-dark:disabled {
          opacity: 0.7;
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
  if (!adminDb) return { props: { categories: [] } };

  try {
    const snap = await adminDb.collection("categories").get();
    const categories: Category[] = snap.docs.map((doc) => {
      const d: any = doc.data() || {};
      return {
        id: doc.id,
        name: d.name || "Category",
        slug: d.slug || doc.id,
        parent: d.parent || "",
        active: !!d.active,
      };
    });

    return { props: { categories } };
  } catch (err) {
    console.error("Error loading categories", err);
    return { props: { categories: [] } };
  }
};
