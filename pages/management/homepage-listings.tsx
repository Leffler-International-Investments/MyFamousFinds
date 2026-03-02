// FILE: /pages/management/homepage-listings.tsx
// Homepage Security Scanner — scans EVERY data source that renders on the
// public homepage and gives admins full delete access to any item.
// Uses the SAME getPublicListings() call the homepage uses so results match exactly.

import Head from "next/head";
import Link from "next/link";
import type { GetServerSideProps } from "next";
import { useState } from "react";
import { deleteDoc, doc } from "firebase/firestore";
import { db } from "../../utils/firebaseClient";
import { adminDb, isFirebaseAdminReady } from "../../utils/firebaseAdmin";
import { getPublicListings } from "../../lib/publicListings";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useRequireAdmin } from "../../hooks/useRequireAdmin";

/* ───────── Types ───────── */

type ListingItem = {
  id: string;
  title: string;
  brand: string;
  category: string;
  price: string;
  image: string;
  status: string;
  condition: string;
  material: string;
  color: string;
  size: string;
  source: "homepage" | "admin" | "both";
  searchText: string; // all fields concatenated for search
};

type MessageItem = {
  id: string;
  text: string;
  type: string;
  active: boolean;
  linkText: string;
  linkUrl: string;
  imageUrl: string;
  videoUrl: string;
};

type Props = {
  listings: ListingItem[];
  messages: MessageItem[];
  scannedAt: string;
  homepageCount: number;
  adminOnlyCount: number;
};

/* ───────── Component ───────── */

export default function HomepageScanner({
  listings: initListings,
  messages: initMessages,
  scannedAt,
  homepageCount,
  adminOnlyCount,
}: Props) {
  const { loading } = useRequireAdmin();
  const [listings, setListings] = useState(initListings);
  const [messages, setMessages] = useState(initMessages);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [deleteById, setDeleteById] = useState("");
  const [deleteByIdStatus, setDeleteByIdStatus] = useState<string | null>(null);

  if (loading) return null;

  /* ── Listing deletion ── */
  const deleteListing = async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/admin/delete-public-listing/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.ok) return true;
    } catch { /* fallback below */ }
    try {
      if (db) { await deleteDoc(doc(db, "listings", id)); return true; }
    } catch { /* ignore */ }
    return false;
  };

  const handleDeleteListing = async (id: string, title: string) => {
    if (!confirm(`Delete listing "${title}"? This cannot be undone.`)) return;
    setDeleting(id);
    const ok = await deleteListing(id);
    if (ok) setListings((prev) => prev.filter((i) => i.id !== id));
    else alert("Delete failed. Check Firebase config.");
    setDeleting(null);
  };

  const handleDeleteAllListings = async () => {
    if (listings.length === 0) return;
    if (!confirm(`EMERGENCY: Delete ALL ${listings.length} listings from the homepage? This cannot be undone.`)) return;
    setDeleting("all-listings");
    let failed = 0;
    for (const item of listings) {
      if (!(await deleteListing(item.id))) failed++;
    }
    setListings([]);
    setDeleting(null);
    alert(failed > 0
      ? `Deleted ${listings.length - failed} of ${listings.length}. ${failed} failed.`
      : "All listings deleted.");
  };

  const handleDeleteById = async () => {
    const id = deleteById.trim();
    if (!id) return;
    if (!confirm(`Delete listing "${id}" from all databases?`)) return;
    setDeleteByIdStatus("Deleting...");
    const ok = await deleteListing(id);
    if (ok) {
      setListings((prev) => prev.filter((i) => i.id !== id));
      setDeleteByIdStatus("Deleted successfully.");
      setDeleteById("");
    } else {
      setDeleteByIdStatus("Failed — item may not exist in either database.");
    }
  };

  /* ── Message deletion ── */
  const handleDeleteMessage = async (id: string) => {
    if (!confirm("Delete this message from the homepage?")) return;
    setDeleting(`msg-${id}`);
    try {
      const res = await fetch("/api/management/messages", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (data.ok) setMessages((prev) => prev.filter((m) => m.id !== id));
      else alert("Delete failed: " + (data.error || "unknown error"));
    } catch (err: any) {
      alert("Delete failed: " + (err?.message || "unknown error"));
    }
    setDeleting(null);
  };

  const handleDeactivateMessage = async (id: string) => {
    setDeleting(`msg-${id}`);
    try {
      const res = await fetch("/api/management/messages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, active: false }),
      });
      const data = await res.json();
      if (data.ok) setMessages((prev) => prev.map((m) => m.id === id ? { ...m, active: false } : m));
    } catch { /* ignore */ }
    setDeleting(null);
  };

  const handleDeleteAllMessages = async () => {
    if (messages.length === 0) return;
    if (!confirm(`Delete ALL ${messages.length} messages?`)) return;
    setDeleting("all-messages");
    for (const msg of messages) {
      try {
        await fetch("/api/management/messages", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: msg.id }),
        });
      } catch { /* continue */ }
    }
    setMessages([]);
    setDeleting(null);
  };

  /* ── Search filter — matches against ALL fields ── */
  const filteredListings = search.trim()
    ? listings.filter((i) => i.searchText.includes(search.toLowerCase()))
    : listings;

  const activeMessages = messages.filter((m) => m.active);

  /* ── Render ── */
  return (
    <div style={{ background: "#f7f7f5", minHeight: "100vh" }}>
      <Head><title>Homepage Scanner - Management</title></Head>
      <Header />

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 16px 64px" }}>

        {/* ═══ Page header ═══ */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700, color: "#0f172a" }}>
              Homepage Scanner
            </h1>
            <p style={{ color: "#6b7280", margin: "4px 0 0", fontSize: 14 }}>
              Scans the exact same data the public homepage displays. Delete anything suspicious immediately.
            </p>
          </div>
          <Link
            href="/management/dashboard"
            style={{ color: "#0f172a", fontWeight: 700, textDecoration: "none", fontSize: 13, border: "1px solid #d1d5db", borderRadius: 999, padding: "8px 16px", background: "#fff" }}
          >
            Back to Dashboard
          </Link>
        </div>

        {/* ═══ Scan summary ═══ */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 24 }}>
          <SummaryCard label="On Homepage" value={homepageCount} />
          <SummaryCard label="Admin DB Only" value={adminOnlyCount} color={adminOnlyCount > 0 ? "#dc2626" : undefined} />
          <SummaryCard label="Total Listings" value={listings.length} />
          <SummaryCard label="Active Messages" value={activeMessages.length} />
          <SummaryCard label="All Messages" value={messages.length} />
          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "14px 18px" }}>
            <p style={{ margin: 0, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", color: "#6b7280", fontWeight: 700 }}>Scanned at</p>
            <p style={{ margin: "4px 0 0", fontSize: 14, fontWeight: 600, color: "#0f172a" }}>{scannedAt}</p>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════ */}
        {/* SECTION 1: BUYER MESSAGES                              */}
        {/* ═══════════════════════════════════════════════════════ */}
        <div style={{ marginBottom: 32, paddingTop: 16, borderTop: "2px solid #111827" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#0f172a" }}>
                Buyer Messages &amp; Announcements
              </h2>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "#6b7280" }}>
                Banners displayed at the top of the homepage. Active messages are visible to all visitors.
              </p>
            </div>
            {messages.length > 0 && (
              <button onClick={handleDeleteAllMessages} disabled={deleting === "all-messages"}
                style={{ border: "1px solid #fca5a5", background: "#fef2f2", color: "#dc2626", borderRadius: 999, padding: "6px 14px", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                Delete All Messages ({messages.length})
              </button>
            )}
          </div>

          {messages.length === 0 ? (
            <p style={{ color: "#9ca3af", fontSize: 13, fontStyle: "italic" }}>No messages found.</p>
          ) : (
            <div style={{ display: "grid", gap: 8 }}>
              {messages.map((msg) => (
                <div key={msg.id} style={{
                  display: "flex", alignItems: "center", gap: 14, background: "#fff",
                  border: `1px solid ${msg.active ? "#fcd34d" : "#e5e7eb"}`, borderRadius: 12, padding: 12,
                  opacity: msg.active ? 1 : 0.6,
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                      <span style={{
                        fontSize: 10, textTransform: "uppercase", fontWeight: 800, padding: "2px 6px", borderRadius: 4,
                        background: msg.active ? "#dcfce7" : "#f3f4f6", color: msg.active ? "#166534" : "#6b7280",
                      }}>
                        {msg.active ? "ACTIVE" : "INACTIVE"}
                      </span>
                      <span style={{
                        fontSize: 10, textTransform: "uppercase", fontWeight: 700, padding: "2px 6px", borderRadius: 4,
                        background: msg.type === "alert" ? "#fecaca" : msg.type === "promo" ? "#fef08a" : "#e5e7eb",
                        color: msg.type === "alert" ? "#991b1b" : msg.type === "promo" ? "#854d0e" : "#374151",
                      }}>
                        {msg.type}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: "#111827" }}>{msg.text}</p>
                    {msg.linkUrl && (
                      <p style={{ margin: "2px 0 0", fontSize: 11, color: "#2563eb" }}>
                        Link: {msg.linkText || msg.linkUrl}
                      </p>
                    )}
                    {msg.imageUrl && <p style={{ margin: "2px 0 0", fontSize: 11, color: "#6b7280" }}>Has image</p>}
                    {msg.videoUrl && <p style={{ margin: "2px 0 0", fontSize: 11, color: "#6b7280" }}>Has video</p>}
                    <p style={{ margin: "2px 0 0", fontSize: 10, color: "#9ca3af" }}>ID: {msg.id}</p>
                  </div>
                  <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                    {msg.active && (
                      <button onClick={() => handleDeactivateMessage(msg.id)} disabled={deleting === `msg-${msg.id}`}
                        style={{ border: "1px solid #d1d5db", background: "#fff", color: "#374151", borderRadius: 8, padding: "6px 12px", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                        Hide
                      </button>
                    )}
                    <button onClick={() => handleDeleteMessage(msg.id)} disabled={deleting === `msg-${msg.id}`}
                      style={{ border: "1px solid #fca5a5", background: "#fff", color: "#dc2626", borderRadius: 8, padding: "6px 12px", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                      {deleting === `msg-${msg.id}` ? "..." : "Delete"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════ */}
        {/* SECTION 2: ALL PRODUCT LISTINGS                        */}
        {/* ═══════════════════════════════════════════════════════ */}
        <div style={{ paddingTop: 16, borderTop: "2px solid #111827" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#0f172a" }}>
                All Product Listings
              </h2>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "#6b7280" }}>
                Fetched using the same getPublicListings() the homepage uses, plus Admin DB extras. Search by any keyword.
              </p>
            </div>
            {listings.length > 0 && (
              <button onClick={handleDeleteAllListings} disabled={deleting === "all-listings"}
                style={{ border: "1px solid #fca5a5", background: "#fef2f2", color: "#dc2626", borderRadius: 999, padding: "6px 14px", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                {deleting === "all-listings" ? "Deleting..." : `Delete All Listings (${listings.length})`}
              </button>
            )}
          </div>

          {/* Search */}
          <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
            <input placeholder="Search anything: title, brand, category, condition, material, color, size, ID..." value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ flex: 1, minWidth: 220, border: "1px solid #e5e7eb", borderRadius: 10, padding: "9px 14px", fontSize: 13, outline: "none", background: "#fff" }} />
            {search.trim() && (
              <button onClick={() => setSearch("")}
                style={{ border: "1px solid #d1d5db", background: "#fff", color: "#374151", borderRadius: 10, padding: "9px 14px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                Clear
              </button>
            )}
          </div>

          {/* Delete by ID */}
          <div style={{
            marginBottom: 16, padding: "12px 16px", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10,
            display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap",
          }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>Delete by ID:</span>
            <input placeholder="Paste listing ID" value={deleteById}
              onChange={(e) => { setDeleteById(e.target.value); setDeleteByIdStatus(null); }}
              style={{ flex: 1, minWidth: 180, border: "1px solid #e5e7eb", borderRadius: 6, padding: "6px 10px", fontSize: 12, outline: "none" }} />
            <button onClick={handleDeleteById} disabled={!deleteById.trim() || deleteByIdStatus === "Deleting..."}
              style={{ border: "1px solid #fca5a5", background: "#dc2626", color: "#fff", borderRadius: 6, padding: "6px 14px", fontWeight: 700, fontSize: 12, cursor: !deleteById.trim() ? "not-allowed" : "pointer", opacity: !deleteById.trim() ? 0.5 : 1 }}>
              {deleteByIdStatus === "Deleting..." ? "..." : "Delete"}
            </button>
            {deleteByIdStatus && deleteByIdStatus !== "Deleting..." && (
              <span style={{ fontSize: 11, fontWeight: 700, color: deleteByIdStatus.startsWith("Deleted") ? "#059669" : "#dc2626" }}>
                {deleteByIdStatus}
              </span>
            )}
          </div>

          {/* Results count */}
          {search.trim() && (
            <p style={{ margin: "0 0 8px", fontSize: 12, color: "#6b7280" }}>
              Showing {filteredListings.length} of {listings.length} listings matching &quot;{search}&quot;
            </p>
          )}

          {/* Listing rows */}
          {filteredListings.length === 0 ? (
            <div style={{ padding: 48, textAlign: "center", background: "#fff", border: "1px dashed #e5e7eb", borderRadius: 16 }}>
              <h3 style={{ margin: "0 0 8px", fontSize: 16, color: "#111827" }}>
                {listings.length === 0 ? "No listings found in either database." : `No results match "${search}".`}
              </h3>
              {listings.length > 0 && (
                <button onClick={() => setSearch("")}
                  style={{ border: "1px solid #cbd5e1", background: "#fff", color: "#0f172a", borderRadius: 999, padding: "8px 14px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: "grid", gap: 8 }}>
              {filteredListings.map((item) => (
                <div key={item.id} style={{
                  display: "flex", alignItems: "center", gap: 14, background: "#fff",
                  border: item.source === "admin" ? "1px solid #fca5a5" : "1px solid #e5e7eb",
                  borderRadius: 12, padding: 12,
                }}>
                  {item.image ? (
                    <img src={item.image} alt="" style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 8, border: "1px solid #f0f0f0", flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: 56, height: 56, borderRadius: 8, background: "#f3f4f6", border: "1px solid #e5e7eb", flexShrink: 0 }} />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: "#111827" }}>{item.title}</p>
                    <p style={{ margin: "2px 0 0", fontSize: 12, color: "#6b7280" }}>
                      {[item.brand, item.category, item.condition, item.material, item.color, item.size, item.price, item.status].filter(Boolean).join(" \u00b7 ")}
                    </p>
                    <p style={{ margin: "2px 0 0", fontSize: 11, color: "#9ca3af" }}>
                      ID: {item.id}
                      <span style={{ marginLeft: 8, fontSize: 10, padding: "1px 5px", borderRadius: 4,
                        background: item.source === "admin" ? "#fef2f2" : item.source === "both" ? "#dcfce7" : "#e0ecff",
                        color: item.source === "admin" ? "#dc2626" : item.source === "both" ? "#166534" : "#1d4ed8",
                        fontWeight: 700,
                      }}>
                        {item.source === "admin" ? "ADMIN DB ONLY" : item.source === "both" ? "Both DBs" : "Homepage"}
                      </span>
                    </p>
                  </div>
                  <button onClick={() => handleDeleteListing(item.id, item.title)}
                    disabled={deleting === item.id}
                    style={{ border: "1px solid #fca5a5", background: deleting === item.id ? "#fef2f2" : "#fff", color: "#dc2626", borderRadius: 8, padding: "8px 16px", fontWeight: 700, fontSize: 13, cursor: deleting === item.id ? "not-allowed" : "pointer", flexShrink: 0 }}>
                    {deleting === item.id ? "..." : "Delete"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </main>
      <Footer />
    </div>
  );
}

/* ───────── Summary card ───────── */

function SummaryCard({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "14px 18px" }}>
      <p style={{ margin: 0, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", color: "#6b7280", fontWeight: 700 }}>{label}</p>
      <p style={{ margin: "4px 0 0", fontSize: 24, fontWeight: 800, color: color || (value > 0 ? "#0f172a" : "#9ca3af") }}>{value}</p>
    </div>
  );
}

/* ───────── Server-side scan ───────── */

export const getServerSideProps: GetServerSideProps<Props> = async () => {
  const seen = new Map<string, ListingItem>();
  let homepageCount = 0;
  let adminOnlyCount = 0;

  // ──────────────────────────────────────────────────────────────
  // 1. PRIMARY: Use getPublicListings() — the EXACT same function
  //    the homepage calls. This guarantees we see what visitors see.
  // ──────────────────────────────────────────────────────────────
  try {
    const publicListings = await getPublicListings({ take: 500 });
    homepageCount = publicListings.length;

    for (const l of publicListings) {
      const priceNum = typeof l.price === "number" ? l.price : (typeof l.priceUsd === "number" ? l.priceUsd : 0);
      const item: ListingItem = {
        id: l.id,
        title: l.title || "Untitled",
        brand: l.brand || "",
        category: l.category || "",
        price: priceNum ? `US$${priceNum.toLocaleString("en-US")}` : "",
        image: l.displayImageUrl || (Array.isArray(l.images) && l.images[0] ? l.images[0] : ""),
        status: l.status || "",
        condition: l.condition || "",
        material: l.material || "",
        color: l.color || "",
        size: l.size || "",
        source: "homepage",
        searchText: "", // populated below
      };
      // Build comprehensive search text from ALL fields
      item.searchText = [
        item.id, item.title, item.brand, item.category, item.price,
        item.status, item.condition, item.material, item.color, item.size,
      ].join(" ").toLowerCase();
      seen.set(l.id, item);
    }
  } catch (err) {
    console.error("getPublicListings scan error:", err);
  }

  // ──────────────────────────────────────────────────────────────
  // 2. SECONDARY: Scan Admin Firestore to find extra items that
  //    may only exist there (ghost items, hacked injections, etc.)
  // ──────────────────────────────────────────────────────────────
  try {
    if (isFirebaseAdminReady && adminDb) {
      const snap = await adminDb.collection("listings").orderBy("createdAt", "desc").get();
      snap.docs.forEach((d) => {
        const data: any = d.data() || {};
        if (seen.has(d.id)) {
          // Already found via getPublicListings — mark as both
          const existing = seen.get(d.id)!;
          seen.set(d.id, { ...existing, source: "both" });
        } else {
          // Admin-only item — not on the homepage query but could be injected
          adminOnlyCount++;
          const priceNum =
            typeof data.priceUsd === "number" ? data.priceUsd
            : typeof data.price === "number" ? data.price : 0;
          const item: ListingItem = {
            id: d.id,
            title: data.title || data.name || data.listingTitle || "Untitled",
            brand: data.brand || data.designer || "",
            category: data.category || data.menuCategory || "",
            price: priceNum ? `US$${priceNum.toLocaleString("en-US")}` : "",
            image: data.displayImageUrl || data.display_image_url || data.imageUrl || data.image_url
              || (Array.isArray(data.images) && data.images[0] ? data.images[0] : ""),
            status: data.status || data.moderationStatus || "",
            condition: data.condition || "",
            material: data.material || data.fabric || "",
            color: data.color || data.colour || "",
            size: data.size || data.itemSize || "",
            source: "admin",
            searchText: "",
          };
          item.searchText = [
            item.id, item.title, item.brand, item.category, item.price,
            item.status, item.condition, item.material, item.color, item.size,
            data.description || "", data.subcategory || "", data.tags?.join?.(" ") || "",
          ].join(" ").toLowerCase();
          seen.set(d.id, item);
        }
      });
    }
  } catch (err) {
    console.error("Admin Firestore scan error:", err);
  }

  // ──────────────────────────────────────────────────────────────
  // 3. Scan buyer messages (all of them, active and inactive)
  // ──────────────────────────────────────────────────────────────
  const messages: MessageItem[] = [];
  try {
    if (isFirebaseAdminReady && adminDb) {
      const snap = await adminDb.collection("buyer_messages").orderBy("createdAt", "desc").get();
      snap.docs.forEach((d) => {
        const data: any = d.data() || {};
        messages.push({
          id: d.id,
          text: data.text || "",
          type: data.type || "info",
          active: data.active !== false,
          linkText: data.linkText || "",
          linkUrl: data.linkUrl || "",
          imageUrl: data.imageUrl || "",
          videoUrl: data.videoUrl || "",
        });
      });
    }
  } catch (err) {
    console.error("Messages scan error:", err);
  }

  const listings = Array.from(seen.values());
  const scannedAt = new Date().toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });

  return { props: { listings, messages, scannedAt, homepageCount, adminOnlyCount } };
};
