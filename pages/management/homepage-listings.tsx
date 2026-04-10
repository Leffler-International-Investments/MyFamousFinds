// FILE: /pages/management/homepage-listings.tsx

import Head from "next/head";
import Link from "next/link";
import type { GetServerSideProps } from "next";
import { useState, useEffect, useCallback } from "react";
import { collection, getDocs, deleteDoc, doc, getDoc } from "firebase/firestore";
import { db } from "../../utils/firebaseClient";
import { adminDb, isFirebaseAdminReady } from "../../utils/firebaseAdmin";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useRequireAdmin } from "../../hooks/useRequireAdmin";
import { COLOR_OPTIONS } from "../../lib/filterConstants";

/* ─── Types ─── */
type ListingItem = {
  id: string;
  title: string;
  brand: string;
  category: string;
  color: string;
  price: string;
  priceNum: number;
  image: string;
  status: string;
  description: string;
  condition: string;
  size: string;
  allImages: string[];
};

type MessageItem = {
  id: string; text: string; type: string; active: boolean;
  linkText: string; linkUrl: string; imageUrl: string; videoUrl: string;
};

type Props = { serverListings: ListingItem[]; messages: MessageItem[]; };

/* ─── docToListing ─── */
function pickImgUrl(v: any): string {
  if (!v) return "";
  if (typeof v === "string") {
    const s = v.trim();
    return (s.startsWith("http://") || s.startsWith("https://") || s.startsWith("data:image/")) ? s : "";
  }
  if (typeof v === "object") {
    return pickImgUrl(v.displayUrl || v.displayImageUrl || v.url || v.src || v.originalUrl || v.original || "");
  }
  return "";
}

function docToListing(id: string, d: any): ListingItem {
  const priceNum =
    typeof d.priceUsd === "number" ? d.priceUsd
    : typeof d.price === "number" ? d.price
    : typeof d.priceUsd === "string" ? Number(String(d.priceUsd).replace(/[^0-9.]/g, "")) || 0
    : typeof d.price === "string" ? Number(String(d.price).replace(/[^0-9.]/g, "")) || 0 : 0;

  const allImages: string[] = [];
  const addImg = (u: any) => {
    const url = pickImgUrl(u);
    if (url && !allImages.includes(url)) allImages.push(url);
  };
  const addArr = (arr: any) => { if (Array.isArray(arr)) arr.forEach(addImg); };

  // Single image fields
  [d.displayImageUrl, d.display_image_url, d.imageUrl, d.image_url, d.image, d.mainImage, d.mainImageUrl, d.thumbnail, d.coverImage]
    .forEach(addImg);
  // Array image fields — items may be strings OR objects with .url/.src/.displayUrl
  addArr(d.displayImageUrls);
  addArr(d.images);
  addArr(d.imageUrls);
  addArr(d.image_urls);
  addArr(d.photos);
  addArr(d.photoUrls);

  return {
    id,
    title: d.title || d.name || d.listingTitle || "Untitled",
    brand: d.brand || d.designer || d.maker || "",
    category: d.category || d.menuCategory || d.categoryLabel || d.department || d.productType || "",
    color: d.color || d.colour || d.item?.color || "",
    price: priceNum ? `US$${priceNum.toLocaleString("en-US")}` : "",
    priceNum,
    image: allImages[0] || "",
    status: d.status || d.moderationStatus || "",
    description: d.description || d.details || "",
    condition: d.condition || "",
    size: d.size || "",
    allImages,
  };
}

/* ─── Edit Modal ─── */
type EditState = {
  id: string; title: string; brand: string; category: string;
  color: string; description: string; condition: string; size: string;
  priceUsd: string; status: string; displayImageUrl: string;
  allImages: string[];
};

function EditModal({ item, onClose, onSaved }: {
  item: EditState;
  onClose: () => void;
  onSaved: (updated: Partial<ListingItem> & { id: string }) => void;
}) {
  const [form, setForm] = useState<EditState>(item);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [loadingImages, setLoadingImages] = useState(false);

  const set = (k: keyof EditState, v: string) => setForm((f: EditState) => ({ ...f, [k]: v }));

  // Load full Firestore doc to get ALL images
  useEffect(() => {
    if (!db) return;
    setLoadingImages(true);
    getDoc(doc(db, "listings", item.id)).then(snap => {
      if (snap.exists()) {
        const full = docToListing(snap.id, snap.data() as any);
        setForm((f: EditState) => ({ ...f, allImages: full.allImages }));
      }
    }).catch(() => {}).finally(() => setLoadingImages(false));
  }, [item.id]);

  const save = async () => {
    setSaving(true); setError("");
    try {
      const res = await fetch(`/api/admin/update-listing/${form.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title, brand: form.brand, category: form.category,
          color: form.color, description: form.description, condition: form.condition,
          size: form.size, priceUsd: form.priceUsd, status: form.status,
          displayImageUrl: form.displayImageUrl,
        }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Save failed");
      onSaved({
        id: form.id, title: form.title, brand: form.brand, category: form.category,
        color: form.color, description: form.description, condition: form.condition, size: form.size,
        priceNum: Number(form.priceUsd) || 0,
        price: Number(form.priceUsd) ? `US$${Number(form.priceUsd).toLocaleString("en-US")}` : "",
        status: form.status, image: form.displayImageUrl || item.allImages[0] || "",
        allImages: form.allImages,
      });
      onClose();
    } catch (e: any) { setError(e.message); }
    setSaving(false);
  };

  const INPUT = {
    border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 10px",
    fontSize: 13, width: "100%", outline: "none", background: "#fafafa",
  } as const;
  const LABEL = { fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase" as const, letterSpacing: "0.05em", display: "block", marginBottom: 4 };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 700, maxHeight: "92vh", overflow: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 24px", borderBottom: "1px solid #f3f4f6" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#0f172a" }}>Edit Listing</h2>
            <p style={{ margin: "2px 0 0", fontSize: 11, color: "#9ca3af" }}>{form.id}</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 22, color: "#9ca3af", lineHeight: 1 }}>✕</button>
        </div>

        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 20 }}>

          {/* ── HERO IMAGE SELECTOR ── */}
          <div>
            <label style={LABEL}>Hero Image (displayed on homepage &amp; product page)</label>
            {/* Current hero image */}
            {form.displayImageUrl && (
              <div style={{ marginBottom: 10, position: "relative", display: "inline-block" }}>
                <img src={form.displayImageUrl} alt="Current hero"
                  style={{ width: 120, height: 120, objectFit: "cover", borderRadius: 10, border: "3px solid #2563eb", display: "block" }} />
                <span style={{ position: "absolute", top: -6, left: -6, background: "#2563eb", color: "#fff", fontSize: 9, fontWeight: 800, padding: "2px 6px", borderRadius: 4 }}>HERO</span>
              </div>
            )}
            {/* All uploaded images — click to set as hero */}
            <p style={{ margin: "0 0 8px", fontSize: 12, color: "#6b7280" }}>
              {loadingImages ? "Loading all uploaded images..." : `${form.allImages.length} uploaded image${form.allImages.length !== 1 ? "s" : ""} — click any to set as hero:`}
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {form.allImages.map((url, i) => (
                <div key={i} onClick={() => set("displayImageUrl", url)}
                  style={{
                    cursor: "pointer", position: "relative", borderRadius: 8, overflow: "hidden",
                    border: `3px solid ${form.displayImageUrl === url ? "#2563eb" : "#e5e7eb"}`,
                    transition: "border-color 0.15s",
                  }}>
                  <img src={url} alt={`Image ${i + 1}`}
                    style={{ width: 80, height: 80, objectFit: "cover", display: "block" }} />
                  {form.displayImageUrl === url && (
                    <div style={{ position: "absolute", inset: 0, background: "rgba(37,99,235,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ background: "#2563eb", color: "#fff", fontSize: 9, fontWeight: 800, padding: "2px 6px", borderRadius: 4 }}>✓ HERO</span>
                    </div>
                  )}
                </div>
              ))}
              {form.allImages.length === 0 && !loadingImages && (
                <p style={{ fontSize: 12, color: "#9ca3af", fontStyle: "italic" }}>No images found</p>
              )}
            </div>
            {/* Manual URL override */}
            <div style={{ marginTop: 10 }}>
              <label style={{ ...LABEL, marginTop: 8 }}>Or paste a custom image URL:</label>
              <input value={form.displayImageUrl} onChange={e => set("displayImageUrl", e.target.value)}
                placeholder="https://..." style={INPUT} />
            </div>
          </div>

          {/* ── TEXT FIELDS ── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <label style={LABEL}>Title</label>
              <input value={form.title} onChange={e => set("title", e.target.value)} style={INPUT} />
            </div>
            <div>
              <label style={LABEL}>Brand / Designer</label>
              <input value={form.brand} onChange={e => set("brand", e.target.value)} style={INPUT} />
            </div>
            <div>
              <label style={LABEL}>Category</label>
              <select value={form.category} onChange={e => set("category", e.target.value)} style={INPUT}>
                {["WOMEN","BAGS","MEN","KIDS","JEWELRY","WATCHES","SHOES","CLOTHING","ACCESSORIES","PARTY-DRESSES","NEW-ARRIVALS"].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={LABEL}>Color</label>
              <select value={form.color} onChange={e => set("color", e.target.value)} style={INPUT}>
                <option value="">— select —</option>
                {COLOR_OPTIONS.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={LABEL}>Price (USD)</label>
              <input type="number" value={form.priceUsd} onChange={e => set("priceUsd", e.target.value)} style={INPUT} min="0" />
            </div>
            <div>
              <label style={LABEL}>Condition</label>
              <select value={form.condition} onChange={e => set("condition", e.target.value)} style={INPUT}>
                {["", "New with tags", "Like new", "Excellent", "Very good", "Good", "Fair"].map(c => (
                  <option key={c} value={c}>{c || "— select —"}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={LABEL}>Size</label>
              <input value={form.size} onChange={e => set("size", e.target.value)} placeholder="e.g. S, M, 38, One size" style={INPUT} />
            </div>
            <div>
              <label style={LABEL}>Status</label>
              <select value={form.status} onChange={e => set("status", e.target.value)} style={INPUT}>
                {["live","pending","rejected","sold","draft"].map(s => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label style={LABEL}>Description</label>
            <textarea value={form.description} onChange={e => set("description", e.target.value)}
              rows={4} style={{ ...INPUT, resize: "vertical", fontFamily: "inherit" }} />
          </div>

          {error && (
            <div style={{ padding: "10px 14px", background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 8, fontSize: 13, color: "#dc2626" }}>
              {error}
            </div>
          )}

          {/* Save / Cancel */}
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button onClick={onClose} style={{ border: "1px solid #e5e7eb", background: "#fff", color: "#374151", borderRadius: 8, padding: "10px 20px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
              Cancel
            </button>
            <button onClick={save} disabled={saving}
              style={{ border: "none", background: saving ? "#93c5fd" : "#2563eb", color: "#fff", borderRadius: 8, padding: "10px 24px", fontWeight: 800, fontSize: 13, cursor: saving ? "not-allowed" : "pointer" }}>
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
export default function HomepageScanner({ serverListings, messages: initMessages }: Props) {
  const { loading } = useRequireAdmin();
  const [listings, setListings] = useState<ListingItem[]>(serverListings);
  const [messages, setMessages] = useState(initMessages);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [removingBgId, setRemovingBgId] = useState<string | null>(null);
  const [deleteById, setDeleteById] = useState("");
  const [deleteByIdStatus, setDeleteByIdStatus] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState("Loading...");
  const [editItem, setEditItem] = useState<EditState | null>(null);

  const runBrowserScan = useCallback(async () => {
    if (!db) { setScanStatus("Firebase Client SDK not available"); return; }
    setScanning(true); setScanStatus("Scanning Firestore...");
    try {
      const snap = await getDocs(collection(db, "listings"));
      const scanned: ListingItem[] = [];
      snap.forEach((d) => scanned.push(docToListing(d.id, d.data() || {})));
      const merged = new Map<string, ListingItem>();
      for (const item of serverListings) merged.set(item.id, item);
      for (const item of scanned) merged.set(item.id, item);
      setListings(Array.from(merged.values()));
      setScanStatus(`Scan complete — ${scanned.length} items from browser + ${serverListings.length} from server`);
    } catch (err: any) {
      setScanStatus(`Scan error: ${err?.message || "unknown"} — showing server results only`);
    }
    setScanning(false);
  }, [serverListings]);

  useEffect(() => { runBrowserScan(); }, [runBrowserScan]);

  if (loading) return null;

  const deleteListing = async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/admin/delete-public-listing/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.ok) return true;
    } catch { /* fallback */ }
    try { if (db) { await deleteDoc(doc(db, "listings", id)); return true; } } catch { /* ignore */ }
    return false;
  };

  const handleDeleteListing = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setDeleting(id);
    const ok = await deleteListing(id);
    if (ok) setListings(prev => prev.filter(i => i.id !== id));
    else alert("Delete failed. Check Firebase config.");
    setDeleting(null);
  };

  const handleDeleteAllListings = async () => {
    if (listings.length === 0) return;
    if (!confirm(`EMERGENCY: Delete ALL ${listings.length} listings? This cannot be undone.`)) return;
    setDeleting("all-listings");
    let failed = 0;
    for (const item of listings) { if (!(await deleteListing(item.id))) failed++; }
    setListings([]);
    setDeleting(null);
    alert(failed > 0 ? `Deleted ${listings.length - failed} of ${listings.length}. ${failed} failed.` : "All listings deleted.");
  };

  const handleDeleteById = async () => {
    const id = deleteById.trim(); if (!id) return;
    if (!confirm(`Delete listing "${id}"?`)) return;
    setDeleteByIdStatus("Deleting...");
    const ok = await deleteListing(id);
    if (ok) { setListings(prev => prev.filter(i => i.id !== id)); setDeleteByIdStatus("Deleted successfully."); setDeleteById(""); }
    else setDeleteByIdStatus("Failed — item may not exist.");
  };

  const handleDeleteMessage = async (id: string) => {
    if (!confirm("Delete this message?")) return;
    setDeleting(`msg-${id}`);
    try {
      const res = await fetch("/api/management/messages", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
      const data = await res.json();
      if (data.ok) setMessages(prev => prev.filter(m => m.id !== id));
      else alert("Delete failed: " + (data.error || "unknown error"));
    } catch (err: any) { alert("Delete failed: " + (err?.message || "unknown error")); }
    setDeleting(null);
  };

  const handleDeactivateMessage = async (id: string) => {
    setDeleting(`msg-${id}`);
    try {
      const res = await fetch("/api/management/messages", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, active: false }) });
      const data = await res.json();
      if (data.ok) setMessages(prev => prev.map(m => m.id === id ? { ...m, active: false } : m));
    } catch { /* ignore */ }
    setDeleting(null);
  };

  const handleDeleteAllMessages = async () => {
    if (messages.length === 0) return;
    if (!confirm(`Delete ALL ${messages.length} messages?`)) return;
    setDeleting("all-messages");
    for (const msg of messages) {
      try { await fetch("/api/management/messages", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: msg.id }) }); } catch { /* continue */ }
    }
    setMessages([]); setDeleting(null);
  };

  const handleRemoveBg = async (id: string, title: string) => {
    if (removingBgId) return;
    if (!confirm(`Remove background and set white background for "${title}"? This may take a minute.`)) return;
    setRemovingBgId(id);
    try {
      const res = await fetch(`/api/admin/remove-bg/${id}`, { method: "POST" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) throw new Error(json?.error || json?.errors?.join("; ") || "Failed to remove background");
      if (json.displayImageUrl) setListings(prev => prev.map(l => l.id === id ? { ...l, image: json.displayImageUrl } : l));
      const bgInfo = json.bgRemovedCount != null ? ` (${json.bgRemovedCount} bg removed, ${json.bgSkippedCount || 0} skipped)` : "";
      alert(`Done! ${json.processedCount} image(s) processed${bgInfo}.`);
    } catch (err: any) { alert(err?.message || "Background removal failed"); }
    setRemovingBgId(null);
  };

  const openEdit = (item: ListingItem) => {
    setEditItem({
      id: item.id, title: item.title, brand: item.brand, category: item.category,
      color: item.color, description: item.description, condition: item.condition, size: item.size,
      priceUsd: String(item.priceNum || ""), status: item.status,
      displayImageUrl: item.image, allImages: item.allImages,
    });
  };

  const activeMessages = messages.filter(m => m.active);

  return (
    <div style={{ background: "#f7f7f5", minHeight: "100vh" }}>
      <Head><title>Homepage Scanner - Management</title></Head>
      <Header />

      {editItem && (
        <EditModal
          item={editItem}
          onClose={() => setEditItem(null)}
          onSaved={(updated) => {
            setListings(prev => prev.map(l => l.id === updated.id ? { ...l, ...updated } : l));
            setEditItem(null);
          }}
        />
      )}

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 16px 64px" }}>

        {/* Page header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700, color: "#0f172a" }}>Homepage Scanner</h1>
            <p style={{ color: "#6b7280", margin: "4px 0 0", fontSize: 14 }}>Scans every item in the database — no filters, no limits. See it, edit it, delete it.</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={runBrowserScan} disabled={scanning}
              style={{ border: "1px solid #2563eb", background: "#eff6ff", color: "#2563eb", borderRadius: 999, padding: "8px 16px", fontWeight: 700, fontSize: 13, cursor: scanning ? "not-allowed" : "pointer" }}>
              {scanning ? "Scanning..." : "Re-Scan Now"}
            </button>
            <Link href="/management/dashboard"
              style={{ color: "#0f172a", fontWeight: 700, textDecoration: "none", fontSize: 13, border: "1px solid #d1d5db", borderRadius: 999, padding: "8px 16px", background: "#fff" }}>
              Back to Dashboard
            </Link>
          </div>
        </div>
        <p style={{ margin: "0 0 16px", fontSize: 12, color: scanning ? "#2563eb" : "#6b7280", fontWeight: 600 }}>{scanStatus}</p>

        {/* Summary */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 24 }}>
          <SummaryCard label="Total Items" value={listings.length} />
          <SummaryCard label="Active Messages" value={activeMessages.length} />
          <SummaryCard label="All Messages" value={messages.length} />
        </div>

        {/* SECTION 1: MESSAGES */}
        <div style={{ marginBottom: 32, paddingTop: 16, borderTop: "2px solid #111827" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#0f172a" }}>Buyer Messages &amp; Announcements</h2>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "#6b7280" }}>Banners at the top of the homepage.</p>
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
              {messages.map(msg => (
                <div key={msg.id} style={{ display: "flex", alignItems: "center", gap: 14, background: "#fff", border: `1px solid ${msg.active ? "#fcd34d" : "#e5e7eb"}`, borderRadius: 12, padding: 12, opacity: msg.active ? 1 : 0.6 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                      <span style={{ fontSize: 10, textTransform: "uppercase", fontWeight: 800, padding: "2px 6px", borderRadius: 4, background: msg.active ? "#dcfce7" : "#f3f4f6", color: msg.active ? "#166534" : "#6b7280" }}>{msg.active ? "ACTIVE" : "INACTIVE"}</span>
                      <span style={{ fontSize: 10, textTransform: "uppercase", fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: msg.type === "alert" ? "#fecaca" : msg.type === "promo" ? "#fef08a" : "#e5e7eb", color: msg.type === "alert" ? "#991b1b" : msg.type === "promo" ? "#854d0e" : "#374151" }}>{msg.type}</span>
                    </div>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: "#111827" }}>{msg.text}</p>
                    {msg.linkUrl && <p style={{ margin: "2px 0 0", fontSize: 11, color: "#2563eb" }}>Link: {msg.linkText || msg.linkUrl}</p>}
                    <p style={{ margin: "2px 0 0", fontSize: 10, color: "#9ca3af" }}>ID: {msg.id}</p>
                  </div>
                  <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                    {msg.active && (
                      <button onClick={() => handleDeactivateMessage(msg.id)} disabled={deleting === `msg-${msg.id}`}
                        style={{ border: "1px solid #d1d5db", background: "#fff", color: "#374151", borderRadius: 8, padding: "6px 12px", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>Hide</button>
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

        {/* SECTION 2: LISTINGS */}
        <div style={{ paddingTop: 16, borderTop: "2px solid #111827" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#0f172a" }}>All Items ({listings.length})</h2>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "#6b7280" }}>Every item in the database — no filters. Edit, fix images, or delete.</p>
            </div>
            {listings.length > 0 && (
              <button onClick={handleDeleteAllListings} disabled={deleting === "all-listings"}
                style={{ border: "1px solid #fca5a5", background: "#fef2f2", color: "#dc2626", borderRadius: 999, padding: "6px 14px", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                {deleting === "all-listings" ? "Deleting..." : `Delete All (${listings.length})`}
              </button>
            )}
          </div>

          {/* Delete by ID */}
          <div style={{ marginBottom: 16, padding: "12px 16px", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>Delete by ID:</span>
            <input placeholder="Paste listing ID" value={deleteById}
              onChange={(e) => { setDeleteById(e.target.value); setDeleteByIdStatus(null); }}
              style={{ flex: 1, minWidth: 180, border: "1px solid #e5e7eb", borderRadius: 6, padding: "6px 10px", fontSize: 12, outline: "none" }} />
            <button onClick={handleDeleteById} disabled={!deleteById.trim() || deleteByIdStatus === "Deleting..."}
              style={{ border: "1px solid #fca5a5", background: "#dc2626", color: "#fff", borderRadius: 6, padding: "6px 14px", fontWeight: 700, fontSize: 12, cursor: !deleteById.trim() ? "not-allowed" : "pointer", opacity: !deleteById.trim() ? 0.5 : 1 }}>
              {deleteByIdStatus === "Deleting..." ? "..." : "Delete"}
            </button>
            {deleteByIdStatus && deleteByIdStatus !== "Deleting..." && (
              <span style={{ fontSize: 11, fontWeight: 700, color: deleteByIdStatus.startsWith("Deleted") ? "#059669" : "#dc2626" }}>{deleteByIdStatus}</span>
            )}
          </div>

          {/* Grid */}
          {scanning ? (
            <div style={{ padding: 48, textAlign: "center", background: "#fff", border: "1px dashed #e5e7eb", borderRadius: 16 }}>
              <h3 style={{ margin: 0, fontSize: 16, color: "#2563eb" }}>Scanning database...</h3>
            </div>
          ) : listings.length === 0 ? (
            <div style={{ padding: 48, textAlign: "center", background: "#fff", border: "1px dashed #e5e7eb", borderRadius: 16 }}>
              <h3 style={{ margin: 0, fontSize: 16, color: "#111827" }}>No items found.</h3>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
              {listings.map(item => (
                <div key={item.id} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, overflow: "hidden", display: "flex", flexDirection: "column" }}>
                  {/* Image */}
                  <div style={{ position: "relative", width: "100%", paddingTop: "100%", background: "#f3f4f6" }}>
                    {item.image ? (
                      <img src={item.image} alt={item.title}
                        style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af", fontSize: 13 }}>No image</div>
                    )}
                    {item.status && (
                      <span style={{ position: "absolute", top: 8, left: 8, fontSize: 9, fontWeight: 800, textTransform: "uppercase", padding: "3px 6px", borderRadius: 4, background: "rgba(0,0,0,0.7)", color: "#fff" }}>
                        {item.status}
                      </span>
                    )}
                    {/* Edit overlay on hover */}
                    <button onClick={() => openEdit(item)}
                      style={{ position: "absolute", top: 8, right: 8, background: "rgba(37,99,235,0.9)", color: "#fff", border: "none", borderRadius: 6, padding: "4px 8px", fontSize: 11, fontWeight: 800, cursor: "pointer" }}>
                      ✏ EDIT
                    </button>
                  </div>

                  {/* Info */}
                  <div style={{ padding: "10px 12px", flex: 1 }}>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: "#111827", lineHeight: 1.3 }}>{item.title}</p>
                    <p style={{ margin: "3px 0 0", fontSize: 11, color: "#6b7280" }}>{[item.brand, item.category, item.price].filter(Boolean).join(" · ")}</p>
                    <p style={{ margin: "2px 0 0", fontSize: 10, color: "#9ca3af", wordBreak: "break-all" }}>{item.id}</p>
                  </div>

                  {/* Action buttons — 3 buttons now */}
                  <div style={{ display: "flex", borderTop: "1px solid #e5e7eb" }}>
                    <button onClick={() => openEdit(item)}
                      style={{ flex: 1, border: "none", borderRight: "1px solid #e5e7eb", background: "#fff", color: "#2563eb", padding: "10px 0", fontWeight: 800, fontSize: 11, cursor: "pointer" }}
                      onMouseEnter={e => (e.target as HTMLButtonElement).style.background = "#eff6ff"}
                      onMouseLeave={e => (e.target as HTMLButtonElement).style.background = "#fff"}>
                      ✏ EDIT
                    </button>
                    <button onClick={() => handleRemoveBg(item.id, item.title)} disabled={removingBgId === item.id}
                      style={{ flex: 1, border: "none", borderRight: "1px solid #e5e7eb", background: removingBgId === item.id ? "#f5f3ff" : "#fff", color: "#7c3aed", padding: "10px 0", fontWeight: 800, fontSize: 11, cursor: removingBgId === item.id ? "not-allowed" : "pointer" }}
                      onMouseEnter={e => { if (removingBgId !== item.id) (e.target as HTMLButtonElement).style.background = "#f5f3ff"; }}
                      onMouseLeave={e => { if (removingBgId !== item.id) (e.target as HTMLButtonElement).style.background = "#fff"; }}>
                      {removingBgId === item.id ? "..." : "WHITE BG"}
                    </button>
                    <button onClick={() => handleDeleteListing(item.id, item.title)} disabled={deleting === item.id}
                      style={{ flex: 1, border: "none", background: deleting === item.id ? "#fef2f2" : "#fff", color: "#dc2626", padding: "10px 0", fontWeight: 800, fontSize: 11, cursor: deleting === item.id ? "not-allowed" : "pointer" }}
                      onMouseEnter={e => { if (deleting !== item.id) (e.target as HTMLButtonElement).style.background = "#fef2f2"; }}
                      onMouseLeave={e => { if (deleting !== item.id) (e.target as HTMLButtonElement).style.background = "#fff"; }}>
                      {deleting === item.id ? "..." : "DELETE"}
                    </button>
                  </div>
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

function SummaryCard({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "14px 18px" }}>
      <p style={{ margin: 0, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", color: "#6b7280", fontWeight: 700 }}>{label}</p>
      <p style={{ margin: "4px 0 0", fontSize: 24, fontWeight: 800, color: color || (value > 0 ? "#0f172a" : "#9ca3af") }}>{value}</p>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async () => {
  const serverListings: ListingItem[] = [];
  try {
    if (isFirebaseAdminReady && adminDb) {
      const snap = await adminDb.collection("listings").get();
      snap.docs.forEach(d => serverListings.push(docToListing(d.id, d.data() || {})));
    }
  } catch (err) { console.error("Admin Firestore scan error:", err); }

  const messages: MessageItem[] = [];
  try {
    if (isFirebaseAdminReady && adminDb) {
      const snap = await adminDb.collection("buyer_messages").get();
      snap.docs.forEach(d => {
        const data: any = d.data() || {};
        messages.push({ id: d.id, text: data.text || "", type: data.type || "info", active: data.active !== false, linkText: data.linkText || "", linkUrl: data.linkUrl || "", imageUrl: data.imageUrl || "", videoUrl: data.videoUrl || "" });
      });
    }
  } catch (err) { console.error("Messages scan error:", err); }

  return { props: { serverListings, messages } };
};
