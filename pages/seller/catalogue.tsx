// FILE: /pages/seller/catalogue.tsx
import Head from "next/head";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useEffect, useState } from "react";

type CatalogueItem = {
  id: string;
  title: string;
  price: number;
  status: string;
};

export default function Catalogue() {
  const [items, setItems] = useState<CatalogueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- ADDED: State for delete button ---
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        // --- THIS NOW CALLS THE CORRECT API PATH ---
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

  // --- ADDED: Handle Delete Function ---
  const handleDelete = async (id: string) => {
    if (deletingId) return; // Prevent multiple deletes

    if (
      !window.confirm("Are you sure you want to permanently delete this listing?")
    ) {
      return;
    }

    setDeletingId(id);
    setError(null);
    try {
      // --- THIS NOW CALLS THE CORRECT API PATH ---
      const res = await fetch(`/api/seller/listings/${id}`, {
        method: "DELETE",
      });
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Failed to delete item");
      }

      // Success: Remove item from the local list
      setItems((prevItems) => prevItems.filter((item) => item.id !== id));
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-black text-gray-100">
      <Head>
        <title>Seller — Catalogue | Famous Finds</title>
      </Head>

      <Header />

      <main className="mx-auto max-w-5xl px-4 pb-16 pt-6 text-sm">
        <Link
          href="/seller/dashboard"
          className="text-xs text-gray-400 hover:text-gray-200"
        >
          ← Back to Dashboard
        </Link>
        <h1 className="mt-4 text-2xl font-semibold text-white">
          My catalogue
        </h1>
        <p className="mt-1 text-sm text-gray-400">
          Live view of all listings under your seller account.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/seller/bulk-upload"
            className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-black hover:bg-gray-100"
          >
            Bulk upload CSV
          </Link>
          <Link
            href="/sell"
            className="rounded-full border border-neutral-700 px-3 py-1.5 text-xs hover:border-neutral-500"
          >
            Add single item
          </Link>
        </div>

        <section className="mt-6 rounded-xl border border-neutral-800 bg-neutral-950 p-4">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-xs">
              <thead className="border-b border-neutral-800 text-[11px] uppercase tracking-wide text-gray-400">
                <tr>
                  <th className="py-2 pr-3 text-left">Title</th>
                  <th className="px-3 py-2 text-left">Price</th>
                  <th className="px-3 py-2 text-left">Status</th>
                  <th className="px-3 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td
                      className="py-4 text-center text-xs text-gray-400"
                      colSpan={4}
                    >
                      Loading your listings…
                    </td>
                  </tr>
                )}

                {!loading && error && (
                  <tr>
                    <td
                      className="py-4 text-center text-xs text-red-400"
                      colSpan={4}
                    >
                      {error}
                    </td>
                  </tr>
Dosn't 
                )}

                {!loading && !error && items.length === 0 && (
                  <tr>
                    <td
                      className="py-4 text-center text-xs text-gray-400"
                      colSpan={4}
                    >
                      You don&apos;t have any listings yet.
                    </td>
                  </tr>
                )}

                {!loading &&
                  !error &&
                  items.map((x) => (
                    <tr
                      key={x.id}
                      className="border-b border-neutral-900 last:border-0"
                    >
                      <td className="py-2 pr-3">{x.title}</td>
                      <td className="px-3 py-2">
                        {/* --- UPDATED: Currency to USD --- */}
                        US$
                        {x.price.toLocaleString("en-US", {
                          maximumFractionDigits: 0,
                        })}
                      </td>
                      <td className="px-3 py-2">{x.status}</td>
                      <td
                        className="px-3 py-2 text-right"
                        style={{
                          display: "flex",
                          justifyContent: "flex-end",
                          gap: "8px",
                        }}
                      >
                        {/* --- THIS IS THE FIX --- */}
                        <Link
                          href={`/product/${x.id}`} // <-- Changed from /listing/ to /product/
                          className="rounded-full border border-neutral-700 px-3 py-1 text-[11px] hover:border-neutral-500"
                        >
                          View
                        </Link>
                        {/* ------------------------ */}

                        <button
                          onClick={() => handleDelete(x.id)}
                          disabled={deletingId === x.id}
                          className="rounded-full border border-red-900/80 bg-red-500/10 px-3 py-1 text-[11px] text-red-400 hover:border-red-700 disabled:opacity-50"
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
    </div>
  );
}
