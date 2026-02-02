// FILE: /pages/designers/index.tsx

import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useMemo, useState } from "react";
import type { GetServerSideProps, NextPage } from "next";

import Header from "../../components/Header";
import Footer from "../../components/Footer";
import ProductCard, { ProductLike } from "../../components/ProductCard";
import ListingFilters from "../../components/ListingFilters";
import { adminDb } from "../../utils/firebaseAdmin";
import { getPublicListings } from "../../lib/publicListings";

// --------------------------------------------------
// Types
// --------------------------------------------------

type ItemWithMeta = ProductLike & {
  priceValue: number;
  category?: string;
  condition?: string;
  brand?: string;
  material?: string;
  size?: string;
  color?: string;
};

type DesignersPageProps = {
  items: ItemWithMeta[];
  designerOptions: string[];
};

// --------------------------------------------------
// Filter options (aligned with Bulk Simple)
// --------------------------------------------------

const CATEGORY_OPTIONS = [
  "Women",
  "Men",
  "Bags",
  "Shoes",
  "Accessories",
  "Jewelry",
  "Watches",
];

const CONDITION_OPTIONS = [
  "New with tags",
  "New (never used)",
  "Excellent",
  "Very good",
  "Good",
  "Fair",
];

const MATERIAL_OPTIONS = [
  "Leather",
  "Exotic Leather",
  "Silk",
  "Cashmere",
  "Wool",
  "Linen",
  "Cotton",
  "Cotton Blend",
  "Denim",
  "Velvet",
  "Suede",
  "Canvas",
  "Metal",
  "Gold",
  "Silver",
  "Plated Metal",
  "Ceramic",
  "Crystal",
  "Resin",
  "Synthetic",
  "Other",
];

// --------------------------------------------------
// Helpers
// --------------------------------------------------

function parsePrice(price?: string | null): number {
  if (!price) return 0;
  const cleaned = price.replace(/[^0-9.,]/g, "").replace(/,/g, "");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

function normalize(raw: string | undefined | null): string {
  if (!raw) return "";
  return raw
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

// --------------------------------------------------
// Component
// --------------------------------------------------

const DesignersPage: NextPage<DesignersPageProps> = ({
  items,
  designerOptions,
}) => {
  const router = useRouter();

  const baseItems: ItemWithMeta[] = (items || []).map((it: any) => ({
    ...it,
    priceValue: parsePrice(it.price),
    category: it.category || "",
    condition: it.condition || "",
    brand: it.brand || "",
    material: it.material || "",
    size: it.size || "",
    color: it.color || "",
  }));

  // ✅ Compact dropdown-style filters
  const [titleQuery, setTitleQuery] = useState("");
  const [category, setCategory] = useState("");
  const [designer, setDesigner] = useState("");
  const [condition, setCondition] = useState("");
  const [material, setMaterial] = useState("");
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  const [minPrice, setMinPrice] = useState<number | "">(0);
  const [maxPrice, setMaxPrice] = useState<number | "">(100000);
  const [sortBy, setSortBy] = useState<"newest" | "price-asc" | "price-desc">(
    "newest"
  );

  const resetFilters = () => {
    setTitleQuery("");
    setCategory("");
    setDesigner("");
    setCondition("");
    setMaterial("");
    setSize("");
    setColor("");
    setMinPrice(0);
    setMaxPrice(100000);
  };

  const applyFiltersToUrl = () => {
    const query: Record<string, string> = {};

    if (titleQuery.trim()) query.title = titleQuery.trim();
    if (category) query.category = category;
    if (designer) query.designer = designer;
    if (condition) query.condition = condition;
    if (material.trim()) query.material = material.trim();
    if (size.trim()) query.size = size.trim();
    if (color.trim()) query.color = color.trim();
    if (typeof minPrice === "number") query.minPrice = String(minPrice);
    if (typeof maxPrice === "number") query.maxPrice = String(maxPrice);

    router.replace({ pathname: "/designers", query }, undefined, {
      shallow: true,
    });
  };

  const filteredItems = useMemo(() => {
    let result = [...baseItems];

    const tq = normalize(titleQuery);
    const cat = normalize(category);
    const des = normalize(designer);
    const cond = normalize(condition);
    const mat = normalize(material);
    const sz = normalize(size);
    const col = normalize(color);

    if (tq) {
      result = result.filter((i) => normalize(i.title).includes(tq));
    }
    if (cat) {
      result = result.filter((i) => normalize(i.category).includes(cat));
    }
    if (des) {
      result = result.filter((i) => normalize(i.brand).includes(des));
    }
    if (cond) {
      result = result.filter((i) => normalize(i.condition) === cond);
    }
    if (mat) {
      result = result.filter((i) => normalize(i.material).includes(mat));
    }
    if (sz) {
      result = result.filter((i) => normalize(i.size).includes(sz));
    }
    if (col) {
      result = result.filter((i) => normalize(i.color).includes(col));
    }

    // PRICE FILTER
    result = result.filter((item) => {
      const p = item.priceValue;
      if (typeof minPrice === "number" && p < minPrice) return false;
      if (typeof maxPrice === "number" && p > maxPrice) return false;
      return true;
    });

    // SORT
    if (sortBy === "price-asc") {
      result.sort((a, b) => a.priceValue - b.priceValue);
    } else if (sortBy === "price-desc") {
      result.sort((a, b) => b.priceValue - a.priceValue);
    }

    return result;
  }, [
    baseItems,
    titleQuery,
    category,
    designer,
    condition,
    material,
    size,
    color,
    minPrice,
    maxPrice,
    sortBy,
  ]);

  const resultsCount = filteredItems.length;

  return (
    <div className="designers-page">
      <Head>
        <title>Designers – All Products | Famous Finds</title>
      </Head>

      <Header />

      <main className="page-main">
        <div className="page-inner">
          <div className="breadcrumb">
            <Link href="/">Home</Link>
            <span>/</span>
            <span>Designers</span>
          </div>

          <div className="layout">
            <ListingFilters
              titleQuery={titleQuery}
              category={category}
              designer={designer}
              material={material}
              condition={condition}
              size={size}
              color={color}
              minPrice={minPrice}
              maxPrice={maxPrice}
              sortBy={sortBy}
              setTitleQuery={setTitleQuery}
              setCategory={setCategory}
              setDesigner={setDesigner}
              setMaterial={setMaterial}
              setCondition={setCondition}
              setSize={setSize}
              setColor={setColor}
              setMinPrice={setMinPrice}
              setMaxPrice={setMaxPrice}
              setSortBy={setSortBy}
              categoryOptions={CATEGORY_OPTIONS}
              designerOptions={designerOptions || []}
              conditionOptions={CONDITION_OPTIONS}
              materialOptions={MATERIAL_OPTIONS}
              onReset={resetFilters}
              onApply={applyFiltersToUrl}
              showApplyButton={true}
            />

            <section className="results">
              <div className="results-header">
                <div>
                  <h1>All Products</h1>
                  <p className="results-count">
                    {resultsCount} {resultsCount === 1 ? "result" : "results"}
                  </p>
                </div>

                <div className="sort">
                  <label>
                    Sort
                    <select
                      value={sortBy}
                      onChange={(e) =>
                        setSortBy(
                          e.target.value as
                            | "newest"
                            | "price-asc"
                            | "price-desc"
                        )
                      }
                    >
                      <option value="newest">Newest</option>
                      <option value="price-asc">Price: Low to High</option>
                      <option value="price-desc">Price: High to Low</option>
                    </select>
                  </label>
                </div>
              </div>

              {resultsCount === 0 ? (
                <div className="empty-state">
                  <h2>No items match these filters yet.</h2>
                  <p>Try adjusting your filters or checking back soon.</p>
                </div>
              ) : (
                <div className="grid">
                  {filteredItems.map((item) => (
                    <ProductCard key={item.id} {...item} />
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </main>

      <Footer />

      <style jsx>{`
        .designers-page {
          background: #ffffff;
          color: #111827;
          min-height: 100vh;
        }
        .page-main {
          padding: 24px 0 64px;
        }
        .page-inner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 16px;
        }
        .breadcrumb {
          font-size: 13px;
          color: #6b7280;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .breadcrumb a {
          color: inherit;
          text-decoration: none;
        }
        .layout {
          display: grid;
          grid-template-columns: 260px minmax(0, 1fr);
          gap: 24px;
        }
        @media (max-width: 900px) {
          .layout {
            grid-template-columns: 1fr;
          }
        }
        .results-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 12px;
          margin-bottom: 18px;
        }
        h1 {
          font-family: "Georgia", serif;
          font-size: 28px;
          margin: 0;
        }
        .results-count {
          margin: 6px 0 0;
          font-size: 13px;
          color: #6b7280;
        }
        .sort label {
          display: flex;
          flex-direction: column;
          gap: 6px;
          font-size: 12px;
          color: #374151;
        }
        .sort select {
          border-radius: 12px;
          border: 1px solid #d1d5db;
          padding: 10px 12px;
          font-size: 13px;
          background: #ffffff;
        }
        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 18px;
        }
        .empty-state {
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          padding: 24px;
          background: #fafafa;
        }
        .empty-state h2 {
          margin: 0 0 6px;
          font-family: "Georgia", serif;
        }
        .empty-state p {
          margin: 0;
          color: #6b7280;
        }
      `}</style>
    </div>
  );
};

export default DesignersPage;

export const getServerSideProps: GetServerSideProps<DesignersPageProps> =
  async () => {
    try {
      // ✅ Use getPublicListings for consistent data loading (same as category pages)
      // This ensures proper status filtering, category normalization, and image extraction
      const listings = await getPublicListings({ take: 500 });

      const items: ItemWithMeta[] = listings.map((l) => {
        const priceNum = typeof l.price === "number" ? l.price : 0;
        const price = priceNum ? `US$${priceNum.toLocaleString("en-US")}` : "";

        return {
          id: l.id,
          title: l.title || "",
          brand: l.brand || "",
          category: l.category || "",
          condition: l.condition || "",
          material: "", // publicListings doesn't extract material yet
          size: "",
          color: "",
          price,
          image: Array.isArray(l.images) && l.images[0] ? l.images[0] : "",
          href: `/product/${l.id}`,
          priceValue: priceNum,
        };
      });

      // designers list (source of truth = designers collection)
      let designerOptions: string[] = [];
      try {
        const ds = await adminDb.collection("designers").get();
        designerOptions = ds.docs
          .map((x) => {
            const data = x.data() as any;
            const name = String(data?.name ?? x.id).trim();
            const active = data?.active !== false;
            return active ? name : "";
          })
          .filter(Boolean)
          .sort((a, b) => a.localeCompare(b));
      } catch {
        // fallback: unique brands from items
        designerOptions = Array.from(
          new Set(items.map((i) => (i.brand || "").trim()).filter(Boolean))
        ).sort((a, b) => a.localeCompare(b));
      }

      return { props: { items, designerOptions } };
    } catch (err) {
      console.error("Error loading designers listings", err);
      return { props: { items: [], designerOptions: [] } };
    }
  };
