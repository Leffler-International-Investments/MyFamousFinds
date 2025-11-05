// FILE: /pages/management/sellers.tsx
import { useMemo, useState } from "react";
import type { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useRequireAdmin } from "../../hooks/useRequireAdmin";
import { adminDb } from "../../utils/firebaseAdmin";

type Seller = {
  id: string;
  name: string;
  email: string;
  country: string;
  listings: number;
  status: string;
};

type Props = {
  sellers: Seller[];
};

export default function ManagementSellers({ sellers }: Props) {
  const { loading } = useRequireAdmin();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Active" | "Pending" | "Suspended">("All");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sellers.filter((s) => {
      if (statusFilter !== "All" && s.status !== statusFilter) return false;
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.country.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q)
      );
    });
  }, [sellers, query, statusFilter]);

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
                Search and filter all approved sellers on the platform.
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
              type="text"
              placeholder="Search by name, email, or ID…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full max-w-xs rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
            />
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as typeof statusFilter)
              }
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
            >
              <option value="All">All statuses</option>
              <option value="Active">Active</option>
              <option value="Pending">Pending</option>
              <option value="Suspended">Suspended</option>
            </select>
          </div>

          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">
                    Seller
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">
                    Email
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">
                    Country
                  </th>
                  <th className="px-4 py-2 text-right font-medium text-gray-700">
                    Listings
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">
                    Status
                  </th>
                  <th className="px-4 py-2 text-right font-medium text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {visible.map((s) => (
                  <tr key={s.id}>
                    <td className="px-4 py-2 text-sm text-gray-900">
                      <div className="font-medium">{s.name}</div>
                      <div className="text-xs text-gray-500">{s.id}</div>
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-700">
                      {s.email}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-700">
                      {s.country}
                    </td>
                    <td className="px-4 py-2 text-right text-sm text-gray-900">
                      {s.listings}
                    </td>
                    <td className="px-4 py-2 text-xs">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                          s.status === "Active"
                            ? "bg-emerald-100 text-emerald-700"
                            : s.status === "Pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {s.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right text-xs">
                      <Link
                        href={`/management/seller-profiles?id=${encodeURIComponent(
                          s.id
                        )}`}
                        className="font-medium text-blue-600 hover:text-blue-800"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
                {!visible.length && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-6 text-center text-xs text-gray-500"
                    >
                      No sellers found for the current filters.
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
    const snap = await adminDb.collection("sellers").get();

    const sellers: Seller[] = snap.docs.map((doc) => {
      const d: any = doc.data() || {};
      return {
        id: doc.id,
        name: d.businessName || d.displayName || "Unnamed seller",
        email: d.email || "",
        country: d.country || "",
        listings:
          typeof d.listingsCount === "number" ? d.listingsCount : 0,
        status: d.status || "Active",
      };
    });

    return { props: { sellers } };
  } catch (err) {
    console.error("Error loading sellers", err);
    return { props: { sellers: [] } };
  }
};
