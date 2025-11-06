// FILE: /pages/management/payouts.tsx
import type { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useRequireAdmin } from "../../hooks/useRequireAdmin";
import { adminDb } from "../../utils/firebaseAdmin";

type PayoutRow = {
  id: string;
  seller: string;
  date: string;
  status: string;
  amount: number;
};

type Props = {
  payouts: PayoutRow[];
};

export default function ManagementPayouts({ payouts }: Props) {
  const { loading } = useRequireAdmin();
  if (loading) return null;

  const hasAny = payouts.length > 0;

  return (
    <>
      <Head>
        <title>Payouts & Finance — Admin</title>
      </Head>
      <div className="min-h-screen bg-gray-50 text-gray-900">
        <Header />
        <main className="mx-auto max-w-6xl px-4 pb-16 pt-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Payouts & Finance
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Review seller payouts and their current status.
              </p>
            </div>
            <Link
              href="/management/dashboard"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              ← Back to Management Dash
            </Link>
          </div>

          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">
                    Payout ID
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">
                    Seller
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">
                    Date
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">
                    Status
                  </th>
                  <th className="px-4 py-2 text-right font-medium text-gray-700">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {hasAny ? (
                  payouts.map((p) => (
                    <tr key={p.id}>
                      <td className="px-4 py-2 text-gray-900">{p.id}</td>
                      <td className="px-4 py-2 text-gray-900">{p.seller}</td>
                      <td className="px-4 py-2 text-gray-700">
                        {p.date || "—"}
                      </td>
                      <td className="px-4 py-2">
                        <span
                          className={
                            "rounded-full px-3 py-1 text-xs font-medium " +
                            (p.status === "Paid"
                              ? "bg-green-100 text-green-800"
                              : p.status === "Pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-gray-200 text-gray-700")
                          }
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right text-gray-900">
                        {p.amount.toLocaleString("en-AU", {
                          style: "currency",
                          currency: "AUD",
                        })}
                      </td>
                    </tr>
                  ))
                ) : (
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

function formatDate(ts: any): string {
  try {
    if (!ts) return "";
    const d =
      typeof ts.toDate === "function"
        ? ts.toDate()
        : ts instanceof Date
        ? ts
        : null;
    if (!d) return "";
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
      d.getDate()
    )}`;
  } catch {
    return "";
  }
}

export const getServerSideProps: GetServerSideProps<Props> = async () => {
  try {
    const snap = await adminDb
      .collection("payouts")
      .orderBy("createdAt", "desc")
      .limit(200)
      .get();

    const payouts: PayoutRow[] = snap.docs.map((doc) => {
      const d: any = doc.data() || {};
      const amountRaw = d.amount ?? d.total ?? 0;
      const amount =
        typeof amountRaw === "number"
          ? amountRaw
          : typeof amountRaw === "string"
          ? Number(amountRaw) || 0
          : 0;

      return {
        id: doc.id,
        seller:
          d.sellerName || d.sellerDisplayName || d.sellerId || "Seller",
        date: formatDate(d.createdAt),
        status: d.status || "Pending",
        amount,
      };
    });

    return { props: { payouts } };
  } catch (err) {
    console.error("Error loading payouts", err);
    return { props: { payouts: [] } };
  }
};

