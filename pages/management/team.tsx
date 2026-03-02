// FILE: /pages/management/team.tsx
import Head from "next/head";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useRequireOwner } from "../../hooks/useRequireOwner";
import { useEffect, useState } from "react";
import { autoPrefixPhone } from "../../utils/phoneFormat";

type Permissions = {
  canManageSellers: boolean;
  canManageProducts: boolean;
  canManageFinance: boolean;
  canManageSupport: boolean;
};

type TeamMember = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  permissions?: Permissions;
  createdAt?: string;
};

const ROLE_OPTIONS = [
  "Admin",
  "Owner",
  "In-house Developer",
  "MD (Managing Director)",
  "Financial Manager",
  "Operations",
  "Support",
];

export default function ManagementTeam() {
  const { loading } = useRequireOwner();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ name: string; phone: string; role: string; permissions: Permissions }>({
    name: "", phone: "", role: "Admin",
    permissions: { canManageSellers: false, canManageProducts: false, canManageFinance: false, canManageSupport: false },
  });
  const [updating, setUpdating] = useState(false);

  function startEdit(member: TeamMember) {
    setEditingId(member.id);
    setEditForm({
      name: member.name,
      phone: member.phone || "",
      role: member.role,
      permissions: member.permissions || {
        canManageSellers: false, canManageProducts: false,
        canManageFinance: false, canManageSupport: false,
      },
    });
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function handleSaveEdit(memberId: string) {
    setUpdating(true);
    setError(null);
    try {
      const res = await fetch("/api/management/team/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: memberId, ...editForm }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || "Failed to update.");
      setTeamMembers((prev) =>
        prev.map((m) => m.id === memberId ? { ...m, ...editForm } : m)
      );
      setEditingId(null);
      setMessage("Member updated successfully.");
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setUpdating(false);
    }
  }

  async function handleRemove(member: TeamMember) {
    if (!window.confirm(`Remove ${member.name} (${member.email}) from the team? This cannot be undone.`)) {
      return;
    }
    setError(null);
    try {
      const res = await fetch("/api/management/team/remove", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: member.id }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || "Failed to remove member.");
      setTeamMembers((prev) => prev.filter((m) => m.id !== member.id));
      setMessage(`${member.name} has been removed.`);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    }
  }

  // Fetch team members from Firestore on mount
  useEffect(() => {
    async function fetchTeam() {
      try {
        const res = await fetch("/api/management/team/list");
        const json = await res.json();
        if (json.ok && json.members) {
          setTeamMembers(json.members);
        }
      } catch (err) {
        console.error("Failed to load team members:", err);
      }
    }
    fetchTeam();
  }, []);

  async function handleAddMember(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);

    const form = e.currentTarget;
    const formData = new FormData(form);
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
        phone: payload.phone,
        role: payload.role,
        permissions: {
          canManageSellers: payload.permissions.perm_sellers,
          canManageProducts: payload.permissions.perm_products,
          canManageFinance: payload.permissions.perm_finance,
          canManageSupport: payload.permissions.perm_support,
        },
        createdAt: new Date().toISOString(),
      };
      setTeamMembers((currentTeam) => [...currentTeam, newUser]);
      form.reset();
    } catch (err: any) { // <-- THIS IS THE FIX (added '{')
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
              <input
                type="tel" id="phone" name="phone" placeholder="+61 478 965 828" required
                onChange={(e) => { e.target.value = autoPrefixPhone(e.target.value); }}
              />
              <span className="form-hint">
                E.164 format: + then country code then number. US: +1404..., AU: +6147...
              </span>
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
            {teamMembers.length === 0 && (
              <div className="team-empty">No team members found yet. Existing members will appear here.</div>
            )}
            {teamMembers.map((member) => (
              <div key={member.id} className="team-card">
                {editingId === member.id ? (
                  /* --- Edit Mode --- */
                  <div className="edit-form">
                    <div className="form-field">
                      <label>Full Name</label>
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      />
                    </div>
                    <div className="form-field">
                      <label>Email</label>
                      <input type="email" value={member.email} disabled />
                    </div>
                    <div className="form-field">
                      <label>Role / Position</label>
                      <select
                        value={editForm.role}
                        onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                      >
                        {ROLE_OPTIONS.map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-field">
                      <label>Mobile Number</label>
                      <input
                        type="tel"
                        value={editForm.phone}
                        placeholder="+61 478 965 828"
                        onChange={(e) => setEditForm({ ...editForm, phone: autoPrefixPhone(e.target.value) })}
                      />
                      <span className="form-hint">
                        E.164 format: + then country code then number
                      </span>
                    </div>
                    <fieldset className="form-fieldset">
                      <legend>Permissions</legend>
                      <div className="form-check-group">
                        <div className="form-check">
                          <input
                            type="checkbox"
                            checked={editForm.permissions.canManageSellers}
                            onChange={(e) => setEditForm({
                              ...editForm,
                              permissions: { ...editForm.permissions, canManageSellers: e.target.checked },
                            })}
                          />
                          <label>Seller Management</label>
                        </div>
                        <div className="form-check">
                          <input
                            type="checkbox"
                            checked={editForm.permissions.canManageProducts}
                            onChange={(e) => setEditForm({
                              ...editForm,
                              permissions: { ...editForm.permissions, canManageProducts: e.target.checked },
                            })}
                          />
                          <label>Product &amp; Content</label>
                        </div>
                        <div className="form-check">
                          <input
                            type="checkbox"
                            checked={editForm.permissions.canManageFinance}
                            onChange={(e) => setEditForm({
                              ...editForm,
                              permissions: { ...editForm.permissions, canManageFinance: e.target.checked },
                            })}
                          />
                          <label className="label-danger">Finance &amp; Payouts</label>
                        </div>
                        <div className="form-check">
                          <input
                            type="checkbox"
                            checked={editForm.permissions.canManageSupport}
                            onChange={(e) => setEditForm({
                              ...editForm,
                              permissions: { ...editForm.permissions, canManageSupport: e.target.checked },
                            })}
                          />
                          <label>Support Tickets</label>
                        </div>
                      </div>
                    </fieldset>
                    <div className="edit-actions">
                      <button
                        className="btn-save"
                        disabled={updating}
                        onClick={() => handleSaveEdit(member.id)}
                      >
                        {updating ? "Saving..." : "Save Changes"}
                      </button>
                      <button className="btn-cancel" onClick={cancelEdit}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  /* --- View Mode --- */
                  <>
                    <div className="team-card-header">
                      <h3>{member.name}</h3>
                      <span
                        className={
                          "status-badge " +
                          (member.role === "Owner" ? "status-owner" : "status-admin")
                        }
                      >
                        {member.role}
                      </span>
                    </div>
                    <p className="team-card-email">{member.email}</p>
                    {member.phone && <p className="team-card-phone">{member.phone}</p>}
                    {member.permissions && (
                      <div className="team-card-permissions">
                        <p className="permissions-label">Permissions</p>
                        <div className="permissions-tags">
                          {member.permissions.canManageSellers && <span className="perm-tag">Sellers</span>}
                          {member.permissions.canManageProducts && <span className="perm-tag">Products</span>}
                          {member.permissions.canManageFinance && <span className="perm-tag perm-finance">Finance</span>}
                          {member.permissions.canManageSupport && <span className="perm-tag">Support</span>}
                          {!member.permissions.canManageSellers && !member.permissions.canManageProducts &&
                           !member.permissions.canManageFinance && !member.permissions.canManageSupport && (
                            <span className="perm-tag perm-none">None</span>
                          )}
                        </div>
                      </div>
                    )}
                    {member.createdAt && (
                      <p className="team-card-date">
                        Added {new Date(member.createdAt).toLocaleDateString()}
                      </p>
                    )}
                    <div className="card-actions">
                      <button className="btn-edit" onClick={() => startEdit(member)}>
                        Edit
                      </button>
                      <button className="btn-remove" onClick={() => handleRemove(member)}>
                        Remove
                      </button>
                    </div>
                  </>
                )}
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
        .form-hint {
          font-size: 11px;
          color: #6b7280;
          margin-top: 2px;
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
        .team-empty {
          border: 1px dashed #d1d5db;
          border-radius: 8px;
          padding: 14px;
          color: #6b7280;
          background: #f9fafb;
          font-size: 14px;
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
          margin-bottom: 4px;
        }
        .team-card-phone {
          font-size: 13px;
          color: #6b7280; /* gray-500 */
          margin-bottom: 16px;
        }
        
        .team-card-permissions {
          margin-bottom: 8px;
        }
        .permissions-label {
          font-size: 11px;
          font-weight: 500;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 4px;
        }
        .permissions-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
        }
        .perm-tag {
          display: inline-block;
          font-size: 11px;
          font-weight: 500;
          padding: 2px 8px;
          border-radius: 999px;
          background: #f0fdf4;
          color: #166534;
        }
        .perm-finance {
          background: #fef2f2;
          color: #991b1b;
        }
        .perm-none {
          background: #f3f4f6;
          color: #6b7280;
        }
        .team-card-date {
          font-size: 12px;
          color: #9ca3af;
          margin-bottom: 12px;
        }

        .card-actions {
          display: flex;
          gap: 8px;
        }
        .btn-edit {
          flex: 1;
          text-align: center;
          font-size: 12px;
          font-weight: 500;
          color: #1d4ed8;
          background: #dbeafe;
          border-radius: 6px;
          padding: 8px;
          border: none;
          cursor: pointer;
          transition: background-color 150ms;
        }
        .btn-edit:hover {
          background: #bfdbfe;
        }
        .btn-remove {
          flex: 1;
          text-align: center;
          font-size: 12px;
          font-weight: 500;
          color: #dc2626;
          background: #fee2e2;
          border-radius: 6px;
          padding: 8px;
          border: none;
          cursor: pointer;
          transition: background-color 150ms;
        }
        .btn-remove:hover {
          background: #fecaca;
        }

        .edit-form {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .edit-form input:disabled {
          background: #f9fafb;
          color: #9ca3af;
        }
        .edit-actions {
          display: flex;
          gap: 8px;
        }
        .btn-save {
          flex: 1;
          text-align: center;
          font-size: 12px;
          font-weight: 500;
          color: #ffffff;
          background: #111827;
          border-radius: 6px;
          padding: 8px;
          border: none;
          cursor: pointer;
        }
        .btn-save:hover {
          background: #000;
        }
        .btn-save:disabled {
          opacity: 0.6;
        }
        .btn-cancel {
          flex: 1;
          text-align: center;
          font-size: 12px;
          font-weight: 500;
          color: #374151;
          background: #f3f4f6;
          border-radius: 6px;
          padding: 8px;
          border: none;
          cursor: pointer;
        }
        .btn-cancel:hover {
          background: #e5e7eb;
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
