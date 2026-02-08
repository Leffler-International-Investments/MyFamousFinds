// FILE: /pages/index.tsx

import Head from "next/head";
import Link from "next/link";
import type { GetServerSideProps, NextPage } from "next";
import { useMemo, useState } from "react";

import Header from "../components/Header";
import Footer from "../components/Footer";
import HomepageButler from "../components/HomepageButler";
import ProductCard, { ProductLike } from "../components/ProductCard";
import { adminDb } from "../utils/firebaseAdmin";

// --------------------------------------------------
// Types
// --------------------------------------------------

type BuyerMessage = {
  id: string;
  text: string;
  linkText?: string;
  linkUrl?: string;
  imageUrl?: string;
  videoUrl?: string;
  type: "info" | "promo" | "alert";
  active?: boolean;
  createdAt?: number;
};

type HomeProps = {
  trending: ProductLike[];
  newArrivals: ProductLike[];
  activeMessages: BuyerMessage[];
  designerOptions: string[];
};

const CATEGORY_OPTIONS = ["Women", "Men", "Bags", "Shoes", "Accessories", "Jewelry", "Watches"];

const CONDITION_OPTIONS = ["New with tags", "New (never used)", "Excellent", "Very good", "Good", "Fair"];

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

function normalize(raw: any): string {
  if (!raw) return "";
  return String(raw).toString().trim().toLowerCase();
}

function parseNum(v: any): number {
  if (typeof v === "number") return v;
  const n = Number(String(v || "").replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

const HomePage: NextPage<HomeProps> = ({ trending, newArrivals, designerOptions: serverDesignerOptions }) => {
  // Same filter UX as /pages/designers/index.tsx
  const [titleQuery, setTitleQuery] = useState("");
  const [category, setCategory] = useState("");
  const [designer, setDesigner] = useState("");
  const [condition, setCondition] = useState("");
  const [material, setMaterial] = useState("");
  const [materialCustom, setMaterialCustom] = useState(false); // ✅ FIX: datalist fails on mobile, so use select + optional custom input
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  const [minPrice, setMinPrice] = useState<number | "">(0);
  const [maxPrice, setMaxPrice] = useState<number | "">(100000);
  const [sortBy, setSortBy] = useState<"newest" | "price-asc" | "price-desc">("newest");

  const resetFilters = () => {
    setTitleQuery("");
    setCategory("");
    setDesigner("");
    setCondition("");
    setMaterial("");
    setMaterialCustom(false);
    setSize("");
    setColor("");
    setMinPrice(0);
    setMaxPrice(100000);
    setSortBy("newest");
  };

  // Combined pool (newArrivals + trending) used for homepage browsing
  const poolItems = useMemo(() => {
    const combined = [...(newArrivals || []), ...(trending || [])];

    const seen = new Set<string>();
    const uniq: any[] = [];
    for (const p of combined) {
      const id = String((p as any).id || "");
      if (!id || seen.has(id)) continue;
      seen.add(id);
      uniq.push(p);
    }
    return uniq.slice(0, 120);
  }, [newArrivals, trending]);

  const designerOptions = useMemo(() => {
    if (Array.isArray(serverDesignerOptions) && serverDesignerOptions.length > 0) {
      return serverDesignerOptions;
    }
    return Array.from(new Set(poolItems.map((x: any) => String(x.brand || "").trim()).filter(Boolean))).sort((a, b) =>
      a.localeCompare(b)
    );
  }, [poolItems, serverDesignerOptions]);

  const filteredItems = useMemo(() => {
    let result = [...(poolItems as any[])];

    const tq = normalize(titleQuery);
    const cat = normalize(category);
    const des = normalize(designer);
    const cond = normalize(condition);
    const mat = normalize(material);
    const sz = normalize(size);
    const col = normalize(color);

    if (tq) result = result.filter((x) => normalize(x.title).includes(tq));
    if (cat) result = result.filter((x) => normalize(x.category).includes(cat));
    if (des) result = result.filter((x) => normalize(x.brand).includes(des));
    if (cond) result = result.filter((x) => normalize(x.condition) === cond);

    if (mat) result = result.filter((x: any) => normalize(x.material).includes(mat));
    if (sz) result = result.filter((x: any) => normalize(x.size).includes(sz));
    if (col) result = result.filter((x: any) => normalize(x.color).includes(col));

    result = result.filter((x: any) => {
      const pv = parseNum(x.priceValue ?? x.price);
      const min = typeof minPrice === "number" ? minPrice : 0;
      const max = typeof maxPrice === "number" ? maxPrice : 999999999;
      return pv >= min && pv <= max;
    });

    if (sortBy === "price-asc")
      result.sort((a: any, b: any) => parseNum(a.priceValue ?? a.price) - parseNum(b.priceValue ?? b.price));
    if (sortBy === "price-desc")
      result.sort((a: any, b: any) => parseNum(b.priceValue ?? b.price) - parseNum(a.priceValue ?? a.price));
    if (sortBy === "newest") result.sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0));

    return result.slice(0, 24);
  }, [poolItems, titleQuery, category, designer, condition, material, size, color, minPrice, maxPrice, sortBy]);

  return (
    <div className="home-wrapper">
      <Head>
        <title>Famous Finds — Shop authenticated designer pieces</title>
        <meta
          name="description"
          content="Discover curated, authenticated pre-loved designer bags, jewelry, watches and ready-to-wear from trusted sellers."
        />
      </Head>

      <Header />

      <main className="wrap">
        {/* HERO */}
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">Curated pre-loved luxury</p>
            <h1>Discover, save &amp; shop authenticated designer pieces.</h1>
            <p className="hero-sub">
              Browse a hand-picked selection of bags, jewelry, watches and ready-to-wear from trusted sellers. Every piece is
              vetted so you can shop with confidence.
            </p>
          </div>
        </section>

        {/* FILTER + RESULTS (LEFT SIDEBAR ALWAYS ON HOMEPAGE) */}
        <section className="home-section">
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
                  <select className="select" value={category} onChange={(e) => setCategory(e.target.value)}>
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
                  <select className="select" value={designer} onChange={(e) => setDesigner(e.target.value)}>
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
                  {/* ✅ FIX: mobile-safe material picker (no datalist) */}
                  <select
                    className="select"
                    value={materialCustom ? "__custom" : material}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v === "__custom") {
                        setMaterialCustom(true);
                        setMaterial("");
                        return;
                      }
                      setMaterialCustom(false);
                      setMaterial(v);
                    }}
                  >
                    <option value="">Any</option>
                    {MATERIAL_OPTIONS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                    <option value="__custom">Other (type)</option>
                  </select>

                  {materialCustom ? (
                    <input
                      className="text-input mt10"
                      placeholder="Type material..."
                      value={material}
                      onChange={(e) => setMaterial(e.target.value)}
                    />
                  ) : null}
                </div>
              </details>

              <details className="filter-block">
                <summary>Condition</summary>
                <div className="filter-body">
                  <select className="select" value={condition} onChange={(e) => setCondition(e.target.value)}>
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
                    placeholder="e.g. 38 / M / One Size..."
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
                    placeholder="e.g. Black / Brown / Gold..."
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                  />
                </div>
              </details>

              <details className="filter-block">
                <summary>Price Range (USD)</summary>
                <div className="filter-body">
                  <div className="price-row">
                    <div>
                      <label className="small-label">Min</label>
                      <input
                        className="text-input"
                        type="number"
                        value={minPrice}
                        onChange={(e) => setMinPrice(e.target.value === "" ? "" : Number(e.target.value) || 0)}
                      />
                    </div>
                    <div>
                      <label className="small-label">Max</label>
                      <input
                        className="text-input"
                        type="number"
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(e.target.value === "" ? "" : Number(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                </div>
              </details>

              <details className="filter-block">
                <summary>Sort</summary>
                <div className="filter-body">
                  <select className="select" value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}>
                    <option value="newest">Newest</option>
                    <option value="price-asc">Price: Low to High</option>
                    <option value="price-desc">Price: High to Low</option>
                  </select>
                </div>
              </details>
            </aside>

            <div className="results">
              <div className="results-header">
                <h2>Browse Listings</h2>
                <Link href="/catalogue" className="open-link">
                  Open full catalogue
                </Link>
              </div>

              <div className="grid">
                {(filteredItems || []).map((p: any) => (
                  <ProductCard key={String(p.id)} product={p as any} />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Butler */}
        <HomepageButler />
      </main>

      <Footer />

      <style jsx>{`
        .home-wrapper {
          background: #fff;
        }
        .wrap {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 18px 60px;
        }
        .hero {
          padding: 40px 0 18px;
          border-bottom: 1px solid #eef2f7;
        }
        .eyebrow {
          letter-spacing: 0.12em;
          text-transform: uppercase;
          font-size: 12px;
          color: #6b7280;
          margin: 0 0 10px;
        }
        h1 {
          font-size: 44px;
          line-height: 1.1;
          margin: 0 0 12px;
          color: #0f172a;
        }
        .hero-sub {
          max-width: 760px;
          color: #475569;
          margin: 0;
          font-size: 15px;
          line-height: 1.6;
        }

        .home-section {
          padding-top: 22px;
        }

        .layout {
          display: grid;
          grid-template-columns: 320px 1fr;
          gap: 18px;
          align-items: start;
        }

        .filters {
          position: sticky;
          top: 16px;
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          padding: 14px;
          background: #fff;
        }

        .filters-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 10px;
          padding-bottom: 10px;
          border-bottom: 1px solid #eef2f7;
        }

        .filters-header h2 {
          margin: 0;
          font-size: 14px;
        }

        .filters-header button {
          border: 0;
          background: transparent;
          font-size: 12px;
          cursor: pointer;
          text-decoration: underline;
        }

        .filter-block {
          border: 1px solid #eef2f7;
          border-radius: 12px;
          padding: 10px 12px;
          margin-bottom: 10px;
        }

        summary {
          cursor: pointer;
          font-weight: 600;
          font-size: 13px;
          color: #111827;
          list-style: none;
        }

        summary::-webkit-details-marker {
          display: none;
        }

        .filter-body {
          margin-top: 10px;
        }

        .text-input,
        .select {
          width: 100%;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 10px 12px;
          font-size: 14px;
          outline: none;
          background: #fff;
        }

        .mt10 {
          margin-top: 10px;
        }

        .small-label {
          display: block;
          font-size: 12px;
          color: #6b7280;
          margin-bottom: 6px;
        }

        .price-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        .results {
          min-width: 0;
        }

        .results-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin: 10px 0 14px;
        }

        .results-header h2 {
          margin: 0;
          font-size: 16px;
          color: #111827;
        }

        .open-link {
          font-size: 13px;
          text-decoration: underline;
          color: #111827;
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
        }

        @media (max-width: 980px) {
          .layout {
            grid-template-columns: 1fr;
          }
          .filters {
            position: relative;
            top: auto;
          }
          .grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 520px) {
          h1 {
            font-size: 34px;
          }
          .grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export const getServerSideProps: GetServerSideProps<HomeProps> = async () => {
  // NOTE: keep your existing data logic; this file version expects these props to be provided as before.
  // If your current repo already has a working getServerSideProps, keep it.
  // (This stub is only here because the uploaded file was truncated in the chat context.)

  // Try to preserve existing behavior if collections are present.
  const empty: HomeProps = { trending: [], newArrivals: [], activeMessages: [], designerOptions: [] };

  try {
    // If your project uses these collections, keep them. Otherwise return empty.
    // We can’t safely guess your exact Firestore schema without the rest of your repo here.
    return { props: empty };
  } catch (e) {
    return { props: empty };
  }
};

export default HomePage;
