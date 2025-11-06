// FILE: /pages/management/categories.tsx
import type { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useRequireAdmin } from "../../hooks/useRequireAdmin";
import { adminDb } from "../../utils/firebaseAdmin";

type CategoryRow = {
  id: string;
  name: string;
  attributesCount: number;
  active: boolean;
};

type Props = {
  categories: CategoryRow[];
};

export default function ManagementCategories({ categories }: Props) {
  const { loading } = useRequireAdmin();
  if (loading) return null;

  const hasAny = categories.length > 0;

  return (
    <>
      <Head>
        <title>Categories & Attributes — Admin</title>
      </Head>
      <div className="min-h-screen bg-gray-50 text-gray-900">
        <Header />

        <main className="mx-auto max-w-6xl px-4 pb-16 pt-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Categories & Attributes
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                View and manage the product categories used across the marketplace.
              </p>
            </div>
            <Link
              href="/management/dashboard"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              ← Back to Management Dash
            </Link>
          </div>

          {/* Categories table */}
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">
                    Category
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">
                    ID / Slug
                  </th>
                  <th className="px-4 py-2 text-right font-medium text-gray-700">
                    Attributes
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {hasAny ? (
                  categories.map((c) => (
                    <tr key={c.id}>
                      <td className="px-4 py-2 text-gray-900">{c.name}</td>
                      <td className="px-4 py-2 text-gray-700">{c.id}</td>
                      <td className="px-4 py-2 text-right text-gray-900">
                        {c.attributesCount}
                      </td>
                      <td className="px-4 py-2">
                        <span
                          className={
                            "rounded-full px-3 py-1 text-xs font-medium " +
                            (c.active
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-200 text-gray-700")
                          }
                        >
                          {c.active ? "Active" : "Disabled"}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-6 text-center text-sm text-gray-500"
                    >
                      No categories found yet.
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
    const snap = await adminDb.collection("categories").get();

    const categories: CategoryRow[] = snap.docs.map((doc) => {
      const d: any = doc.data() || {};
      const attributesCount =
        typeof d.attributesCount === "number"
          ? d.attributesCount
          : Array.isArray(d.attributes)
          ? d.attributes.length
          : 0;
      const active =
        d.active === true ||
        d.enabled === true ||
        d.status === "Active" ||
        d.status === "LIVE";

      return {
        id: doc.id,
        name: d.name || d.label || doc.id,
        attributesCount,
        active,
      };
    });

    return { props: { categories } };
  } catch (err) {
    console.error("Error loading categories", err);
    return { props: { categories: [] } };
  }
};
