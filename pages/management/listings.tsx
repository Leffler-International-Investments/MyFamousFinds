// FILE: /pages/management/listings.tsx
import { useMemo, useState } from "react";
import type { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useRequireAdmin } from "../../hooks/useRequireAdmin";
import { mgmtFetch } from "../../utils/managementClient";
import { adminDb } from "../../utils/firebaseAdmin";

type Listing = {
  id: string;
  title: string;
  seller: string;
  status: "Live" | "Pending" | "Rejected" | "Sold";
  price: number;

  // existing fields
  brand: string;
  category: string;
  condition: string;
};

type Props = {
  items: Listing[];
};

const CATEGORIES = ["WOMEN", "BAGS", "MEN", "JEWELRY", "WATCHES"] as const;
const CONDITIONS = [
  "New with tags",
  "New (never used)",
  "Excellent",
  "Very good",
  "Good",
  "Fair",
] as const;
const STATUSES = ["Live", "Pending", "Rejected", "Sold"] as const;

export default function ManagementListings({ items }: Props) {
  const { loading } = useRequireAdmin();

  const [rows, setRows] = useState<Listing[]>(items);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<"All" | "Live" | "Pending" | "Rejected" | "Sold">("All");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [sellingId, setSellingId] = useState<string | null>(null);
  const [updatingKey, setUpdatingKey] = useState<string | null>(null);

  // NEW: category edit state per row
  const [editedCategory, setEditedCategory] = useState<Record<string, string>>(
    () => {
      const init: Record<string, string> = {};
      for (const l of items) init[l.id] = (l.category || "").toString();
      return init;
    }
  );
  const [editedCondition, setEditedCondition] = useState<Record<string, string>>(
    () => {
      const init: Record<string, string> = {};
      for (const l of items) init[l.id] = (l.condition || "").toString();
      return init;
    }
  );
  const [editedPrice, setEditedPrice] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const l of items) init[l.id] = l.price ? String(l.price) : "";
    return init;
  });
  const [editedStatus, setEditedStatus] = useState<Record<string, string>>(
    () => {
      const init: Record<string, string> = {};
      for (const l of items) init[l.id] = l.status || "Live";
      return init;
    }
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((l) => {
      // 1. Filter by Status
      if (statusFilter !== "All" && l.status !== statusFilter) return false;

      // 2. Filter by Search Query (Title, Seller, ID, Brand, Category, Condition)
      if (!q) return true;
      return (
        l.title.toLowerCase().includes(q) ||
        l.seller.toLowerCase().includes(q) ||
        l.id.toLowerCase().includes(q) ||
        (l.brand || "").toLowerCase().includes(q) ||
        (l.category || "").toLowerCase().includes(q) ||
        (l.condition || "").toLowerCase().includes(q)
      );
    });
  }, [rows, query, statusFilter]);

  async function handleDelete(id: string, title: string) {
    if (deletingId) return;
    const ok = window.confirm(
      `Delete listing "${title}" permanently? It will disappear from the homepage and catalogue.`
    );
    if (!ok) return;

    try {
      setDeletingId(id);
      const res = await mgmtFetch(`/api/admin/delete/${id}`, { method: "POST" });
      const json = await res.json();
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || "Failed to delete listing");
      }

      setRows((prev) => prev.filter((l) => l.id !== id));
    } catch (err: any) {
      console.error("Delete listing error", err);
      alert(err?.message || "Unable to delete listing");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleMarkSold(id: string, title: string) {
    if (sellingId) return;
    const ok = window.confirm(
      `Mark listing "${title}" as SOLD and hide it from the homepage?`
    );
    if (!ok) return;

    try {
      setSellingId(id);
      const res = await mgmtFetch(`/api/admin/mark-sold/${id}`, { method: "POST" });
      const json = await res.json();
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || "Failed to mark listing as sold");
      }

      // Update status locally so admin sees change immediately
      setRows((prev) =>
        prev.map((l) => (l.id === id ? { ...l, status: "Sold" } : l))
      );
    } catch (err: any) {
      console.error("Mark sold error", err);
      alert(err?.message || "Unable to mark listing as sold");
    } finally {
      setSellingId(null);
    }
  }

  // NEW: Update listing category (writes to Firestore via API)
  async function handleUpdateCategory(id: string, title: string) {
    if (updatingKey) return;

    const nextCat = (editedCategory[id] || "").trim().toUpperCase();
    if (!nextCat) {
      alert("Please select a category first.");
      return;
    }
    if (!CATEGORIES.includes(nextCat as any)) {
      alert("Invalid category. Use: WOMEN, BAGS, MEN, JEWELRY, WATCHES");
      return;
    }

    try {
      setUpdatingKey(`${id}:category`);

      // IMPORTANT:
      // This endpoint must exist in your project.
      // Create /pages/api/admin/update-category/[id].ts (or adjust URL to your existing endpoint).
      const res = await mgmtFetch(`/api/admin/update-category/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: nextCat }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || "Failed to update category");
      }

      // Update locally
      setRows((prev) =>
        prev.map((l) => (l.id === id ? { ...l, category: nextCat } : l))
      );
    } catch (err: any) {
      console.error("Update category error", err);
      alert(err?.message || "Unable to update category");
    } finally {
      setUpdatingKey(null);
    }
  }

  async function handleUpdatePrice(id: string) {
    if (updatingKey) return;
    const raw = (editedPrice[id] || "").trim();
    const parsed = Number(raw);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      alert("Please enter a valid price.");
      return;
    }

    try {
      setUpdatingKey(`${id}:price`);
      const res = await mgmtFetch(`/api/admin/update-listing/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ price: parsed }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || "Failed to update price");
      }
      setRows((prev) =>
        prev.map((l) => (l.id === id ? { ...l, price: parsed } : l))
      );
    } catch (err: any) {
      console.error("Update price error", err);
      alert(err?.message || "Unable to update price");
    } finally {
      setUpdatingKey(null);
    }
  }

  async function handleUpdateCondition(id: string) {
    if (updatingKey) return;
    const nextCondition = (editedCondition[id] || "").trim();
    if (!nextCondition) {
      alert("Please select a condition first.");
      return;
    }

    try {
      setUpdatingKey(`${id}:condition`);
      const res = await mgmtFetch(`/api/admin/update-listing/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ condition: nextCondition }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || "Failed to update condition");
      }
      setRows((prev) =>
        prev.map((l) => (l.id === id ? { ...l, condition: nextCondition } : l))
      );
    } catch (err: any) {
      console.error("Update condition error", err);
      alert(err?.message || "Unable to update condition");
    } finally {
      setUpdatingKey(null);
    }
  }

  async function handleUpdateStatus(id: string) {
    if (updatingKey) return;
    const nextStatus = (editedStatus[id] || "").trim();
    if (!nextStatus) {
      alert("Please select a status first.");
      return;
    }

    try {
      setUpdatingKey(`${id}:status`);
      const res = await mgmtFetch(`/api/admin/update-listing/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || "Failed to update status");
      }
      setRows((prev) =>
        prev.map((l) => (l.id === id ? { ...l, status: nextStatus as Listing["status"] } : l))
      );
    } catch (err: any) {
      console.error("Update status error", err);
      alert(err?.message || "Unable to update status");
    } finally {
      setUpdatingKey(null);
    }
  }

  if (loading) return <div className="dashboard-page" />;

  return (
    <>
      <Head>
        <title>All Listings — Admin</title>
      </Head>

      <div className="dashboard-page">
        <Header />

        <main className="dashboard-main">
          <div className="dashboard-header">
            <div>
              <h1>All Listings</h1>
              <p>Search, review, and moderate every item on Famous-Finds.</p>
            </div>
            <Link href="/management/dashboard">← Back to Management Dashboard</Link>
          </div>

          <div className="filters-bar">
            <input
              type="text"
              placeholder="Search by title, brand, seller, or ID…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="form-input"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="form-input"
              style={{ maxWidth: "220px" }}
            >
              <option value="All">All statuses</option>
              <option value="Live">Live</option>
              <option value="Pending">Pending</option>
              <option value="Rejected">Rejected</option>
              <option value="Sold">Sold</option>
            </select>
          </div>

          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Listing</th>
                  <th>Brand</th>
                  <th>Condition</th>
                  <th>Seller</th>
                  <th>Price (US$)</th>
                  <th>Status</th>

                  {/* NEW */}
                  <th>Category</th>

                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((l) => {
                  const current = (l.category || "").trim().toUpperCase();
                  const edited = (editedCategory[l.id] || "").trim().toUpperCase();
                  const dirty = edited && edited !== current;
                  const conditionCurrent = (l.condition || "").trim();
                  const conditionEdited = (editedCondition[l.id] || "").trim();
                  const conditionDirty =
                    conditionEdited && conditionEdited !== conditionCurrent;
                  const priceCurrent = l.price ? String(l.price) : "";
                  const priceEdited = (editedPrice[l.id] || "").trim();
                  const priceDirty = priceEdited && priceEdited !== priceCurrent;
                  const statusCurrent = l.status;
                  const statusEdited = (editedStatus[l.id] || "").trim();
                  const statusDirty = statusEdited && statusEdited !== statusCurrent;

                  return (
                    <tr key={l.id}>
                      <td>
                        <div className="listing-title">{l.title}</div>
                        <div className="listing-id">ID: {l.id}</div>
                      </td>

                      <td>{l.brand || "—"}</td>

                      <td>
                        <div className="edit-cell">
                          <select
                            className={`edit-select ${conditionDirty ? "edit-select-dirty" : ""}`}
                            value={editedCondition[l.id] ?? l.condition ?? ""}
                            onChange={(e) =>
                              setEditedCondition((prev) => ({
                                ...prev,
                                [l.id]: e.target.value,
                              }))
                            }
                          >
                            <option value="">— Pick —</option>
                            {CONDITIONS.map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            className="btn-table-update"
                            onClick={() => handleUpdateCondition(l.id)}
                            disabled={!conditionDirty || updatingKey === `${l.id}:condition`}
                            title={!conditionDirty ? "No changes to save" : "Save condition"}
                          >
                            {updatingKey === `${l.id}:condition` ? "Updating…" : "Update"}
                          </button>
                        </div>
                      </td>
                      <td>{l.seller}</td>

                      <td>
                        <div className="edit-cell">
                          <input
                            type="number"
                            min={1}
                            step={1}
                            className={`edit-input ${priceDirty ? "edit-input-dirty" : ""}`}
                            value={editedPrice[l.id] ?? ""}
                            onChange={(e) =>
                              setEditedPrice((prev) => ({
                                ...prev,
                                [l.id]: e.target.value,
                              }))
                            }
                          />
                          <button
                            type="button"
                            className="btn-table-update"
                            onClick={() => handleUpdatePrice(l.id)}
                            disabled={!priceDirty || updatingKey === `${l.id}:price`}
                            title={!priceDirty ? "No changes to save" : "Save price"}
                          >
                            {updatingKey === `${l.id}:price` ? "Updating…" : "Update"}
                          </button>
                        </div>
                      </td>

                      <td>
                        <div className="status-cell">
                          <span
                            className={
                              "status-badge " +
                              (l.status === "Live"
                                ? "status-active"
                                : l.status === "Pending"
                                ? "status-pending"
                                : l.status === "Rejected"
                                ? "status-rejected"
                                : "status-sold")
                            }
                          >
                            {l.status}
                          </span>

                          <select
                            className={`edit-select ${statusDirty ? "edit-select-dirty" : ""}`}
                            value={editedStatus[l.id] ?? l.status}
                            onChange={(e) =>
                              setEditedStatus((prev) => ({
                                ...prev,
                                [l.id]: e.target.value,
                              }))
                            }
                          >
                            {STATUSES.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>

                          <button
                            type="button"
                            className="btn-table-update"
                            onClick={() => handleUpdateStatus(l.id)}
                            disabled={!statusDirty || updatingKey === `${l.id}:status`}
                            title={!statusDirty ? "No changes to save" : "Save status"}
                          >
                            {updatingKey === `${l.id}:status` ? "Updating…" : "Update"}
                          </button>
                        </div>
                      </td>

                      {/* NEW: Category editor */}
                      <td>
                        <div className="cat-cell">
                          <select
                            className={`cat-select ${dirty ? "cat-select-dirty" : ""}`}
                            value={editedCategory[l.id] ?? l.category ?? ""}
                            onChange={(e) =>
                              setEditedCategory((prev) => ({
                                ...prev,
                                [l.id]: e.target.value,
                              }))
                            }
                          >
                            <option value="">— Pick —</option>
                            {CATEGORIES.map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </select>

                          <button
                            type="button"
                            className="btn-table-update"
                            onClick={() => handleUpdateCategory(l.id, l.title)}
                            disabled={!dirty || updatingKey === `${l.id}:category`}
                            title={!dirty ? "No changes to save" : "Save category"}
                          >
                            {updatingKey === `${l.id}:category` ? "Updating…" : "Update"}
                          </button>
                        </div>
                      </td>

                      <td>
                        <Link href={`/product/${l.id}`} className="btn-table-view">
                          View
                        </Link>

                        {l.status !== "Sold" && (
                          <button
                            type="button"
                            className="btn-table-sold"
                            onClick={() => handleMarkSold(l.id, l.title)}
                            disabled={sellingId === l.id}
                          >
                            {sellingId === l.id ? "Marking…" : "Mark sold"}
                          </button>
                        )}

                        <button
                          type="button"
                          className="btn-table-delete"
                          onClick={() => handleDelete(l.id, l.title)}
                          disabled={deletingId === l.id}
                        >
                          {deletingId === l.id ? "Deleting…" : "Delete"}
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {visible.length === 0 && (
                  <tr>
                    <td colSpan={8} className="table-message">
                      No listings match this filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </main>

        <Footer />
      </div>

      <style jsx>{`
        .filters-bar {
          margin-bottom: 16px;
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
        }
        .form-input {
          max-width: 320px;
          width: 100%;
          border-radius: 6px;
          border: 1px solid #d1d5db;
          padding: 8px 12px;
          font-size: 14px;
        }
        .form-input:focus {
          border-color: #111827;
          outline: none;
        }

        .table-wrapper {
          overflow-x: auto;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
          background: #ffffff;
          box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
        }
        .data-table {
          min-width: 100%;
          border-collapse: collapse;
          font-size: 14px;
        }
        .data-table thead {
          background: #f9fafb;
        }
        .data-table th {
          padding: 10px 12px;
          text-align: left;
          font-weight: 600;
          color: #374151;
          white-space: nowrap;
        }
        .data-table tbody tr {
          border-bottom: 1px solid #f3f4f6;
        }
        .data-table tbody tr:last-child {
          border-bottom: none;
        }
        .data-table td {
          padding: 10px 12px;
          color: #111827;
          vertical-align: middle;
        }
        .listing-title {
          font-weight: 500;
        }
        .listing-id {
          font-size: 11px;
          color: #9ca3af;
          margin-top: 2px;
        }
        .table-message {
          padding: 24px;
          text-align: center;
          color: #6b7280;
        }

        .status-badge {
          display: inline-flex;
          border-radius: 999px;
          padding: 2px 8px;
          font-size: 12px;
          font-weight: 500;
          white-space: nowrap;
        }
        .status-active {
          background: #d1fae5;
          color: #065f46;
        }
        .status-pending {
          background: #fef3c7;
          color: #92400e;
        }
        .status-rejected {
          background: #fee2e2;
          color: #991b1b;
        }
        .status-sold {
          background: #e5e7eb;
          color: #4b5563;
        }

        .status-cell {
          display: flex;
          gap: 8px;
          align-items: center;
          flex-wrap: wrap;
        }

        .btn-table-view {
          font-size: 12px;
          font-weight: 500;
          color: #2563eb;
          text-decoration: none;
          margin-right: 8px;
        }
        .btn-table-view:hover {
          color: #1d4ed8;
        }

        .btn-table-sold {
          font-size: 12px;
          font-weight: 500;
          border-radius: 999px;
          padding: 4px 10px;
          border: 1px solid #047857;
          background: #ecfdf5;
          color: #047857;
          cursor: pointer;
          margin-right: 8px;
        }
        .btn-table-sold:disabled {
          opacity: 0.7;
          cursor: default;
        }
        .btn-table-sold:hover:not(:disabled) {
          background: #d1fae5;
        }

        .btn-table-delete {
          font-size: 12px;
          font-weight: 500;
          border-radius: 999px;
          padding: 4px 10px;
          border: 1px solid #dc2626;
          background: #fee2e2;
          color: #b91c1c;
          cursor: pointer;
        }
        .btn-table-delete:disabled {
          opacity: 0.7;
          cursor: default;
        }
        .btn-table-delete:hover:not(:disabled) {
          background: #fecaca;
        }

        /* NEW: Category editor styles */
        .cat-cell {
          display: flex;
          gap: 8px;
          align-items: center;
          flex-wrap: wrap;
        }
        .cat-select {
          border-radius: 999px;
          border: 1px solid #d1d5db;
          padding: 6px 10px;
          font-size: 12px;
          background: white;
          min-width: 150px;
        }
        .cat-select-dirty {
          border: 2px solid #047857;
        }

        .btn-table-update {
          font-size: 12px;
          font-weight: 500;
          border-radius: 999px;
          padding: 4px 10px;
          border: 1px solid #0a7;
          background: #ecfdf5;
          color: #047857;
          cursor: pointer;
        }
        .btn-table-update:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          background: #f3f4f6;
          border-color: #d1d5db;
          color: #6b7280;
        }
        .btn-table-update:hover:not(:disabled) {
          background: #d1fae5;
        }

        .edit-cell {
          display: flex;
          gap: 8px;
          align-items: center;
          flex-wrap: wrap;
        }
        .edit-input {
          border-radius: 999px;
          border: 1px solid #d1d5db;
          padding: 6px 10px;
          font-size: 12px;
          background: white;
          width: 120px;
        }
        .edit-input-dirty {
          border: 2px solid #047857;
        }
        .edit-select {
          border-radius: 999px;
          border: 1px solid #d1d5db;
          padding: 6px 10px;
          font-size: 12px;
          background: white;
          min-width: 150px;
        }
        .edit-select-dirty {
          border: 2px solid #047857;
        }
      `}</style>
    </>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async () => {
  try {
    if (!adminDb) return { props: { items: [] } };
    const snap = await adminDb.collection("listings").get();

    const items: Listing[] = snap.docs.map((doc) => {
      const d: any = doc.data() || {};
      const rawStatus = (d.status || "").toString();
      let status: Listing["status"] = "Live";

      if (/pending/i.test(rawStatus)) status = "Pending";
      else if (/reject/i.test(rawStatus)) status = "Rejected";
      else if (/sold/i.test(rawStatus)) status = "Sold";

      const brand = d.brand || d.designer || d.designerName || d.brandName || "";
      const category = d.category || d.categoryLabel || d.categoryName || "";
      const condition =
        d.condition ||
        d.conditionLabel ||
        d.itemCondition ||
        d.conditionText ||
        "";

      return {
        id: doc.id,
        title: d.title || "Untitled listing",
        seller: d.sellerName || d.sellerId || "Seller",
        price: Number(d.price || 0),
        status,
        brand: String(brand),
        category: String(category),
        condition: String(condition),
      };
    });

    return { props: { items } };
  } catch (err) {
    console.error("Error loading listings", err);
    return { props: { items: [] } };
  }
};
