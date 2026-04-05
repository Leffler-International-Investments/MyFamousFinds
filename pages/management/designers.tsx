// FILE: /pages/management/designers.tsx

import type { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { useMemo, useState } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useRequireAdmin } from "../../hooks/useRequireAdmin";
import { app as firebaseApp, firebaseClientReady } from "../../utils/firebaseClient";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  updateDoc,
  addDoc,
  deleteDoc,
} from "firebase/firestore";

type DesignerCategory = "high-end" | "contemporary" | "jewelry-watches" | "kids" | "top" | "trending" | "emerging" | "";

type DesignerRow = {
  id: string;
  name: string;
  slug: string;
  featured?: boolean;
  group?: "watches" | "fashion";
  designerCategory?: DesignerCategory;
  order?: number;
};

function slugify(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const ManagementDesigners: NextPage = () => {
  const { loading: authLoading } = useRequireAdmin();
  const db = useMemo(() => (firebaseApp ? getFirestore(firebaseApp) : null), []);

  const [rows, setRows] = useState<DesignerRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string>("");

  const [newName, setNewName] = useState("");
  const [newGroup, setNewGroup] = useState<"watches" | "fashion">("fashion");
  const [newFeatured, setNewFeatured] = useState(false);
  const [newDesignerCategory, setNewDesignerCategory] = useState<DesignerCategory>("");

  if (authLoading) return <div className="dashboard-page" />;

  if (!firebaseClientReady || !db) {
    return (
      <div className="dashboard-page">
        <Header />
        <main className="dashboard-main">
          <div className="dashboard-header">
            <div>
              <h1>Designers</h1>
              <p>Firebase env vars are not available in this build environment.</p>
            </div>
            <Link href="/management/dashboard">
              ← Back to Management Dashboard
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  async function load() {
    if (!db) return;
    setErr("");
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "designers"));
      const items: DesignerRow[] = snap.docs
        .map((d) => ({ id: d.id, ...(d.data() as any) }))
        .sort((a, b) => (a.order || 0) - (b.order || 0));
      setRows(items);
    } catch (e: any) {
      setErr(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  async function toggleFeatured(id: string, current: boolean) {
    if (!db) return;
    setErr("");
    try {
      await updateDoc(doc(db, "designers", id), { featured: !current });
      setRows((prev) =>
        prev.map((r) => (r.id === id ? { ...r, featured: !current } : r))
      );
    } catch (e: any) {
      setErr(e?.message || String(e));
    }
  }

  async function updateDesignerCategory(id: string, cat: DesignerCategory) {
    if (!db) return;
    setErr("");
    try {
      await updateDoc(doc(db, "designers", id), { designerCategory: cat });
      setRows((prev) =>
        prev.map((r) => (r.id === id ? { ...r, designerCategory: cat } : r))
      );
    } catch (e: any) {
      setErr(e?.message || String(e));
    }
  }

  async function remove(id: string) {
    if (!db) return;
    if (!confirm("Delete this designer?")) return;
    setErr("");
    try {
      await deleteDoc(doc(db, "designers", id));
      setRows((prev) => prev.filter((r) => r.id !== id));
    } catch (e: any) {
      setErr(e?.message || String(e));
    }
  }

  async function add() {
    if (!db) return;
    const name = newName.trim();
    if (!name) return;
    setErr("");
    try {
      const slug = slugify(name);
      const payload = {
        name,
        slug,
        group: newGroup,
        featured: newFeatured,
        designerCategory: newDesignerCategory,
        order: rows.length + 1,
      };
      const ref = await addDoc(collection(db, "designers"), payload);
      setRows((prev) => [...prev, { id: ref.id, ...payload }]);
      setNewName("");
      setNewFeatured(false);
      setNewGroup("fashion");
      setNewDesignerCategory("");
    } catch (e: any) {
      setErr(e?.message || String(e));
    }
  }

  return (
    <>
      <Head>
        <title>Designers — Management</title>
      </Head>

      <div className="dashboard-page">
        <Header />

        <main className="dashboard-main">
          <div className="dashboard-header">
            <div>
              <h1>Designers</h1>
              <p>Manage the list of approved designers for seller drop-downs and bulk uploads.</p>
            </div>
            <Link href="/management/dashboard">
              ← Back to Management Dashboard
            </Link>
          </div>

          <div style={{ marginBottom: 16 }}>
            <button className="btn-load" onClick={load} disabled={loading}>
              {loading ? "Loading…" : "Load Designers"}
            </button>
          </div>

          {err && <div className="error-banner">{err}</div>}

          <section className="card">
            <h2>Add Designer</h2>
            <div className="add-form">
              <input
                className="form-input"
                placeholder="Designer name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
              <select
                className="form-input"
                value={newGroup}
                onChange={(e) => setNewGroup(e.target.value as any)}
              >
                <option value="fashion">Fashion</option>
                <option value="watches">Watches</option>
              </select>
              <select
                className="form-input"
                value={newDesignerCategory}
                onChange={(e) => setNewDesignerCategory(e.target.value as DesignerCategory)}
              >
                <option value="">No Category</option>
                <option value="high-end">High-End Luxury</option>
                <option value="contemporary">Contemporary</option>
                <option value="jewelry-watches">Jewelry & Watches</option>
                <option value="kids">Kids</option>
              </select>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={newFeatured}
                  onChange={(e) => setNewFeatured(e.target.checked)}
                />
                Featured
              </label>
            </div>
            <button className="btn-add" onClick={add}>Add Designer</button>
          </section>

          <section className="card">
            <h2>Existing Designers ({rows.length})</h2>
            {!rows.length ? (
              <p className="empty-msg">No designers loaded. Click "Load Designers" above.</p>
            ) : (
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Slug</th>
                      <th>Group</th>
                      <th>Category</th>
                      <th>Featured</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.id}>
                        <td className="name-cell">{r.name}</td>
                        <td className="slug-cell">{r.slug}</td>
                        <td>{r.group || "fashion"}</td>
                        <td>
                          <select
                            className="inline-select"
                            value={r.designerCategory || ""}
                            onChange={(e) => updateDesignerCategory(r.id, e.target.value as DesignerCategory)}
                          >
                            <option value="">None</option>
                            <option value="high-end">High-End</option>
                            <option value="contemporary">Contemporary</option>
                            <option value="jewelry-watches">Jewelry & Watches</option>
                            <option value="kids">Kids</option>
                          </select>
                        </td>
                        <td>
                          <button
                            className="btn-toggle"
                            onClick={() => toggleFeatured(r.id, !!r.featured)}
                          >
                            {r.featured ? "Yes" : "No"}
                          </button>
                        </td>
                        <td>
                          <button
                            className="btn-delete"
                            onClick={() => remove(r.id)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </main>

        <Footer />
      </div>

      <style jsx>{`
        .card {
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          padding: 24px;
          margin-bottom: 24px;
        }
        .card h2 {
          margin: 0 0 16px;
          font-size: 18px;
          font-weight: 600;
          color: #111827;
        }
        .add-form {
          display: grid;
          gap: 12px;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          margin-bottom: 16px;
        }
        .form-input {
          width: 100%;
          border-radius: 8px;
          border: 1px solid #d1d5db;
          padding: 10px 12px;
          font-size: 14px;
          font-family: inherit;
        }
        .form-input:focus {
          border-color: #111827;
          outline: none;
        }
        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: #374151;
        }
        .btn-load {
          display: inline-flex;
          padding: 10px 24px;
          border-radius: 999px;
          border: 1px solid #d1d5db;
          background: #ffffff;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s;
        }
        .btn-load:hover {
          border-color: #111827;
          background: #f9fafb;
        }
        .btn-load:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .btn-add {
          display: inline-flex;
          padding: 10px 24px;
          border-radius: 999px;
          border: none;
          background: #111827;
          color: #fff;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.2s;
        }
        .btn-add:hover { opacity: 0.85; }
        .error-banner {
          margin-bottom: 16px;
          padding: 12px 16px;
          border-radius: 10px;
          border: 1px solid #fecaca;
          background: #fef2f2;
          color: #991b1b;
          font-size: 14px;
        }
        .empty-msg {
          font-size: 14px;
          color: #6b7280;
        }
        .table-wrapper {
          overflow-x: auto;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
        }
        .data-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 14px;
        }
        .data-table thead {
          background: #f9fafb;
        }
        .data-table th {
          padding: 10px 12px;
          text-align: left;
          font-weight: 500;
          color: #374151;
          font-size: 13px;
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
        }
        .name-cell {
          font-weight: 500;
        }
        .slug-cell {
          font-family: monospace;
          font-size: 12px;
          color: #6b7280;
        }
        .inline-select {
          border-radius: 6px;
          border: 1px solid #d1d5db;
          padding: 4px 8px;
          font-size: 13px;
          font-family: inherit;
          background: #fff;
        }
        .btn-toggle {
          border-radius: 6px;
          border: 1px solid #d1d5db;
          padding: 4px 12px;
          font-size: 13px;
          background: #fff;
          cursor: pointer;
        }
        .btn-toggle:hover { border-color: #9ca3af; }
        .btn-delete {
          border-radius: 6px;
          border: 1px solid #fca5a5;
          padding: 4px 12px;
          font-size: 13px;
          background: #fff;
          color: #b91c1c;
          cursor: pointer;
        }
        .btn-delete:hover {
          background: #fef2f2;
          border-color: #ef4444;
        }
        @media (max-width: 640px) {
          .add-form {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
};

export async function getServerSideProps() {
  return { props: {} };
}

export default ManagementDesigners;
