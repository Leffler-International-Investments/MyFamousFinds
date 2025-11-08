// FILE: /pages/management/payouts.tsx
import type { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { adminDb } from "../../utils/firebaseAdmin";
import { useRequireAdmin } from "../../hooks/useRequireAdmin";

type Payout = {
  id: string;
  sellerName: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
};

type Props = {
  payouts: Payout[];
};

export default function ManagementPayouts({ payouts }: Props) {
  const { loading } = useRequireAdmin();
  if (loading) return null;

  return (
    <>
      <Head>
        <title>Payouts &amp; Finance — Admin</title>
      </Head>
      <div className="min-h-screen bg-gray-50 text-gray-900">
        <Header />
        <main className="mx-auto max-w-6xl px-4 pb-16 pt-6">
          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-semibold">Payouts &amp; Finance</h1>
              <p className="mt-1 text-sm text-gray-600">
                Review seller payouts and platform fees, denominated in USD.
              </p>
            </div>
            <Link
              href="/management/dashboard"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              ← Back to Management Dashboard
            </Link>
          </div>

          <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">
                    Payout ID
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">
                    Seller
                  </th>
                  <th className="px-4 py-2 text-right font-medium text-gray-700">
                    Amount (USD)
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">
                    Status
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {payouts.map((p) => (
                  <tr key={p.id}>
                    <td className="px-4 py-2 text-gray-900">{p.id}</td>
                    <td className="px-4 py-2 text-gray-700">
                      {p.sellerName}
                    </td>
                    <td className="px-4 py-2 text-right text-gray-700">
                      {p.amount
                        ? p.amount.toLocaleString("en-US", {
                            style: "currency",
                            currency: "USD",
                          })
                        : "—"}
                    </td>
                    <td className="px-4 py-2 text-gray-700">{p.status}</td>
                    <td className="px-4 py-2 text-gray-700">
                      {p.createdAt}
                    </td>
                  </tr>
                ))}
                {payouts.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-6 text-center text-sm text-gray-500"
                    >
                      No payouts recorded yet.
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
    const snap = await adminDb
      .collection("payouts")
      .orderBy("createdAt", "desc")
      .limit(200)
      .get();

    const payouts: Payout[] = snap.docs.map((doc) => {
      const d: any = doc.data() || {};
      return {
        id: doc.id,
        sellerName: d.sellerName || "",
        amount: Number(d.amount || 0),
        currency: d.currency || "USD",
        status: d.status || "Pending",
        createdAt:
          d.createdAt?.toDate?.().toLocaleString("en-US") || "",
      };
    });

    return { props: { payouts } };
  } catch (err) {
    console.error("Error loading payouts", err);
    return { props: { payouts: [] } };
  }
};
