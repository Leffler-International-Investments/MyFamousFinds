// FILE: /pages/management/homepage-listings.tsx
// Homepage Security Scanner — scans the ACTUAL Firestore database the homepage
// reads from, directly from the browser using the same Firebase Client SDK.
// NO filters, NO limits — every document in the collection is fetched and shown.

import Head from "next/head";
import Link from "next/link";
import type { GetServerSideProps } from "next";
import { useState, useEffect, useCallback } from "react";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db } from "../../utils/firebaseClient";
import { adminDb, isFirebaseAdminReady } from "../../utils/firebaseAdmin";
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
  serverListings: ListingItem[];
  messages: MessageItem[];
};

/* ───────── Extract a listing from raw Firestore doc data ───────── */

function docToListing(id: string, d: any): ListingItem {
  const priceNum =
    typeof d.priceUsd === "number" ? d.priceUsd
    : typeof d.price === "number" ? d.price
    : typeof d.priceUsd === "string" ? Number(String(d.priceUsd).replace(/[^0-9.]/g, "")) || 0
    : typeof d.price === "string" ? Number(String(d.price).replace(/[^0-9.]/g, "")) || 0
    : 0;

  // Try every possible image field
  const image =
    d.displayImageUrl || d.display_image_url ||
    d.imageUrl || d.image_url || d.image ||
    d.mainImage || d.mainImageUrl || d.thumbnail || d.coverImage ||
    (Array.isArray(d.displayImageUrls) && d.displayImageUrls[0]) ||
    (Array.isArray(d.images) && d.images[0]) ||
    (Array.isArray(d.imageUrls) && d.imageUrls[0]) ||
    (Array.isArray(d.image_urls) && d.image_urls[0]) ||
    (Array.isArray(d.photos) && d.photos[0]) ||
    (Array.isArray(d.photoUrls) && d.photoUrls[0]) ||
    "";

  return {
    id,
    title: d.title || d.name || d.listingTitle || "Untitled",
    brand: d.brand || d.designer || d.maker || "",
    category: d.category || d.menuCategory || d.categoryLabel || d.department || d.productType || "",
    price: priceNum ? `US$${priceNum.toLocaleString("en-US")}` : "",
    image: typeof image === "string" ? image : "",
    status: d.status || d.moderationStatus || "",
  };
}

/* ───────── Component ───────── */

export default function HomepageScanner({ serverListings, messages: initMessages }: Props) {
  const { loading } = useRequireAdmin();
  const [listings, setListings] = useState<ListingItem[]>(serverListings);
  const [messages, setMessages] = useState(initMessages);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteById, setDeleteById] = useState("");
  const [deleteByIdStatus, setDeleteByIdStatus] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState("Loading...");

  // ─── BROWSER-SIDE SCAN: uses the SAME Firebase Client SDK the homepage uses ───
  const runBrowserScan = useCallback(async () => {
    if (!db) {
      setScanStatus("Firebase Client SDK not available");
      return;
    }
    setScanning(true);
    setScanStatus("Scanning Firestore...");
    try {
      // Raw query — NO orderBy, NO limit, NO filters. Get EVERY document.
      const snap = await getDocs(collection(db, "listings"));
      const scanned: ListingItem[] = [];
      snap.forEach((d) => {
        scanned.push(docToListing(d.id, d.data() || {}));
      });

      // Merge with server results (in case admin DB had extras)
      const merged = new Map<string, ListingItem>();
      for (const item of serverListings) merged.set(item.id, item);
      for (const item of scanned) merged.set(item.id, item); // browser items override

      setListings(Array.from(merged.values()));
      setScanStatus(`Scan complete — ${scanned.length} items from browser + ${serverListings.length} from server`);
    } catch (err: any) {
      console.error("Browser scan error:", err);
      setScanStatus(`Scan error: ${err?.message || "unknown"} — showing server results only`);
    }
    setScanning(false);
  }, [serverListings]);

  // Auto-scan on mount
  useEffect(() => {
    runBrowserScan();
  }, [runBrowserScan]);

  if (loading) return null;

  /* ── Listing deletion ── */
  const deleteListing = async (id: string): Promise<boolean> => {
    // Try admin API first
    try {
      const res = await fetch(`/api/admin/delete-public-listing/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.ok) return true;
    } catch { /* fallback below */ }
    // Fallback: delete directly from client Firestore
    try {
      if (db) { await deleteDoc(doc(db, "listings", id)); return true; }
    } catch { /* ignore */ }
    return false;
  };

  const handleDeleteListing = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setDeleting(id);
    const ok = await deleteListing(id);
    if (ok) setListings((prev) => prev.filter((i) => i.id !== id));
    else alert("Delete failed. Check Firebase config.");
    setDeleting(null);
  };

  const handleDeleteAllListings = async () => {
    if (listings.length === 0) return;
    if (!confirm(`EMERGENCY: Delete ALL ${listings.length} listings? This cannot be undone.`)) return;
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
    if (!confirm(`Delete listing "${id}"?`)) return;
    setDeleteByIdStatus("Deleting...");
    const ok = await deleteListing(id);
    if (ok) {
      setListings((prev) => prev.filter((i) => i.id !== id));
      setDeleteByIdStatus("Deleted successfully.");
      setDeleteById("");
    } else {
      setDeleteByIdStatus("Failed — item may not exist.");
    }
  };

  /* ── Message deletion ── */
  const handleDeleteMessage = async (id: string) => {
    if (!confirm("Delete this message?")) return;
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
              Scans every item in the database — no filters, no limits. See it, delete it.
            </p>
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

        {/* Scan status */}
        <p style={{ margin: "0 0 16px", fontSize: 12, color: scanning ? "#2563eb" : "#6b7280", fontWeight: 600 }}>
          {scanStatus}
        </p>

        {/* ═══ Scan summary ═══ */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 24 }}>
          <SummaryCard label="Total Items" value={listings.length} />
          <SummaryCard label="Active Messages" value={activeMessages.length} />
          <SummaryCard label="All Messages" value={messages.length} />
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
                Banners at the top of the homepage.
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
                    {msg.linkUrl && <p style={{ margin: "2px 0 0", fontSize: 11, color: "#2563eb" }}>Link: {msg.linkText || msg.linkUrl}</p>}
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
        {/* SECTION 2: ALL LISTINGS — VISUAL CARD GRID             */}
        {/* ═══════════════════════════════════════════════════════ */}
        <div style={{ paddingTop: 16, borderTop: "2px solid #111827" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#0f172a" }}>
                All Items ({listings.length})
              </h2>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "#6b7280" }}>
                Every item in the database — no filters. Look at the images, delete what you want.
              </p>
            </div>
            {listings.length > 0 && (
              <button onClick={handleDeleteAllListings} disabled={deleting === "all-listings"}
                style={{ border: "1px solid #fca5a5", background: "#fef2f2", color: "#dc2626", borderRadius: 999, padding: "6px 14px", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                {deleting === "all-listings" ? "Deleting..." : `Delete All (${listings.length})`}
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

          {/* Visual card grid */}
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
              {listings.map((item) => (
                <div key={item.id} style={{
                  background: "#fff", border: "1px solid #e5e7eb",
                  borderRadius: 14, overflow: "hidden",
                  display: "flex", flexDirection: "column",
                }}>
                  {/* Large image */}
                  <div style={{ position: "relative", width: "100%", paddingTop: "100%", background: "#f3f4f6" }}>
                    {item.image ? (
                      <img src={item.image} alt={item.title}
                        style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af", fontSize: 13 }}>
                        No image
                      </div>
                    )}
                    {item.status && (
                      <span style={{
                        position: "absolute", top: 8, left: 8, fontSize: 9, fontWeight: 800,
                        textTransform: "uppercase", padding: "3px 6px", borderRadius: 4,
                        background: "rgba(0,0,0,0.7)", color: "#fff",
                      }}>
                        {item.status}
                      </span>
                    )}
                  </div>

                  {/* Item info */}
                  <div style={{ padding: "10px 12px", flex: 1 }}>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: "#111827", lineHeight: 1.3 }}>
                      {item.title}
                    </p>
                    <p style={{ margin: "3px 0 0", fontSize: 11, color: "#6b7280" }}>
                      {[item.brand, item.category, item.price].filter(Boolean).join(" \u00b7 ")}
                    </p>
                    <p style={{ margin: "2px 0 0", fontSize: 10, color: "#9ca3af", wordBreak: "break-all" }}>
                      {item.id}
                    </p>
                  </div>

                  {/* DELETE button */}
                  <button
                    onClick={() => handleDeleteListing(item.id, item.title)}
                    disabled={deleting === item.id}
                    style={{
                      width: "100%", border: "none", borderTop: "1px solid #fca5a5",
                      background: deleting === item.id ? "#fef2f2" : "#fff",
                      color: "#dc2626", padding: "10px 0", fontWeight: 800, fontSize: 13,
                      cursor: deleting === item.id ? "not-allowed" : "pointer",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) => { if (deleting !== item.id) (e.target as HTMLButtonElement).style.background = "#fef2f2"; }}
                    onMouseLeave={(e) => { if (deleting !== item.id) (e.target as HTMLButtonElement).style.background = "#fff"; }}
                  >
                    {deleting === item.id ? "DELETING..." : "DELETE"}
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

/* ───────── Server-side: fetch Admin DB items + messages as a baseline ───────── */

export const getServerSideProps: GetServerSideProps<Props> = async () => {
  const serverListings: ListingItem[] = [];

  // Fetch from Admin Firestore as baseline (reliable server-side)
  try {
    if (isFirebaseAdminReady && adminDb) {
      const snap = await adminDb.collection("listings").get();
      snap.docs.forEach((d) => {
        serverListings.push(docToListing(d.id, d.data() || {}));
      });
    }
  } catch (err) {
    console.error("Admin Firestore scan error:", err);
  }

  // Fetch all buyer messages
  const messages: MessageItem[] = [];
  try {
    if (isFirebaseAdminReady && adminDb) {
      const snap = await adminDb.collection("buyer_messages").get();
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

  return { props: { serverListings, messages } };
};
