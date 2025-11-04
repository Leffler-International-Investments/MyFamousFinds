// FILE: /pages/seller/statements.tsx
import Head from "next/head";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";

const statements = [
  { id: "st_2025_10", period: "October 2025", orders: 82, gmv: "$31,420.00", payouts: "$24,860.00" },
  { id: "st_2025_09", period: "September 2025", orders: 76, gmv: "$28,910.00", payouts: "$22,310.00" },
  { id: "st_2025_08", period: "August 2025", orders: 69, gmv: "$25,780.00", payouts: "$20,040.00" },
];

export default function SellerStatements() {
  return (
    <>
      <Head>
        <title>Seller — Statements | Famous Finds</title>
      </Head>
      <div className="min-h-screen bg-black text-gray-100">
        <Header />
        <main className="mx-auto max-w-5xl px-4 pb-16 pt-6">
          <div className="mb-4">
            <Link
              href="/"
              className="text-sm text-gray-400 hover:text-gray-200"
            >
              ← Back to Dashboard
            </Link>
          </div>

          <h1 className="text-2xl font-semibold">Statements</h1>
          <p className="mt-1 text-sm text-gray-400">
            Monthly statements summarising orders, fees and payouts. These are
            ideal for your accountant or end-of-year tax prep.
          </p>

          <section className="mt-8 rounded-xl border border-neutral-800 bg-neutral-950 p-5">
            <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <h2 className="text-sm font-semibold">
                Monthly statements (demo data)
              </h2>
              <button
                type="button"
                onClick={() =>
                  alert("Would download a zipped archive of all statements.")
                }
                className="self-start rounded-full border border-neutral-700 px-3 py-1 text-xs hover:border-neutral-500"
              >
                Download all
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-xs">
                <thead className="border-b border-neutral-800 text-[11px] uppercase tracking-wide text-gray-400">
                  <tr>
                    <th className="py-2 pr-3 text-left">Period</th>
                    <th className="px-3 py-2 text-left">Orders</th>
                    <th className="px-3 py-2 text-left">GMV</th>
                    <th className="px-3 py-2 text-left">Payouts</th>
                    <th className="px-3 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {statements.map((st) => (
                    <tr
                      key={st.id}
                      className="border-b border-neutral-900 last:border-0"
                    >
                      <td className="py-2 pr-3">{st.period}</td>
                      <td className="px-3 py-2">{st.orders}</td>
                      <td className="px-3 py-2">{st.gmv}</td>
                      <td className="px-3 py-2">{st.payouts}</td>
                      <td className="px-3 py-2 text-right">
                        <div className="inline-flex gap-2">
                          <Link
                            href={`/seller/statement-print?id=${encodeURIComponent(
                              st.id
                            )}`}
                            className="text-[11px] text-gray-300 underline-offset-2 hover:underline"
                          >
                            View / print
                          </Link>
                          <button
                            type="button"
                            onClick={() =>
                              alert(
                                `Would download PDF statement for ${st.period}.`
                              )
                            }
                            className="text-[11px] text-gray-300 underline-offset-2 hover:underline"
                          >
                            Download PDF
                          </button>
                        </div>
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
