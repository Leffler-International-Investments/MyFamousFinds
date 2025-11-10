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

  if (loading) return null;

  return (
    <>
      <Head>
        <title>Categories &amp; Attributes — Admin</title>
      </Head>

      <div className="min-h-screen bg-gray-50 text-gray-900">
        <Header />

        <main className="mx-auto max-w-5xl px-4 pb-16 pt-6">
          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-semibold">Categories &amp; Attributes</h1>
              <p className="mt-1 text-sm text-gray-600">
                Manage your top-level categories and how items are structured throughout
                Famous Finds.
              </p>
            </div>
            <Link
              href="/management/dashboard"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              ← Back to Management Dashboard
            </Link>
          </div>

          <div className="mb-4 flex justify-end">
            <button className="rounded-full bg-gray-900 px-4 py-2 text-xs font-semibold text-white">
              + Add Category (coming soon)
            </button>
          </div>

          <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Name</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">
                    Slug
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">
                    Parent
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">
                    Active
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((cat) => (
                  <tr key={cat.id}>
                    <td className="px-4 py-2 text-gray-900">{cat.name}</td>
                    <td className="px-4 py-2 text-gray-700">{cat.slug}</td>
                    <td className="px-4 py-2 text-gray-700">
                      {cat.parent || "Top level"}
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={
                          "inline-flex rounded-full px-2 py-0.5 text-xs font-medium " +
                          (cat.active
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-200 text-gray-700")
                        }
                      >
                        {cat.active ? "Active" : "Hidden"}
                      </span>
                    </td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-6 text-center text-sm text-gray-500"
                    >
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
