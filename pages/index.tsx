// FILE: /pages/index.tsx

import Head from "next/head";
import Link from "next/link";
import type { GetServerSideProps, NextPage } from "next";
import { useMemo, useState } from "react";

import Header from "../components/Header";
import Footer from "../components/Footer";
import DemoGrid from "../components/DemoGrid";
import HomepageButler from "../components/HomepageButler";
import ProductCard, { ProductLike } from "../components/ProductCard";
import ListingFilters from "../components/ListingFilters";
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
};

const CATEGORY_OPTIONS = ["Women", "Bags", "Men", "Jewelry", "Watches"];
const CONDITION_OPTIONS = ["New", "Excellent", "Very good", "Good"];
const MATERIAL_OPTIONS = [
  "Leather",
  "Silk",
  "Cashmere",
  "Wool",
  "Linen",
  "Cotton",
  "Denim",
  "Suede",
  "Canvas",
  "Nylon",
  "Gold",
  "Silver",
  "Stainless Steel",
  "Diamonds",
  "Pearls",
];

function normalize(v: any): string {
  return String(v || "").trim().toLowerCase();
}

function parseNum(v: any): number {
  if (typeof v === "number") return v;
  const n = Number(String(v || "").replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

const HomePage: NextPage<HomeProps> = ({ trending, newArrivals, activeMessages }) => {
  // Shared filter state
  const [titleQuery, setTitleQuery] = useState("");
  const [category, setCategory] = useState("");
  const [designer, setDesigner] = useState("");
  const [material, setMaterial] = useState("");
  const [condition, setCondition] = useState("");
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  const [minPrice, setMinPrice] = useState<number | "">(0);
  const [maxPrice, setMaxPrice] = useState<number | "">(1000000);
  const [sortBy, setSortBy] = useState<"newest" | "price-asc" | "price-desc">("newest");

  const resetFilters = () => {
    setTitleQuery("");
    setCategory("");
    setDesigner("");
    setMaterial("");
    setCondition("");
    setSize("");
    setColor("");
    setMinPrice(0);
    setMaxPrice(1000000);
    setSortBy("newest");
  };

  // Catalogue preview items
  const previewItems = useMemo(() => {
    const combined = [...(newArrivals || []), ...(trending || [])];

    // de-dupe by id
    const seen = new Set<string>();
    const uniq: any[] = [];
    for (const p of combined) {
      const id = String((p as any).id || "");
      if (!id || seen.has(id)) continue;
      seen.add(id);
      uniq.push(p);
    }
    return uniq.slice(0, 60);
  }, [newArrivals, trending]);

  const designerOptions = useMemo(() => {
    const fromItems = Array.from(
      new Set(previewItems.map((x: any) => String(x.brand || "").trim()).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b));
    return fromItems;
  }, [previewItems]);

  const filteredPreview = useMemo(() => {
    let result = [...(previewItems as any[])];

    const tq = normalize(titleQuery);
    const cat = normalize(category);
    const des = normalize(designer);
    const cond = normalize(condition);
    const mat = normalize(material);
    const sz = normalize(size);
    const col = normalize(color);

    if (tq) result = result.filter((x) => normalize(x.title).includes(tq));
    if (cat) result = result.filter((x) => normalize(x.category) === cat);
    if (des) result = result.filter((x) => normalize(x.brand) === des);
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

    return result.slice(0, 12);
  }, [
    previewItems,
    titleQuery,
    category,
    designer,
    material,
    condition,
    size,
    color,
    minPrice,
    maxPrice,
    sortBy,
  ]);

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
              Browse a hand-picked selection of bags, jewelry, watches and
              ready-to-wear from trusted sellers. Every piece is vetted so you
              can shop with confidence.
            </p>

            <div className="hero-actions">
              <Link href="/category/new-arrivals" className="btn-primary">
                Browse New Arrivals
              </Link>
              <Link href="/designers" className="btn-secondary">
                View Trending Pieces
              </Link>
            </div>
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

        {/* NEW ARRIVALS GRID */}
        <section className="home-section">
          <DemoGrid
            title="New Arrivals"
            subtitle="Just in – freshly listed pieces from our vetted sellers."
            products={newArrivals}
          />
        </section>

        {/* TRENDING GRID */}
        <section className="home-section">
          <DemoGrid
            title="Trending Now"
            subtitle="Most-viewed and most-saved listings this week."
            products={trending}
          />
        </section>

        {/* Catalogue Preview */}
        <section className="home-section">
          <div className="preview-head">
            <div>
              <h2 className="preview-title">Catalogue Preview</h2>
              <p className="preview-sub">Use the same filters you see on the Designers page.</p>
            </div>
            <Link className="preview-link" href="/category/new-arrivals">
              Open full catalogue
            </Link>
          </div>

          <div className="preview-grid">
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
              designerOptions={designerOptions}
              conditionOptions={CONDITION_OPTIONS}
              materialOptions={MATERIAL_OPTIONS}
              onReset={resetFilters}
              showApplyButton={false}
            />

            <div className="preview-cards">
              {filteredPreview.length === 0 ? (
                <div className="empty-state">
                  <h3>No items match these filters.</h3>
                  <button className="resetBtn" onClick={resetFilters}>Reset filters</button>
                </div>
              ) : (
                /* ✅ FIX: Spread product fields as props */
                filteredPreview.map((p: any) => <ProductCard key={p.id} {...p} />)
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
        .hero-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }
        .btn-primary,
        .btn-secondary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
          padding: 12px 16px;
          font-weight: 700;
          font-size: 13px;
          text-decoration: none;
        }
        .btn-primary {
          background: #0f172a;
          color: #fff;
          border: 1px solid #0f172a;
        }
        .btn-secondary {
          background: #fff;
          color: #0f172a;
          border: 1px solid #cbd5e1;
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
          border-bottom: 1px solid #eef2f7;
          font-size: 13px;
          color: #111827;
        }
        .snapshot-row:last-of-type {
          border-bottom: 0;
        }

        .home-section {
          margin-top: 18px;
        }

        .preview-head {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 12px;
          margin: 10px 0 12px;
        }
        .preview-title {
          margin: 0;
          font-size: 20px;
          color: #0f172a;
        }
        .preview-sub {
          margin: 6px 0 0;
          font-size: 13px;
          color: #6b7280;
        }
        .preview-link {
          font-size: 13px;
          text-decoration: underline;
          color: #0f172a;
        }

        .preview-grid {
          display: grid;
          grid-template-columns: 260px minmax(0, 1fr);
          gap: 24px;
          align-items: start;
        }

        .preview-cards {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 18px;
        }

        .empty-state {
          border: 1px dashed #e5e7eb;
          border-radius: 16px;
          padding: 22px;
          background: #fafafa;
        }
        .resetBtn {
          margin-top: 10px;
          border: 1px solid #111827;
          background: #fff;
          border-radius: 999px;
          padding: 10px 14px;
          cursor: pointer;
          font-weight: 600;
        }

        @media (max-width: 900px) {
          .hero {
            grid-template-columns: 1fr;
          }
          .preview-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 560px) {
          h1 {
            font-size: 34px;
          }
        }
      `}</style>
    </div>
  );
};

export default HomePage;

export const getServerSideProps: GetServerSideProps = async () => {
  const listings = await adminDb.collection("listings").limit(200).get();

  const pickImage = (d: any): string => {
    const fromArray =
      Array.isArray(d.images) ? d.images :
      Array.isArray(d.imageUrls) ? d.imageUrls :
      Array.isArray(d.photos) ? d.photos :
      [];
    if (Array.isArray(fromArray) && fromArray[0]) return String(fromArray[0]);

    return (
      d.image_url ||
      d.imageUrl ||
      d.image ||
      d.coverImage ||
      d.coverImageUrl ||
      ""
    );
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
      createdAt: data.createdAt || null,
      viewCount: data.viewCount || 0,
    };
  });

  const newArrivals = items
    .slice()
    .sort((a: any, b: any) => {
      const aTime = a.createdAt?.toMillis?.() || 0;
      const bTime = b.createdAt?.toMillis?.() || 0;
      return bTime - aTime;
    })
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

  return {
    props: {
      trending,
      newArrivals,
      activeMessages,
    },
  };
};


