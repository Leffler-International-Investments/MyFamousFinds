// FILE: /pages/seller/catalogue.tsx
import Head from "next/head";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useEffect, useState } from "react";
// Import the same security hook as your dashboard
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

  if (authLoading) {
    // Use the dashboard-page class to prevent style flashing
    return <div className="dashboard-page"></div>;
  }

  return (
    <>
      <Head>
        <title>My Catalogue - Seller Console</title>
      </Head>
      {/*
        This page uses the "dashboard-page" class from globals.css
        to match the style of your Seller Dashboard
      */}
      <div className="dashboard-page">
        <Header />
        <main className="dashboard-main">
          {/* Page header (styles from globals.css) */}
          <div className="dashboard-header">
            <div>
              <h1>My catalogue</h1>
              <p>Live view of all listings under your seller account.</p>
            </div>
            <Link href="/seller/dashboard">← Back to Dashboard</Link>
          </div>

          {/* Action buttons (styles from globals.css) */}
          <div className="catalogue-actions-bar">
            <Link
              href="/seller/bulk-upload"
              className="catalogue-button-secondary"
            >
              Bulk upload CSV
            </Link>
            <Link href="/sell" className="catalogue-button">
              Add single item
            </Link>
          </div>

          {/* Render error message if any */}
          {error && <div className="auth-error" style={{marginBottom: 16}}>{error}</div>}

          {/* Catalogue Table (styles from globals.css) */}
          <div className="catalogue-table-wrapper">
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
                    <td colSpan={4} style={{ textAlign: "center", padding: 16 }}>
                      Loading your listings…
                    </td>
                  </tr>
                )}

                {!loading && !error && items.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ textAlign: "center", padding: 16 }}>
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
                      <td className="catalogue-table-actions">
                        <Link
                          href={`/product/${x.id}`}
                          className="catalogue-table-button"
                        >
                          View
                        </Link>
                        <button
                          type="button"
                          className="catalogue-table-button delete"
                          onClick={() => handleDelete(x.id)}
                          disabled={deletingId === x.id}
                        >
                          {deletingId === x.id ? "Deleting..." : "Delete"}
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}
