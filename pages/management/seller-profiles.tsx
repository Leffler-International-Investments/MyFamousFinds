// FILE: /pages/management/seller-profiles.tsx
import type { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useRequireAdmin } from "../../hooks/useRequireAdmin";
import { adminDb } from "../../utils/firebaseAdmin";

type SellerProfile = {
  id: string;
  name: string;
  email: string;
  country: string;
  status: string;
};

type Props = {
  sellers: SellerProfile[];
};

export default function ManagementSellerProfiles({ sellers }: Props) {
  const { loading } = useRequireAdmin();
  if (loading) return null;

  const hasAny = sellers.length > 0;

  return (
    <>
      <Head>
        <title>Seller Profiles / Controls — Admin</title>
      </Head>
      <div className="min-h-screen bg-gray-50 text-gray-900">
        <Header />
        <main className="mx-auto max-w-6xl px-4 pb-16 pt-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Seller Profiles / Controls
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Inspect and control individual seller accounts.
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
                    Email
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">
                    Country
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {hasAny ? (
                  sellers.map((s) => (
                    <tr key={s.id}>
                      <td className="px-4 py-2 text-gray-900">{s.name}</td>
                      <td className="px-4 py-2 text-gray-700">{s.email}</td>
                      <td className="px-4 py-2 text-gray-700">
                        {s.country || "—"}
                      </td>
                      <td className="px-4 py-2">
                        <span
                          className={
                            "rounded-full px-3 py-1 text-xs font-medium " +
                            (s.status === "Active"
                              ? "bg-green-100 text-green-800"
                              : s.status === "Pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800")
                          }
                        >
                          {s.status}
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
                      No seller profiles found.
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
      .collection("sellers")
      .orderBy("createdAt", "desc")
      .limit(200)
      .get();

    const sellers: SellerProfile[] = snap.docs.map((doc) => {
      const d: any = doc.data() || {};
      return {
        id: doc.id,
        name: d.businessName || d.displayName || "Unnamed seller",
        email: d.email || "",
        country: d.country || "",
        status: d.status || "Active",
      };
    });

    return { props: { sellers } };
  } catch (err) {
    console.error("Error loading seller profiles", err);
    return { props: { sellers: [] } };
  }
};

