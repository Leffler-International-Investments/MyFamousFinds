// FILE: /pages/management/disputes.tsx
import type { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { adminDb } from "../../utils/firebaseAdmin";
import { useRequireAdmin } from "../../hooks/useRequireAdmin";

type Dispute = {
  id: string;
  orderId: string;
  buyerEmail: string;
  sellerEmail: string;
  reason: string;
  status: string;
  createdAt: string;
};

type Props = {
  disputes: Dispute[];
};

export default function ManagementDisputes({ disputes }: Props) {
  const { loading } = useRequireAdmin();
  if (loading) return null;

  return (
    <>
      <Head>
        <title>Returns &amp; Disputes — Admin</title>
      </Head>
      <div className="min-h-screen bg-gray-50 text-gray-900">
        <Header />
        <main className="mx-auto max-w-6xl px-4 pb-16 pt-6">
          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-semibold">Returns &amp; Disputes</h1>
              <p className="mt-1 text-sm text-gray-600">
                Review active disputes between buyers and sellers and track their
                outcomes.
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
                    Dispute ID
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">
                    Order
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">
                    Buyer
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">
                    Seller
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">
                    Reason
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
                {disputes.map((d) => (
                  <tr key={d.id}>
                    <td className="px-4 py-2 text-gray-900">{d.id}</td>
                    <td className="px-4 py-2 text-gray-700">{d.orderId}</td>
                    <td className="px-4 py-2 text-gray-700">
                      {d.buyerEmail || "—"}
                    </td>
                    <td className="px-4 py-2 text-gray-700">
                      {d.sellerEmail || "—"}
                    </td>
                    <td className="px-4 py-2 text-gray-700">{d.reason}</td>
                    <td className="px-4 py-2 text-gray-700">{d.status}</td>
                    <td className="px-4 py-2 text-gray-700">{d.createdAt}</td>
                  </tr>
                ))}
                {disputes.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-6 text-center text-sm text-gray-500"
                    >
                      No disputes recorded yet.
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
      .collection("disputes")
      .orderBy("createdAt", "desc")
      .limit(200)
      .get();

    const disputes: Dispute[] = snap.docs.map((doc) => {
      const d: any = doc.data() || {};
      return {
        id: doc.id,
        orderId: d.orderId || "",
        buyerEmail: d.buyerEmail || d.buyer || "",
        sellerEmail: d.sellerEmail || d.seller || "",
        reason: d.reason || "",
        status: d.status || "Open",
        createdAt:
          d.createdAt?.toDate?.().toLocaleString("en-US") || "",
      };
    });

    return { props: { disputes } };
  } catch (err) {
    console.error("Error loading disputes", err);
    return { props: { disputes: [] } };
  }
};
