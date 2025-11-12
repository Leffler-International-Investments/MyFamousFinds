// FILE: /pages/management/designers.tsx

import { useState, useEffect, FormEvent } from "react";
import Head from "next/head";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import firebaseApp from "../../utils/firebaseClient";
import {
  getFirestore,
  collection,
  onSnapshot,
  query,
  orderBy,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";

const db = getFirestore(firebaseApp);

type Designer = {
  id: string;
  name: string;
  isTop?: boolean;
  isUpcoming?: boolean;
  active?: boolean;
  itemTypes?: string[];
  notes?: string | null;
};

export default function ManagementDesignersPage() {
  // 🔹 removed useRequireManagement; page just renders
  const [designers, setDesigners] = useState<Designer[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [newName, setNewName] = useState("");
  const [newIsTop, setNewIsTop] = useState(false);
  const [newIsUpcoming, setNewIsUpcoming] = useState(false);
  const [newItemTypes, setNewItemTypes] = useState("");
  const [newNotes, setNewNotes] = useState("");

  useEffect(() => {
    const q = query(collection(db, "designers"), orderBy("name", "asc"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list: Designer[] = [];
        snap.forEach((docSnap) => {
          const data = docSnap.data() as any;
          list.push({
            id: docSnap.id,
            name: data.name || "",
            isTop: !!data.isTop,
            isUpcoming: !!data.isUpcoming,
            active: data.active !== false,
            itemTypes: data.itemTypes || [],
            notes: data.notes || null,
          });
        });
        setDesigners(list);
      },
      (err) => {
        console.error(err);
        setError("Unable to load designers.");
      }
    );
    return () => unsub();
  }, []);

  const handleAddDesigner = async (e: FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    setBusy(true);
    setError(null);

    try {
      const itemTypesArray = newItemTypes
        .split(",")
        .map((v) => v.trim().toUpperCase())
        .filter(Boolean);

      await addDoc(collection(db, "designers"), {
        name: newName.trim(),
        slug: newName.trim().toLowerCase().replace(/\s+/g, "-"),
        isTop: newIsTop,
        isUpcoming: newIsUpcoming,
        active: true,
        itemTypes: itemTypesArray,
        notes: newNotes.trim() || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setNewName("");
      setNewIsTop(false);
      setNewIsUpcoming(false);
      setNewItemTypes("");
      setNewNotes("");
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Unable to add designer.");
    } finally {
      setBusy(false);
    }
  };

  const toggleField = async (
    designer: Designer,
    field: "active" | "isTop" | "isUpcoming"
  ) => {
    setBusy(true);
    setError(null);

    try {
      const ref = doc(db, "designers", designer.id);
      const current = (designer as any)[field];
      await updateDoc(ref, {
        [field]: !current,
        updatedAt: serverTimestamp(),
      });
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Unable to update designer.");
    } finally {
      setBusy(false);
    }
  };

  const handleUpdateItemTypes = async (designer: Designer, raw: string) => {
    setBusy(true);
    setError(null);

    try {
      const arr = raw
        .split(",")
        .map((v) => v.trim().toUpperCase())
        .filter(Boolean);

      const ref = doc(db, "designers", designer.id);
      await updateDoc(ref, {
        itemTypes: arr,
        updatedAt: serverTimestamp(),
      });
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Unable to update item types.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="dark-theme-page">
      <Head>
        <title>Management — Designers Directory | Famous Finds</title>
      </Head>

      <Header />

      <main className="section">
        <div className="back-link">
          <Link href="/management/dashboard">← Back to Management Dashboard</Link>
        </div>

        <div className="page-header">
          <div>
            <h1>Designers Directory</h1>
            <p className="subtitle">
              Control which designers are accepted on Famous-Finds. Only{" "}
              <strong>active</strong> designers appear in seller drop-downs and
              upload pages.
            </p>
          </div>
        </div>

        {error && <p className="banner error">{error}</p>}
        {busy && <p className="banner busy">Saving changes…</p>}

        <section className="card">
          <h2>Current designers</h2>
          <p className="card-subtitle">
            Total: <strong>{designers.length}</strong>. Use the switches to mark{" "}
            <strong>Top</strong>, <strong>Upcoming</strong>, or{" "}
            <strong>Inactive</strong>.
          </p>

          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Top</th>
                  <th>Upcoming</th>
                  <th>Active</th>
                  <th>Item types (codes)</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {designers.map((d) => (
                  <tr key={d.id}>
                    <td>{d.name}</td>
                    <td>
                      <label className="toggle-label">
                        <input
                          type="checkbox"
                          checked={!!d.isTop}
                          onChange={() => toggleField(d, "isTop")}
                        />
                        <span>Top</span>
                      </label>
                    </td>
                    <td>
                      <label className="toggle-label">
                        <input
                          type="checkbox"
                          checked={!!d.isUpcoming}
                          onChange={() => toggleField(d, "isUpcoming")}
                        />
                        <span>Upcoming</span>
                      </label>
                    </td>
                    <td>
                      <label className="toggle-label">
                        <input
                          type="checkbox"
                          checked={d.active !== false}
                          onChange={() => toggleField(d, "active")}
                        />
                        <span>{d.active === false ? "Inactive" : "Active"}</span>
                      </label>
                    </td>
                    <td>
                      <input
                        className="small-input"
                        defaultValue={(d.itemTypes || []).join(", ")}
                        onBlur={(e) =>
                          handleUpdateItemTypes(d, e.target.value || "")
                        }
                        placeholder="B,S,J,C…"
                      />
                      <div className="field-hint">
                        B = bags, S = shoes, J = jewelry, C = clothing, etc.
                      </div>
                    </td>
                    <td className="notes-cell">
                      {d.notes || <span className="muted">—</span>}
                    </td>
                  </tr>
                ))}
                {!designers.length && (
                  <tr>
                    <td colSpan={6} className="muted">
                      No designers yet. Add at least one approved designer
                      below.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="card">
          <h2>Add a designer</h2>
          <p className="card-subtitle">
            This will immediately become available in seller upload drop-downs.
          </p>

          <form onSubmit={handleAddDesigner} className="add-form">
            <label>
              Designer name
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Chanel, Louis Vuitton, Dan Trousers"
                required
              />
            </label>

            <div className="form-row">
              <label className="checkbox-inline">
                <input
                  type="checkbox"
                  checked={newIsTop}
                  onChange={(e) => setNewIsTop(e.target.checked)}
                />
                <span>Top designer</span>
              </label>

              <label className="checkbox-inline">
                <input
                  type="checkbox"
                  checked={newIsUpcoming}
                  onChange={(e) => setNewIsUpcoming(e.target.checked)}
                />
                <span>Upcoming / emerging</span>
              </label>
            </div>

            <label>
              Item types (codes, comma-separated)
              <input
                type="text"
                value={newItemTypes}
                onChange={(e) => setNewItemTypes(e.target.value)}
                placeholder="B,S,J,C (Bags, Shoes, Jewelry, Clothing…)"
              />
              <div className="field-hint">
                Use codes so management and vetting know what this designer
                produces.
              </div>
            </label>

            <label>
              Internal notes (optional)
              <textarea
                rows={3}
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                placeholder="Where they sell, price point, why we accept them, etc."
              />
            </label>

            <button type="submit" className="btn-primary" disabled={busy}>
              {busy ? "Saving…" : "Add designer to directory"}
            </button>
          </form>
        </section>
      </main>

      <Footer />

      <style jsx>{`
        .back-link a {
          font-size: 12px;
          color: #9ca3af;
        }
        .back-link a:hover {
          color: #e5e7eb;
        }
        .page-header {
          margin-top: 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        h1 {
          font-size: 20px;
          font-weight: 600;
          color: white;
        }
        .subtitle {
          margin-top: 4px;
          font-size: 12px;
          color: #9ca3af;
        }
        .subtitle strong {
          font-weight: 600;
          color: #e5e7eb;
        }
        .card {
          margin-top: 24px;
          border-radius: 16px;
          border: 1px solid #ffffff1a;
          background: #ffffff0d;
          padding: 16px;
          font-size: 12px;
        }
        .card h2 {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.16em;
          color: #9ca3af;
        }
        .card-subtitle {
          margin-top: 8px;
          color: #d1d5db;
        }
        .card-subtitle strong {
          font-weight: 600;
          color: white;
        }
        .table-wrapper {
          margin-top: 12px;
          overflow-x: auto;
          border-radius: 6px;
          border: 1px solid #ffffff1a;
        }
        .data-table {
          min-width: 100%;
          text-align: left;
          font-size: 11px;
          color: #f3f4f6;
        }
        .data-table thead {
          background: #ffffff0d;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.16em;
          color: #9ca3af;
        }
        .data-table th,
        .data-table td {
          padding: 8px 12px;
          vertical-align: top;
        }
        .data-table tr {
          border-bottom: 1px solid #ffffff1a;
        }
        .data-table tr:last-child {
          border-bottom: 0;
        }
        .toggle-label {
          display: inline-flex;
          gap: 6px;
          align-items: center;
          font-size: 11px;
        }
        .small-input {
          width: 180px;
          max-width: 100%;
          border-radius: 6px;
          border: 1px solid #ffffff1a;
          background: #00000066;
          padding: 6px 8px;
          font-size: 11px;
          color: #f9fafb;
        }
        .field-hint {
          margin-top: 4px;
          font-size: 10px;
          color: #9ca3af;
        }
        .notes-cell {
          max-width: 260px;
        }
        .notes-cell .muted {
          font-style: italic;
        }
        .add-form {
          margin-top: 12px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        label {
          display: flex;
          flex-direction: column;
          gap: 4px;
          font-size: 12px;
        }
        input,
        textarea {
          border-radius: 8px;
          border: 1px solid #ffffff1a;
          background: #00000066;
          padding: 8px 10px;
          font-size: 12px;
          color: #f9fafb;
        }
        textarea {
          resize: vertical;
        }
        .form-row {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
        }
        .checkbox-inline {
          display: inline-flex;
          gap: 6px;
          align-items: center;
          font-size: 12px;
        }
        .btn-primary {
          margin-top: 4px;
          border-radius: 999px;
          background: white;
          padding: 8px 16px;
          font-size: 12px;
          font-weight: 600;
          color: black;
          border: none;
          cursor: pointer;
        }
        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .banner {
          margin-top: 12px;
          font-size: 12px;
        }
        .banner.error {
          color: #f87171;
        }
        .banner.busy {
          color: #fbbf24;
        }
      `}</style>
    </div>
  );
}
