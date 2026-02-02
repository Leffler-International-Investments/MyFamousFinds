// FILE: /pages/management/designers.tsx

import type { NextPage } from "next";
import Head from "next/head";
import { useMemo, useState } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { app as firebaseApp } from "../../utils/firebaseClient";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  updateDoc,
  addDoc,
  deleteDoc,
} from "firebase/firestore";

type DesignerRow = {
  id: string;
  name: string;
  slug: string;
  featured?: boolean;
  group?: "watches" | "fashion";
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
  const db = useMemo(() => getFirestore(firebaseApp!), []);

  const [rows, setRows] = useState<DesignerRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string>("");

  const [newName, setNewName] = useState("");
  const [newGroup, setNewGroup] = useState<"watches" | "fashion">("fashion");
  const [newFeatured, setNewFeatured] = useState(false);

  async function load() {
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

  async function remove(id: string) {
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
        order: rows.length + 1,
      };
      const ref = await addDoc(collection(db, "designers"), payload);
      setRows((prev) => [...prev, { id: ref.id, ...payload }]);
      setNewName("");
      setNewFeatured(false);
      setNewGroup("fashion");
    } catch (e: any) {
      setErr(e?.message || String(e));
    }
  }

  return (
    <>
      <Head>
        <title>Management – Designers</title>
      </Head>

      <Header />

      <main className="mx-auto max-w-5xl px-4 py-10">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Designers</h1>

          <div className="flex gap-2">
            <button
              className="rounded-md border px-3 py-2 text-sm"
              onClick={load}
              disabled={loading}
            >
              {loading ? "Loading..." : "Load"}
            </button>
          </div>
        </div>

        {err ? (
          <div className="mt-4 rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
            {err}
          </div>
        ) : null}

        <section className="mt-6 rounded-xl border p-4">
          <h2 className="text-lg font-medium">Add designer</h2>

          <div className="mt-3 grid gap-3 md:grid-cols-3">
            <input
              className="w-full rounded-md border px-3 py-2"
              placeholder="Designer name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />

            <select
              className="w-full rounded-md border px-3 py-2"
              value={newGroup}
              onChange={(e) => setNewGroup(e.target.value as any)}
            >
              <option value="fashion">Fashion</option>
              <option value="watches">Watches</option>
            </select>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={newFeatured}
                onChange={(e) => setNewFeatured(e.target.checked)}
              />
              Featured
            </label>
          </div>

          <button
            className="mt-3 rounded-md bg-black px-4 py-2 text-sm text-white"
            onClick={add}
          >
            Add
          </button>
        </section>

        <section className="mt-6 rounded-xl border p-4">
          <h2 className="text-lg font-medium">Existing designers</h2>

          {!rows.length ? (
            <div className="mt-3 text-sm text-gray-600">
              No designers loaded. Click “Load”.
            </div>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="py-2">Name</th>
                    <th className="py-2">Slug</th>
                    <th className="py-2">Group</th>
                    <th className="py-2">Featured</th>
                    <th className="py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="border-b">
                      <td className="py-2">{r.name}</td>
                      <td className="py-2">{r.slug}</td>
                      <td className="py-2">{r.group || "fashion"}</td>
                      <td className="py-2">
                        <button
                          className="rounded-md border px-2 py-1 text-xs"
                          onClick={() => toggleFeatured(r.id, !!r.featured)}
                        >
                          {r.featured ? "Yes" : "No"}
                        </button>
                      </td>
                      <td className="py-2">
                        <button
                          className="rounded-md border px-2 py-1 text-xs"
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
    </>
  );
};

export default ManagementDesigners;
