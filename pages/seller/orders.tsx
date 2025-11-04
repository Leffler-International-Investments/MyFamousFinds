// FILE: /pages/seller/orders.tsx
import Head from "next/head";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";

export default function SellerOrders() {
  const rows = [
    {
      id: "FF-9201",
      item: "Gucci Marmont Mini",
      buyer: "A. Smith",
      total: "$2,450.00",
      status: "Awaiting shipment",
    },
    {
      id: "FF-9191",
      item: "Chanel Slingbacks",
      buyer: "M. Rossi",
      total: "$1,250.00",
      status: "Shipped",
    },
  ];

  return (
    <>
      <Head>
        <title>Seller — Orders | Famous Finds</title>
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

          <h1 className="mt-4 text-2xl font-semibold text-white">My orders</h1>
          <p className="mt-1 text-sm text-gray-400">
            Review new orders and mark items as shipped once dispatched.
          </p>

          <section className="mt-6 rounded-xl border border-neutral-800 bg-neutral-950 p-4">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-xs">
                <thead className="border-b border-neutral-800 text-[11px] uppercase tracking-wide text-gray-400">
                  <tr>
                    <th className="py-2 pr-3 text-left">Order</th>
                    <th className="px-3 py-2 text-left">Item</th>
                    <th className="px-3 py-2 text-left">Buyer</th>
                    <th className="px-3 py-2 text-left">Total</th>
                    <th className="px-3 py-2 text-left">Status</th>
                    <th className="px-3 py-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr
                      key={r.id}
                      className="border-b border-neutral-900 last:border-0"
                    >
                      <td className="py-2 pr-3">{r.id}</td>
                      <td className="px-3 py-2">{r.item}</td>
                      <td className="px-3 py-2">{r.buyer}</td>
                      <td className="px-3 py-2">{r.total}</td>
                      <td className="px-3 py-2">{r.status}</td>
                      <td className="px-3 py-2 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            alert(
                              `In a full version, ${r.id} would be updated to "Shipped".`
                            )
                          }
                          className="rounded-full bg-white px-3 py-1.5 text-[11px] font-medium text-black hover:bg-gray-100"
                        >
                          Mark as shipped
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
    </>
  );
}
