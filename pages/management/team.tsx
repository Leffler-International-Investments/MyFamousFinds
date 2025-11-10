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
      // --- ADDED ROLE ---
      role: formData.get("role") as string,
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
        body: JSON.stringify(payload), // Payload now includes the role
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
        role: payload.role, // Use the role from the form
      };
      setTeamMembers((currentTeam) => [...currentTeam, newUser]);
      e.currentTarget.reset();
    } catch (err: any)
      console.error(err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="dashboard-page" />; // Light theme skeleton
  }

  return (
    // Use light theme classes from globals.css
    <div className="dashboard-page">
      <Head>
        <title>Management Team — Admin</title>
      </Head>
      <Header />
      <main className="dashboard-main">
        {/* Use light theme classes from globals.css */}
        <div className="dashboard-header">
          <div>
            <h1>Management Team</h1>
            <p>Add new admins and set their console permissions.</p>
          </div>
          <Link href="/management/dashboard">
            ← Back to Management Dashboard
          </Link>
        </div>

        <div className="team-grid">
          {/* Add New Member Form */}
          <form onSubmit={handleAddMember} className="form-card">
            <h2>Add New Member</h2>
            <div className="form-field">
              <label htmlFor="name">Full Name</label>
              <input type="text" id="name" name="name" required />
            </div>
            <div className="form-field">
              <label htmlFor="email">Email</label>
              <input type="email" id="email" name="email" required />
            </div>
            
            {/* --- NEW DROPDOWN --- */}
            <div className="form-field">
              <label htmlFor="role">Role / Position</label>
              <select id="role" name="role" required>
                <option value="Admin">Admin</option>
                <option value="Owner">Owner</option>
                <option value="In-house Developer">In-house Developer</option>
                <option value="MD (Managing Director)">MD (Managing Director)</option>
                <option value="Financial Manager">Financial Manager</option>
                <option value="Operations">Operations</option>
                <option value="Support">Support</option>
              </select>
            </div>
            {/* --- END NEW DROPDOWN --- */}

            <div className="form-field">
              <label htmlFor="phone">Mobile Number (for 2FA)</label>
              <input type="tel" id="phone" name="phone" placeholder="+14041234567" required />
            </div>
            <fieldset className="form-fieldset">
              <legend>Permissions</legend>
              <div className="form-check-group">
                <div className="form-check">
                  <input type="checkbox" id="perm_sellers" name="perm_sellers" defaultChecked />
                  <label htmlFor="perm_sellers">Seller Management</label>
                </div>
                <div className="form-check">
                  <input type="checkbox" id="perm_products" name="perm_products" defaultChecked />
                  <label htmlFor="perm_products">Product & Content</label>
                </div>
                <div className="form-check">
                  <input type="checkbox" id="perm_finance" name="perm_finance" />
                  <label htmlFor="perm_finance" className="label-danger">Finance & Payouts</label>
                </div>
                <div className="form-check">
                  <input type="checkbox" id="perm_support" name="perm_support" defaultChecked />
                  <label htmlFor="perm_support">Support Tickets</label>
                </div>
              </div>
            </fieldset>
            {message && <p className="form-message success">{message}</p>}
            {error && <p className="form-message error">{error}</p>}
            <button
              type="submit"
              disabled={saving}
              className="btn-submit"
            >
              {saving ? "Creating User..." : "Add Team Member"}
            </button>
          </form>

          {/* Team List */}
          <div className="team-list-wrapper">
            {teamMembers.map((member) => (
              <div key={member.id} className="team-card">
                <div className="team-card-header">
                  <h3>{member.name}</h3>
                  <span
                    className={
                      "status-badge " +
                      (member.role === "Owner"
                        ? "status-owner"
                        : "status-admin")
                    }
                  >
                    {member.role}
                  </span>
                </div>
                <p className="team-card-email">{member.email}</p>
                <button className="btn-remove">
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />

      {/* Styles for the light theme form and cards */}
      <style jsx>{`
        .team-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 32px;
        }
        @media (min-width: 1024px) {
          .team-grid {
            grid-template-columns: 1fr 2fr;
          }
        }

        .form-card {
          display: flex;
          flex-direction: column;
          gap: 16px;
          border-radius: 8px;
          border: 1px solid #e5e7eb; /* gray-200 */
          background: #ffffff;
          padding: 24px;
          box-shadow: 0 1px 2px 0 rgba(0,0,0,0.05);
        }
        .form-card h2 {
          font-size: 18px;
          font-weight: 600;
        }

        .form-field {
          display: flex;
          flex-direction: column;
        }
        .form-field label {
          font-size: 12px;
          font-weight: 500;
          color: #374151; /* gray-700 */
          margin-bottom: 4px;
        }
        /* --- UPDATED TO INCLUDE select --- */
        .form-field input,
        .form-field select {
          width: 100%;
          border-radius: 6px;
          border: 1px solid #d1d5db; /* gray-300 */
          padding: 8px 12px;
          font-size: 14px;
        }
        .form-field select {
          background: #ffffff;
        }
        
        .form-fieldset {
          border: none;
          padding: 0;
          margin: 0;
        }
        .form-fieldset legend {
          font-size: 12px;
          font-weight: 500;
          color: #374151; /* gray-700 */
        }
        .form-check-group {
          margin-top: 8px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .form-check {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .form-check label {
          font-size: 14px;
        }
        .form-check .label-danger {
          font-weight: 500;
          color: #b91c1c; /* red-700 */
        }
        
        .form-message {
          font-size: 12px;
        }
        .form-message.success {
          color: #065f46; /* green-700 */
        }
        .form-message.error {
          color: #b91c1c; /* red-600 */
        }

        .btn-submit {
          width: 100%;
          border-radius: 6px;
          background: #111827; /* gray-900 */
          padding: 8px 16px;
          font-size: 14px;
          font-weight: 500;
          color: #ffffff;
          border: none;
          cursor: pointer;
        }
        .btn-submit:hover {
          background: #000;
        }
        .btn-submit:disabled {
          opacity: 0.6;
        }
        
        .team-list-wrapper {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        
        .team-card {
          background: #ffffff;
          box-shadow: 0 1px 2px 0 rgba(0,0,0,0.05);
          border-radius: 8px;
          padding: 16px;
          border: 1px solid #e5e7eb; /* gray-200 */
        }
        
        .team-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        .team-card-header h3 {
          font-size: 16px;
          font-weight: 600;
          color: #111827; /* gray-900 */
        }
        
        .team-card-email {
          font-size: 14px;
          color: #4b5563; /* gray-600 */
          margin-bottom: 16px;
        }
        
        .btn-remove {
          width: 100%;
          text-align: center;
          font-size: 12px;
          font-weight: 500;
          color: #dc2626; /* red-600 */
          background: #fee2e2; /* red-100 */
          border-radius: 6px;
          padding: 8px;
          border: none;
          cursor: pointer;
          transition: background-color 150ms;
        }
        .btn-remove:hover {
          background: #fecaca; /* red-200 */
        }

        .status-badge {
          display: inline-flex;
          border-radius: 999px;
          padding: 2px 8px;
          font-size: 12px;
          font-weight: 500;
        }
        .status-owner {
          background: #dbeafe; /* blue-100 */
          color: #1e40af; /* blue-800 */
        }
        .status-admin {
          background: #e5e7eb; /* gray-200 */
          color: #374151; /* gray-700 */
        }
      `}</style>
    </div>
  );
}
