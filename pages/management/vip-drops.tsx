// FILE: /pages/management/vip-drops.tsx

import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useRequireAdmin } from "../../hooks/useRequireAdmin";
import { db } from "../../utils/firebaseClient";
import {
  collection,
  addDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";

type VipDrop = {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  linkUrl?: string;
  active: boolean;
};

export default function VipDropsPage() {
  const { loading } = useRequireAdmin();
  const [drops, setDrops] = useState<VipDrop[]>([]);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDrops = async () => {
      try {
        const q = query(
          collection(db, "vip_drops"),
          orderBy("createdAt", "desc")
        );
        const snap = await getDocs(q);
        const items: VipDrop[] = snap.docs.map((d) => ({
          id: d.id,
          title: (d.data().title as string) || "",
          description: (d.data().description as string) || "",
          imageUrl: d.data().imageUrl as string | undefined,
          linkUrl: d.data().linkUrl as string | undefined,
          active: (d.data().active as boolean) ?? true,
        }));
        setDrops(items);
      } catch (err) {
        console.error("vip_drops_load_error", err);
      }
    };
    loadDrops();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }

    try {
      setSaving(true);
      const docRef = await addDoc(collection(db, "vip_drops"), {
        title: title.trim(),
        description: desc.trim(),
        imageUrl: imageUrl.trim() || null,
        linkUrl: linkUrl.trim() || null,
        active: true,
        createdAt: serverTimestamp(),
      });

      setDrops((prev) => [
        {
          id: docRef.id,
          title: title.trim(),
          description: desc.trim(),
          imageUrl: imageUrl.trim() || undefined,
          linkUrl: linkUrl.trim() || undefined,
          active: true,
        },
        ...prev,
      ]);

      setTitle("");
      setDesc("");
      setImageUrl("");
      setLinkUrl("");
    } catch (err) {
      console.error("vip_drops_create_error", err);
      setError("Could not save VIP drop. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return null;

  return (
    <div className="dashboard-page">
      <Head>
        <title>VIP-Only Drops – Management - Famous Finds</title>
      </Head>
      <Header />

      <main className="dashboard-main">
        <div className="dashboard-header">
          <div>
            <h1>VIP-only drops</h1>
            <p>
              Upload diamonds, jewellery, and other decks that should only be
              visible to approved VIP members.
            </p>
          </div>
          <Link href="/management/dashboard">Back to dashboard</Link>
        </div>

        <section className="dashboard-section">
          <div className="dashboard-section-header">
            <h2 className="dashboard-section-title">Create new VIP drop</h2>
            <p className="dashboard-section-subtitle">
              These items can later be surfaced only on VIP pages (Front Row,
              My VIP Profile, etc.).
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6 max-w-2xl">
            {error && (
              <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title (VIP drop name)
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Example: Platinum Diamond Tennis Bracelet"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Short description
                </label>
                <textarea
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                  rows={3}
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder="Key details, story, or why this is VIP-only."
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Image URL (optional)
                  </label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://…"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Link to listing (optional)
                  </label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    placeholder="/listing/123 or external URL"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center rounded-full bg-black text-white px-6 py-2.5 text-sm font-semibold tracking-wide uppercase hover:bg-gray-900 disabled:opacity-60"
              >
                {saving ? "Saving…" : "Save VIP drop"}
              </button>
            </form>
          </div>
        </section>

        <section className="dashboard-section">
          <div className="dashboard-section-header">
            <h2 className="dashboard-section-title">Existing VIP drops</h2>
            <p className="dashboard-section-subtitle">
              These can later be pulled into VIP-only carousels on the site.
            </p>
          </div>

          {drops.length === 0 ? (
            <p className="text-sm text-gray-500">
              No VIP drops created yet. Use the form above to add your first
              one.
            </p>
          ) : (
            <div className="dashboard-grid">
              {drops.map((drop) => (
                <div key={drop.id} className="dashboard-tile">
                  <p className="dashboard-tile-title">{drop.title}</p>
                  <p className="dashboard-tile-description">
                    {drop.description || "No description set."}
                  </p>
                  {drop.linkUrl && (
                    <p className="text-xs text-gray-500 break-all mb-1">
                      Link: {drop.linkUrl}
                    </p>
                  )}
                  <p className="dashboard-tile-link dashboard-tile-link-gold">
                    VIP-only • Active
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
