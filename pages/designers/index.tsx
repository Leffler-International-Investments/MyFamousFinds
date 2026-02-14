// FILE: /pages/designers/index.tsx

import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import React, { useEffect, useMemo, useState } from "react";
import type { GetServerSideProps, NextPage } from "next";

import Header from "../../components/Header";
import Footer from "../../components/Footer";
import ProductCard, { ProductLike } from "../../components/ProductCard";
import { adminDb } from "../../utils/firebaseAdmin";
import { queryToFilters, type SortValue } from "../../lib/filterConstants";

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

type DesignerEntry = {
  name: string;
  slug: string;
  designerCategory?: "top" | "trending" | "emerging" | "";
};

type DesignersPageProps = {
  items: ItemWithMeta[];
  designerOptions: string[];
  topDesigners: DesignerEntry[];
  trendingDesigners: DesignerEntry[];
  emergingBrands: DesignerEntry[];
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

const COLOR_OPTIONS = [
  "Black", "White", "Cream", "Beige", "Brown", "Tan", "Burgundy", "Red",
  "Pink", "Orange", "Yellow", "Green", "Blue", "Navy", "Purple", "Grey",
  "Silver", "Gold", "Multi",
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

function slugify(input: string) {
  return input
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
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
// Designer Section Component
// --------------------------------------------------

function DesignerSection({
  title,
  designers,
  onSelect,
}: {
  title: string;
  designers: DesignerEntry[];
  onSelect: (name: string) => void;
}) {
  if (!designers.length) return null;
  return (
    <div className="designer-section">
      <h3 className="designer-section-title">{title}</h3>
      <div className="designer-chips">
        {designers.map((d) => (
          <button
            key={d.slug}
            type="button"
            className="designer-chip"
            onClick={() => onSelect(d.name)}
          >
            {d.name}
          </button>
        ))}
      </div>
      <style jsx>{`
        .designer-section {
          margin-bottom: 24px;
        }
        .designer-section-title {
          font-size: 16px;
          font-weight: 700;
          color: #111827;
          margin: 0 0 12px;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          border-bottom: 2px solid #111827;
          padding-bottom: 6px;
          display: inline-block;
        }
        .designer-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .designer-chip {
          border: 1px solid #d1d5db;
          background: #ffffff;
          color: #111827;
          padding: 8px 16px;
          border-radius: 999px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s ease;
          white-space: nowrap;
        }
        .designer-chip:hover {
          background: #111827;
          color: #ffffff;
          border-color: #111827;
        }
      `}</style>
    </div>
  );
}

// --------------------------------------------------
// Component
// --------------------------------------------------

const DesignersPage: NextPage<DesignersPageProps> = ({
  items,
  designerOptions,
  topDesigners,
  trendingDesigners,
  emergingBrands,
}) => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"designers" | "products">(
    "designers"
  );

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

  // Compact dropdown-style filters
  const [titleQuery, setTitleQuery] = useState("");
  const [category, setCategory] = useState("");
  const [designer, setDesigner] = useState("");
  const [condition, setCondition] = useState("");
  const [material, setMaterial] = useState("");
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  const [minPrice, setMinPrice] = useState<number | "">(0);
  const [maxPrice, setMaxPrice] = useState<number | "">(100000);
  const [sortBy, setSortBy] = useState<SortValue>("newest");
  const [showFilters, setShowFilters] = useState(false);

  // Initialize filters from URL query params on mount (for cross-page sync)
  useEffect(() => {
    if (!router.isReady) return;
    const parsed = queryToFilters(router.query);
    if (parsed.titleQuery) setTitleQuery(parsed.titleQuery);
    if (parsed.category) setCategory(parsed.category);
    if (parsed.designer) { setDesigner(parsed.designer); setActiveTab("products"); }
    if (parsed.condition) setCondition(parsed.condition);
    if (parsed.material) setMaterial(parsed.material);
    if (parsed.size) setSize(parsed.size);
    if (parsed.color) setColor(parsed.color);
    if (typeof parsed.minPrice === "number") setMinPrice(parsed.minPrice);
    if (typeof parsed.maxPrice === "number") setMaxPrice(parsed.maxPrice);
    if (parsed.sortBy) setSortBy(parsed.sortBy);
    if (Object.keys(parsed).length > 0) { setShowFilters(true); setActiveTab("products"); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady]);

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

  const handleDesignerSelect = (name: string) => {
    setDesigner(name);
    setActiveTab("products");
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

  const fSty: Record<string, React.CSSProperties> = {
    wrap: { display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" },
    input: { border: "1px solid #e5e7eb", borderRadius: "12px", padding: "8px 12px", fontSize: "13px", outline: "none", background: "#fff", minWidth: "140px", flex: "1 1 140px" },
    select: { border: "1px solid #e5e7eb", borderRadius: "12px", padding: "8px 12px", fontSize: "13px", outline: "none", background: "#fff", minWidth: "120px" },
    clear: { border: "1px solid #cbd5e1", background: "#fff", color: "#0f172a", borderRadius: "999px", padding: "8px 14px", fontWeight: 700, fontSize: "12px", cursor: "pointer", whiteSpace: "nowrap" },
  };

  const filterPanel = (
    <div style={fSty.wrap}>
      <input style={fSty.input} placeholder="Search by title..." value={titleQuery} onChange={(e) => setTitleQuery(e.target.value)} />
      <select style={fSty.select} value={category} onChange={(e) => setCategory(e.target.value)}>
        <option value="">All Categories</option>
        {CATEGORY_OPTIONS.map((o) => (<option key={o} value={o}>{o}</option>))}
      </select>
      <select style={fSty.select} value={designer} onChange={(e) => setDesigner(e.target.value)}>
        <option value="">All Designers</option>
        {(designerOptions || []).map((o) => (<option key={o} value={o}>{o}</option>))}
      </select>
      <select style={fSty.select} value={condition} onChange={(e) => setCondition(e.target.value)}>
        <option value="">Condition</option>
        {CONDITION_OPTIONS.map((o) => (<option key={o} value={o}>{o}</option>))}
      </select>
      <select style={fSty.select} value={material} onChange={(e) => setMaterial(e.target.value)}>
        <option value="">Material</option>
        {MATERIAL_OPTIONS.map((o) => (<option key={o} value={o}>{o}</option>))}
      </select>
      <select style={fSty.select} value={color} onChange={(e) => setColor(e.target.value)}>
        <option value="">Color</option>
        {COLOR_OPTIONS.map((c) => (<option key={c} value={c}>{c}</option>))}
      </select>
      <select style={fSty.select} value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}>
        <option value="newest">Newest</option>
        <option value="price-asc">Price: Low to High</option>
        <option value="price-desc">Price: High to Low</option>
      </select>
      <button style={fSty.clear} type="button" onClick={resetFilters}>Clear All</button>
    </div>
  );

  return (
    <div className="designers-page">
      <Head>
        <title>Designers – All Products | Famous Finds</title>
      </Head>

      <Header
        showFilter={showFilters}
        onToggleFilter={() => setShowFilters(!showFilters)}
        filterContent={filterPanel}
      />

      <main className="page-main">
        <div className="page-inner">
          <div className="breadcrumb">
            <Link href="/">Home</Link>
            <span>/</span>
            <span>Designers</span>
          </div>

          {/* Tab Toggle */}
          <div className="tab-bar">
            <button
              type="button"
              className={`tab-btn${activeTab === "designers" ? " tab-btn--active" : ""}`}
              onClick={() => setActiveTab("designers")}
            >
              Designers
            </button>
            <button
              type="button"
              className={`tab-btn${activeTab === "products" ? " tab-btn--active" : ""}`}
              onClick={() => setActiveTab("products")}
            >
              All Products
            </button>
          </div>

          {/* DESIGNERS TAB */}
          {activeTab === "designers" && (
            <section className="designers-directory">
              <DesignerSection
                title="Top Designers"
                designers={topDesigners}
                onSelect={handleDesignerSelect}
              />
              <DesignerSection
                title="Trending Designers"
                designers={trendingDesigners}
                onSelect={handleDesignerSelect}
              />
              <DesignerSection
                title="Emerging Brands"
                designers={emergingBrands}
                onSelect={handleDesignerSelect}
              />

              {/* All Designers A-Z */}
              <div className="all-designers">
                <h3 className="all-designers-title">All Designers</h3>
                <div className="designer-chips-all">
                  {(designerOptions || []).map((d) => (
                    <button
                      key={d}
                      type="button"
                      className="designer-chip-small"
                      onClick={() => handleDesignerSelect(d)}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* PRODUCTS TAB */}
          {activeTab === "products" && (
            <div className="layout">
              <section className="results">
                <div className="results-header">
                  <div>
                    <h1>
                      {designer ? `${designer}` : "All Products"}
                    </h1>
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
          )}
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

        /* Tab Bar */
        .tab-bar {
          display: flex;
          gap: 0;
          margin-bottom: 24px;
          border-bottom: 2px solid #e5e7eb;
        }
        .tab-btn {
          padding: 10px 24px;
          font-size: 14px;
          font-weight: 600;
          color: #6b7280;
          background: none;
          border: none;
          border-bottom: 2px solid transparent;
          margin-bottom: -2px;
          cursor: pointer;
          transition: all 0.15s;
        }
        .tab-btn:hover {
          color: #111827;
        }
        .tab-btn--active {
          color: #111827;
          border-bottom-color: #111827;
        }

        /* Designers Directory */
        .designers-directory {
          padding: 8px 0;
        }
        .all-designers {
          margin-top: 32px;
          padding-top: 24px;
          border-top: 1px solid #e5e7eb;
        }
        .all-designers-title {
          font-size: 16px;
          font-weight: 700;
          color: #111827;
          margin: 0 0 12px;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }
        .designer-chips-all {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        .designer-chip-small {
          border: 1px solid #e5e7eb;
          background: #fafafa;
          color: #374151;
          padding: 6px 12px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s ease;
          white-space: nowrap;
        }
        .designer-chip-small:hover {
          background: #111827;
          color: #ffffff;
          border-color: #111827;
        }

        /* Products Layout */
        .layout {
          display: grid;
          grid-template-columns: 1fr;
          gap: 24px;
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

        @media (max-width: 480px) {
          .grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
          }
        }
      `}</style>
    </div>
  );
};

export default DesignersPage;

export const getServerSideProps: GetServerSideProps<DesignersPageProps> =
  async () => {
    // Safety Guard
    if (!adminDb) {
      return {
        props: {
          items: [],
          designerOptions: [],
          topDesigners: [],
          trendingDesigners: [],
          emergingBrands: [],
        },
      };
    }

    try {
      const snapshot = await adminDb
        .collection("listings")
        .limit(500)
        .get();

      const items: ItemWithMeta[] = [];
      snapshot.docs.forEach((doc) => {
        const d: any = doc.data() || {};

        // Minimal filter: only skip if literally sold
        const isSold =
          d.isSold === true ||
          d.sold === true ||
          String(d.status || "").toLowerCase().includes("sold");
        if (isSold) return;

        const brandRaw =
          d.brand || d.designer || d.designerName || d.brandName || "";
        const categoryRaw =
          d.category || d.categoryLabel || d.categoryName || "";
        const conditionRaw =
          d.condition ||
          d.conditionLabel ||
          d.itemCondition ||
          d.conditionText ||
          "";
        const materialRaw =
          d.material || d.fabric || d.fabrication || d.materialName || "";
        const sizeRaw = d.size || d.itemSize || "";
        const colorRaw = d.color || d.colour || "";
        const priceNum =
          typeof d.price === "number" ? d.price : Number(d.price || 0);
        const price = priceNum
          ? `US$${priceNum.toLocaleString("en-US")}`
          : "";

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
      let topDesigners: DesignerEntry[] = [];
      let trendingDesigners: DesignerEntry[] = [];
      let emergingBrands: DesignerEntry[] = [];

      try {
        const ds = await adminDb.collection("designers").get();
        const allDesigners: DesignerEntry[] = ds.docs
          .map((x) => {
            const data = x.data() as any;
            const name = String(data?.name ?? x.id).trim();
            const active = data?.active !== false;
            if (!active || !name) return null;
            return {
              name,
              slug: data.slug || slugify(name),
              designerCategory: data.designerCategory || "",
            };
          })
          .filter(Boolean) as DesignerEntry[];

        designerOptions = allDesigners
          .map((d) => d.name)
          .sort((a, b) => a.localeCompare(b));

        topDesigners = allDesigners
          .filter((d) => d.designerCategory === "top")
          .sort((a, b) => a.name.localeCompare(b.name));
        trendingDesigners = allDesigners
          .filter((d) => d.designerCategory === "trending")
          .sort((a, b) => a.name.localeCompare(b.name));
        emergingBrands = allDesigners
          .filter((d) => d.designerCategory === "emerging")
          .sort((a, b) => a.name.localeCompare(b.name));
      } catch {
        designerOptions = Array.from(
          new Set(items.map((i) => (i.brand || "").trim()).filter(Boolean))
        ).sort((a, b) => a.localeCompare(b));
      }

      return {
        props: {
          items,
          designerOptions,
          topDesigners,
          trendingDesigners,
          emergingBrands,
        },
      };
    } catch (err) {
      console.error("Error loading designers listings", err);
      return {
        props: {
          items: [],
          designerOptions: [],
          topDesigners: [],
          trendingDesigners: [],
          emergingBrands: [],
        },
      };
    }
  };
