// FILE: /pages/management/homepage-listings.tsx
// Management page: view and delete listings shown on the homepage.
// Uses getPublicListings() (client SDK) — same data source as the homepage.

import Head from "next/head";
import Link from "next/link";
import type { GetServerSideProps } from "next";
import { useState } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useRequireAdmin } from "../../hooks/useRequireAdmin";
import { getPublicListings } from "../../lib/publicListings";

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

  if (loading) return null;

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/delete-public-listing/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.ok) {
        setItems((prev) => prev.filter((i) => i.id !== id));
      } else {
        alert("Failed to delete: " + (data.error || "Unknown error"));
      }
    } catch {
      alert("Error deleting listing. Please try again.");
    } finally {
      setDeleting(null);
    }
  };

  const handleDeleteAll = async () => {
    if (items.length === 0) return;
    if (!confirm(`Delete ALL ${items.length} listings? This cannot be undone.`)) return;
    for (const item of items) {
      try {
        await fetch(`/api/admin/delete-public-listing/${item.id}`, {
          method: "DELETE",
        });
      } catch {
        // continue with next
      }
    }
    setItems([]);
    alert("All listings have been deleted.");
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

export const getServerSideProps: GetServerSideProps<Props> = async () => {
  try {
    const listings = await getPublicListings({ take: 500 });
    const items: ListingItem[] = (listings || []).map((l: any) => {
      const priceNum =
        typeof l.price === "number"
          ? l.price
          : typeof l.priceUsd === "number"
          ? l.priceUsd
          : 0;
      return {
        id: l.id,
        title: l.title || "Untitled",
        brand: l.brand || "",
        category: l.category || "",
        price: priceNum ? `US$${priceNum.toLocaleString("en-US")}` : "",
        image:
          l.displayImageUrl ||
          (Array.isArray(l.images) && l.images[0] ? l.images[0] : ""),
        status: l.status || "",
      };
    });
    return { props: { items } };
  } catch (err) {
    console.error("Error loading homepage listings:", err);
    return { props: { items: [] } };
  }
};
