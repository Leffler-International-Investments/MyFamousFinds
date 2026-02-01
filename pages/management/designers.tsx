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
  query,
  orderBy,
  where,
} from "firebase/firestore";

type DesignerRecord = {
  id: string;
  name: string;
  slug: string;
  top?: boolean;
  upcoming?: boolean;
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

function extractDesignerNameFromListing(d: any): string {
  return String(
    d?.brand ||
      d?.designer ||
      d?.designerName ||
      d?.brandName ||
      d?.otherDesignerName ||
      ""
  )
    .trim()
    .replace(/\s+/g, " ");
}

export default function ManagementDesigners() {
  const [designers, setDesigners] = useState<DesignerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [seeding, setSeeding] = useState(false);

  const [syncing, setSyncing] = useState(false);
  const [syncReport, setSyncReport] = useState<string | null>(null);

  const [newName, setNewName] = useState("");
  const [newItemTypes, setNewItemTypes] = useState("B,S,J,C...");
  const [newNotes, setNewNotes] = useState("");

  const db = useMemo(() => getFirestore(firebaseApp), []);

  const loadDesigners = async () => {
    const qRef = query(collection(db, "designers"), orderBy("name"));
    const snap = await getDocs(qRef);
    const data: DesignerRecord[] = snap.docs
      .map((d) => ({ id: d.id, ...(d.data() as any) }))
      .map((d) => ({
        id: d.id,
        name: d.name || d.id,
        slug: d.slug || slugify(d.name || d.id),
        top: !!d.top,
        upcoming: !!d.upcoming,
        active: d.active !== false,
        itemTypes: d.itemTypes || d.item_types || "B,S,J,C...",
        notes: d.notes || "",
      }));
    setDesigners(data);
  };

  useEffect(() => {
    const fetchDesigners = async () => {
      try {
        setLoading(true);
        setError(null);
        await loadDesigners();
      } catch (err: any) {
        console.error("Error loading designers", err);
        setError("Could not load designers. Please refresh and try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchDesigners();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db]);

  const filteredDesigners = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return designers;
    return designers.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.slug.toLowerCase().includes(q) ||
        (d.itemTypes || "").toLowerCase().includes(q)
    );
  }, [designers, search]);

  const onFieldChange = async (
    id: string,
    field: keyof DesignerRecord,
    value: any
  ) => {
    try {
      setDesigners((prev) =>
        prev.map((d) => (d.id === id ? { ...d, [field]: value } : d))
      );

      const ref = doc(db, "designers", id);
      if (field === "id") return;

      await updateDoc(ref, {
        [field]: value,
      });
    } catch (err) {
      console.error("Error updating designer", err);
      setError("Could not save change. Please try again.");
    }
  };

  const onToggleFlag = async (
    id: string,
    field: "top" | "upcoming" | "active"
  ) => {
    const current = designers.find((d) => d.id === id);
    if (!current) return;
    const next = !current[field];
    await onFieldChange(id, field, next);
  };

  const onDelete = async (id: string) => {
    if (!window.confirm("Delete this designer? This cannot be undone.")) return;
    try {
      await deleteDoc(doc(db, "designers", id));
      setDesigners((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      console.error("Error deleting designer", err);
      setError("Could not delete designer. Please try again.");
    }
  };

  const onAdd = async () => {
    const name = newName.trim();
    if (!name) return;
    try {
      setError(null);
      setSyncReport(null);

      const slug = slugify(name);
      const payload = {
        name,
        slug,
        top: false,
        upcoming: false,
        active: true,
        itemTypes: newItemTypes.trim() || "B,S,J,C...",
        notes: newNotes.trim(),
      };

      const ref = await addDoc(collection(db, "designers"), payload);
      setDesigners((prev) =>
        [...prev, { id: ref.id, ...payload }].sort((a, b) =>
          a.name.localeCompare(b.name)
        )
      );
      setNewName("");
      setNewItemTypes("B,S,J,C...");
      setNewNotes("");
    } catch (err) {
      console.error("Error adding designer", err);
      setError("Could not add designer. Please try again.");
    }
  };

  const onSeedDefaults = async () => {
    if (
      !window.confirm(
        "Seed default list of designers? Existing records will be kept."
      )
    )
      return;

    setSeeding(true);
    setError(null);
    setSyncReport(null);

    try {
      const defaults = [
        "Alexander McQueen",
        "Balenciaga",
        "Bottega Veneta",
        "Burberry",
        "Chanel",
        "Dior",
        "Fendi",
        "Givenchy",
        "Goyard",
        "Gucci",
        "Hermès",
        "Louis Vuitton",
        "Prada",
        "Saint Laurent",
        "Valentino",
        "Versace",
      ];

      const existingNames = new Set(
        designers.map((d) => d.name.toLowerCase().trim())
      );

      for (const name of defaults) {
        if (existingNames.has(name.toLowerCase().trim())) continue;
        const payload = {
          name,
          slug: slugify(name),
          top: false,
          upcoming: false,
          active: true,
          itemTypes: "B,S,J,C...",
          notes: "",
        };
        await addDoc(collection(db, "designers"), payload);
      }

      await loadDesigners();
    } catch (err) {
      console.error("Error seeding defaults", err);
      setError("Could not seed defaults. Please try again.");
    } finally {
      setSeeding(false);
    }
  };

  // ✅ NEW: Sync designers collection from Live listings (Ariel's real listing data)
  const onSyncFromLiveListings = async () => {
    if (
      !window.confirm(
        "Sync designers from LIVE listings?\n\nThis will add missing designers into the Designers collection (no deletions)."
      )
    )
      return;

    setSyncing(true);
    setError(null);
    setSyncReport(null);

    try {
      // current designers (by normalized name)
      const designerSnap = await getDocs(collection(db, "designers"));
      const existing = new Set<string>();
      designerSnap.docs.forEach((dd) => {
        const data = dd.data() as any;
        const name = String(data?.name ?? dd.id).trim().toLowerCase();
        if (name) existing.add(name);
      });

      // live listings
      const listingsQ = query(
        collection(db, "listings"),
        where("status", "==", "Live")
      );
      const listingsSnap = await getDocs(listingsQ);

      const found = new Set<string>();
      listingsSnap.docs.forEach((ld) => {
        const data = ld.data() as any;
        const name = extractDesignerNameFromListing(data).trim();
        if (!name) return;
        found.add(name);
      });

      const toAdd = Array.from(found).filter(
        (name) => !existing.has(name.toLowerCase())
      );

      let added = 0;
      for (const name of toAdd) {
        const payload = {
          name,
          slug: slugify(name),
          top: false,
          upcoming: false,
          active: true,
          itemTypes: "B,S,J,C...",
          notes: "Auto-added from LIVE listings",
        };
        await addDoc(collection(db, "designers"), payload);
        added += 1;
      }

      await loadDesigners();
      setSyncReport(
        `Sync complete: scanned ${listingsSnap.size} LIVE listings. Added ${added} missing designer(s).`
      );
    } catch (err) {
      console.error("Sync from listings failed:", err);
      setError("Could not sync from listings. Please try again.");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="dark-theme-page">
      <Head>
        <title>Designers Directory – Management | Famous Finds</title>
      </Head>

      <Header />

      <main className="section">
        <div className="back-link">
          <Link href="/management/dashboard">← Back to Management Dashboard</Link>
        </div>

        <h1 className="page-title">Designers Directory</h1>
        <p className="page-sub">
          Control which designers are accepted on Famous-Finds. Only{" "}
          <strong>active</strong> designers appear in seller drop-downs and
          upload pages.
        </p>

        <div className="toolbar">
          <input
            type="text"
            className="search"
            placeholder="Search designers…"
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

          <button
            type="button"
            className="sync-btn"
            onClick={onSyncFromLiveListings}
            disabled={syncing}
            title="Add missing designers from LIVE listings into the designers collection"
          >
            {syncing ? "Syncing…" : "Sync from LIVE listings"}
          </button>
        </div>

        {syncReport && <p className="success">{syncReport}</p>}
        {error && <p className="error">{error}</p>}

        <section className="card">
          <div className="card-header">
            <h2>
              CURRENT DESIGNERS{" "}
              <span className="count">
                Showing {filteredDesigners.length} of {designers.length}.
              </span>
            </h2>
            <p className="muted">
              Tick <strong>Active</strong> to control which designers appear in
              seller drop-downs and upload pages.
            </p>
          </div>

          {loading ? (
            <p className="muted">Loading designers…</p>
          ) : filteredDesigners.length === 0 ? (
            <p className="muted">No designers match your search.</p>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th className="name-col">Name</th>
                    <th>Top</th>
                    <th>Upcoming</th>
                    <th>Active</th>
                    <th>Item types (codes)</th>
                    <th>Notes</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDesigners.map((d) => (
                    <tr key={d.id}>
                      <td className="name-col">{d.name}</td>
                      <td>
                        <input
                          type="checkbox"
                          checked={!!d.top}
                          onChange={() => onToggleFlag(d.id, "top")}
                        />
                      </td>
                      <td>
                        <input
                          type="checkbox"
                          checked={!!d.upcoming}
                          onChange={() => onToggleFlag(d.id, "upcoming")}
                        />
                      </td>
                      <td>
                        <input
                          type="checkbox"
                          checked={!!d.active}
                          onChange={() => onToggleFlag(d.id, "active")}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className="small-input"
                          value={d.itemTypes || ""}
                          onChange={(e) =>
                            onFieldChange(d.id, "itemTypes", e.target.value)
                          }
                        />
                        <div className="hint">
                          B = bags, S = shoes, J = jewelry, C = clothing, etc.
                        </div>
                      </td>
                      <td>
                        <input
                          type="text"
                          className="small-input"
                          value={d.notes || ""}
                          onChange={(e) =>
                            onFieldChange(d.id, "notes", e.target.value)
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

        <section className="card add-section">
          <h2>Add a designer</h2>
          <p>
            This will immediately become available in seller upload drop-downs.
          </p>
          <div className="add-form">
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
            </label>
            <label>
              Notes (optional)
              <input
                type="text"
                placeholder="Internal note"
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
              />
            </label>
            <button
              type="button"
              className="add-btn"
              onClick={onAdd}
              disabled={!newName.trim()}
            >
              Add designer
            </button>
          </div>
        </section>
      </main>

      <Footer />

      <style jsx>{`
        .dark-theme-page {
          background: #ffffff;
          color: #111827;
        }

        .section {
          max-width: 1200px;
          margin: 0 auto;
          padding: 16px 16px 80px;
          background: #ffffff;
        }

        .back-link a {
          font-size: 13px;
          color: #4b5563;
          text-decoration: none;
        }

        .back-link a:hover {
          color: #111827;
        }

        .page-title {
          margin-top: 12px;
          font-size: 22px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
        }

        .page-sub {
          font-size: 13px;
          color: #4b5563;
          max-width: 520px;
          margin-bottom: 16px;
        }

        .toolbar {
          display: flex;
          gap: 12px;
          align-items: center;
          margin-bottom: 16px;
          flex-wrap: wrap;
        }

        .search {
          flex: 1;
          min-width: 220px;
          border-radius: 999px;
          border: 1px solid #d1d5db;
          background: #ffffff;
          color: #111827;
          padding: 8px 12px;
          font-size: 13px;
        }

        .seed-btn {
          border-radius: 999px;
          border: 1px solid #111827;
          padding: 8px 14px;
          font-size: 13px;
          font-weight: 600;
          background: #111827;
          color: #ffffff;
          cursor: pointer;
          white-space: nowrap;
        }

        .sync-btn {
          border-radius: 999px;
          border: 1px solid #1f2937;
          padding: 8px 14px;
          font-size: 13px;
          font-weight: 600;
          background: #ffffff;
          color: #111827;
          cursor: pointer;
          white-space: nowrap;
        }

        .seed-btn[disabled],
        .sync-btn[disabled] {
          opacity: 0.6;
          cursor: default;
        }

        .success {
          background: #ecfdf5;
          border: 1px solid #10b981;
          color: #065f46;
          padding: 10px 12px;
          border-radius: 12px;
          font-size: 13px;
          margin: 10px 0 14px;
        }

        .error {
          background: #fef2f2;
          border: 1px solid #ef4444;
          color: #991b1b;
          padding: 10px 12px;
          border-radius: 12px;
          font-size: 13px;
          margin: 10px 0 14px;
        }

        .card {
          background: #ffffff;
          border-radius: 16px;
          padding: 16px 16px 18px;
          border: 1px solid #e5e7eb;
          box-shadow: 0 4px 10px rgba(15, 23, 42, 0.04);
          margin-bottom: 24px;
        }

        .card-header {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 8px;
          margin-bottom: 10px;
        }

        .card-header h2 {
          font-size: 15px;
          margin: 0 0 4px;
        }

        .count {
          font-size: 12px;
          color: #6b7280;
          font-weight: 500;
          margin-left: 8px;
        }

        .muted {
          color: #6b7280;
          font-size: 13px;
          margin: 0;
        }

        .table-wrap {
          overflow-x: auto;
          padding-top: 6px;
        }

        .table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }

        .table th,
        .table td {
          padding: 10px 8px;
          border-top: 1px solid #f3f4f6;
          vertical-align: top;
        }

        .table th {
          text-align: left;
          color: #111827;
          font-size: 12px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .name-col {
          min-width: 200px;
          font-weight: 600;
        }

        .small-input {
          width: 100%;
          min-width: 140px;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          padding: 8px 10px;
          font-size: 13px;
        }

        .hint {
          font-size: 11px;
          color: #9ca3af;
          margin-top: 6px;
        }

        .delete-btn {
          border: 1px solid #ef4444;
          color: #ef4444;
          background: #ffffff;
          border-radius: 999px;
          padding: 8px 12px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
        }

        .delete-btn:hover {
          background: #fef2f2;
        }

        .add-section h2 {
          margin: 0 0 6px;
        }

        .add-form {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr)) auto;
          gap: 12px;
          align-items: end;
          margin-top: 10px;
        }

        @media (max-width: 900px) {
          .add-form {
            grid-template-columns: 1fr;
          }
        }

        .add-form label {
          display: flex;
          flex-direction: column;
          gap: 6px;
          font-size: 12px;
          color: #374151;
        }

        .add-form input {
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 10px 12px;
          font-size: 13px;
        }

        .add-btn {
          border-radius: 999px;
          border: 1px solid #111827;
          padding: 10px 14px;
          font-size: 13px;
          font-weight: 700;
          background: #111827;
          color: #ffffff;
          cursor: pointer;
          white-space: nowrap;
        }

        .add-btn[disabled] {
          opacity: 0.6;
          cursor: default;
        }
      `}</style>
    </div>
  );
}
