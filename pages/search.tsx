// FILE: pages/search.tsx

import Head from "next/head";
import Link from "next/link";
import type { GetServerSideProps, NextPage } from "next";

import Header from "../components/Header";
import Footer from "../components/Footer";
import ProductCard, { ProductLike } from "../components/ProductCard";
import { adminDb } from "../utils/firebaseAdmin";
import { getDeletedListingIds } from "../lib/deletedListings";

// ---------- helpers ----------

const formatPrice = (raw: any): string => {
  const num = typeof raw === "number" ? raw : Number(raw || 0);
  if (!num) return "";
  return `US$${num.toLocaleString()}`;
};

const pickImage = (data: any): string => {
  if (data.displayImageUrl) return data.displayImageUrl;
  if (data.display_image_url) return data.display_image_url;
  if (data.image_url) return data.image_url;
  if (data.imageUrl) return data.imageUrl;
  if (data.image) return data.image;
  if (Array.isArray(data.imageUrls) && data.imageUrls.length > 0) {
    return data.imageUrls[0];
  }
  return "";
};

// ---------- types ----------

type Props = {
  items: ProductLike[];
  query: string | null;
  matchedCategory: string | null;
};

// ---------- page ----------

const SearchPage: NextPage<Props> = ({ items, query, matchedCategory }) => {
  const title = query ? `Search: ${query}` : "Search";

  return (
    <>
      <Head>
        <title>{title} | Famous Finds</title>
      </Head>

      <Header />

      <main className="dashboard-page" style={{ padding: "48px 0 72px" }}>
        <div
          style={{
            maxWidth: "1120px",
            margin: "0 auto",
            padding: "0 24px",
          }}
        >
          <h1
            style={{
              margin: "0 0 8px",
              fontSize: "32px",
              lineHeight: 1.1,
              fontWeight: 600,
              letterSpacing: "-0.02em",
            }}
          >
            {query ? `Results for “${query}”` : "Search Famous Finds"}
          </h1>

          <p
            style={{
              margin: "0 0 24px",
              fontSize: "14px",
              color: "#6b7280",
            }}
          >
            We search only inside Famous Finds listings – titles, designers,
            categories and tags.
          </p>

          {!query && (
            <p
              style={{
                margin: "0 0 24px",
                fontSize: "14px",
                color: "#6b7280",
              }}
            >
              Type a designer, category or item name into the search box above.
            </p>
          )}

          {matchedCategory && (
            <div style={{
              margin: "0 0 24px",
              padding: "14px 18px",
              background: "#f9fafb",
              border: "1px solid #e5e7eb",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}>
              <span style={{ fontSize: "14px", color: "#374151" }}>
                Browse the full category:
              </span>
              <Link
                href={`/category/${matchedCategory}`}
                style={{
                  fontSize: "14px",
                  fontWeight: 700,
                  color: "#111827",
                  textDecoration: "none",
                  padding: "6px 14px",
                  border: "1px solid #111827",
                  borderRadius: "999px",
                }}
              >
                {matchedCategory.charAt(0).toUpperCase() + matchedCategory.slice(1)}
              </Link>
            </div>
          )}

          {query && items.length === 0 && (
            <p
              style={{
                margin: "0 0 24px",
                fontSize: "14px",
                color: "#6b7280",
              }}
            >
              No matching items found.
            </p>
          )}

          {items.length > 0 && (
            <section style={{ marginBottom: "32px" }}>
              <div
                className="search-results-grid"
                style={{
                  display: "grid",
                  // ✅ FIXED: Changed from 'auto-fit' to 'auto-fill'.
                  // This prevents a single item from stretching to full width.
                  // It will now stay a standard card size (~260px).
                  gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                  gap: "24px", 
                  alignItems: "flex-start",
                }}
              >
                {items.map((item) => (
                  <div key={item.id} className="product-card-wrapper">
                    <ProductCard {...item} />
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
};

export default SearchPage;

// ---------- server-side search in our environment only ----------

export const getServerSideProps: GetServerSideProps<Props> = async (
  context
) => {
  const rawQ = context.query.q;
  const query =
    typeof rawQ === "string" && rawQ.trim().length > 0
      ? rawQ.trim()
      : null;

  if (!query) {
    return {
      props: {
        items: [],
        query: null,
        matchedCategory: null,
      },
    };
  }

  const deletedIds = await getDeletedListingIds();

  const snapshot = await adminDb
    .collection("listings")
    .limit(500)
    .get();

  const allItems: ProductLike[] = [];
  snapshot.docs.forEach((doc) => {
    if (deletedIds.has(doc.id)) return;
    const data = doc.data() as any;

    // Filter by status (case-insensitive)
    const status = String(data.status || "").trim().toLowerCase();
    const isLive =
      !status ||
      status === "live" ||
      status === "active" ||
      status === "approved" ||
      status === "published" ||
      status === "pending";
    if (!isLive) return;

    // Filter out sold items
    const isSold =
      data.isSold === true ||
      data.sold === true ||
      status === "sold" ||
      status === "inactive_sold";
    if (isSold) return;

    allItems.push({
      id: doc.id,
      title: data.title || "",
      brand: data.brand || data.designer || "",
      price: formatPrice(data.price),
      image: pickImage(data),
      href: `/product/${doc.id}`,
      category: data.category || "",
      condition: data.condition || "",
      badge: data.condition || "",
      tags: data.tags || [],
    } as any);
  });

  const needle = query.toLowerCase();

  // Also check if the query matches a site category
  const SITE_CATEGORIES = ["women", "men", "kids", "bags", "shoes", "accessories", "jewelry", "watches"];
  const matchedCategory = SITE_CATEGORIES.find((c) => c.includes(needle) || needle.includes(c));

  const items = allItems.filter((item: any) => {
    const haystack = [
      item.title || "",
      item.brand || "",
      item.category || "",
      Array.isArray(item.tags) ? item.tags.join(" ") : "",
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(needle);
  });

  return {
    props: {
      items,
      query,
      matchedCategory: matchedCategory || null,
    },
  };
};
