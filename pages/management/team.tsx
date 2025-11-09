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
  const { loading } } = useRequireOwner();
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
    return <div className="dashboard-page" />;
  }

  return (
    <div className="dashboard-page">
      <Head>
        <title>Management Team — Admin</title>
      </Head>
      <Header />
      <main className="dashboard-main">
        <div className="dashboard-header">
          <div>
            <h1>Management Team</h1>
            <p>Add new admins and set their console permissions.</p>
          </div>
          <Link href="/management/dashboard">
            ← Back to Management Dashboard
          </Link>
        </div>

        {/* We use dashboard-section for the white bg and padding */}
        <section className="dashboard-section">
          <div className="team-grid">
            {/* Add New Member Form */}
            <form onSubmit={handleAddMember} className="form-card">
              <h2>Add New Member</h2>
              
              <div className="field">
                <label>Full Name</label>
                <input type="text" name="name" required />
              </div>
              
              <div className="field">
                <label>Email</label>
                <input type="email" name="email" required />
              </div>
              
              <div className="field">
                <label>Mobile Number (for 2FA)</label>
                <input type="tel" name="phone" placeholder="+14041234567" required />
              </div>
              
              <fieldset className="field">
                <legend>Permissions</legend>
                <div className="checkbox-group">
                  <div className="checkbox-row">
                    <input type="checkbox" id="perm_sellers" name="perm_sellers" defaultChecked />
                    <label htmlFor="perm_sellers">Seller Management</label>
                  </div>
                  <div className="checkbox-row">
                    <input type="checkbox" id="perm_products" name="perm_products" defaultChecked />
                    <label htmlFor="perm_products">Product & Content</label>
                  </div>
                  <div className="checkbox-row">
                    <input type="checkbox" id="perm_finance" name="perm_finance" />
                    <label htmlFor="perm_finance" className="finance-label">Finance & Payouts</label>
                  </div>
                  <div className="checkbox-row">
                    <input type="checkbox" id="perm_support" name="perm_support" defaultChecked />
                    <label htmlFor="perm_support">Support Tickets</label>
                  </div>
                </div>
              </fieldset>

              {message && <p className="message-success">{message}</p>}
              {error && <p className="message-error">{error}</p>}
              
              <button
                type="submit"
                disabled={saving}
                className="form-button"
              >
                {saving ? "Creating User..." : "Add Team Member"}
              </button>
            </form>

            {/* Team List */}
            <div className="team-list-container">
              {/* Desktop Table Header (Hidden on Mobile) */}
              <div className="team-list-header">
                <div className="col-name">Name</div>
                <div className="col-email">Email</div>
                <div className="col-role">Role</div>
                <div className="col-actions">Actions</div>
              </div>

              {/* Member List */}
              <div className="team-list-body">
                {teamMembers.map((member) => (
                  <div key={member.id} className="team-member-card">
                    {/* Mobile View (Stacked) */}
                    <div className="mobile-view">
                      <div className="mobile-header">
                        <h3>{member.name}</h3>
                        <span className={`role-badge ${
                            member.role === "Owner" ? "role-owner" : "role-admin"
                          }`}>
                          {member.role}
                        </span>
                      </div>
                      <p className="mobile-email">{member.email}</p>
                      <button className="remove-button-mobile">
                        Remove
                      </button>
                    </div>

                    {/* Desktop View (Grid Row) */}
                    <div className="desktop-view col-name">
                      {member.name}
                    </div>
                    <div className="desktop-view col-email">
                      {member.email}
                    </div>
                    <div className="desktop-view col-role">
                      <span className={`role-badge ${
                          member.role === "Owner" ? "role-owner" : "role-admin"
                        }`}>
                        {member.role}
                      </span>
                    </div>
                    <div className="desktop-view col-actions">
                      <button className="remove-button-desktop">
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>

    <style jsx>{`
      .team-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 32px;
      }
      @media (min-width: 1024px) {
        .team-grid {
          grid-template-columns: minmax(0, 1fr) minmax(0, 2fr);
        }
      }

      /* Form Card */
      .form-card {
        background: #f9fafb; /* gray-50 */
        border: 1px solid #e5e7eb; /* gray-200 */
        border-radius: 8px;
        padding: 20px;
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .form-card h2 {
        font-size: 18px;
        font-weight: 600;
        color: #111827; /* gray-900 */
        margin: 0;
      }
      .field {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .field label, .field legend {
        font-size: 13px;
        font-weight: 500;
        color: #374151; /* gray-700 */
      }
      .field input[type="text"],
      .field input[type="email"],
      .field input[type="tel"] {
        width: 100%;
        border-radius: 6px;
        border: 1px solid #d1d5db; /* gray-300 */
        padding: 8px 12px;
        font-size: 14px;
      }
      .checkbox-group {
        margin-top: 4px;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .checkbox-row {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .checkbox-row label {
        font-size: 14px;
        font-weight: 400;
        color: #111827;
      }
      .checkbox-row .finance-label {
        font-weight: 500;
        color: #b91c1c; /* red-700 */
      }
      .message-success {
        font-size: 13px;
        color: #059669; /* green-600 */
      }
      .message-error {
        font-size: 13px;
        color: #dc2626; /* red-600 */
      }
      .form-button {
        width: 100%;
        border-radius: 6px;
        background: #111827; /* gray-900 */
        padding: 10px 16px;
        font-size: 14px;
        font-weight: 500;
        color: white;
        border: none;
        cursor: pointer;
      }
      .form-button:hover {
        background: #000;
      }
      .form-button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
      
      /* Team List */
      .team-list-header {
        display: none; /* Hidden on mobile */
      }
      .team-list-body {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .team-member-card {
        background: white;
        box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
        border-radius: 8px;
        padding: 16px;
        border: 1px solid #e5e7eb; /* gray-200 */
      }
      .mobile-view {
        display: block;
      }
      .mobile-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
      }
      .mobile-header h3 {
        font-size: 16px;
        font-weight: 600;
        color: #111827; /* gray-900 */
      }
      .mobile-email {
        font-size: 14px;
        color: #4b5563; /* gray-600 */
        margin-bottom: 16px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .remove-button-mobile {
        width: 100%;
        text-align: center;
        font-size: 13px;
        font-weight: 500;
        color: #dc2626; /* red-600 */
        background: #fee2e2; /* red-100 */
        border: none;
        border-radius: 6px;
        padding: 8px;
        cursor: pointer;
      }
      .remove-button-mobile:hover {
        background: #fecaca; /* red-200 */
        color: #b91c1c; /* red-700 */
      }
      .desktop-view {
        display: none; /* Hidden on mobile */
      }

      .role-badge {
        display: inline-flex;
        border-radius: 999px;
        padding: 2px 8px;
        font-size: 12px;
        font-weight: 500;
      }
      .role-owner {
        background-color: #dbeafe; /* blue-100 */
        color: #1e40af; /* blue-800 */
      }
      .role-admin {
        background-color: #f3f4f6; /* gray-100 */
        color: #374151; /* gray-700 */
      }

      @media (min-width: 1024px) {
        .team-list-body {
          gap: 0;
          border-left: 1px solid #e5e7eb; /* gray-200 */
          border-right: 1px solid #e5e7eb; /* gray-200 */
          border-bottom: 1px solid #e5e7eb; /* gray-200 */
          border-radius: 0 0 8px 8px;
        }
        .team-list-header {
          display: grid;
          grid-template-columns: 3fr 4fr 2fr 1fr;
          gap: 16px;
          padding: 12px 24px;
          background: #f9fafb; /* gray-50 */
          border: 1px solid #e5e7eb; /* gray-200 */
          border-radius: 8px 8px 0 0;
          font-size: 12px;
          font-weight: 600;
          color: #374151; /* gray-700 */
          text-transform: uppercase;
        }
        .col-actions {
          text-align: right;
        }
        .team-member-card {
          display: grid;
          grid-template-columns: 3fr 4fr 2fr 1fr;
          gap: 16px;
          align-items: center;
          padding: 16px 24px;
          border: none;
          border-radius: 0;
          box-shadow: none;
          border-bottom: 1px solid #e5e7eb; /* gray-200 */
        }
        .team-list-body .team-member-card:last-child {
          border-bottom: none;
        }
        .mobile-view {
          display: none;
        }
        .desktop-view {
          display: block;
          font-size: 14px;
          color: #4b5563; /* gray-600 */
        }
        .desktop-view.col-name {
          font-weight: 500;
          color: #111827; /* gray-900 */
        }
        .desktop-view.col-email {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .desktop-view.col-actions {
          text-align: right;
        }
        .remove-button-desktop {
          font-size: 13px;
          font-weight: 500;
          color: #dc2626; /* red-600 */
          background: none;
          border: none;
          cursor: pointer;
        }
        .remove-button-desktop:hover {
          color: #991b1b; /* red-800 */
          text-decoration: underline;
        }
      }
    `}</style>
  );
}
