// FILE: /pages/seller/catalogue.tsx
import Head from "next/head";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";

export default function Catalogue() {
  // Demo data – in production this would be fetched for the logged-in seller
  const items = [
    { id: "g1", title: "Gucci Marmont Mini", price: 2450, status: "Active" },
    { id: "d1", title: "Dior Printed Dress", price: 1950, status: "Active" },
  ];

  return (
    <>
      <Head>
        <title>Seller — Catalogue | Famous Finds</title>
      </Head>
      <div className="min-h-screen bg-black text-gray-100">
        <Header />
        <main className="mx-auto max-w-5xl px-4 pb-16 pt-6 text-sm">
          <Link
            href="/"
            className="text-xs text-gray-400 hover:text-gray-200"
          >
            ← Back to Dashboard
          </Link>

          <h1 className="mt-4 text-2xl font-semibold text-white">
            My catalogue
          </h1>
          <p className="mt-1 text-sm text-gray-400">
            Manage active listings. In a full build you&apos;d be able to edit,
            pause and duplicate items from here.
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
                    <th className="px-3 py-2 text-right">View</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((x) => (
                    <tr
                      key={x.id}
                      className="border-b border-neutral-900 last:border-0"
                    >
                      <td className="py-2 pr-3">{x.title}</td>
                      <td className="px-3 py-2">${x.price}</td>
                      <td className="px-3 py-2">{x.status}</td>
                      <td className="px-3 py-2 text-right">
                        <Link
                          href={`/product/${x.id}`}
                          className="text-[11px] text-gray-300 underline-offset-2 hover:underline"
                        >
                          View listing
                        </Link>
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
    </>
  );
}
