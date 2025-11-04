// FILE: /pages/management/categories.tsx
import Head from "next/head";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";

const mockCategories = [
  { id: "bags", name: "Bags", attributes: 12, active: true },
  { id: "watches", name: "Watches", attributes: 9, active: true },
  { id: "jewelry", name: "Jewelry", attributes: 15, active: true },
  { id: "kids", name: "Kids", attributes: 6, active: false },
];

export default function ManagementCategories() {
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
                Control the taxonomy of Famous-Finds: categories, filters, and attributes.
              </p>
            </div>
            <Link
              href="/management/dashboard"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              ← Back to Management Dashboard
            </Link>
          </div>

          <div className="mb-4 flex flex-wrap gap-3">
            <button className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-black">
              + Add Category
            </button>
            <button className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
              Manage Attributes
            </button>
          </div>

          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">ID</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Category</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Attributes</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Status</th>
                  <th className="px-4 py-2 text-right font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {mockCategories.map((cat) => (
                  <tr key={cat.id}>
                    <td className="px-4 py-2 text-gray-900">{cat.id}</td>
                    <td className="px-4 py-2 text-gray-900">{cat.name}</td>
                    <td className="px-4 py-2 text-gray-700">{cat.attributes}</td>
                    <td className="px-4 py-2">
                      <span
                        className={
                          "rounded-full px-3 py-1 text-xs font-medium " +
                          (cat.active
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-200 text-gray-700")
                        }
                      >
                        {cat.active ? "Active" : "Hidden"}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right">
                      <button className="text-xs font-medium text-gray-700 hover:text-gray-900">
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-4 text-xs text-gray-500">
            In the future, connect this to your categories collection and attribute schema.
          </p>
        </main>
        <Footer />
      </div>
    </>
  );
}
