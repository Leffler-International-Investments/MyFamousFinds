// FILE: /pages/management/menu.tsx
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
} from "firebase/firestore";
import { useRequireAdmin } from "../../hooks/useRequireAdmin";

type Submenu = {
  id: string;
  label: string;
  href: string;
  position: number;
};

type Category = {
  id: string;
  name: string;
  slug: string;
  position: number;
  active: boolean;
  submenus: Submenu[];
};

const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

export default function MasterCategoryLibraryPage() {
  const { loading } = useRequireAdmin();
  const db = useMemo(() => getFirestore(firebaseApp), []);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  const [newCatName, setNewCatName] = useState("");
  const [newCatOrder, setNewCatOrder] = useState("100");

  const [submenuDrafts, setSubmenuDrafts] = useState<
    Record<string, { label: string; href: string }>
  >({});

  useEffect(() => {
    if (loading) return;

    const load = async () => {
      try {
        setInitialLoading(true);
        setError(null);
        const qRef = query(collection(db, "menuCategories"), orderBy("position"));
        const snap = await getDocs(qRef);
        const list: Category[] = snap.docs.map((d) => {
          const data = d.data() as any;
          const subs: Submenu[] = Array.isArray(data.submenus)
            ? data.submenus.map((s: any, index: number) => ({
                id: s.id || `${d.id}-sub-${index}`,
                label: s.label || "",
                href: s.href || "",
                position:
                  typeof s.position === "number" ? s.position : (index + 1) * 10,
              }))
            : [];
          return {
            id: d.id,
            name: data.name || d.id,
            slug: data.slug || slugify(data.name || d.id),
            position:
              typeof data.position === "number" ? data.position : (subs.length + 1) * 10,
            active: data.active !== false,
            submenus: subs.sort((a, b) => a.position - b.position),
          };
        });
        setCategories(list);
      } catch (err: any) {
        console.error("Error loading menu categories", err);
        // UPDATED: Display the actual error message from Firebase to help debugging
        setError(`Error: ${err.message || "Could not load menu categories."}`);
      } finally {
        setInitialLoading(false);
      }
    };

    load();
  }, [db, loading]);

  const handleCategoryFieldChange = async (
    id: string,
    field: "name" | "position",
    value: string
  ) => {
    try {
      setCategories((prev) =>
        prev.map((c) =>
          c.id === id
            ? {
                ...c,
                [field]:
                  field === "position"
                    ? Number(value) || c.position
                    : value,
              }
            : c
        )
      );

      const ref = doc(db, "menuCategories", id);
      const update: any = {};
      if (field === "name") {
        update.name = value;
        update.slug = slugify(value);
      } else {
        update.position = Number(value) || 100;
      }
      await updateDoc(ref, update);
    } catch (err) {
      console.error("Error updating category", err);
      setError("Could not update category.");
    }
  };

  const handleToggleActive = async (id: string) => {
    const current = categories.find((c) => c.id === id);
    if (!current) return;

    try {
      const next = !current.active;
      setCategories((prev) =>
        prev.map((c) => (c.id === id ? { ...c, active: next } : c))
      );
      await updateDoc(doc(db, "menuCategories", id), { active: next });
    } catch (err) {
      console.error("Error toggling active", err);
      setError("Could not update active flag.");
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!window.confirm("Delete this category and all its sub-menus?")) return;
    try {
      await deleteDoc(doc(db, "menuCategories", id));
      setCategories((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      console.error("Error deleting category", err);
      setError("Could not delete category.");
    }
  };

  const handleAddCategory = async () => {
    const name = newCatName.trim();
    if (!name) return;

    try {
      setError(null);
      const position = Number(newCatOrder) || (categories.length + 1) * 10;
      const payload = {
        name,
        slug: slugify(name),
        position,
        active: true,
        submenus: [] as Submenu[],
      };
      const ref = await addDoc(collection(db, "menuCategories"), payload);
      setCategories((prev) =>
        [...prev, { id: ref.id, ...payload }].sort(
          (a, b) => a.position - b.position
        )
      );
      setNewCatName("");
      setNewCatOrder("100");
    } catch (err) {
      console.error("Error adding category", err);
      setError("Could not add category.");
    }
  };

  const handleSubDraftChange = (
    catId: string,
    field: "label" | "href",
    value: string
  ) => {
    setSubmenuDrafts((prev) => ({
      ...prev,
      [catId]: { ...(prev[catId] || { label: "", href: "" }), [field]: value },
    }));
  };

  const handleAddSubmenu = async (cat: Category) => {
    const draft = submenuDrafts[cat.id] || { label: "", href: "" };
    const label = draft.label.trim();
    const href = draft.href.trim();
    if (!label || !href) return;

    try {
      const nextPos =
        (cat.submenus[cat.submenus.length - 1]?.position || 0) + 10;
      const newSub: Submenu = {
        id: `${cat.id}-${Date.now()}`,
        label,
        href,
        position: nextPos,
      };
      const updatedSubs = [...cat.submenus, newSub].sort(
        (a, b) => a.position - b.position
      );

      setCategories((prev) =>
        prev.map((c) =>
          c.id === cat.id ? { ...c, submenus: updatedSubs } : c
        )
      );
      await updateDoc(doc(db, "menuCategories", cat.id), {
        submenus: updatedSubs,
      });
      setSubmenuDrafts((prev) => ({ ...prev, [cat.id]: { label: "", href: "" } }));
    } catch (err) {
      console.error("Error adding submenu", err);
      setError("Could not add sub-menu.");
    }
  };

  const handleDeleteSubmenu = async (cat: Category, subId: string) => {
    if (!window.confirm("Remove this sub-menu item?")) return;
    try {
      const updatedSubs = cat.submenus.filter((s) => s.id !== subId);
      setCategories((prev) =>
        prev.map((c) =>
          c.id === cat.id ? { ...c, submenus: updatedSubs } : c
        )
      );
      await updateDoc(doc(db, "menuCategories", cat.id), {
        submenus: updatedSubs,
      });
    } catch (err) {
      console.error("Error deleting submenu", err);
      setError("Could not delete sub-menu.");
    }
  };

  const handleSeedDefaults = async () => {
    if (
      !window.confirm(
        "Seed default header categories and sub-menus? Existing categories will be kept."
      )
    )
      return;

    setSeeding(true);
    setError(null);

    try {
      const existingSlugs = new Set(
        categories.map((c) => c.slug.toLowerCase())
      );

      const defaults: {
        name: string;
        position: number;
        submenus: { label: string; href: string; position: number }[];
      }[] = [
        {
          name: "NEW ARRIVALS",
          position: 10,
          submenus: [
            {
              label: "All New Arrivals",
              href: "/category/new-arrivals",
              position: 10,
            },
            {
              label: "New Bags",
              href: "/category/bags?sort=new",
              position: 20,
            },
            {
              label: "New Shoes",
              href: "/category/shoes?sort=new",
              position: 30,
            },
            {
              label: "New Watches",
              href: "/category/watches?sort=new",
              position: 40,
            },
          ],
        },
        {
          name: "DESIGNERS",
          position: 20,
          submenus: [
            { label: "All Designers", href: "/designers", position: 10 },
          ],
        },
        {
          name: "WOMEN",
          position: 30,
          submenus: [
            { label: "All Women", href: "/category/women", position: 10 },
            { label: "Bags", href: "/category/bags?for=women", position: 20 },
            { label: "Shoes", href: "/category/shoes?for=women", position: 30 },
            {
              label: "Clothing",
              href: "/category/clothing?for=women",
              position: 40,
            },
            {
              label: "Jewelry",
              href: "/category/jewelry?for=women",
              position: 50,
            },
          ],
        },
        {
          name: "BAGS",
          position: 40,
          submenus: [
            { label: "All Bags", href: "/category/bags", position: 10 },
            { label: "Totes", href: "/category/bags?tote=1", position: 20 },
            {
              label: "Crossbody",
              href: "/category/bags?crossbody=1",
              position: 30,
            },
            { label: "Mini Bags", href: "/category/bags?mini=1", position: 40 },
          ],
        },
        {
          name: "MEN",
          position: 50,
          submenus: [
            { label: "All Men", href: "/category/men", position: 10 },
            { label: "Bags", href: "/category/bags?for=men", position: 20 },
            { label: "Shoes", href: "/category/shoes?for=men", position: 30 },
            {
              label: "Accessories",
              href: "/category/accessories?for=men",
              position: 40,
            },
            {
              label: "Watches",
              href: "/category/watches?for=men",
              position: 50,
            },
          ],
        },
        {
          name: "JEWELRY",
          position: 60,
          submenus: [
            { label: "All Jewelry", href: "/category/jewelry", position: 10 },
            {
              label: "Necklaces",
              href: "/category/jewelry?type=necklace",
              position: 20,
            },
            {
              label: "Bracelets",
              href: "/category/jewelry?type=bracelet",
              position: 30,
            },
            {
              label: "Earrings",
              href: "/category/jewelry?type=earrings",
              position: 40,
            },
            {
              label: "Brooches",
              href: "/category/jewelry?type=brooch",
              position: 50,
            },
          ],
        },
        {
          name: "WATCHES",
          position: 70,
          submenus: [
            { label: "All Watches", href: "/category/watches", position: 10 },
            {
              label: "Men's Watches",
              href: "/category/watches?for=men",
              position: 20,
            },
            {
              label: "Women's Watches",
              href: "/category/watches?for=women",
              position: 30,
            },
          ],
        },
      ];

      for (const def of defaults) {
        const slug = slugify(def.name);
        if (existingSlugs.has(slug.toLowerCase())) continue;

        const submenus: Submenu[] = def.submenus.map((s) => ({
          id: `${slug}-${s.position}`,
          label: s.label,
          href: s.href,
          position: s.position,
        }));

        await addDoc(collection(db, "menuCategories"), {
          name: def.name,
          slug,
          position: def.position,
          active: true,
          submenus,
        });
      }

      // reload
      const qRef = query(collection(db, "menuCategories"), orderBy("position"));
      const snap = await getDocs(qRef);
      const list: Category[] = snap.docs.map((d) => {
        const data = d.data() as any;
        const subs: Submenu[] = Array.isArray(data.submenus)
          ? data.submenus.map((s: any, index: number) => ({
              id: s.id || `${d.id}-sub-${index}`,
              label: s.label || "",
              href: s.href || "",
              position:
                typeof s.position === "number" ? s.position : (index + 1) * 10,
            }))
          : [];
        return {
          id: d.id,
          name: data.name || d.id,
          slug: data.slug || slugify(data.name || d.id),
          position:
            typeof data.position === "number" ? data.position : (subs.length + 1) * 10,
          active: data.active !== false,
          submenus: subs.sort((a, b) => a.position - b.position),
        };
      });
      setCategories(list);
    } catch (err) {
      console.error("Error seeding menu defaults", err);
      setError("Could not seed defaults.");
    } finally {
      setSeeding(false);
    }
  };

  if (loading || initialLoading) return null;

  return (
    <div className="page">
      <Head>
        <title>Master Category Library – Management | Famous Finds</title>
      </Head>

      <Header />

      <main className="main">
        <div className="back">
          <Link href="/management/dashboard">← Back to Management Dashboard</Link>
        </div>

        <h1 className="title">Master Category Library</h1>
        <p className="subtitle">
          Control top-level categories and sub-menu items shown in the
          marketplace header. Only <strong>active</strong> categories should
          appear in the live menu.
        </p>

        <div className="toolbar">
          <button
            type="button"
            className="primary"
            onClick={handleSeedDefaults}
            disabled={seeding}
          >
            {seeding ? "Seeding defaults…" : "Seed default header categories"}
          </button>
        </div>

        {error && <p className="error">{error}</p>}

        <section className="card">
          <h2>Current categories</h2>

          {categories.length === 0 ? (
            <p className="muted">
              No categories yet. Use the button above to seed defaults or add
              manually below.
            </p>
          ) : (
            <div className="cat-list">
              {categories
                .slice()
                .sort((a, b) => a.position - b.position)
                .map((cat) => {
                  const draft = submenuDrafts[cat.id] || {
                    label: "",
                    href: "",
                  };
                  return (
                    <div key={cat.id} className="cat-card">
                      <div className="cat-header">
                        <div className="cat-main">
                          <input
                            className="cat-name"
                            value={cat.name}
                            onChange={(e) =>
                              handleCategoryFieldChange(
                                cat.id,
                                "name",
                                e.target.value
                              )
                            }
                          />
                          <span className="slug">/{cat.slug}</span>
                        </div>
                        <div className="cat-controls">
                          <label className="inline">
                            Order
                            <input
                              type="number"
                              className="order-input"
                              value={cat.position}
                              onChange={(e) =>
                                handleCategoryFieldChange(
                                  cat.id,
                                  "position",
                                  e.target.value
                                )
                              }
                            />
                          </label>
                          <label className="inline">
                            Active
                            <input
                              type="checkbox"
                              checked={cat.active}
                              onChange={() => handleToggleActive(cat.id)}
                            />
                          </label>
                          <button
                            type="button"
                            className="danger"
                            onClick={() => handleDeleteCategory(cat.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>

                      <div className="submenus">
                        <h3>Sub-menu items</h3>
                        {cat.submenus.length === 0 ? (
                          <p className="muted small">
                            No sub-menu items yet. Add some below.
                          </p>
                        ) : (
                          <table>
                            <thead>
                              <tr>
                                <th>Label</th>
                                <th>Link (href)</th>
                                <th>Order</th>
                                <th>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {cat.submenus.map((s) => (
                                <tr key={s.id}>
                                  <td>{s.label}</td>
                                  <td>{s.href}</td>
                                  <td>{s.position}</td>
                                  <td>
                                    <button
                                      type="button"
                                      className="small-danger"
                                      onClick={() =>
                                        handleDeleteSubmenu(cat, s.id)
                                      }
                                    >
                                      Remove
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}

                        <div className="add-sub">
                          <input
                            type="text"
                            placeholder="Sub-menu label (e.g. New Bags)"
                            value={draft.label}
                            onChange={(e) =>
                              handleSubDraftChange(
                                cat.id,
                                "label",
                                e.target.value
                              )
                            }
                          />
                          <input
                            type="text"
                            placeholder="Link (e.g. /category/bags?sort=new)"
                            value={draft.href}
                            onChange={(e) =>
                              handleSubDraftChange(
                                cat.id,
                                "href",
                                e.target.value
                              )
                            }
                          />
                          <button
                            type="button"
                            className="secondary"
                            onClick={() => handleAddSubmenu(cat)}
                          >
                            Add sub-menu
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </section>

        <section className="card">
          <h2>Add top-level category</h2>
          <p className="muted">
            Example: NEW ARRIVALS, DESIGNERS, WOMEN, BAGS, MEN, JEWELRY, WATCHES.
          </p>
          <div className="add-cat">
            <label>
              Category name
              <input
                type="text"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="e.g. SHOES"
              />
            </label>
            <label>
              Order
              <input
                type="number"
                value={newCatOrder}
                onChange={(e) => setNewCatOrder(e.target.value)}
              />
            </label>
            <button
              type="button"
              className="primary"
              onClick={handleAddCategory}
              disabled={!newCatName.trim()}
            >
              Add category
            </button>
          </div>
        </section>
      </main>

      <Footer />

      <style jsx>{`
        .page {
          background: #ffffff;
          color: #111827;
        }
        .main {
          max-width: 1200px;
          margin: 0 auto;
          padding: 16px 16px 80px;
        }
        .back a {
          font-size: 13px;
          color: #4b5563;
          text-decoration: none;
        }
        .back a:hover {
          color: #111827;
        }
        .title {
          font-size: 22px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          margin-top: 12px;
        }
        .subtitle {
          font-size: 13px;
          color: #4b5563;
          max-width: 640px;
          margin-bottom: 16px;
        }
        .toolbar {
          margin-bottom: 16px;
        }
        .primary {
          background: #111827;
          color: #ffffff;
          border: none;
          border-radius: 999px;
          padding: 8px 16px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
        }
        .primary[disabled] {
          opacity: 0.6;
          cursor: default;
        }
        .card {
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          padding: 16px 16px 18px;
          box-shadow: 0 4px 10px rgba(15, 23, 42, 0.04);
          margin-bottom: 24px;
        }
        .muted {
          font-size: 12px;
          color: #6b7280;
        }
        .small {
          font-size: 11px;
        }
        .error {
          font-size: 12px;
          color: #b91c1c;
          margin-bottom: 8px;
        }
        .cat-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-top: 8px;
        }
        .cat-card {
          border-radius: 12px;
          border: 1px solid #e5e7eb;
          padding: 12px 12px 14px;
          background: #ffffff;
        }
        .cat-header {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 8px;
        }
        .cat-main {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .cat-name {
          border: none;
          border-bottom: 1px solid #d1d5db;
          font-size: 15px;
          font-weight: 600;
          padding: 2px 0;
          min-width: 160px;
        }
        .slug {
          font-size: 11px;
          color: #6b7280;
        }
        .cat-controls {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }
        .inline {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
        }
        .order-input {
          width: 70px;
          border-radius: 6px;
          border: 1px solid #d1d5db;
          padding: 4px 6px;
          font-size: 12px;
        }
        .danger {
          background: #b91c1c;
          color: #fef2f2;
          border: none;
          border-radius: 999px;
          padding: 4px 10px;
          font-size: 11px;
          cursor: pointer;
        }
        .submenus h3 {
          font-size: 13px;
          margin: 4px 0 6px;
        }
        .submenus table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
          margin-bottom: 6px;
        }
        .submenus th,
        .submenus td {
          border-bottom: 1px solid #e5e7eb;
          padding: 4px 4px;
          text-align: left;
        }
        .small-danger {
          background: #b91c1c;
          color: #fef2f2;
          border: none;
          border-radius: 999px;
          padding: 3px 8px;
          font-size: 11px;
          cursor: pointer;
        }
        .add-sub {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 6px;
        }
        .add-sub input {
          flex: 1;
          min-width: 180px;
          border-radius: 8px;
          border: 1px solid #d1d5db;
          padding: 6px 8px;
          font-size: 12px;
        }
        .secondary {
          border-radius: 999px;
          border: 1px solid #111827;
          background: #ffffff;
          color: #111827;
          padding: 6px 10px;
          font-size: 12px;
          cursor: pointer;
          white-space: nowrap;
        }
        .add-cat {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          align-items: flex-end;
          margin-top: 8px;
        }
        .add-cat label {
          display: flex;
          flex-direction: column;
          gap: 4px;
          font-size: 13px;
        }
        .add-cat input {
          border-radius: 8px;
          border: 1px solid #d1d5db;
          padding: 6px 8px;
          font-size: 13px;
        }
      `}</style>
    </div>
  );
}
