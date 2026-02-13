// FILE: pages/products.tsx

import Head from "next/head";
import type { GetServerSideProps, NextPage } from "next";

import Header from "../components/Header";
import Footer from "../components/Footer";
import ProductCard, { ProductLike } from "../components/ProductCard";
import { getPublicListings } from "../lib/publicListings";
import { getDeletedListingIds } from "../lib/deletedListings";

// ---------------- helpers ----------------

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

// ---------------- types ----------------

type Props = {
  items: ProductLike[];
  designer: string | null;
  tag: string | null;
};

// ---------------- page ----------------

const ProductsPage: NextPage<Props> = ({ items, designer, tag }) => {
  const grouped: Record<string, ProductLike[]> = {};

  items.forEach((item: any) => {
    const cat =
      item.category || item.categoryName || item.department || "Other";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(item);
  });

  const pageTitle = designer || tag || "All Designer Pieces";

  return (
    <>
      <Head>
        <title>{pageTitle} | Famous Finds</title>
      </Head>

      <Header />

      {/* Simple layout, no CSS files required */}
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
            {designer ? designer : tag ? `${tag} pieces` : "All Designer Pieces"}
          </h1>

          {designer && (
            <p
              style={{
                margin: "0 0 24px",
                fontSize: "14px",
                color: "#6b7280",
              }}
            >
              Showing all live listings for <strong>{designer}</strong>, grouped
              by category.
            </p>
          )}

          {Object.keys(grouped).length === 0 && (
            <p
              style={{
                margin: "0 0 24px",
                fontSize: "14px",
                color: "#6b7280",
              }}
            >
              No items found.
            </p>
          )}

          {Object.entries(grouped).map(([category, catItems]) => (
            <section key={category} style={{ marginBottom: "32px" }}>
              <h2
                style={{
                  margin: "0 0 12px",
                  fontSize: "20px",
                  fontWeight: 500,
                  textTransform: "capitalize",
                }}
              >
                {category}
              </h2>

              {/* Grid like the homepage – cards stay small */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(280px, 1fr))",
                  gap: "32px",
                  alignItems: "flex-start",
                }}
              >
                {catItems.map((item) => (
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
          ))}
        </div>
      </main>

      <Footer />
    </>
  );
};

export default ProductsPage;

// ---------------- server-side data ----------------

export const getServerSideProps: GetServerSideProps<Props> = async (
  context
) => {
  const { designer: rawDesigner, tag: rawTag } = context.query;

  const designer =
    typeof rawDesigner === "string" && rawDesigner.length > 0
      ? rawDesigner
      : null;
  const tag =
    typeof rawTag === "string" && rawTag.length > 0 ? rawTag : null;

  const excludeIds = await getDeletedListingIds();
  const listings = await getPublicListings({ take: 500, excludeIds });

  let items: ProductLike[] = (listings || []).map((l: any) => {
    const priceNum = typeof l.price === "number" ? l.price : (typeof l.priceUsd === "number" ? l.priceUsd : 0);
    return {
      id: l.id,
      title: l.title || "",
      brand: l.brand || "",
      price: priceNum ? `US$${priceNum.toLocaleString("en-US")}` : "",
      image: l.displayImageUrl || (Array.isArray(l.images) && l.images[0] ? l.images[0] : ""),
      href: `/product/${l.id}`,
      category: l.category || "",
      condition: l.condition || "",
      badge: l.condition || "",
      tags: l.tags || [],
    };
  });

  if (designer) {
    items = items.filter(
      (item: any) => (item.brand || "").trim() === designer
    );
  }

  if (tag) {
    items = items.filter((item: any) =>
      Array.isArray(item.tags) ? item.tags.includes(tag) : false
    );
  }

  return {
    props: {
      items,
      designer,
      tag,
    },
  };
};
