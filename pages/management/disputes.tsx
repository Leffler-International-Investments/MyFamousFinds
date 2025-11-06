// FILE: /pages/management/disputes.tsx
import type { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useRequireAdmin } from "../../hooks/useRequireAdmin";
import { adminDb } from "../../utils/firebaseAdmin";

type DisputeRow = {
  id: string;
  orderId: string;
  buyer: string;
  reason: string;
  status: string;
  openedAt: string;
};

type Props = {
  disputes: DisputeRow[];
};

export default function ManagementDisputes({ disputes }: Props) {
  const { loading } = useRequireAdmin();
  if (loading) return null;

  const hasAny = disputes.length > 0;

  return (
    <>
      <Head>
        <title>Returns & Disputes — Admin</title>
      </Head>
      <div className="min-h-screen bg-gray-50 text-gray-900">
        <Header />
        <main className="mx-auto max-w-6xl px-4 pb-16 pt-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Returns & Disputes
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Track escalations between buyers and sellers and resolve cases.
              </p>
            </div>
            <Link
              href="/management/dashboard"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              ← Back to Management Dash
            </Link>
          </div>

          {/* Disputes table */}
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">
                    Dispute ID
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">
                    Order ID
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">
                    Buyer
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">
                    Reason
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">
                    Opened
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {hasAny ? (
                  disputes.map((d) => (
                    <tr key={d.id}>
                      <td className="px-4 py-2 text-gray-900">{d.id}</td>
                      <td className="px-4 py-2 text-gray-900">
                        {d.orderId || "—"}
                      </td>
                      <td className="px-4 py-2 text-gray-700">
                        {d.buyer || "—"}
                      </td>
                      <td className="px-4 py-2 text-gray-700">
                        {d.reason || "—"}
                      </td>
                      <td className="px-4 py-2 text-gray-700">
                        {d.openedAt || "—"}
                      </td>
                      <td className="px-4 py-2">
                        <span
                          className={
                            "rounded-full px-3 py-1 text-xs font-medium " +
                            (d.status === "Open"
                              ? "bg-red-100 text-red-800"
                              : d.status === "In Review"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-green-100 text-green-800")
                          }
                        >
                          {d.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-6 text-center text-sm text-gray-500"
                    >
                      No disputes or returns recorded yet.
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
    return (
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
      `${pad(d.getHours())}:${pad(d.getMinutes())}`
    );
  } catch {
    return "";
  }
}

export const getServerSideProps: GetServerSideProps<Props> = async () => {
  try {
    const snap = await adminDb
      .collection("disputes")
      .orderBy("createdAt", "desc")
      .limit(200)
      .get();

    const disputes: DisputeRow[] = snap.docs.map((doc) => {
      const d: any = doc.data() || {};
      return {
        id: doc.id,
        orderId: d.orderId || d.orderRef || "",
        buyer: d.buyerName || d.buyerEmail || "",
        reason: d.reason || d.type || "",
        status: d.status || "Open",
        openedAt: formatDate(d.createdAt),
      };
    });

    return { props: { disputes } };
  } catch (err) {
    console.error("Error loading disputes", err);
    return { props: { disputes: [] } };
  }
};
