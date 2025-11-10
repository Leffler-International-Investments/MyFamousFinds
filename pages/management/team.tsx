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
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(initialTeam);

  async function handleAddMember(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const payload = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      permissions: {
        perm_sellers: formData.get("perm_sellers") === "on",
        perm_products: formData.get("perm_products") === "on",
        perm_finance: formData.get("perm_finance") === "on",
        perm_support: formData.get("perm_support") === "on",
      },
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
      const newUser: TeamMember = {
        id: json.uid,
        name: payload.name,
        email: payload.email,
        role: "Admin",
      };
      setTeamMembers((currentTeam) => [...currentTeam, newUser]);
      e.currentTarget.reset();
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
        <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
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
            className="flex-shrink-0 text-sm text-gray-600 hover:text-gray-900"
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
            {message && <p className="text-xs text-green-700">{message}</p>}
            {error && <p className="text-xs text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-black disabled:opacity-60"
            >
              {saving ? "Creating User..." : "Add Team Member"}
            </button>
          </form>

          {/* REBUILT RESPONSIVE TEAM LIST */}
          <div className="lg:col-span-2">
            {/* Desktop Table Header (Hidden on Mobile) */}
            <div className="hidden lg:grid lg:grid-cols-10 gap-4 px-6 py-3 bg-gray-50 border border-gray-200 rounded-t-lg text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
              <div className="col-span-3">Name</div>
              <div className="col-span-4">Email</div>
              <div className="col-span-2">Role</div>
              <div className="col-span-1 text-right">Actions</div>
            </div>

            {/* Member List */}
            <div className="space-y-4 lg:space-y-0 lg:border-x lg:border-b lg:rounded-b-lg lg:border-gray-200 lg:divide-y lg:divide-gray-200">
              {teamMembers.map((member) => (
                <div
                  key={member.id}
                  // Mobile Card styles
                  className="bg-white shadow-sm rounded-lg p-4 border border-gray-200
                                 // Desktop Row styles
                                 lg:shadow-none lg:rounded-none lg:border-0 
                                 lg:grid lg:grid-cols-10 lg:gap-4 lg:items-center 
                                 lg:px-6 lg:py-4"
                >
                  {/* Mobile View (Stacked) */}
                  <div className="lg:hidden">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-base font-semibold text-gray-900">
                        {member.name}
                      </h3>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          member.role === "Owner"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {member.role}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-4 truncate">
                      {member.email}
                    </p>
                    <button className="w-full text-center text-xs font-medium text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 rounded-md py-2 transition-colors">
                      Remove
                    </button>
                  </div>

                  {/* Desktop View (Grid Row) */}
                  <div className="hidden lg:block col-span-3 text-sm font-medium text-gray-900">
                    {member.name}
                  </div>
                  <div className="hidden lg:block col-span-4 text-sm text-gray-600 truncate">
                    {member.email}
                  </div>
                  <div className="hidden lg:block col-span-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        member.role === "Owner"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {member.role}
                    </span>
                  </div>
                  <div className="hidden lg:block col-span-1 text-right">
                    <button className="text-xs font-medium text-red-600 hover:text-red-800">
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

