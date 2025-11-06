// FILE: /pages/management/users.tsx
import type { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useRequireAdmin } from "../../hooks/useRequireAdmin";
import { adminDb } from "../../utils/firebaseAdmin";

type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
};

type Props = {
  users: AdminUser[];
};

export default function ManagementUsers({ users }: Props) {
  const { loading } = useRequireAdmin();
  if (loading) return null;

  const hasAny = users.length > 0;

  return (
    <>
      <Head>
        <title>User & Role Management — Admin</title>
      </Head>
      <div className="min-h-screen bg-gray-50 text-gray-900">
        <Header />
        <main className="mx-auto max-w-6xl px-4 pb-16 pt-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                User & Role Management
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Manage admin users and support staff access.
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
                    Name
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">
                    Email
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">
                    Role
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {hasAny ? (
                  users.map((u) => (
                    <tr key={u.id}>
                      <td className="px-4 py-2 text-gray-900">{u.name}</td>
                      <td className="px-4 py-2 text-gray-700">{u.email}</td>
                      <td className="px-4 py-2 text-gray-700">{u.role}</td>
                      <td className="px-4 py-2">
                        <span
                          className={
                            "rounded-full px-3 py-1 text-xs font-medium " +
                            (u.status === "Active"
                              ? "bg-green-100 text-green-800"
                              : u.status === "Suspended"
                              ? "bg-red-100 text-red-800"
                              : "bg-gray-200 text-gray-700")
                          }
                        >
                          {u.status}
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
                      No admin users found.
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
    const snap = await adminDb.collection("adminUsers").get();

    const users: AdminUser[] = snap.docs.map((doc) => {
      const d: any = doc.data() || {};
      return {
        id: doc.id,
        name: d.name || d.displayName || "",
        email: d.email || "",
        role: d.role || "Admin",
        status: d.status || "Active",
      };
    });

    return { props: { users } };
  } catch (err) {
    console.error("Error loading admin users", err);
    return { props: { users: [] } };
  }
};
