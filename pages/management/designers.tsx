// FILE: /pages/management/designers.tsx
// Management — Designers Directory (full CRUD + seed)
// Keeps your original Firestore client approach and UI,
// adds delete + search + seeding (API with client fallback).

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
  deleteDoc,
  doc,
  writeBatch,
  serverTimestamp,
} from "firebase/firestore";

const db = getFirestore(firebaseApp);

type Designer = {
  id: string;
  name: string;
  slug?: string;
  isTop?: boolean;
  isUpcoming?: boolean;
  active?: boolean;
  itemTypes?: string[];
  notes?: string | null;
};

const DEFAULT_25 = [
  "Chanel",
  "Gucci",
  "Hermès",
  "Louis Vuitton",
  "Prada",
  "Dior",
  "Celine",
  "Saint Laurent",
  "Balenciaga",
  "Bottega Veneta",
  "Givenchy",
  "Fendi",
  "Versace",
  "Valentino",
  "Burberry",
  "Alexander McQueen",
  "Loewe",
  "Miu Miu",
  "Tom Ford",
  "Off-White",
  "Rolex",
  "Cartier",
  "Tiffany & Co.",
  "Van Cleef & Arpels",
  "TAG Heuer",
];

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function ManagementDesignersPage() {
  // ===== State =====
  const [designers, setDesigners] = useState<Designer[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [newName, setNewName] = useState("");
  const [newIsTop, setNewIsTop] = useState(false);
  const [newIsUpcoming, setNewIsUpcoming] = useState(false);
  const [newItemTypes, setNewItemTypes] = useState("");
  const [newNotes, setNewNotes] = useState("");

  const [filter, setFilter] = useState(""); // search box
  const [adminKey, setAdminKey] = useState(""); // for API seeding
  const [seedText, setSeedText] = useState(""); // optional custom list

  // ===== Live load =====
  useEffect(() => {
    const qy = query(collection(db, "designers"), orderBy("name", "asc"));
    const unsub = onSnapshot(
      qy,
      (snap) => {
        const list: Designer[] = [];
        snap.forEach((docSnap) => {
          const data = docSnap.data() as any;
          list.push({
            id: docSnap.id,
            name: data.name || "",
            slug: data.slug || docSnap.id,
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

  // ===== Actions =====
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
        slug: slugify(newName.trim()),
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

  const handleDelete = async (designer: Designer) => {
    if (!confirm(`Delete “${designer.name}”?`)) return;
    setBusy(true);
    setError(null);
    try {
      await deleteDoc(doc(db, "designers", designer.id));
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Unable to delete designer.");
    } finally {
      setBusy(false);
    }
  };

  // Seed via API if available (preferred, server writes)
  const seedViaApi = async () => {
    setBusy(true);
    setError(null);
    try {
      const body =
        seedText.trim().length > 0
          ? { text: seedText }
          : {}; // defaults on server when text empty
      const res = await fetch("/api/admin/seed-designers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": adminKey.trim(),
        },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok || !json?.ok) throw new Error(json?.error || "seed_failed");
      alert(`Upserted ${json.upserted} designers.`);
    } catch (err: any) {
      console.warn("API seeding failed, will not fall back automatically.", err);
      setError(err?.message || "Seeding failed.");
    } finally {
      setBusy(false);
    }
  };

  // Optional client fallback (writes directly; requires rules to allow management)
  const seedClientFallback = async () => {
    const names =
      seedText.trim().length > 0
        ? seedText.split(/\r?\n/).map((s) => s.trim()).filter(Boolean)
        : DEFAULT_25;

    if (!confirm(`Add/merge ${names.length} designers from this page?`)) return;

    setBusy(true);
    setError(null);
    try {
      const batch = writeBatch(db);
      names.forEach((nm) => {
        const name = nm.trim();
        if (!name) return;
        const id = slugify(name);
        const ref = doc(db, "designers", id);
        batch.set(
          ref,
          {
            name,
            slug: id,
            approved: true,
            active: true,
            updatedAt: serverTimestamp(),
            createdAt: serverTimestamp(),
          },
          { merge: true }
        );
      });
      await batch.commit();
      alert(`Upserted ${names.length} designers (client fallback).`);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Client seeding failed.");
    } finally {
      setBusy(false);
    }
  };

  // ===== Derived =====
  const filtered = designers.filter((d) => {
    if (!filter.trim()) return true;
    const f = filter.toLowerCase();
    return (
      d.name.toLowerCase().includes(f) ||
      (d.slug || "").toLowerCase().includes(f)
    );
  });

  // ===== UI =====
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

        {error && <p className="banner error">❌ {error}</p>}
        {busy && <p className="banner busy">Saving…</p>}

        {/* Search + Seed controls */}
        <section className="card">
          <div className="toolbar">
            <label className="tool">
              <span>Search</span>
              <input
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Type to filter by name or slug…"
              />
            </label>

            <div className="seed">
              <details>
                <summary>Seed defaults / bulk add</summary>
                <div className="seed-body">
                  <p className="muted">
                    Option A (server): enter your <code>ADMIN_SEED_KEY</code>{" "}
                    and click <strong>Seed via API</strong>. Leave the list
                    empty to use 25 defaults.
                  </p>
                  <label className="tool">
                    <span>Admin Key</span>
                    <input
                      type="password"
                      value={adminKey}
                      onChange={(e) => setAdminKey(e.target.value)}
                      placeholder="••••••••"
                    />
                  </label>
                  <label className="tool">
                    <span>Designers (one per line)</span>
                    <textarea
                      rows={5}
                      value={seedText}
                      onChange={(e) => setSeedText(e.target.value)}
                      placeholder={DEFAULT_25.join("\n")}
                    />
                  </label>
                  <div className="seed-actions">
                    <button
                      className="btn-secondary"
                      onClick={seedViaApi}
                      disabled={busy || !adminKey.trim()}
                      title="Writes on server; safest"
                    >
                      Seed via API
                    </button>
                    <button
                      className="btn-secondary"
                      onClick={seedClientFallback}
                      disabled={busy}
                      title="Writes from browser; needs permissive rules for management"
                    >
                      Seed (client fallback)
                    </button>
                  </div>
                </div>
              </details>
            </div>
          </div>
        </section>

        {/* Table */}
        <section className="card">
          <h2>Current designers</h2>
          <p className="card-subtitle">
            Showing <strong>{filtered.length}</strong> of{" "}
            <strong>{designers.length}</strong>.
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
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((d) => (
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
                    <td>
                      <button
                        className="chip danger"
                        onClick={() => handleDelete(d)}
                        disabled={busy}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {!filtered.length && (
                  <tr>
                    <td colSpan={7} className="muted">
                      No matching designers.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Add form */}
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
                placeholder="e.g., Goyard"
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
        .back-link a { font-size: 12px; color: #9ca3af; }
        .back-link a:hover { color: #e5e7eb; }
        .page-header { margin-top: 16px; display: flex; align-items: center; justify-content: space-between; }
        h1 { font-size: 20px; font-weight: 600; color: white; }
        .subtitle { margin-top: 4px; font-size: 12px; color: #9ca3af; }
        .subtitle strong { font-weight: 600; color: #e5e7eb; }

        .card { margin-top: 24px; border-radius: 16px; border: 1px solid #ffffff1a; background: #ffffff0d; padding: 16px; font-size: 12px; }
        .card h2 { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.16em; color: #9ca3af; }
        .card-subtitle { margin-top: 8px; color: #d1d5db; }
        .card-subtitle strong { font-weight: 600; color: white; }

        .toolbar { display: grid; gap: 12px; }
        @media (min-width: 720px) { .toolbar { grid-template-columns: 1fr 1fr; } }
        .tool { display: flex; flex-direction: column; gap: 6px; }
        .tool span { color: #9ca3af; font-size: 11px; letter-spacing: 0.02em; text-transform: uppercase; }
        .tool input, .tool textarea { background: #00000066; color: #fff; border: 1px solid #ffffff1a; border-radius: 6px; padding: 10px; font-size: 12px; }
        textarea { resize: vertical; }
        .muted { color: #9ca3af; }

        .seed details { background: #00000033; border: 1px solid #ffffff1a; border-radius: 8px; padding: 8px 10px; }
        .seed summary { cursor: pointer; color: #e5e7eb; }
        .seed-body { margin-top: 8px; display: grid; gap: 8px; }
        .seed-actions { display: flex; gap: 8px; }

        .table-wrapper { margin-top: 12px; overflow-x: auto; border-radius: 6px; border: 1px solid #ffffff1a; }
        .data-table { min-width: 100%; text-align: left; font-size: 11px; color: #f3f4f6; }
        .data-table thead { background: #ffffff0d; font-size: 10px; text-transform: uppercase; letter-spacing: 0.16em; color: #9ca3af; }
        .data-table th, .data-table td { padding: 8px 12px; vertical-align: top; }
        .data-table tr { border-bottom: 1px solid #ffffff1a; }
        .data-table tr:last-child { border-bottom: 0; }

        .toggle-label { display: inline-flex; gap: 6px; align-items: center; font-size: 11px; }
        .small-input { width: 180px; max-width: 100%; border-radius: 6px; border: 1px solid #ffffff1a; background: #00000066; padding: 6px 8px; font-size: 11px; color: #f9fafb; }
        .field-hint { margin-top: 4px; font-size: 10px; color: #9ca3af; }
        .notes-cell { max-width: 260px; }
        .notes-cell .muted { font-style: italic; }

        .add-form { margin-top: 12px; display: flex; flex-direction: column; gap: 10px; }
        label { display: flex; flex-direction: column; gap: 4px; font-size: 12px; }
        input, textarea { border-radius: 8px; border: 1px solid #ffffff1a; background: #00000066; padding: 8px 10px; font-size: 12px; color: #f9fafb; }
        textarea { resize: vertical; }
        .form-row { display: flex; flex-wrap: wrap; gap: 12px; }
        .checkbox-inline { display: inline-flex; gap: 6px; align-items: center; font-size: 12px; }

        .btn-primary, .btn-secondary { border-radius: 999px; padding: 8px 16px; font-size: 12px; font-weight: 600; border: none; cursor: pointer; }
        .btn-primary { background: white; color: black; }
        .btn-primary:disabled { opacity: .6; cursor: not-allowed; }
        .btn-secondary { background: #111827; color: #e5e7eb; border: 1px solid #374151; }

        .chip.danger { background: #7f1d1d; border: 1px solid #fecaca; color: #fecaca; border-radius: 999px; padding: 6px 10px; font-size: 11px; cursor: pointer; }
        .banner { margin-top: 12px; font-size: 12px; }
        .banner.error { color: #f87171; }
        .banner.busy { color: #fbbf24; }
      `}</style>
    </div>
  );
}
