// FILE: /pages/management/seller-profiles.tsx
import type { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { adminDb } from "../../utils/firebaseAdmin";
import { useRequireAdmin } from "../../hooks/useRequireAdmin";

type SellerProfile = {
  id: string;
  name: string;
  email: string;
  status: string;
  createdAt: string;
};

type Props = {
  sellers: SellerProfile[];
};

export default function ManagementSellerProfiles({ sellers }: Props) {
  const { loading } = useRequireAdmin();
  if (loading) return null;

  return (
    <>
      <Head>
        <title>Seller Profiles / Controls — Admin</title>
      </Head>
      <div className="min-h-screen bg-gray-50 text-gray-900">
        <Header />
        <main className="mx-auto max-w-6xl px-4 pb-16 pt-6">
          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-semibold">
                Seller Profiles / Controls
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                View and edit seller details, statuses, and permissions.
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
                    Seller
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">
                    Email
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
                {sellers.map((s) => (
                  <tr key={s.id}>
                    <td className="px-4 py-2 text-gray-900">{s.name}</td>
                    <td className="px-4 py-2 text-gray-700">{s.email}</td>
                    <td className="px-4 py-2 text-gray-700">{s.status}</td>
                    <td className="px-4 py-2 text-gray-700">
                      {s.createdAt}
                    </td>
                  </tr>
                ))}
                {sellers.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-6 text-center text-sm text-gray-500"
                    >
                      No sellers found.
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
        name: d.name || d.businessName || "Seller",
        email: d.email || "",
        status: d.status || "Active",
        createdAt:
          d.createdAt?.toDate?.().toLocaleString("en-US") || "",
      };
    });

    return { props: { sellers } };
  } catch (err) {
    console.error("Error loading seller profiles", err);
    return { props: { sellers: [] } };
  }
};
