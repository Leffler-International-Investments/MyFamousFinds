// FILE: /pages/management/tax.tsx
import type { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useRequireAdmin } from "../../hooks/useRequireAdmin";
import { adminDb } from "../../utils/firebaseAdmin";

type TaxSummaryRow = {
  id: string;
  sellerName: string;
  year: number;
  grossSales: number;
  formsIssued: boolean;
};

type Props = {
  summaries: TaxSummaryRow[];
};

export default function ManagementTax({ summaries }: Props) {
  const { loading } = useRequireAdmin();
  if (loading) return null;

  const hasAny = summaries.length > 0;

  return (
    <>
      <Head>
        <title>Tax & Compliance — Admin</title>
      </Head>
      <div className="min-h-screen bg-gray-50 text-gray-900">
        <Header />
        <main className="mx-auto max-w-6xl px-4 pb-16 pt-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Tax & Compliance
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                View annual sales totals and form issuance for sellers.
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
                    Seller
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">
                    Year
                  </th>
                  <th className="px-4 py-2 text-right font-medium text-gray-700">
                    Gross Sales
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">
                    Form Issued
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {hasAny ? (
                  summaries.map((row) => (
                    <tr key={row.id}>
                      <td className="px-4 py-2 text-gray-900">
                        {row.sellerName}
                      </td>
                      <td className="px-4 py-2 text-gray-700">{row.year}</td>
                      <td className="px-4 py-2 text-right text-gray-900">
                        {row.grossSales.toLocaleString("en-AU", {
                          style: "currency",
                          currency: "USD",
                        })}
                      </td>
                      <td className="px-4 py-2">
                        <span
                          className={
                            "rounded-full px-3 py-1 text-xs font-medium " +
                            (row.formsIssued
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-200 text-gray-700")
                          }
                        >
                          {row.formsIssued ? "Issued" : "Not yet issued"}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-6 text-center text-sm text-gray-500"
                    >
                      No tax summaries recorded yet.
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
      .collection("taxSummaries")
      .orderBy("year", "desc")
      .limit(200)
      .get();

    const summaries: TaxSummaryRow[] = snap.docs.map((doc) => {
      const d: any = doc.data() || {};
      const year =
        typeof d.year === "number"
          ? d.year
          : typeof d.year === "string"
          ? Number(d.year) || new Date().getFullYear()
          : new Date().getFullYear();
      const grossRaw = d.grossSales ?? d.totalGross ?? 0;
      const gross =
        typeof grossRaw === "number"
          ? grossRaw
          : typeof grossRaw === "string"
          ? Number(grossRaw) || 0
          : 0;

      return {
        id: doc.id,
        sellerName: d.sellerName || d.sellerId || "Seller",
        year,
        grossSales: gross,
        formsIssued: !!(d.formsIssued || d.formIssued),
      };
    });

    return { props: { summaries } };
  } catch (err) {
    console.error("Error loading tax summaries", err);
    return { props: { summaries: [] } };
  }
};

