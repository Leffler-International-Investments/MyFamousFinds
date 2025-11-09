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
  const { loading } } = useRequireAdmin();
  const [items] = useState(categories);

  if (loading) return <div className="dashboard-page"></div>;

  return (
    <>
      <Head>
        <title>Categories &amp; Attributes — Admin</title>
      </Head>

      <div className="dashboard-page">
        <Header />

        <main className="dashboard-main">
          <div className="dashboard-header">
            <div>
              <h1>Categories &amp; Attributes</h1>
              <p>
                Manage your top-level categories and how items are structured.
              </p>
            </div>
            <Link href="/management/dashboard">
              ← Back to Management Dashboard
            </Link>
          </div>

          <section className="dashboard-section">
            <div className="controls">
              <button className="action-button-dark" disabled>
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
                      <td className="font-medium">{cat.name}</td>
                      <td>{cat.slug}</td>
                      <td>{cat.parent || "Top level"}</td>
                      <td>
                        <span
                          className={`status-badge ${
                            cat.active ? "status-live" : "status-gray"
                          }`}
                        >
                          {cat.active ? "Active" : "Hidden"}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {items.length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center">
                        No categories configured yet.
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
          justify-content: flex-end;
        }
        .action-button-dark {
          border-radius: 999px;
          background-color: #1f2937; /* gray-800 */
          color: #f9fafb; /* gray-50 */
          padding: 8px 16px;
          font-size: 12px;
          font-weight: 500;
          text-decoration: none;
          white-space: nowrap;
          border: none;
          cursor: pointer;
        }
        .action-button-dark:hover:not(:disabled) {
          background-color: #111827; /* gray-900 */
        }
        .action-button-dark:disabled {
          opacity: 0.6;
          cursor: not-allowed;
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
        .status-gray {
          background-color: #f3f4f6; /* gray-100 */
          color: #374151; /* gray-700 */
        }
      `}</style>
    </>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async () => {
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
