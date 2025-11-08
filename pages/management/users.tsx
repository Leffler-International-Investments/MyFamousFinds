// FILE: /pages/management/users.tsx
import type { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { adminDb } from "../../utils/firebaseAdmin";
import { useRequireAdmin } from "../../hooks/useRequireAdmin";

type AdminUser = {
  id: string;
  email: string;
  role: string;
  createdAt: string;
};

type Props = {
  users: AdminUser[];
};

export default function ManagementUsers({ users }: Props) {
  const { loading } = useRequireAdmin();
  if (loading) return null;

  return (
    <>
      <Head>
        <title>User &amp; Role Management — Admin</title>
      </Head>
      <div className="min-h-screen bg-gray-50 text-gray-900">
        <Header />

        <main className="mx-auto max-w-6xl px-4 pb-16 pt-6">
          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                User &amp; Role Management
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Manage admin accounts and their roles across the platform.
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
                    Email
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">
                    Role
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((u) => (
                  <tr key={u.id}>
                    <td className="px-4 py-2 text-gray-900">{u.email}</td>
                    <td className="px-4 py-2 text-gray-700">{u.role}</td>
                    <td className="px-4 py-2 text-gray-700">
                      {u.createdAt}
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-4 py-6 text-center text-sm text-gray-500"
                    >
                      No admin users configured yet.
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
      .collection("adminUsers")
      .orderBy("createdAt", "desc")
      .limit(200)
      .get();

    const users: AdminUser[] = snap.docs.map((doc) => {
      const d: any = doc.data() || {};
      return {
        id: doc.id,
        email: d.email || "",
        role: d.role || "admin",
        createdAt:
          d.createdAt?.toDate?.().toLocaleString("en-US") || "",
      };
    });

    return { props: { users } };
  } catch (err) {
    console.error("Error loading admin users", err);
    return { props: { users: [] } };
  }
};
