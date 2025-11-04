// FILE: /pages/management/listings.tsx
import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useRequireAdmin } from "../../hooks/useRequireAdmin";

type Listing = {
  id: string;
  title: string;
  seller: string;
  status: "Live" | "Pending" | "Rejected";
  price: number;
};

export default function ManagementListings() {
  const { loading: authLoading } = useRequireAdmin();

  const [items, setItems] = useState<Listing[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Fetch live data whenever searchTerm changes
  useEffect(() => {
    if (authLoading) return;

    const controller = new AbortController();

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (searchTerm.trim()) params.set("search", searchTerm.trim());

        const res = await fetch(
          `/api/management/listings?${params.toString()}`,
          {
            signal: controller.signal,
            credentials: "include",
          }
        );

        if (!res.ok) {
          throw new Error(`Request failed: ${res.status}`);
        }

        const json = await res.json();
        // Expecting { items: Listing[] }
        setItems(Array.isArray(json.items) ? json.items : []);
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.error(err);
          setError("Failed to load listings.");
        }
      } finally {
        setLoading(false);
      }
    }

    load();
    return () => controller.abort();
  }, [searchTerm, authLoading]);

  if (authLoading) return null;

  return (
    <>
      <Head>
        <title>All Listings — Admin</title>
      </Head>
      <div className="min-h-screen bg-gray-50 text-gray-900">
        <Header />
        <main className="mx-auto max-w-6xl px-4 pb-16 pt-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                All Listings
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Search, review, and moderate every item on Famous-Finds.
              </p>
            </div>
            <Link
              href="/management/dashboard"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              ← Back to Management Dashboard
            </Link>
          </div>

          {/* Search + Status filter (searchTerm is live) */}
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <input
              type="text"
              placeholder="Search by title, ID, or seller…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full max-w-xs rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none"
            />
            {/* Optional: front-end filter, or attach its value to the query string */}
            <select className="rounded-md border border-gray-300 px-2 py-2 text-sm focus:border-gray-900 focus:outline-none">
              <option>All statuses</option>
              <option>Live</option>
              <option>Pending</option>
              <option>Rejected</option>
            </select>
          </div>

          {error && (
            <p className="mb-3 text-sm text-red-600">
              {error}
            </p>
          )}

          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            {loading ? (
              <div className="px-4 py-8 text-center text-sm text-gray-500">
                Loading listings…
              </div>
            ) : items.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-gray-500">
                No listings found.
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium text-gray-700">
                      ID
                    </th>
                    <th className="px-4 py-2 text-left font-medium text-gray-700">
                      Item
                    </th>
                    <th className="px-4 py-2 text-left font-medium text-gray-700">
                      Seller
                    </th>
                    <th className="px-4 py-2 text-left font-medium text-gray-700">
                      Status
                    </th>
                    <th className="px-4 py-2 text-right font-medium text-gray-700">
                      Price (USD)
                    </th>
                    <th className="px-4 py-2 text-right font-medium text-gray-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-2 text-gray-900">{item.id}</td>
                      <td className="px-4 py-2 text-gray-900">{item.title}</td>
                      <td className="px-4 py-2 text-gray-700">{item.seller}</td>
                      <td className="px-4 py-2">
                        <span
                          className={
                            "rounded-full px-3 py-1 text-xs font-medium " +
                            (item.status === "Live"
                              ? "bg-green-100 text-green-800"
                              : item.status === "Pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800")
                          }
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right text-gray-900">
                        ${item.price.toLocaleString()}
                      </td>
                      <td className="px-4 py-2 text-right">
                        <button className="text-xs font-medium text-gray-700 hover:text-gray-900">
                          Review
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <p className="mt-4 text-xs text-gray-500">
            Backend TODO: implement <code>/api/management/listings</code> to
            accept a <code>?search=</code> param and return{" "}
            <code>{`{ items: Listing[] }`}</code>.
          </p>
        </main>
        <Footer />
      </div>
    </>
  );
}
