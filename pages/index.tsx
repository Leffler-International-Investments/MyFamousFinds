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

function normalize(raw: any): string {
  if (!raw) return "";
  return String(raw).toString().trim().toLowerCase();
}

function parseNum(v: any): number {
  if (typeof v === "number") return v;
  const n = Number(String(v || "").replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

const HomePage: NextPage<HomeProps> = ({
  trending,
  newArrivals,
  designerOptions: serverDesignerOptions,
}) => {
  // Same filter UX as /pages/designers/index.tsx
  const [titleQuery, setTitleQuery] = useState("");
  const [category, setCategory] = useState("");
  const [designer, setDesigner] = useState("");
  const [condition, setCondition] = useState("");
  const [material, setMaterial] = useState("");
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
    return Array.from(
      new Set(poolItems.map((x: any) => String(x.brand || "").trim()).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b));
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

    if (sortBy === "price-asc") result.sort((a: any, b: any) => parseNum(a.priceValue ?? a.price) - parseNum(b.priceValue ?? b.price));
    if (sortBy === "price-desc") result.sort((a: any, b: any) => parseNum(b.priceValue ?? b.price) - parseNum(a.priceValue ?? a.price));
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
        {/* HERO + SNAPSHOT */}
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">Curated pre-loved luxury</p>
            <h1>Discover, save &amp; shop authenticated designer pieces.</h1>
            <p className="hero-sub">
              Browse a hand-picked selection of bags, jewelry, watches and ready-to-wear from trusted sellers. Every piece is vetted so you can shop with confidence.
            </p>

          </div>

          {/* SNAPSHOT CARD */}
          <aside className="snapshot-card">
            <h2>Your Famous Finds Snapshot</h2>
            <p className="snapshot-view">Guest view</p>
            <div className="snapshot-row">
              <span>Saved Items</span>
              <span>0</span>
            </div>
            <div className="snapshot-row">
              <span>Recently Viewed</span>
              <span>0</span>
            </div>
            <div className="snapshot-row">
              <span>Active Offers</span>
              <span>0</span>
            </div>

            <Link
              href="/buyer/dashboard"
              className="block w-full bg-slate-900 text-white rounded-full py-3 text-center text-sm font-medium"
            >
              Sign in to view your dashboard
            </Link>

            <Link
              href="/buyer/signup"
              className="block w-full border border-gray-300 text-gray-700 rounded-full py-3 mt-3 text-center text-sm font-medium"
            >
              Create a free buyer account
            </Link>
          </aside>
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
                    placeholder="e.g. Black / Gold / Red..."
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                  />
                </div>
              </details>

              <details className="filter-block">
                <summary>Price Range (USD)</summary>
                <div className="filter-body price-row">
                  <input
                    className="text-input"
                    inputMode="numeric"
                    placeholder="Min"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value ? Number(e.target.value) : "")}
                  />
                  <input
                    className="text-input"
                    inputMode="numeric"
                    placeholder="Max"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value ? Number(e.target.value) : "")}
                  />
                </div>
              </details>

              <details className="filter-block">
                <summary>Sort</summary>
                <div className="filter-body">
                  <select className="select" value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}>
                    <option value="newest">Newest</option>
                    <option value="price-asc">Price: Low → High</option>
                    <option value="price-desc">Price: High → Low</option>
                  </select>
                </div>
              </details>
            </aside>

            <div className="results">
              <div className="results-head">
                <h2>Browse Listings</h2>
                <Link className="results-link" href="/designers">
                  Open full catalogue
                </Link>
              </div>

              {filteredItems.length === 0 ? (
                <div className="empty-state">
                  <h3>No items match these filters.</h3>
                  <button className="resetBtn" onClick={resetFilters}>
                    Reset filters
                  </button>
                </div>
              ) : (
                <div className="cards">
                  {filteredItems.map((p: any) => (
                    <ProductCard key={p.id} {...p} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

      </main>

      <HomepageButler />
      <Footer />

      <style jsx>{`
        .home-wrapper {
          background: #f7f7f5;
        }
        .wrap {
          max-width: 1200px;
          margin: 0 auto;
          padding: 32px 16px 64px;
        }
        .hero {
          display: grid;
          grid-template-columns: minmax(0, 3fr) minmax(0, 1fr);
          gap: 20px;
          align-items: start;
          margin-bottom: 30px;
        }
        .eyebrow {
          font-size: 12px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #6b7280;
          margin: 0 0 8px;
        }
        h1 {
          margin: 0 0 10px;
          font-size: 44px;
          letter-spacing: -0.03em;
          line-height: 1.05;
          color: #0f172a;
        }
        .hero-sub {
          margin: 0 0 16px;
          font-size: 15px;
          color: #374151;
          line-height: 1.6;
          max-width: 52ch;
        }

        .snapshot-card {
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 18px;
          padding: 16px;
        }
        .snapshot-card h2 {
          margin: 0 0 6px;
          font-size: 16px;
          color: #0f172a;
        }
        .snapshot-view {
          margin: 0 0 12px;
          color: #6b7280;
          font-size: 12px;
        }
        .snapshot-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 0;
          border-top: 1px dashed #e5e7eb;
          font-size: 13px;
          color: #111827;
        }

        .home-section {
          margin-top: 22px;
        }

        /* Designers-style filter sidebar */
        .layout {
          display: grid;
          grid-template-columns: 320px minmax(0, 1fr);
          gap: 18px;
          align-items: start;
        }
        .filters {
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          padding: 14px;
          position: sticky;
          top: 16px;
        }
        .filters-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 10px;
        }
        .filters-header h2 {
          margin: 0;
          font-size: 14px;
          color: #0f172a;
          letter-spacing: 0.02em;
          text-transform: uppercase;
        }
        .filters-header button {
          border: 0;
          background: transparent;
          color: #0f172a;
          font-weight: 700;
          font-size: 12px;
          cursor: pointer;
        }
        .filter-block {
          border-top: 1px solid #eef2f7;
          padding-top: 10px;
          margin-top: 10px;
        }
        .filter-block summary {
          cursor: pointer;
          font-weight: 700;
          font-size: 13px;
          color: #111827;
          list-style: none;
        }
        .filter-block summary::-webkit-details-marker {
          display: none;
        }
        .filter-body {
          margin-top: 8px;
        }
        .text-input,
        .select {
          width: 100%;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 10px 12px;
          font-size: 13px;
          outline: none;
          background: #fff;
        }
        .price-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        .results {
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          padding: 14px;
        }
        .results-head {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 10px;
          padding-bottom: 10px;
          border-bottom: 1px solid #eef2f7;
          margin-bottom: 12px;
        }
        .results-head h2 {
          margin: 0;
          font-size: 18px;
          color: #0f172a;
        }
        .results-link {
          font-size: 13px;
          text-decoration: none;
          color: #0f172a;
          font-weight: 700;
        }

        .cards {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
        }
        .empty-state {
          padding: 18px;
          border: 1px dashed #e5e7eb;
          border-radius: 12px;
          text-align: center;
        }
        .empty-state h3 {
          margin: 0 0 10px;
          font-size: 14px;
          color: #111827;
        }
        .resetBtn {
          border: 1px solid #cbd5e1;
          background: #fff;
          color: #0f172a;
          border-radius: 999px;
          padding: 10px 14px;
          font-weight: 700;
          cursor: pointer;
        }

        @media (max-width: 980px) {
          .hero {
            grid-template-columns: 1fr;
          }
          .layout {
            grid-template-columns: 1fr;
          }
          .filters {
            position: relative;
            top: auto;
          }
          .cards {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
        @media (max-width: 560px) {
          h1 {
            font-size: 34px;
          }
          .cards {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export const getServerSideProps: GetServerSideProps = async () => {
  // ✅ Prevent runtime 500 if Firebase Admin env vars are missing/misparsed in Vercel
  if (!adminDb) {
    return {
      props: {
        trending: [],
        newArrivals: [],
        activeMessages: [],
        designerOptions: [],
      },
    };
  }

  const listings = await adminDb.collection("listings").limit(200).get();

  const pickImage = (d: any): string => {
    const fromArray =
      Array.isArray(d.images)
        ? d.images
        : Array.isArray(d.imageUrls)
        ? d.imageUrls
        : Array.isArray(d.photos)
        ? d.photos
        : [];
    if (Array.isArray(fromArray) && fromArray[0]) return String(fromArray[0]);

    return d.image_url || d.imageUrl || d.image || d.coverImage || d.coverImageUrl || "";
  };

  const items: any[] = listings.docs.map((doc) => {
    const data: any = doc.data() || {};
    const priceNum = typeof data.price === "number" ? data.price : Number(data.price || 0);

    return {
      id: doc.id,
      title: data.title || data.name || "Untitled",
      brand: data.brand || data.designer || "",
      price: priceNum ? `US$${priceNum.toLocaleString("en-US")}` : "",
      priceValue: priceNum || 0,
      image: pickImage(data),
      href: `/product/${doc.id}`,
      category: data.category || data.categoryLabel || data.menuCategory || "",
      condition: data.condition || "",
      material: data.material || "",
      size: data.size || "",
      color: data.color || "",
      createdAt: data.createdAt?.toMillis?.() || 0,
      viewCount: data.viewCount || 0,
    };
  });

  const newArrivals = items
    .slice()
    .sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0))
    .slice(0, 8);

  let trending = items
    .slice()
    .sort((a: any, b: any) => (b.viewCount || 0) - (a.viewCount || 0))
    .slice(0, 8);

  if (!trending.length) trending = newArrivals;

  let activeMessages: BuyerMessage[] = [];
  try {
    const messagesRef = adminDb.collection("buyer_messages");
    let snap = await messagesRef.where("active", "==", true).get();
    if (snap.empty) snap = await messagesRef.get();

    activeMessages = snap.docs
      .map((doc) => {
        const d = doc.data() as any;
        return {
          id: doc.id,
          text: d.text || "",
          linkText: d.linkText || "",
          linkUrl: d.linkUrl || "",
          imageUrl: d.imageUrl || "",
          videoUrl: d.videoUrl || "",
          type: (d.type as BuyerMessage["type"]) || "info",
          active: d.active ?? true,
          createdAt: d.createdAt?.toMillis?.() || 0,
        } as BuyerMessage;
      })
      .filter((m) => m.active !== false && m.text.trim().length > 0)
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  } catch (err) {
    console.error("Error fetching messages:", err);
  }

  let designerOptions: string[] = [];
  try {
    const ds = await adminDb.collection("designers").get();
    designerOptions = ds.docs
      .map((doc) => {
        const data = doc.data() as any;
        const name = String(data?.name ?? doc.id).trim();
        const active = data?.active !== false;
        return active ? name : "";
      })
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));
  } catch (err) {
    console.error("Error fetching designers for homepage:", err);
    designerOptions = Array.from(
      new Set(items.map((i) => String(i.brand || "").trim()).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b));
  }

  return {
    props: {
      trending,
      newArrivals,
      activeMessages,
      designerOptions,
    },
  };
};

export default HomePage;
