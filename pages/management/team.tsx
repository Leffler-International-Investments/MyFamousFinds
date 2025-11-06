// FILE: /pages/management/team.tsx
import Head from "next/head";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useRequireOwner } from "../../hooks/useRequireOwner";
import { useState } from "react";

const mockTeam = [
  { id: "1", name: "Ariel Richardson", email: "arichspot@gmail.com", role: "Owner" },
  { id: "2", name: "Dan Leffler", email: "leffleryd@gmail.com", role: "Owner" },
];

export default function ManagementTeam() {
  const { loading } = useRequireOwner();
  const [saving, setSaving] = useState(false);

  async function handleAddMember(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);

    // Placeholder – later this will call a real API endpoint
    await new Promise((res) => setTimeout(res, 1000));
    alert(
      "In a real app, this would create a new Firebase Auth user and save their permissions in Firestore."
    );

    setSaving(false);
  }

  if (loading) {
    return <div className="min-h-screen bg-gray-50" />;
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <Head>
        <title>Management Team — Admin</title>
      </Head>
      <Header />
      <main className="mx-auto max-w-6xl px-4 pb-16 pt-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Management Team
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Add new admins and set their console permissions.
            </p>
          </div>
          <Link
            href="/management/dashboard"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            ← Back to Management Dashboard
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Add New Member Form */}
          <form
            onSubmit={handleAddMember}
            className="space-y-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm lg:col-span-1"
          >
            <h2 className="text-lg font-semibold">Add New Member</h2>

            <div>
              <label className="text-xs font-medium text-gray-700">
                Full Name
              </label>
              <input
                type="text"
                name="name"
                required
                className="mt-1 w-full rounded-md border border-gray-300 p-2 text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                name="email"
                required
                className="mt-1 w-full rounded-md border border-gray-300 p-2 text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-700">
                Mobile Number (for 2FA)
              </label>
              <input
                type="tel"
                name="phone"
                placeholder="+14041234567"
                required
                className="mt-1 w-full rounded-md border border-gray-300 p-2 text-sm"
              />
            </div>

            <fieldset>
              <legend className="text-xs font-medium text-gray-700">
                Permissions
              </legend>
              <div className="mt-2 space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="perm_sellers"
                    name="perm_sellers"
                    defaultChecked
                  />
                  <label htmlFor="perm_sellers" className="text-sm">
                    Seller Management
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="perm_products"
                    name="perm_products"
                    defaultChecked
                  />
                  <label htmlFor="perm_products" className="text-sm">
                    Product & Content
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="perm_finance"
                    name="perm_finance"
                  />
                  <label
                    htmlFor="perm_finance"
                    className="text-sm font-medium text-red-700"
                  >
                    Finance & Payouts
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="perm_support"
                    name="perm_support"
                    defaultChecked
                  />
                  <label htmlFor="perm_support" className="text-sm">
                    Support Tickets
                  </label>
                </div>
              </div>
            </fieldset>

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-black disabled:opacity-60"
            >
              {saving ? "Creating User..." : "Add Team Member"}
            </button>
          </form>

          {/* Current Team List */}
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm lg:col-span-2">
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
                  <th className="px-4 py-2 text-right font-medium text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {mockTeam.map((member) => (
                  <tr key={member.id}>
                    <td className="px-4 py-3">{member.name}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {member.email}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          member.role === "Owner"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {member.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button className="text-xs font-medium text-red-600 hover:text-red-800">
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
