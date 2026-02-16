// FILE: /pages/seller/catalogue.tsx

import Head from "next/head";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useEffect, useState } from "react";
import { useRequireSeller } from "../../hooks/useRequireSeller";
import { sellerFetch } from "../../utils/sellerClient";

// NEW: use client Firestore to toggle allowOffers
import { db } from "../../utils/firebaseClient";
import { doc, updateDoc } from "firebase/firestore";

type CatalogueItem = {
  id: string;
  title: string;
  price: number;
  status: string;
  purchase_proof: string;
  proof_doc_url: string;
  details: string;
  allowOffers?: boolean;
};

export default function SellerCatalogue() {
  const { loading: authLoading } = useRequireSeller();

  const [items, setItems] = useState<CatalogueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await sellerFetch("/api/seller/listings");
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
      const res = await sellerFetch(`/api/seller/listings/${id}`, {
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

  // TOGGLE "MAKE AN OFFER" USING FIRESTORE DIRECTLY
  const handleToggleOffers = async (item: CatalogueItem) => {
    if (togglingId) return;

    const current = !!item.allowOffers;
    setTogglingId(item.id);
    setError(null);

    try {
      const ref = doc(db, "listings", item.id);
      await updateDoc(ref, { allowOffers: !current });

      // update local UI state
      setItems((prev) =>
        prev.map((x) =>
          x.id === item.id ? { ...x, allowOffers: !current } : x
        )
      );
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Unable to update offer setting.");
    } finally {
      setTogglingId(null);
    }
  };

  if (authLoading) {
    return <div className="dark-theme-page"></div>;
  }

  return (
    <div className="dark-theme-page">
      <Head>
        <title>My Catalogue - Famous Finds</title>
      </Head>

      <Header />

      <main className="section">
        <div className="section-header">
          <div>
            <h1>My catalogue</h1>
            <p style={{ opacity: 0.8, marginTop: 4 }}>
              Live view of all listings under your seller account.
            </p>
          </div>
          <Link href="/seller/dashboard" className="cta">
            ← Back to Dashboard
          </Link>
        </div>

        <div className="actions-bar">
          <Link href="/seller/bulk-upload" className="btn-secondary">
            Bulk upload CSV
          </Link>
          <Link href="/sell" className="btn-primary">
            Add single item
          </Link>
        </div>

        {error && <p className="banner error">{error}</p>}

        <section className="sell-card">
          <div className="table-overflow-wrapper">
            <table className="catalogue-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th>Details</th>
                  <th>Proof</th>
                  <th>Proof Doc</th>
                  <th>Make an offer</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={8} className="table-message">
                      Loading your listings…
                    </td>
                  </tr>
                )}

                {!loading && !error && items.length === 0 && (
                  <tr>
                    <td colSpan={8} className="table-message">
                      You don&apos;t have any listings yet.
                    </td>
                  </tr>
                )}

                {!loading &&
                  !error &&
                  items.map((x) => {
                    const offersOn = !!x.allowOffers;
                    return (
                      <tr key={x.id}>
                        <td>{x.title}</td>
                        <td>
                          US$
                          {x.price.toLocaleString("en-US", {
                            maximumFractionDigits: 0,
                          })}
                        </td>
                        <td>{x.status}</td>
                        <td className="cell-details">{x.details || "—"}</td>
                        <td>
                          {x.purchase_proof === "Requested" ? (
                            <span className="proof-requested">Proof requested</span>
                          ) : (
                            x.purchase_proof || "—"
                          )}
                        </td>
                        <td>
                          {x.proof_doc_url ? (
                            <a
                              href={x.proof_doc_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn-proof-open"
                            >
                              View
                            </a>
                          ) : (
                            <span className="no-proof">—</span>
                          )}
                        </td>
                        <td>
                          <button
                            className={`btn-offer-toggle ${
                              offersOn ? "on" : "off"
                            }`}
                            disabled={togglingId === x.id}
                            onClick={() => handleToggleOffers(x)}
                          >
                            {togglingId === x.id
                              ? "Updating..."
                              : offersOn
                              ? "Enabled"
                              : "Disabled"}
                          </button>
                        </td>
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
                    );
                  })}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      <Footer />

      <style jsx>{`
        .sell-card {
          background: #111827;
          border-radius: 16px;
          padding: 18px 18px 20px;
          border: 1px solid #1f2937;
        }

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
          color: #e5e7eb;
        }

        .catalogue-table th,
        .catalogue-table td {
          padding: 10px 12px;
          text-align: left;
          border-bottom: 1px solid #374151;
        }

        .catalogue-table th {
          font-size: 12px;
          text-transform: uppercase;
          color: #9ca3af;
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
          border: 1px solid #b91c1c;
          color: #fca5a5;
          background: #7f1d1d;
        }
        .btn-table-delete:hover {
          opacity: 0.8;
        }
        .btn-table-delete:disabled {
          opacity: 0.5;
        }

        .btn-offer-toggle {
          padding: 4px 10px;
          font-size: 12px;
          font-weight: 500;
          border-radius: 999px;
          border: 1px solid #374151;
          background: #111827;
          color: #e5e7eb;
          cursor: pointer;
        }
        .btn-offer-toggle.on {
          border-color: #10b981;
          background: #064e3b;
          color: #a7f3d0;
        }
        .btn-offer-toggle.off {
          border-color: #4b5563;
          background: #111827;
          color: #9ca3af;
        }
        .btn-offer-toggle:disabled {
          opacity: 0.6;
          cursor: default;
        }

        .cell-details {
          max-width: 160px;
          font-size: 12px;
          color: #9ca3af;
          white-space: pre-wrap;
          word-break: break-word;
        }
        .proof-requested {
          color: #f59e0b;
          font-weight: 600;
          font-size: 12px;
        }
        .no-proof {
          color: #6b7280;
          font-size: 12px;
        }
        .btn-proof-open {
          display: inline-block;
          background: #2563eb;
          color: #fff;
          border-radius: 999px;
          padding: 4px 10px;
          font-size: 12px;
          text-decoration: none;
          white-space: nowrap;
        }
        .btn-proof-open:hover {
          background: #1d4ed8;
        }

        .banner {
          margin-bottom: 16px;
          padding: 8px 10px;
          border-radius: 6px;
          font-size: 13px;
        }
        .error {
          background: #7f1d1d;
          color: #fee2e2;
        }
      `}</style>
    </div>
  );
}
