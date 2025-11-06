// FILE: /pages/management/team.tsx
import Head from "next/head";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useRequireOwner } from "../../hooks/useRequireOwner";
import { useState } from "react";

const initialTeam = [
  { id: "1", name: "Ariel Richardson", email: "arichspot@gmail.com", role: "Owner" },
  { id: "2", name: "Dan Leffler", email: "leffleryd@gmail.com", role: "Owner" },
];

// Define a type for our team member for state
type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: string;
};

export default function ManagementTeam() {
  const { loading } = useRequireOwner();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // --- UPDATED: Convert mock list to state ---
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(initialTeam);

  async function handleAddMember(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);

    const formData = new FormData(e.currentTarget);
    
    const payload = {
      name: formData.get("name") as string, // Cast as string for type safety
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      permissions: {
        perm_sellers: formData.get("perm_sellers") === "on",
        perm_products: formData.get("perm_products") === "on",
        perm_finance: formData.get("perm_finance") === "on",
        perm_support: formData.get("perm_support") === "on",
      }
    };

    try {
      const res = await fetch("/api/management/team/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!json.ok) {
        throw new Error(json.error || "Failed to create user.");
      }

      setMessage(`Success! User ${payload.email} has been created.`);

      // --- ADDED: Implement the TODO to update the UI ---
      const newUser: TeamMember = {
        id: json.uid, // Get new ID from API response
        name: payload.name,
        email: payload.email,
        role: "Admin", // Matches the role set in the API
      };
      setTeamMembers(currentTeam => [...currentTeam, newUser]);
      
      e.currentTarget.reset(); // Clear the form

    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
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
        {/* ... (Header/Title section unchanged) ... */}
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
          {/* Add New Member Form (Unchanged) */}
          <form
            onSubmit={handleAddMember}
            className="space-y-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm lg:col-span-1"
          >
            {/* ... (All form inputs are identical) ... */}
            <h2 className="text-lg font-semibold">Add New Member</h2>
            <div>
              <label className="text-xs font-medium text-gray-700">
                Full Name
              </label>
              <input type="text" name="name" required className="mt-1 w-full rounded-md border border-gray-300 p-2 text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700">
                Email
              </label>
              <input type="email" name="email" required className="mt-1 w-full rounded-md border border-gray-300 p-2 text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700">
                Mobile Number (for 2FA)
              </label>
              <input type="tel" name="phone" placeholder="+14041234567" required className="mt-1 w-full rounded-md border border-gray-300 p-2 text-sm" />
            </div>
            <fieldset>
              <legend className="text-xs font-medium text-gray-700">Permissions</legend>
              <div className="mt-2 space-y-2">
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="perm_sellers" name="perm_sellers" defaultChecked />
                  <label htmlFor="perm_sellers" className="text-sm">Seller Management</label>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="perm_products" name="perm_products" defaultChecked />
                  <label htmlFor="perm_products" className="text-sm">Product & Content</label>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="perm_finance" name="perm_finance" />
                  <label htmlFor="perm_finance" className="text-sm font-medium text-red-700">Finance & Payouts</label>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="perm_support" name="perm_support" defaultChecked />
                  <label htmlFor="perm_support" className="text-sm">Support Tickets</label>
                </div>
              </div>
            </fieldset>

            {/* Error/Success Messages (Unchanged) */}
            {message && <p className="text-xs text-green-700">{message}</p>}
            {error && <p className="text-xs text-red-600">{error}</p>}

            {/* Submit Button (Unchanged) */}
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
              {/* ... (Table Head unchanged) ... */}
                <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Name</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Email</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Role</th>
                  <th className="px-4 py-2 text-right font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {/* --- UPDATED: Map over 'teamMembers' state --- */}
                {teamMembers.map((member) => (
                  <tr key={member.id}>
                    <td className="px-4 py-3">{member.name}</td>
                    <td className="px-4 py-3 text-gray-600">
  s                   {member.email}
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
        _             </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button className="text-xs font-medium text-red-600 hover:text-red-800">
                        Remove
                      </button>
                    </td>
          _       </tr>
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
