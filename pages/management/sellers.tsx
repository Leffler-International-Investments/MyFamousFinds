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
  const { loading } = useRequireAdmin();
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

  if (loading) return null;

  return (
    <>
      <Head>
        <title>Seller Directory — Admin</title>
      </Head>
      <div className="min-h-screen bg-gray-50 text-gray-900">
        <Header />

        <main className="mx-auto max-w-6xl px-4 pb-16 pt-6">
          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Seller Directory
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                View and manage all active sellers on Famous-Finds.
              </p>
            </div>
            <Link
              href="/management/dashboard"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              ← Back to Management Dashboard
            </Link>
          </div>

          <div className="mb-4 flex flex-wrap items-center gap-3">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by seller name, email, or ID…"
              className="w-full max-w-xs rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
            />
          </div>

          <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-gray-700">
                    Seller
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700">
                    Email
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700">
                    Status
                  </th>
                  <th className="px-3 py-2 text-right font-medium text-gray-700">
                    Listings
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {visible.map((s) => (
                  <tr key={s.id}>
                    <td className="px-3 py-2 text-gray-900">{s.name}</td>
                    <td className="px-3 py-2 text-gray-700">{s.email}</td>
                    <td className="px-3 py-2 text-gray-700">{s.status}</td>
                    <td className="px-3 py-2 text-right text-gray-700">
                      {s.totalListings.toLocaleString("en-US")}
                    </td>
                    <td className="px-3 py-2 text-gray-700">
                      {s.createdAt}
                    </td>
                  </tr>
                ))}
                {visible.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-3 py-6 text-center text-sm text-gray-500"
                    >
                      No sellers match this search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </main>

        <Footer />
      </div>
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
