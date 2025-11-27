// FILE: pages/search.tsx

import Head from "next/head";
import type { GetServerSideProps, NextPage } from "next";

import Header from "../components/Header";
import Footer from "../components/Footer";
import ProductCard, { ProductLike } from "../components/ProductCard";
import { adminDb } from "../utils/firebaseAdmin";

// ---------- helpers ----------

const formatPrice = (raw: any): string => {
  const num = typeof raw === "number" ? raw : Number(raw || 0);
  if (!num) return "";
  return `US$${num.toLocaleString()}`;
};

const pickImage = (data: any): string => {
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
};

// ---------- page ----------

const SearchPage: NextPage<Props> = ({ items, query }) => {
  const title = query ? `Search: ${query}` : "Search";

  return (
    <>
      <Head>
        <title>{title} | Famous Finds</title>
      </Head>

      <Header />

      <main
        style={{
          background: "#f7f5f1",
          padding: "48px 0 72px",
        }}
      >
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
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(280px, 1fr))",
                  gap: "32px",
                  alignItems: "flex-start",
                }}
              >
                {items.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      maxWidth: "360px",
                    }}
                  >
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

  // If no query, don't waste reads – just return empty.
  if (!query) {
    return {
      props: {
        items: [],
        query: null,
      },
    };
  }

  const snapshot = await adminDb
    .collection("listings")
    .where("status", "==", "Live")
    .get();

  const allItems: ProductLike[] = snapshot.docs.map((doc) => {
    const data = doc.data() as any;
    return {
      id: doc.id,
      title: data.title || "",
      brand: data.brand || "",
      price: formatPrice(data.price),
      image: pickImage(data),
      href: `/product/${doc.id}`,
      category: data.category || "",
      condition: data.condition || "",
      badge: data.condition || "",
      tags: data.tags || [],
    };
  });

  const needle = query.toLowerCase();

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
    },
  };
};
