// FILE: /pages/designers/index.tsx

import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useMemo, useState } from "react";
import type { GetServerSideProps, NextPage } from "next";

import Header from "../../components/Header";
import Footer from "../../components/Footer";
import ProductCard, { ProductLike } from "../../components/ProductCard";
import { adminDb } from "../../utils/firebaseAdmin";

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
  "Kids",
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
            <aside className="filters">
              <div className="filters-header">
                <h2>Filters</h2>
                <button type="button" onClick={resetFilters}>
                  Clear All
                </button>
              </div>

              <details className="filter-block" open>
                <summary>Title</summary>
                <div className="filter-body">
                  <input
                    className="text-input"
                    placeholder="Search title..."
                    value={titleQuery}
                    onChange={(e) => setTitleQuery(e.target.value)}
                  />
                </div>
              </details>

              <details className="filter-block">
                <summary>Category</summary>
                <div className="filter-body">
                  <select
                    className="select"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option value="">Any</option>
                    {CATEGORY_OPTIONS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </details>

              <details className="filter-block">
                <summary>Designer</summary>
                <div className="filter-body">
                  <select
                    className="select"
                    value={designer}
                    onChange={(e) => setDesigner(e.target.value)}
                  >
                    <option value="">Any</option>
                    {(designerOptions || []).map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </details>

              <details className="filter-block">
                <summary>Material</summary>
                <div className="filter-body">
                  <input
                    className="text-input"
                    list="materials-list"
                    placeholder="Select or type material..."
                    value={material}
                    onChange={(e) => setMaterial(e.target.value)}
                  />
                  <datalist id="materials-list">
                    {MATERIAL_OPTIONS.map((m) => (
                      <option key={m} value={m} />
                    ))}
                  </datalist>
                </div>
              </details>

              <details className="filter-block">
                <summary>Condition</summary>
                <div className="filter-body">
                  <select
                    className="select"
                    value={condition}
                    onChange={(e) => setCondition(e.target.value)}
                  >
                    <option value="">Any</option>
                    {CONDITION_OPTIONS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </details>

              <details className="filter-block">
                <summary>Size</summary>
                <div className="filter-body">
                  <input
                    className="text-input"
                    placeholder="Type size..."
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
                  />
                </div>
              </details>

              <details className="filter-block">
                <summary>Color</summary>
                <div className="filter-body">
                  <input
                    className="text-input"
                    placeholder="Type color..."
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                  />
                </div>
              </details>

              <details className="filter-block">
                <summary>Price</summary>
                <div className="filter-body">
                  <div className="price-row">
                    <div className="price-input">
                      <span>Min</span>
                      <input
                        type="number"
                        value={minPrice}
                        onChange={(e) =>
                          setMinPrice(
                            e.target.value === ""
                              ? ""
                              : Number(e.target.value) || 0
                          )
                        }
                      />
                    </div>

                    <div className="price-input">
                      <span>Max</span>
                      <input
                        type="number"
                        value={maxPrice}
                        onChange={(e) =>
                          setMaxPrice(
                            e.target.value === ""
                              ? ""
                              : Number(e.target.value) || 0
                          )
                        }
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    className="apply-btn"
                    onClick={applyFiltersToUrl}
                  >
                    Apply Filters
                  </button>
                </div>
              </details>
            </aside>

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
        .filters {
          border-radius: 16px;
          border: 1px solid #e5e7eb;
          padding: 16px 18px 20px;
          background: #fafafa;
        }
        .filters-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }
        .filters-header h2 {
          font-size: 18px;
          font-weight: 600;
        }
        .filters-header button {
          border: none;
          background: none;
          font-size: 13px;
          text-decoration: underline;
          cursor: pointer;
          color: #6b7280;
        }
        .filter-block {
          border-top: 1px solid #e5e7eb;
          padding-top: 10px;
          margin-top: 10px;
        }
        .filter-block summary {
          cursor: pointer;
          font-weight: 600;
          font-size: 13px;
          color: #111827;
          list-style: none;
        }
        .filter-block summary::-webkit-details-marker {
          display: none;
        }
        .filter-body {
          margin-top: 10px;
        }
        .text-input,
        .select {
          width: 100%;
          border-radius: 12px;
          border: 1px solid #d1d5db;
          background: #ffffff;
          color: #111827;
          padding: 10px 12px;
          font-size: 13px;
        }
        .price-row {
          display: grid;
          grid-template-columns: 1fr;
          gap: 10px;
        }
        .price-input span {
          display: block;
          font-size: 12px;
          color: #6b7280;
          margin-bottom: 6px;
        }
        .price-input input {
          width: 100%;
          border-radius: 12px;
          border: 1px solid #d1d5db;
          padding: 10px 12px;
          font-size: 13px;
          background: #ffffff;
        }
        .apply-btn {
          width: 100%;
          margin-top: 12px;
          border-radius: 999px;
          padding: 10px 12px;
          font-size: 13px;
          font-weight: 700;
          border: 1px solid #111827;
          background: #111827;
          color: #ffffff;
          cursor: pointer;
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
    // ✅ Safety Guard
    if (!adminDb) {
      return { props: { items: [], designerOptions: [] } };
    }

    try {
      const snapshot = await adminDb
        .collection("listings")
        .limit(500)
        .get();

      const items: ItemWithMeta[] = [];
      snapshot.docs.forEach((doc) => {
        const d: any = doc.data() || {};

        // Filter by status (case-insensitive, matching homepage)
        const status = String(d.status || "").trim().toLowerCase();
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
          d.isSold === true ||
          d.sold === true ||
          status === "sold" ||
          status === "inactive_sold";
        if (isSold) return;

        const brandRaw = d.brand || d.designer || d.designerName || d.brandName || "";
        const categoryRaw = d.category || d.categoryLabel || d.categoryName || "";
        const conditionRaw = d.condition || d.conditionLabel || d.itemCondition || d.conditionText || "";
        const materialRaw = d.material || d.fabric || d.fabrication || d.materialName || "";
        const sizeRaw = d.size || d.itemSize || "";
        const colorRaw = d.color || d.colour || "";
        const priceNum = typeof d.price === "number" ? d.price : Number(d.price || 0);
        const price = priceNum ? `US$${priceNum.toLocaleString("en-US")}` : "";

        items.push({
          id: doc.id,
          title: d.title || "",
          brand: brandRaw,
          category: categoryRaw,
          condition: conditionRaw,
          material: materialRaw,
          size: sizeRaw,
          color: colorRaw,
          price,
          image: pickImage(d),
          href: `/product/${doc.id}`,
          priceValue: priceNum || 0,
        });
      });

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
