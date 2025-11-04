// FILE: /pages/seller/statement-print.tsx
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import Header from "../../components/Header";
import Footer from "../../components/Footer";

export default function SellerStatementPrint() {
  const router = useRouter();
  const id = (router.query.id as string) || "st_2025_10";

  return (
    <>
      <Head>
        <title>Statement — Famous Finds</title>
      </Head>
      <div className="min-h-screen bg-black text-gray-100">
        <Header />
        <main className="mx-auto max-w-4xl px-4 pb-16 pt-6">
          <div className="mb-4 flex items-center justify-between">
            <Link
              href="/seller/statements"
              className="text-sm text-gray-400 hover:text-gray-200"
            >
              ← Back to statements
            </Link>
            <button
              type="button"
              onClick={() => window.print()}
              className="rounded-full border border-neutral-700 px-3 py-1 text-xs hover:border-neutral-500"
            >
              Print
            </button>
          </div>

          <section className="rounded-xl border border-neutral-800 bg-neutral-950 p-6 text-sm">
            <header className="mb-6 flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
              <div>
                <h1 className="text-lg font-semibold">
                  Seller statement (demo)
                </h1>
                <p className="text-xs text-gray-400">
                  Statement ID: {id}
                </p>
              </div>
              <div className="text-right text-xs text-gray-400">
                <div>Famous Finds</div>
                <div>Curated luxury &amp; premium resale — US</div>
              </div>
            </header>

            <div className="grid gap-4 border-b border-neutral-800 pb-4 text-xs md:grid-cols-3">
              <div>
                <h2 className="mb-1 font-semibold text-gray-200">
                  Period
                </h2>
                <p>1–31 October 2025</p>
              </div>
              <div>
                <h2 className="mb-1 font-semibold text-gray-200">
                  Seller
                </h2>
                <p>Luxe Closet NYC</p>
                <p>seller@example.com</p>
              </div>
              <div>
                <h2 className="mb-1 font-semibold text-gray-200">
                  Summary
                </h2>
                <p>Orders: 82</p>
                <p>GMV: $31,420.00</p>
                <p>Payouts: $24,860.00</p>
              </div>
            </div>

            <div className="mt-4 text-xs">
              <h2 className="mb-2 font-semibold text-gray-200">
                Totals
              </h2>
              <table className="w-full text-xs">
                <tbody>
                  <tr>
                    <td className="py-1 pr-3 text-gray-400">
                      Item sales
                    </td>
                    <td className="py-1 text-right">$31,420.00</td>
                  </tr>
                  <tr>
                    <td className="py-1 pr-3 text-gray-400">
                      Platform fees
                    </td>
                    <td className="py-1 text-right">- $3,770.40</td>
                  </tr>
                  <tr>
                    <td className="py-1 pr-3 text-gray-400">
                      Shipping reimbursements
                    </td>
                    <td className="py-1 text-right">$1,210.40</td>
                  </tr>
                  <tr>
                    <td className="py-1 pr-3 text-gray-400">
                      Adjustments / refunds
                    </td>
                    <td className="py-1 text-right">- $0.00</td>
                  </tr>
                  <tr className="border-t border-neutral-800">
                    <td className="py-2 pr-3 font-semibold text-gray-100">
                      Net amount payable
                    </td>
                    <td className="py-2 text-right font-semibold">
                      $24,860.00
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="mt-6 text-[11px] text-gray-500">
              This is a design preview. In a production system this statement
              would be generated from live order and payout data (for example
              via Stripe reports) and available as a downloadable PDF.
            </p>
          </section>
        </main>
        <Footer />
      </div>
    </>
  );
}
