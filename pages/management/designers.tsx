// FILE: /pages/management/designers.tsx
// Management — Designers Directory. This page controls the "designers"
// collection in Firestore. Sell + Bulk Simple only read from that collection.

import { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import firebaseApp from "../../utils/firebaseClient";
import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";

const db = getFirestore(firebaseApp);

type Designer = {
  id: string;
  name: string;
  isTop?: boolean;
  isUpcoming?: boolean;
  active?: boolean;
  itemTypes?: string;
  notes?: string;
};

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function ManagementDesigners() {
  const [designers, setDesigners] = useState<Designer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");

  const [newName, setNewName] = useState("");
  const [newItemTypes, setNewItemTypes] = useState("B,S,J,C…");
  const [newNotes, setNewNotes] = useState("");
  const [adding, setAdding] = useState(false);

  const [seeding, setSeeding] = useState(false);

  // ------- Load designers from Firestore -------
  async function loadDesigners() {
    setLoading(true);
    setError(null);
    try {
      const snap = await getDocs(collection(db, "designers"));
      const list: Designer[] = snap.docs
        .map((d) => ({ id: d.id, ...(d.data() as any) }))
        .map((d) => ({
          id: d.id,
          name: String(d.name || d.id),
          isTop: !!d.isTop,
          isUpcoming: !!d.isUpcoming,
          active: d.active ?? true,
          itemTypes: d.itemTypes || "B,S,J,C…",
          notes: d.notes || "",
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
      setDesigners(list);
    } catch (e: any) {
      console.error(e);
      setError(e?.message || "Failed to load designers");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDesigners();
  }, []);

  // ------- Filter list by search -------
  const filtered = useMemo(() => {
    if (!search.trim()) return designers;
    const q = search.toLowerCase();
    return designers.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        (d.notes || "").toLowerCase().includes(q)
    );
  }, [designers, search]);

  // ------- Toggle flags (top / upcoming / active) -------
  async function toggle(id: string, field: "isTop" | "isUpcoming" | "active") {
    try {
      const current = designers.find((d) => d.id === id);
      const value = !((current as any)?.[field]);
      await updateDoc(doc(db, "designers", id), { [field]: value });
      setDesigners((prev) =>
        prev.map((d) => (d.id === id ? { ...d, [field]: value } : d))
      );
    } catch (e: any) {
      console.error(e);
      alert("Failed to update designer: " + (e?.message || ""));
    }
  }

  // ------- Update itemTypes / notes on blur -------
  async function updateField(
    id: string,
    field: "itemTypes" | "notes",
    value: string
  ) {
    try {
      await updateDoc(doc(db, "designers", id), { [field]: value });
      setDesigners((prev) =>
        prev.map((d) => (d.id === id ? { ...d, [field]: value } : d))
      );
    } catch (e: any) {
      console.error(e);
      alert("Failed to update field: " + (e?.message || ""));
    }
  }

  // ------- Delete designer -------
  async function onDelete(id: string) {
    if (!confirm("Delete this designer from the directory?")) return;
    try {
      await deleteDoc(doc(db, "designers", id));
      setDesigners((prev) => prev.filter((d) => d.id !== id));
    } catch (e: any) {
      console.error(e);
      alert("Failed to delete designer: " + (e?.message || ""));
    }
  }

  // ------- Add designer manually -------
  async function onAdd(e: React.FormEvent) {
    e.preventDefault();
    const name = newName.trim();
    if (!name) {
      alert("Please enter a designer name.");
      return;
    }
    setAdding(true);
    try {
      await addDoc(collection(db, "designers"), {
        name,
        slug: slugify(name),
        isTop: false,
        isUpcoming: false,
        active: true,
        itemTypes: newItemTypes || "B,S,J,C…",
        notes: newNotes || "",
      });
      setNewName("");
      setNewItemTypes("B,S,J,C…");
      setNewNotes("");
      await loadDesigners();
    } catch (e: any) {
      console.error(e);
      alert("Failed to add designer: " + (e?.message || ""));
    } finally {
      setAdding(false);
    }
  }

  // ------- Seed defaults / bulk add -------
  async function onSeedDefaults() {
    if (
      !confirm(
        "Seed default top designers into the directory?\nThis will MERGE with existing designers and will not delete anything."
      )
    ) {
      return;
    }
    setSeeding(true);
    try {
      const res = await fetch("/api/management/seed-designers", {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || "Failed to seed designers");
      }
      await loadDesigners();
      alert(`Seeded/merged ${json.count} default designers.`);
    } catch (e: any) {
      console.error(e);
      alert("Failed to seed defaults: " + (e?.message || ""));
    } finally {
      setSeeding(false);
    }
  }

  return (
    <div className="dark-theme-page">
      <Head>
        <title>Designers Directory – Management | Famous Finds</title>
      </Head>

      <Header />

      <main className="section">
        <div className="back-link">
          {/* ----- THIS LINK IS NOW CORRECTED ----- */}
          <Link href="/management/dashboard">← Back to Management Dashboard</Link>
        </div>

        <h1 className="page-title">Designers Directory</h1>
        <p className="page-sub">
          Control which designers are accepted on Famous-Finds. Only{" "}
          <strong>active</strong> designers appear in seller drop-downs and
          upload pages.
        </p>

        {/* Search + Seed button row */}
        <div className="toolbar">
          <input
            type="text"
            className="search"
            placeholder="Search…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button
            type="button"
            className="seed-btn"
            onClick={onSeedDefaults}
            disabled={seeding}
          >
            {seeding ? "Seeding…" : "Seed defaults / bulk add"}
          </button>
        </div>

        {/* Current designers table */}
        <section className="card">
          <div className="card-header">
            <h2>
              CURRENT DESIGNERS{" "}
              <span className="count">
                Showing {filtered.length} of {designers.length}.
              </span>
            </h2>
          </div>

          {loading && <p className="muted">Loading designers…</p>}
          {error && <p className="error">⚠ {error}</p>}

          {!loading && !error && filtered.length === 0 && (
            <p className="muted">No designers match this search.</p>
          )}

          {!loading && !error && filtered.length > 0 && (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Top</th>
                    <th>Upcoming</th>
                    <th>Active</th>
                    <th>Item types (codes)</th>
                    <th>Notes</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((d) => (
                    <tr key={d.id}>
                      <td>{d.name}</td>
                      <td>
                        <input
                          type="checkbox"
                          checked={!!d.isTop}
                          onChange={() => toggle(d.id, "isTop")}
                        />
                      </td>
                      <td>
                        <input
                          type="checkbox"
                          checked={!!d.isUpcoming}
                          onChange={() => toggle(d.id, "isUpcoming")}
                        />
                      </td>
                      <td>
                        <input
                          type="checkbox"
                          checked={d.active !== false}
                          onChange={() => toggle(d.id, "active")}
                        />
                      </td>
                      <td>
                        <input
                          className="small-input"
                          defaultValue={d.itemTypes || ""}
                          onBlur={(e) =>
                            updateField(d.id, "itemTypes", e.target.value)
                          }
                        />
                        <div className="hint">
                          B = bags, S = shoes, J = jewelry, C = clothing, etc.
                        </div>
                      </td>
                      <td>
                        <input
                          className="small-input"
                          defaultValue={d.notes || ""}
                          onBlur={(e) =>
                            updateField(d.id, "notes", e.target.value)
                          }
                        />
                      </td>
                      <td>
                        <button
                          type="button"
                          className="delete-btn"
                          onClick={() => onDelete(d.id)}
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

        {/* Add a designer */}
        <section className="card add-card">
          <h2>ADD A DESIGNER</h2>
          <p className="muted">
            This will immediately become available in seller upload drop-downs.
          </p>

          <form className="add-form" onSubmit={onAdd}>
            <label>
              Designer name
              <input
                type="text"
                placeholder="e.g., Goyard"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </label>

            <label>
              Item types (codes)
              <input
                type="text"
                value={newItemTypes}
                onChange={(e) => setNewItemTypes(e.target.value)}
              />
              <div className="hint">
                Example: <strong>B,S,J,C…</strong> – B = bags, S = shoes, J =
                jewelry, C = clothing, etc.
              </div>
            </label>

            <label>
              Notes (optional)
              <input
                type="text"
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
              />
            </label>

            <button
              type="submit"
              className="add-btn"
              disabled={adding}
            >
              {adding ? "Adding…" : "Add designer"}
            </button>
          </form>
        </section>
      </main>

      <Footer />

      <style jsx>{`
        .back-link a {
          font-size: 13px;
          color: #9ca3af;
        }
        .page-title {
          margin-top: 12px;
          font-size: 22px;
        }
        .page-sub {
          font-size: 13px;
          color: #9ca3af;
          max-width: 520px;
          margin-bottom: 16px;
        }
        .toolbar {
          display: flex;
          gap: 8px;
          margin-bottom: 14px;
          flex-wrap: wrap;
        }
        .search {
          flex: 1;
          min-width: 220px;
          border-radius: 999px;
          border: 1px solid #374151;
          background: #020617;
          color: #e5e7eb;
          padding: 8px 12px;
          font-size: 13px;
        }
        .seed-btn {
          border-radius: 999px;
          border: none;
          padding: 8px 14px;
          font-size: 13px;
          font-weight: 600;
          background: #111827;
          color: #e5e7eb;
          border: 1px solid #4b5563;
          cursor: pointer;
          white-space: nowrap;
        }
        .seed-btn[disabled] {
          opacity: 0.6;
          cursor: default;
        }
        .card {
          background: #020617;
          border-radius: 16px;
          border: 1px solid #111827;
          padding: 14px 16px 16px;
          margin-bottom: 18px;
        }
        .card-header h2 {
          font-size: 15px;
          margin: 0 0 8px;
        }
        .count {
          font-size: 12px;
          color: #9ca3af;
          font-weight: 400;
        }
        .muted {
          font-size: 12px;
          color: #9ca3af;
        }
        .error {
          font-size: 12px;
          color: #fecaca;
        }
        .table-wrap {
          overflow-x: auto;
          margin-top: 6px;
        }
        .table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
        }
        th,
        td {
          padding: 6px 8px;
          border-bottom: 1px solid #111827;
          vertical-align: top;
        }
        th {
          font-weight: 600;
          color: #9ca3af;
        }
        td input[type="checkbox"] {
          transform: scale(1.1);
        }
        .small-input {
          width: 180px;
          max-width: 100%;
          background: #020617;
          border-radius: 8px;
          border: 1px solid #1f2937;
          padding: 4px 6px;
          color: #e5e7eb;
          font-size: 12px;
        }
        .hint {
          font-size: 11px;
          color: #6b7280;
          margin-top: 2px;
        }
        .delete-btn {
          background: #7f1d1d;
          color: #fee2e2;
          border-radius: 999px;
          border: none;
          padding: 4px 10px;
          font-size: 11px;
          cursor: pointer;
        }
        .add-card h2 {
          margin-bottom: 4px;
        }
        .add-form {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
          gap: 10px 16px;
          margin-top: 10px;
          align-items: flex-end;
        }
        .add-form label {
          display: flex;
          flex-direction: column;
          gap: 4px;
          font-size: 13px;
        }
        .add-form input[type="text"] {
          background: #020617;
          border-radius: 8px;
          border: 1px solid #1f2937;
          padding: 8px 10px;
          color: #e5e7eb;
        }
        .add-btn {
          margin-top: 4px;
          border-radius: 999px;
          border: none;
          padding: 8px 14px;
          font-size: 13px;
          font-weight: 600;
          background: #fff;
          color: #000;
          cursor: pointer;
          justify-self: flex-start;
        }
        .add-btn[disabled] {
          opacity: 0.6;
          cursor: default;
        }
      `}</style>
    </div>
  );
}
