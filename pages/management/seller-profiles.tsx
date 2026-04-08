// FILE: /pages/management/seller-profiles.tsx
import type { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { adminDb } from "../../utils/firebaseAdmin";
import { useRequireAdmin } from "../../hooks/useRequireAdmin";
import { useState } from "react";

type SellerProfile = {
  id: string;
  businessName: string;
  contactName: string;
  email: string;
  contactEmail: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  website: string;
  social: string;
  inventory: string;
  status: string;
  notes: string;
  createdAt: string;
};

type Props = {
  sellers: SellerProfile[];
};

const STATUS_OPTIONS = ["Pending", "Approved", "Suspended", "Blocked", "Removed"];

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  Approved: { bg: "#dcfce7", color: "#166534" },
  Pending: { bg: "#fef9c3", color: "#854d0e" },
  Suspended: { bg: "#ffedd5", color: "#9a3412" },
  Blocked: { bg: "#fee2e2", color: "#991b1b" },
  Removed: { bg: "#f3f4f6", color: "#6b7280" },
};

export default function ManagementSellerProfiles({ sellers: initial }: Props) {
  const { loading: authLoading } = useRequireAdmin();
  const [sellers, setSellers] = useState(initial);
  const [editingSeller, setEditingSeller] = useState<SellerProfile | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    seller: SellerProfile;
    action: "Suspended" | "Blocked" | "Removed";
  } | null>(null);
  const [actionReason, setActionReason] = useState("");
  const [filter, setFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  if (authLoading) return <div className="dashboard-page" />;

  const filtered = sellers.filter((s) => {
    const matchesStatus = statusFilter === "All" || s.status === statusFilter;
    const matchesSearch =
      !filter ||
      s.businessName.toLowerCase().includes(filter.toLowerCase()) ||
      s.email.toLowerCase().includes(filter.toLowerCase()) ||
      s.contactName.toLowerCase().includes(filter.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  async function handleSave() {
    if (!editingSeller) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/update-seller", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingSeller),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || "Failed to save");
      setSellers((prev) =>
        prev.map((s) => (s.id === editingSeller.id ? { ...editingSeller } : s))
      );
      setEditingSeller(null);
      setSuccess("Seller updated successfully.");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusAction() {
    if (!confirmAction) return;
    setSaving(true);
    setError(null);
    const { seller, action } = confirmAction;

    try {
      if (action === "Removed") {
        const res = await fetch(`/api/admin/remove-seller/${seller.id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason: actionReason }),
        });
        const json = await res.json();
        if (json.error) throw new Error(json.error);
      } else {
        const res = await fetch("/api/admin/sellers/toggle", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sellerId: seller.id, status: action }),
        });
        const json = await res.json();
        if (json.error) throw new Error(json.error);
      }

      setSellers((prev) =>
        prev.map((s) => (s.id === seller.id ? { ...s, status: action } : s))
      );
      setConfirmAction(null);
      setActionReason("");
      setSuccess(`Seller ${action.toLowerCase()} successfully.`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleReactivate(seller: SellerProfile) {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/sellers/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sellerId: seller.id, status: "Approved" }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setSellers((prev) =>
        prev.map((s) => (s.id === seller.id ? { ...s, status: "Approved" } : s))
      );
      setSuccess("Seller reactivated.");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function statusBadge(status: string) {
    const c = STATUS_COLORS[status] || { bg: "#f3f4f6", color: "#374151" };
    return (
      <span
        style={{
          display: "inline-block",
          padding: "3px 10px",
          borderRadius: 999,
          fontSize: 12,
          fontWeight: 600,
          background: c.bg,
          color: c.color,
        }}
      >
        {status}
      </span>
    );
  }

  return (
    <>
      <Head>
        <title>Seller Profiles / Controls — Admin</title>
      </Head>
      <div className="dashboard-page">
        <Header />
        <main className="dashboard-main">
          <div className="dashboard-header">
            <div>
              <h1>Seller Profiles / Controls</h1>
              <p>View and edit seller details, statuses, and permissions.</p>
            </div>
            <Link href="/management/dashboard">← Back to Management Dashboard</Link>
          </div>

          {error && <div className="banner error">{error}</div>}
          {success && <div className="banner success">{success}</div>}

          {/* Filters */}
          <div className="filters">
            <input
              type="text"
              placeholder="Search by name or email..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="filter-input"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="filter-select"
            >
              <option value="All">All Statuses</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <span className="filter-count">{filtered.length} seller{filtered.length !== 1 ? "s" : ""}</span>
          </div>

          {/* Seller Table */}
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Seller</th>
                  <th>Contact</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.id}>
                    <td className="cell-bold">{s.businessName || s.contactName || "—"}</td>
                    <td>{s.contactName || "—"}</td>
                    <td className="cell-small">{s.email}</td>
                    <td className="cell-small">{s.phone || "—"}</td>
                    <td className="cell-small">
                      {[s.city, s.state, s.country].filter(Boolean).join(", ") || "—"}
                    </td>
                    <td>{statusBadge(s.status)}</td>
                    <td className="cell-small">{s.createdAt}</td>
                    <td>
                      <div className="action-buttons">
                        <button className="btn btn-edit" onClick={() => setEditingSeller({ ...s })}>
                          Edit
                        </button>
                        {(s.status === "Approved" || s.status === "Pending") && (
                          <button
                            className="btn btn-warn"
                            onClick={() => setConfirmAction({ seller: s, action: "Suspended" })}
                          >
                            Suspend
                          </button>
                        )}
                        {s.status !== "Blocked" && s.status !== "Removed" && (
                          <button
                            className="btn btn-danger"
                            onClick={() => setConfirmAction({ seller: s, action: "Blocked" })}
                          >
                            Block
                          </button>
                        )}
                        {s.status !== "Removed" && (
                          <button
                            className="btn btn-danger-outline"
                            onClick={() => setConfirmAction({ seller: s, action: "Removed" })}
                          >
                            Delete
                          </button>
                        )}
                        {(s.status === "Suspended" || s.status === "Blocked" || s.status === "Removed") && (
                          <button
                            className="btn btn-success"
                            onClick={() => handleReactivate(s)}
                            disabled={saving}
                          >
                            Reactivate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="table-message">No sellers found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </main>
        <Footer />
      </div>

      {/* ── Edit Modal ── */}
      {editingSeller && (
        <div className="modal-overlay" onClick={() => setEditingSeller(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Seller — {editingSeller.businessName || editingSeller.email}</h2>
              <button className="modal-close" onClick={() => setEditingSeller(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <Field label="Business Name" value={editingSeller.businessName} onChange={(v) => setEditingSeller({ ...editingSeller, businessName: v })} />
                <Field label="Contact Name" value={editingSeller.contactName} onChange={(v) => setEditingSeller({ ...editingSeller, contactName: v })} />
                <Field label="Email" value={editingSeller.email} onChange={(v) => setEditingSeller({ ...editingSeller, email: v })} />
                <Field label="Contact Email" value={editingSeller.contactEmail} onChange={(v) => setEditingSeller({ ...editingSeller, contactEmail: v })} />
                <Field label="Phone" value={editingSeller.phone} onChange={(v) => setEditingSeller({ ...editingSeller, phone: v })} />
                <Field label="Website" value={editingSeller.website} onChange={(v) => setEditingSeller({ ...editingSeller, website: v })} />
                <Field label="Social" value={editingSeller.social} onChange={(v) => setEditingSeller({ ...editingSeller, social: v })} />
                <Field label="Address" value={editingSeller.address} onChange={(v) => setEditingSeller({ ...editingSeller, address: v })} />
                <Field label="City" value={editingSeller.city} onChange={(v) => setEditingSeller({ ...editingSeller, city: v })} />
                <Field label="State" value={editingSeller.state} onChange={(v) => setEditingSeller({ ...editingSeller, state: v })} />
                <Field label="ZIP" value={editingSeller.zip} onChange={(v) => setEditingSeller({ ...editingSeller, zip: v })} />
                <Field label="Country" value={editingSeller.country} onChange={(v) => setEditingSeller({ ...editingSeller, country: v })} />
              </div>
              <div style={{ marginTop: 16 }}>
                <label className="field-label">Status</label>
                <select
                  className="field-input"
                  value={editingSeller.status}
                  onChange={(e) => setEditingSeller({ ...editingSeller, status: e.target.value })}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div style={{ marginTop: 16 }}>
                <label className="field-label">Inventory / Items Description</label>
                <textarea
                  className="field-input field-textarea"
                  value={editingSeller.inventory}
                  onChange={(e) => setEditingSeller({ ...editingSeller, inventory: e.target.value })}
                />
              </div>
              <div style={{ marginTop: 16 }}>
                <label className="field-label">Admin Notes</label>
                <textarea
                  className="field-input field-textarea"
                  value={editingSeller.notes}
                  onChange={(e) => setEditingSeller({ ...editingSeller, notes: e.target.value })}
                  placeholder="Internal notes about this seller..."
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-cancel" onClick={() => setEditingSeller(null)}>Cancel</button>
              <button className="btn btn-save" onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirm Action Modal ── */}
      {confirmAction && (
        <div className="modal-overlay" onClick={() => { setConfirmAction(null); setActionReason(""); }}>
          <div className="modal-box modal-small" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                {confirmAction.action === "Removed" ? "Delete" : confirmAction.action} Seller
              </h2>
              <button className="modal-close" onClick={() => { setConfirmAction(null); setActionReason(""); }}>✕</button>
            </div>
            <div className="modal-body">
              <p>
                Are you sure you want to <strong>{confirmAction.action === "Removed" ? "delete" : confirmAction.action.toLowerCase()}</strong>{" "}
                <strong>{confirmAction.seller.businessName || confirmAction.seller.email}</strong>?
              </p>
              {confirmAction.action === "Removed" && (
                <p className="warning-text">
                  This will hide all their listings from the site.
                </p>
              )}
              <label className="field-label" style={{ marginTop: 12 }}>Reason (optional)</label>
              <textarea
                className="field-input field-textarea"
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder="Reason for this action..."
              />
            </div>
            <div className="modal-footer">
              <button className="btn btn-cancel" onClick={() => { setConfirmAction(null); setActionReason(""); }}>Cancel</button>
              <button
                className={`btn ${confirmAction.action === "Removed" ? "btn-danger" : "btn-warn"}`}
                onClick={handleStatusAction}
                disabled={saving}
              >
                {saving ? "Processing..." : confirmAction.action === "Removed" ? "Delete Seller" : `${confirmAction.action} Seller`}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .filters { display: flex; gap: 12px; align-items: center; margin-bottom: 20px; flex-wrap: wrap; }
        .filter-input { flex: 1; min-width: 200px; padding: 8px 14px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; }
        .filter-input:focus { outline: none; border-color: #111; }
        .filter-select { padding: 8px 14px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; background: #fff; }
        .filter-count { font-size: 13px; color: #6b7280; white-space: nowrap; }
        .banner { padding: 10px 14px; border-radius: 8px; font-size: 13px; margin-bottom: 16px; }
        .error { background: #fef2f2; color: #b91c1c; }
        .success { background: #f0fdf4; color: #166534; }
        .table-wrapper { overflow-x: auto; border-radius: 8px; border: 1px solid #e5e7eb; background: #fff; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
        .data-table { min-width: 100%; border-collapse: collapse; font-size: 13px; }
        .data-table thead { background: #f9fafb; }
        .data-table th { padding: 10px 12px; text-align: left; font-weight: 600; color: #374151; font-size: 12px; text-transform: uppercase; white-space: nowrap; }
        .data-table tbody tr { border-bottom: 1px solid #f3f4f6; }
        .data-table tbody tr:hover { background: #f9fafb; }
        .data-table td { padding: 10px 12px; color: #111; vertical-align: middle; }
        .cell-bold { font-weight: 600; }
        .cell-small { font-size: 12px; color: #6b7280; }
        .table-message { padding: 24px; text-align: center; color: #6b7280; }
        .action-buttons { display: flex; gap: 6px; flex-wrap: wrap; }
        .btn { padding: 4px 10px; font-size: 12px; font-weight: 600; border-radius: 6px; cursor: pointer; border: 1px solid transparent; white-space: nowrap; transition: opacity 0.15s; }
        .btn:disabled { opacity: 0.5; cursor: default; }
        .btn:hover:not(:disabled) { opacity: 0.85; }
        .btn-edit { background: #eff6ff; color: #1d4ed8; border-color: #bfdbfe; }
        .btn-warn { background: #fff7ed; color: #c2410c; border-color: #fed7aa; }
        .btn-danger { background: #dc2626; color: #fff; }
        .btn-danger-outline { background: #fff; color: #dc2626; border-color: #fca5a5; }
        .btn-success { background: #f0fdf4; color: #166534; border-color: #bbf7d0; }
        .btn-cancel { background: #f3f4f6; color: #374151; border-color: #d1d5db; }
        .btn-save { background: #111; color: #fff; padding: 8px 20px; }

        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 1000; display: flex; align-items: flex-start; justify-content: center; padding: 40px 16px; overflow-y: auto; }
        .modal-box { background: #fff; border-radius: 16px; box-shadow: 0 20px 50px rgba(0,0,0,0.2); width: 100%; max-width: 720px; }
        .modal-small { max-width: 480px; }
        .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 24px; border-bottom: 1px solid #e5e7eb; }
        .modal-header h2 { margin: 0; font-size: 18px; font-weight: 700; color: #111; }
        .modal-close { background: none; border: none; font-size: 18px; cursor: pointer; color: #6b7280; padding: 4px; }
        .modal-body { padding: 20px 24px; }
        .modal-body p { margin: 0 0 8px; font-size: 14px; color: #374151; }
        .warning-text { color: #dc2626; font-size: 13px; font-weight: 500; }
        .modal-footer { display: flex; justify-content: flex-end; gap: 10px; padding: 16px 24px; border-top: 1px solid #e5e7eb; }

        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        @media (max-width: 600px) { .form-grid { grid-template-columns: 1fr; } }
        .field-label { display: block; font-size: 12px; font-weight: 600; color: #374151; margin-bottom: 4px; text-transform: uppercase; }
        .field-input { width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; color: #111; background: #fff; }
        .field-input:focus { outline: none; border-color: #111; }
        .field-textarea { min-height: 70px; resize: vertical; }
      `}</style>
    </>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="field-label">{label}</label>
      <input
        className="field-input"
        type="text"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
      />
      <style jsx>{`
        .field-label { display: block; font-size: 12px; font-weight: 600; color: #374151; margin-bottom: 4px; text-transform: uppercase; }
        .field-input { width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; color: #111; background: #fff; }
        .field-input:focus { outline: none; border-color: #111; }
      `}</style>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async () => {
  try {
    if (!adminDb) return { props: { sellers: [] } };

    const snap = await adminDb
      .collection("sellers")
      .limit(200)
      .get();

    const sellers: SellerProfile[] = snap.docs.map((doc) => {
      const d: any = doc.data() || {};
      return {
        id: doc.id,
        businessName: d.businessName || d.name || "",
        contactName: d.contactName || d.name || "",
        email: d.email || "",
        contactEmail: d.contactEmail || "",
        phone: d.phone || d.contactPhone || "",
        address: d.address || "",
        city: d.city || "",
        state: d.state || "",
        zip: d.zip || "",
        country: d.country || "",
        website: d.website || "",
        social: d.social || "",
        inventory: d.inventory || "",
        status: d.status || "Active",
        notes: d.notes || "",
        createdAt: d.createdAt?.toDate?.().toLocaleString("en-US") || "",
      };
    });

    sellers.sort((a, b) => {
      if (!a.createdAt && !b.createdAt) return 0;
      if (!a.createdAt) return 1;
      if (!b.createdAt) return -1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return { props: { sellers } };
  } catch (err) {
    console.error("Error loading seller profiles", err);
    return { props: { sellers: [] } };
  }
};
