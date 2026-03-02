// FILE: /pages/management/homepage-listings.tsx
// Management page: view and delete ALL listings from BOTH Firestore databases.
// Unlike the public homepage, this page shows every item regardless of status
// so admins can find and remove ghost listings.

import Head from "next/head";
import Link from "next/link";
import type { GetServerSideProps } from "next";
import { useState } from "react";
import { collection, getDocs, orderBy, query, deleteDoc, doc } from "firebase/firestore";
import { db } from "../../utils/firebaseClient";
import { adminDb, isFirebaseAdminReady } from "../../utils/firebaseAdmin";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useRequireAdmin } from "../../hooks/useRequireAdmin";

type ListingItem = {
  id: string;
  title: string;
  brand: string;
  category: string;
  price: string;
  image: string;
  status: string;
};

type Props = {
  items: ListingItem[];
};

export default function HomepageListings({ items: initialItems }: Props) {
  const { loading } = useRequireAdmin();
  const [items, setItems] = useState(initialItems);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [deleteById, setDeleteById] = useState("");
  const [deleteByIdStatus, setDeleteByIdStatus] = useState<string | null>(null);

  if (loading) return null;

  // Delete a single listing: try Admin SDK API first, fall back to client-side Firestore
  const deleteListing = async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/admin/delete-public-listing/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.ok) return true;
    } catch { /* API failed, try client-side fallback */ }

    // Fallback: delete directly via client-side Firestore SDK
    try {
      if (db) {
        await deleteDoc(doc(db, "listings", id));
        return true;
      }
    } catch (err) {
      console.error("Client-side delete failed:", err);
    }
    return false;
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setDeleting(id);
    const ok = await deleteListing(id);
    if (ok) {
      setItems((prev) => prev.filter((i) => i.id !== id));
    } else {
      alert("Failed to delete listing. Check Firebase configuration.");
    }
    setDeleting(null);
  };

  const handleDeleteAll = async () => {
    if (items.length === 0) return;
    if (!confirm(`Delete ALL ${items.length} listings? This cannot be undone.`)) return;
    setDeleting("all");
    let failed = 0;
    for (const item of items) {
      const ok = await deleteListing(item.id);
      if (!ok) failed++;
    }
    setItems([]);
    setDeleting(null);
    if (failed > 0) {
      alert(`Deleted ${items.length - failed} of ${items.length} listings. ${failed} failed.`);
    } else {
      alert("All listings have been deleted.");
    }
  };

  const handleDeleteById = async () => {
    const id = deleteById.trim();
    if (!id) return;
    if (!confirm(`Delete listing with ID "${id}"? This will remove it from Firestore and the homepage.`)) return;
    setDeleteByIdStatus("Deleting...");
    try {
      // Try admin API first
      const res = await fetch(`/api/admin/delete-public-listing/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.ok) {
        setItems((prev) => prev.filter((i) => i.id !== id));
        setDeleteByIdStatus("Deleted successfully.");
        setDeleteById("");
      } else {
        // Fallback: try client-side delete
        if (db) {
          await deleteDoc(doc(db, "listings", id));
          setItems((prev) => prev.filter((i) => i.id !== id));
          setDeleteByIdStatus("Deleted via client SDK.");
          setDeleteById("");
        } else {
          setDeleteByIdStatus("Failed: " + (data.error || "Unknown error"));
        }
      }
    } catch (err: any) {
      setDeleteByIdStatus("Error: " + (err?.message || "Unknown error"));
    }
  };

  const filtered = search.trim()
    ? items.filter(
        (i) =>
          i.title.toLowerCase().includes(search.toLowerCase()) ||
          i.brand.toLowerCase().includes(search.toLowerCase()) ||
          i.category.toLowerCase().includes(search.toLowerCase())
      )
    : items;

  return (
    <div style={{ background: "#f7f7f5", minHeight: "100vh" }}>
      <Head>
        <title>All Listings on Homepage - Management</title>
      </Head>
      <Header />
      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 16px 64px" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700, color: "#0f172a" }}>
              All Listings on Homepage
            </h1>
            <p style={{ color: "#6b7280", margin: "4px 0 0", fontSize: 14 }}>
              {items.length} items currently displayed on the homepage. Delete any item from here.
            </p>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <Link
              href="/management/dashboard"
              style={{
                color: "#0f172a",
                fontWeight: 700,
                textDecoration: "none",
                fontSize: 13,
                border: "1px solid #d1d5db",
                borderRadius: 999,
                padding: "8px 16px",
                background: "#fff",
              }}
            >
              Back to Dashboard
            </Link>
            {items.length > 0 && (
              <button
                onClick={handleDeleteAll}
                style={{
                  border: "1px solid #fca5a5",
                  background: "#fef2f2",
                  color: "#dc2626",
                  borderRadius: 999,
                  padding: "8px 16px",
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                Delete All ({items.length})
              </button>
            )}
          </div>
        </div>

        {/* Search */}
        <div style={{ marginBottom: 16 }}>
          <input
            placeholder="Search by title, brand, or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              maxWidth: 400,
              border: "1px solid #e5e7eb",
              borderRadius: 12,
              padding: "10px 14px",
              fontSize: 14,
              outline: "none",
              background: "#fff",
            }}
          />
        </div>

        {/* Delete by ID — for ghost listings not appearing in the list */}
        <div style={{
          marginBottom: 20,
          padding: "16px 20px",
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 12,
        }}>
          <p style={{ margin: "0 0 8px", fontWeight: 700, fontSize: 14, color: "#0f172a" }}>
            Delete a listing by ID
          </p>
          <p style={{ margin: "0 0 10px", fontSize: 12, color: "#6b7280" }}>
            Use this to remove ghost listings that don&apos;t appear in the list above. Paste the listing ID from the product URL.
          </p>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <input
              placeholder="e.g. pJEVgR6vhikUPTim1Ysd"
              value={deleteById}
              onChange={(e) => { setDeleteById(e.target.value); setDeleteByIdStatus(null); }}
              style={{
                flex: 1,
                minWidth: 200,
                border: "1px solid #e5e7eb",
                borderRadius: 8,
                padding: "8px 12px",
                fontSize: 13,
                outline: "none",
              }}
            />
            <button
              onClick={handleDeleteById}
              disabled={!deleteById.trim() || deleteByIdStatus === "Deleting..."}
              style={{
                border: "1px solid #fca5a5",
                background: "#dc2626",
                color: "#fff",
                borderRadius: 8,
                padding: "8px 16px",
                fontWeight: 700,
                fontSize: 13,
                cursor: !deleteById.trim() ? "not-allowed" : "pointer",
                opacity: !deleteById.trim() ? 0.5 : 1,
              }}
            >
              {deleteByIdStatus === "Deleting..." ? "Deleting..." : "Delete by ID"}
            </button>
          </div>
          {deleteByIdStatus && deleteByIdStatus !== "Deleting..." && (
            <p style={{
              margin: "8px 0 0",
              fontSize: 12,
              color: deleteByIdStatus.startsWith("Deleted") ? "#059669" : "#dc2626",
              fontWeight: 600,
            }}>
              {deleteByIdStatus}
            </p>
          )}
        </div>

        {/* Listing rows */}
        {filtered.length === 0 ? (
          <div
            style={{
              padding: 48,
              textAlign: "center",
              background: "#fff",
              border: "1px dashed #e5e7eb",
              borderRadius: 16,
            }}
          >
            <h3 style={{ margin: "0 0 8px", fontSize: 16, color: "#111827" }}>
              {items.length === 0 ? "No listings found." : "No results match your search."}
            </h3>
            {items.length > 0 && (
              <button
                onClick={() => setSearch("")}
                style={{
                  border: "1px solid #cbd5e1",
                  background: "#fff",
                  color: "#0f172a",
                  borderRadius: 999,
                  padding: "8px 14px",
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: "grid", gap: 8 }}>
            {filtered.map((item) => (
              <div
                key={item.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  background: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: 12,
                  padding: 12,
                }}
              >
                {item.image ? (
                  <img
                    src={item.image}
                    alt=""
                    style={{
                      width: 56,
                      height: 56,
                      objectFit: "cover",
                      borderRadius: 8,
                      border: "1px solid #f0f0f0",
                      flexShrink: 0,
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 8,
                      background: "#f3f4f6",
                      border: "1px solid #e5e7eb",
                      flexShrink: 0,
                    }}
                  />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: "#111827" }}>
                    {item.title}
                  </p>
                  <p style={{ margin: "2px 0 0", fontSize: 12, color: "#6b7280" }}>
                    {[item.brand, item.category, item.price, item.status]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  <p style={{ margin: "2px 0 0", fontSize: 11, color: "#9ca3af" }}>
                    ID: {item.id}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(item.id, item.title)}
                  disabled={deleting === item.id}
                  style={{
                    border: "1px solid #fca5a5",
                    background: deleting === item.id ? "#fef2f2" : "#fff",
                    color: "#dc2626",
                    borderRadius: 8,
                    padding: "8px 16px",
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: deleting === item.id ? "not-allowed" : "pointer",
                    flexShrink: 0,
                  }}
                >
                  {deleting === item.id ? "Deleting..." : "Delete"}
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

// Helper: extract a listing row from a raw Firestore document
function toListingItem(id: string, d: any): ListingItem {
  const priceNum =
    typeof d.priceUsd === "number"
      ? d.priceUsd
      : typeof d.price === "number"
      ? d.price
      : 0;
  return {
    id,
    title: d.title || d.name || d.listingTitle || "Untitled",
    brand: d.brand || d.designer || "",
    category: d.category || d.menuCategory || "",
    price: priceNum ? `US$${priceNum.toLocaleString("en-US")}` : "",
    image:
      d.displayImageUrl ||
      d.display_image_url ||
      d.imageUrl ||
      d.image_url ||
      (Array.isArray(d.images) && d.images[0] ? d.images[0] : ""),
    status: d.status || d.moderationStatus || "",
  };
}

export const getServerSideProps: GetServerSideProps<Props> = async () => {
  const seen = new Map<string, ListingItem>();

  // 1. Fetch ALL listings from Client Firestore (no status filter, no cap)
  //    This is the same database the public homepage reads from.
  try {
    if (db) {
      const q = query(
        collection(db, "listings"),
        orderBy("createdAt", "desc")
      );
      const snap = await getDocs(q);
      snap.forEach((d) => {
        if (!seen.has(d.id)) {
          seen.set(d.id, toListingItem(d.id, d.data() || {}));
        }
      });
    }
  } catch (err) {
    console.error("Client Firestore fetch error:", err);
  }

  // 2. Fetch ALL listings from Admin Firestore and merge
  //    Catches items that only exist in the admin project.
  try {
    if (isFirebaseAdminReady && adminDb) {
      const snap = await adminDb
        .collection("listings")
        .orderBy("createdAt", "desc")
        .get();
      snap.docs.forEach((d) => {
        if (!seen.has(d.id)) {
          seen.set(d.id, toListingItem(d.id, d.data() || {}));
        }
      });
    }
  } catch (err) {
    console.error("Admin Firestore fetch error:", err);
  }

  const items = Array.from(seen.values());
  return { props: { items } };
};
