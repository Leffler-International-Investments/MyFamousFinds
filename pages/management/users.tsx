// FILE: /pages/management/users.tsx
import Head from "next/head";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";

const mockUsers = [
  { id: "u_001", name: "Alice Carter", email: "alice@example.com", role: "Admin", status: "Active" },
  { id: "u_002", name: "Brian Lee", email: "brian@example.com", role: "Support", status: "Active" },
  { id: "u_003", name: "Chloe Smith", email: "chloe@example.com", role: "Seller", status: "Suspended" },
];

export default function ManagementUsers() {
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
                View all platform users, update roles, and manage access.
              </p>
            </div>
            <Link
              href="/management/dashboard"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              ← Back to Management Dashboard
            </Link>
          </div>

          <div className="mb-4 flex flex-wrap gap-3">
            <button className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-black">
              + Invite New Admin
            </button>
            <button className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
              Export Users (CSV)
            </button>
          </div>

          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">ID</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Name</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Email</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Role</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Status</th>
                  <th className="px-4 py-2 text-right font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {mockUsers.map((user) => (
                  <tr key={user.id}>
                    <td className="px-4 py-2 text-gray-900">{user.id}</td>
                    <td className="px-4 py-2 text-gray-900">{user.name}</td>
                    <td className="px-4 py-2 text-gray-700">{user.email}</td>
                    <td className="px-4 py-2">
                      <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-800">
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={
                          "rounded-full px-3 py-1 text-xs font-medium " +
                          (user.status === "Active"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800")
                        }
                      >
                        {user.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right">
                      <button className="text-xs font-medium text-gray-700 hover:text-gray-900">
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-4 text-xs text-gray-500">
            Later you can replace the mockUsers array with data from your database or
            API (e.g. /api/management/users).
          </p>
        </main>
        <Footer />
      </div>
    </>
  );
}
