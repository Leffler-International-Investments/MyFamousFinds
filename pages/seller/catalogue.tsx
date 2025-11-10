// FILE: /pages/seller/catalogue.tsx
import Head from "next/head";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useEffect, useState } from "react";
import { useRequireSeller } from "../../hooks/useRequireSeller";

type CatalogueItem = {
  id: string;
  title: string;
  price: number;
  status: string;
};

export default function SellerCatalogue() {
  const { loading: authLoading } = useRequireSeller();

  const [items, setItems] = useState<CatalogueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/seller/listings");
        const json = await res.json();
        if (!json.ok) {
          throw new Error(json.error || "Failed to load catalogue");
        }
        if (!cancelled) {
          setItems(json.items || []);
        }
      } catch (err: any) {
        console.error(err);
        if (!cancelled) {
          setError(err?.message || "Unable to load catalogue.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleDelete = async (id: string) => {
    if (deletingId) return;
    if (
      !window.confirm("Are you sure you want to permanently delete this listing?")
    ) {
      return;
    }
    setDeletingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/seller/listings/${id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to delete item");
      }
      setItems((prevItems) => prevItems.filter((item) => item.id !== id));
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  // Use a loading skeleton that matches the dark theme
  if (authLoading) {
    return <div className="dark-theme-page"></div>;
  }

  return (
    // Use the same wrapper class as sell.tsx
    <div className="dark-theme-page">
      <Head>
        <title>My Catalogue - Famous Finds</title>
      </Head>

      <Header />

      {/* Use the same <main> class as sell.tsx */}
      <main className="section">
        {/* Use the same header class as sell.tsx */}
        <div className="section-header">
          <div>
            <h1>My catalogue</h1>
            <p style={{ opacity: 0.8, marginTop: 4 }}>
              Live view of all listings under your seller account.
            </p>
          </div>
          {/* Use the .cta class from globals.css, just like sell.tsx */}
          <Link href="/seller/dashboard" className="cta">
            ← Back to Dashboard
          </Link>
        </div>

        {/* This div holds the buttons */}
        <div className="actions-bar">
          <Link href="/seller/bulk-upload" className="btn-secondary">
            Bulk upload CSV
          </Link>
          <Link href="/sell" className="btn-primary">
            Add single item
          </Link>
        </div>

        {/* Render error message if any, styled like sell.tsx */}
        {error && <p className="banner error">{error}</p>}

        {/* Use the same .sell-card class to wrap the table */}
        <section className="sell-card">
          <div className="table-overflow-wrapper">
            <table className="catalogue-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={4} className="table-message">
                      Loading your listings…
                    </td>
                  </tr>
                )}

                {!loading && !error && items.length === 0 && (
                  <tr>
                    <td colSpan={4} className="table-message">
                      You don&apos;t have any listings yet.
                    </td>
                  </tr>
                )}

                {!loading &&
                  !error &&
                  items.map((x) => (
                    <tr key={x.id}>
                      <td>{x.title}</td>
                      <td>
                        US$
                        {x.price.toLocaleString("en-US", {
                          maximumFractionDigits: 0,
                        })}
                      </td>
                      <td>{x.status}</td>
                      <td className="actions-cell">
                        <Link
                          href={`/product/${x.id}`}
                          className="btn-table-view"
                        >
                          View
                        </Link>
                        <button
                          onClick={() => handleDelete(x.id)}
                          disabled={deletingId === x.id}
                          className="btn-table-delete"
                        >
                          {deletingId === x.id ? "Deleting..." : "Delete"}
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      <Footer />

      {/* This <style jsx> block is added to match sell.tsx.
        It copies styles from sell.tsx and adds styles for the table.
      */}
      <style jsx>{`
        /* Copied from sell.tsx */
        .sell-card {
          background: #111827;
          border-radius: 16px;
          padding: 18px 18px 20px;
          border: 1px solid #1f2937;
        }

        /* New styles for catalogue page */
        .actions-bar {
          display: flex;
          gap: 12px;
          margin-bottom: 20px;
        }

        .btn-primary,
        .btn-secondary {
          display: inline-block;
          padding: 10px 16px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          font-size: 14px;
          text-decoration: none;
        }

        .btn-primary {
          background: white;
          color: black;
          border: none;
        }

        .btn-secondary {
          border: 1px solid #fff;
          color: #fff;
        }

        .table-overflow-wrapper {
          overflow-x: auto;
        }

        .catalogue-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 14px;
          color: #e5e7eb; /* Light text */
        }

        .catalogue-table th,
        .catalogue-table td {
          padding: 10px 12px;
          text-align: left;
          border-bottom: 1px solid #374151; /* Dark border */
        }

        .catalogue-table th {
          font-size: 12px;
          text-transform: uppercase;
          color: #9ca3af; /* Muted header text */
          font-weight: 500;
        }

        .catalogue-table tr:last-child td {
          border-bottom: none;
        }

        .table-message {
          text-align: center;
          color: #9ca3af;
          padding: 24px;
        }

        .actions-cell {
          display: flex;
          justify-content: flex-start;
          gap: 12px;
        }

        .btn-table-view,
        .btn-table-delete {
          padding: 4px 10px;
          font-size: 12px;
          font-weight: 500;
          border-radius: 999px;
          text-decoration: none;
          cursor: pointer;
        }

        .btn-table-view {
          border: 1px solid #374151;
          color: #e5e7eb;
          background: #1f2937;
        }
        .btn-table-view:hover {
          border-color: #6b7280;
        }

        .btn-table-delete {
          border: 1px solid #b91c1c; /* Red border */
          color: #fca5a5; /* Red text */
          background: #7f1d1d; /* Dark red bg */
        }
        .btn-table-delete:hover {
          opacity: 0.8;
        }
        .btn-table-delete:disabled {
          opacity: 0.5;
        }

        /* Error banner styles */
        .banner {
          margin-bottom: 16px;
          padding: 8px 10px;
          border-radius: 6px;
          font-size: 13px;
        }
        .error {
          background: #7f1d1d; /* red-900 */
          color: #fee2e2; /* red-100 */
        }
      `}</style>
    </div>
  );
}
