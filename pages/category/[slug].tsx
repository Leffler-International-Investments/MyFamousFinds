// FILE: /pages/category/[slug].tsx

import Head from "next/head";
import Link from "next/link";
import type { GetServerSideProps } from "next";
import { useEffect, useMemo, useState } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import ProductCard, { ProductLike } from "../../components/ProductCard";
import ListingFilters from "../../components/ListingFilters";
import { getPublicListings } from "../../lib/publicListings";

type CategoryProps = {
  slug: string;
  label: string;
  items: ProductLike[];
};

type ItemWithMeta = ProductLike & {
  priceValue: number;
  category?: string;
  condition?: string;
  brand?: string;
  material?: string;
  size?: string;
  color?: string;
  createdAt?: number;
};

type PublicDesignersResponse = {
  ok: boolean;
  designers?: { id: string; name: string; slug: string; active?: boolean }[];
  error?: string;
};

function parsePrice(price?: string | null): number {
  if (!price) return 0;
  const cleaned = price.replace(/[^0-9.,]/g, "").replace(/,/g, "");
  const asNumber = Number(cleaned);
  return Number.isFinite(asNumber) ? asNumber : 0;
}

function canonicalSlug(slug: string): string {
  const s = (slug || "").toLowerCase().trim();
  if (s === "mens") return "men";
  if (s === "jewellery") return "jewelry";
  if (s === "watch") return "watches";
  return s;
}

function toUsdString(n?: number): string {
  if (typeof n !== "number") return "";
  return `US$${n.toLocaleString("en-US")}`;
}

function normalize(raw: any): string {
  if (!raw) return "";
  return String(raw)
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

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

const labelMap: Record<string, string> = {
  "new-arrivals": "New Arrivals",
  women: "Women",
  men: "Men",
  bags: "Bags",
  jewelry: "Jewelry",
  watches: "Watches",
};

export default function CategoryPage({ slug, label, items }: CategoryProps) {
  const [liveItems, setLiveItems] = useState<ProductLike[]>(items || []);
  const [loading, setLoading] = useState<boolean>((items || []).length === 0);
  const [clientLoaded, setClientLoaded] = useState(false);

  const itemsWithMeta: ItemWithMeta[] = useMemo(() => {
    return (liveItems || []).map((item: any) => ({
      ...item,
      priceValue: parsePrice(item.price),
      category: item.category || "",
      condition: item.condition || "",
      brand: item.brand || "",
      material: item.material || "",
      size: item.size || "",
      color: item.color || "",
      createdAt: item.createdAt || 0,
    }));
  }, [liveItems]);

  // ✅ Shared filter state (same as homepage + designers)
  const [titleQuery, setTitleQuery] = useState("");
  const [category, setCategory] = useState(""); // only used for new-arrivals
  const [designer, setDesigner] = useState("");
  const [condition, setCondition] = useState("");
  const [material, setMaterial] = useState("");
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  const [minPrice, setMinPrice] = useState<number | "">(0);
  const [maxPrice, setMaxPrice] = useState<number | "">(100000);
  const [sortBy, setSortBy] = useState<"newest" | "price-asc" | "price-desc">("newest");

  const [designerOptions, setDesignerOptions] = useState<string[]>([]);

  // reset when slug changes (prevents "sticky previous category" issues)
  useEffect(() => {
    setLiveItems(items || []);
    setLoading((items || []).length === 0);
    setClientLoaded(false);

    setTitleQuery("");
    setDesigner("");
    setCondition("");
    setMaterial("");
    setSize("");
    setColor("");
    setMinPrice(0);
    setMaxPrice(100000);
    setSortBy("newest");

    // category dropdown only relevant in new-arrivals
    setCategory("");
  }, [slug]);

  // ✅ Client fallback loader (kept from your file, but now also maps material/size/color)
  useEffect(() => {
    let alive = true;

    async function loadFallback() {
      const pageSlug = canonicalSlug(slug);
      const pageLabel = labelMap[pageSlug] || label;
      const wantsCategory = pageSlug !== "new-arrivals";
      const ssrHasItems = (items || []).length > 0;

      const ssrLooksWrong =
        ssrHasItems &&
        wantsCategory &&
        (items || []).every((it: any) => {
          const c = String(it?.category || "").trim().toLowerCase();
          return c !== String(pageLabel).trim().toLowerCase();
        });

      if (ssrHasItems && !ssrLooksWrong) {
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const listings = await getPublicListings({
          category: pageSlug === "new-arrivals" ? "" : pageSlug,
          take: 500,
        });

        const mapped: ProductLike[] = (listings || []).map((l: any) => ({
          id: l.id,
          title: l.title,
          brand: l.brand || "",
          category: l.category || "",
          condition: l.condition || "",
          material: l.material || "",
          size: l.size || "",
          color: l.color || "",
          price: toUsdString(l.price ?? l.priceUsd),
          image: Array.isArray(l.images) && l.images[0] ? l.images[0] : "",
          href: `/product/${l.id}`,
          createdAt: l.createdAt || 0,
        }));

        if (!alive) return;

        const finalItems = mapped.slice(0, 60);
        setLiveItems(finalItems);
        setClientLoaded(true);
      } catch (e) {
        console.error("Client fallback category load failed", e);
      } finally {
        if (alive) setLoading(false);
      }
    }

    loadFallback();
    return () => {
      alive = false;
    };
  }, [slug, label, items]);

  // designers options (API first, fallback to items)
  useEffect(() => {
    async function loadDesigners() {
      try {
        const res = await fetch("/api/public/designers");
        const data: PublicDesignersResponse = await res.json();

        if (data.ok && data.designers && data.designers.length > 0) {
          const names = Array.from(
            new Set(
              data.designers
                .filter((d) => d.active !== false)
                .map((d) => d.name.trim())
                .filter(Boolean)
            )
          ).sort((a, b) => a.localeCompare(b));

          if (names.length > 0) {
            setDesignerOptions(names);
            return;
          }
        }
      } catch {
        // ignore
      }

      const fromItems = Array.from(new Set(itemsWithMeta.map((i) => (i.brand || "").trim()).filter(Boolean))).sort(
        (a, b) => a.localeCompare(b)
      );

      setDesignerOptions(fromItems);
    }

    loadDesigners();
  }, [itemsWithMeta]);

  const resetFilters = () => {
    setTitleQuery("");
    setDesigner("");
    setCondition("");
    setMaterial("");
    setSize("");
    setColor("");
    setMinPrice(0);
    setMaxPrice(100000);
    setSortBy("newest");
    setCategory("");
  };

  const filteredItems: ItemWithMeta[] = useMemo(() => {
    let result = [...itemsWithMeta];

    const tq = normalize(titleQuery);
    const des = normalize(designer);
    const cond = normalize(condition);
    const mat = normalize(material);
    const sz = normalize(size);
    const col = normalize(color);

    // Category logic:
    // - For /category/* pages (except new-arrivals): force category == label
    // - For /category/new-arrivals: allow dropdown category
    const pageIsNewArrivals = canonicalSlug(slug) === "new-arrivals";
    const lockedCategory = pageIsNewArrivals ? category : label;

    const cat = normalize(lockedCategory);

    if (tq) result = result.filter((x) => normalize(x.title).includes(tq));
    if (cat) result = result.filter((x) => normalize(x.category).includes(cat));
    if (des) result = result.filter((x) => normalize(x.brand).includes(des));
    if (cond) result = result.filter((x) => normalize(x.condition) === cond);
    if (mat) result = result.filter((x) => normalize((x as any).material).includes(mat));
    if (sz) result = result.filter((x) => normalize((x as any).size).includes(sz));
    if (col) result = result.filter((x) => normalize((x as any).color).includes(col));

    // PRICE
    result = result.filter((x) => {
      const pv = x.priceValue || 0;
      const min = typeof minPrice === "number" ? minPrice : 0;
      const max = typeof maxPrice === "number" ? maxPrice : 999999999;
      return pv >= min && pv <= max;
    });

    // SORT
    if (sortBy === "price-asc") result.sort((a, b) => (a.priceValue || 0) - (b.priceValue || 0));
    if (sortBy === "price-desc") result.sort((a, b) => (b.priceValue || 0) - (a.priceValue || 0));
    if (sortBy === "newest") result.sort((a, b) => ((b.createdAt as any) || 0) - ((a.createdAt as any) || 0));

    return result;
  }, [itemsWithMeta, slug, label, titleQuery, category, designer, condition, material, size, color, minPrice, maxPrice, sortBy]);

  const resultsCount = filteredItems.length;
  const pageIsNewArrivals = canonicalSlug(slug) === "new-arrivals";

  return (
    <div className="ff-page">
      <Head>
        <title>{label} | My Famous Finds</title>
        <meta name="description" content={`Browse ${label} on My Famous Finds`} />
      </Head>

      <Header />

      <main className="ff-category">
        <div className="ff-category-head">
          <div>
            <h1 className="ff-category-title">{label}</h1>
            <div className="ff-category-sub">
              {loading ? "Loading..." : `${resultsCount.toLocaleString()} results`}
              {clientLoaded ? " (refreshed)" : ""}
            </div>
          </div>

          <div className="ff-category-actions">
            <Link href="/catalogue" className="admin-button">
              Back to Catalogue
            </Link>
          </div>
        </div>

        <div className="ff-category-layout">
          <ListingFilters
            titleQuery={titleQuery}
            category={pageIsNewArrivals ? category : label}
            designer={designer}
            material={material}
            condition={condition}
            size={size}
            color={color}
            minPrice={minPrice}
            maxPrice={maxPrice}
            sortBy={sortBy}
            setTitleQuery={setTitleQuery}
            setCategory={pageIsNewArrivals ? setCategory : () => {}}
            setDesigner={setDesigner}
            setMaterial={setMaterial}
            setCondition={setCondition}
            setSize={setSize}
            setColor={setColor}
            setMinPrice={setMinPrice}
            setMaxPrice={setMaxPrice}
            setSortBy={setSortBy}
            categoryOptions={pageIsNewArrivals ? CATEGORY_OPTIONS : [label]}
            designerOptions={designerOptions}
            conditionOptions={CONDITION_OPTIONS}
            materialOptions={MATERIAL_OPTIONS}
            onReset={resetFilters}
            showApplyButton={false}
          />

          <section className="ff-results">
            {loading ? (
              <div className="ff-loading">Loading items...</div>
            ) : filteredItems.length === 0 ? (
              <div className="ff-empty">
                <div className="ff-empty-title">No Results</div>
                <div className="ff-empty-sub">Try removing filters or changing category.</div>
                <button className="admin-button" onClick={resetFilters}>
                  Reset filters
                </button>
              </div>
            ) : (
              <div className="ff-grid">
                {filteredItems.map((p) => (
                  <ProductCard key={p.id} {...(p as any)} />
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      <Footer />

      <style jsx>{`
        .ff-category {
          max-width: 1300px;
          margin: 0 auto;
          padding: 20px 16px 60px;
        }
        .ff-category-head {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 16px;
        }
        .ff-category-title {
          font-family: "Georgia", serif;
          font-size: 44px;
          line-height: 1.05;
          margin: 0;
        }
        .ff-category-sub {
          margin-top: 6px;
          font-size: 13px;
          color: #6b7280;
        }
        .ff-category-layout {
          display: grid;
          grid-template-columns: 260px minmax(0, 1fr);
          gap: 24px;
          align-items: start;
        }
        @media (max-width: 900px) {
          .ff-category-layout {
            grid-template-columns: 1fr;
          }
        }
        .ff-results {
          min-width: 0;
        }
        .ff-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 18px;
        }
        .ff-loading {
          padding: 28px 0;
          color: #6b7280;
        }
        .ff-empty {
          border: 1px dashed #d1d5db;
          border-radius: 16px;
          padding: 22px;
          background: #fafafa;
        }
        .ff-empty-title {
          font-weight: 700;
          font-size: 16px;
        }
        .ff-empty-sub {
          margin-top: 6px;
          color: #6b7280;
          font-size: 13px;
        }
      `}</style>
    </div>
  );
}

// SSR
export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const raw = String(ctx.params?.slug || "");
  const slug = canonicalSlug(raw);
  const label = labelMap[slug] || raw;

  try {
    const wantsCategory = slug !== "new-arrivals";

    const listings = await getPublicListings({
      category: wantsCategory ? slug : "",
      take: 500,
    });

    const mapped: ProductLike[] = (listings || []).map((l: any) => ({
      id: l.id,
      title: l.title,
      brand: l.brand || "",
      category: l.category || "",
      condition: l.condition || "",
      material: l.material || "",
      size: l.size || "",
      color: l.color || "",
      price: toUsdString(l.price ?? l.priceUsd),
      image: Array.isArray(l.images) && l.images[0] ? l.images[0] : "",
      href: `/product/${l.id}`,
      createdAt: l.createdAt || 0,
    }));

    const items = mapped.slice(0, 60);

    return {
      props: {
        slug,
        label,
        items,
      },
    };
  } catch (e) {
    return {
      props: {
        slug,
        label,
        items: [],
      },
    };
  }
};
