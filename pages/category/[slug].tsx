// FILE: /pages/category/[slug].tsx
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import type { GetServerSideProps } from "next";
import React, { useEffect, useMemo, useState } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import ProductCard, { ProductLike } from "../../components/ProductCard";
import { getPublicListings } from "../../lib/publicListings";
import { getDeletedListingIds } from "../../lib/deletedListings";
import {
  CATEGORY_OPTIONS,
  CONDITION_OPTIONS,
  MATERIAL_OPTIONS,
  COLOR_OPTIONS,
  DEFAULT_DESIGNERS,
  normalize,
  parsePrice,
  queryToFilters,
  filtersToQuery,
  type SortValue,
} from "../../lib/filterConstants";

type CategoryProps = {
  slug: string;
  label: string;
  items: ProductLike[];
};

type ItemWithPrice = ProductLike & {
  priceValue: number;
  category?: string;
  condition?: string;
  brand?: string;
  material?: string;
  size?: string;
  color?: string;
};

type PublicDesignersResponse = {
  ok: boolean;
  designers?: { id: string; name: string; slug: string; active?: boolean }[];
  error?: string;
};

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

const labelMap: Record<string, string> = {
  "new-arrivals": "New Arrivals",
  women: "Women",
  men: "Men",
  kids: "Kids",
  bags: "Bags",
  shoes: "Shoes",
  jewelry: "Jewelry",
  watches: "Watches",
};

export default function CategoryPage({ slug, label, items }: CategoryProps) {
  const router = useRouter();
  const [liveItems, setLiveItems] = useState<ProductLike[]>(items || []);
  const [loading, setLoading] = useState<boolean>((items || []).length === 0);
  const [clientLoaded, setClientLoaded] = useState(false);

  const itemsWithPrice: ItemWithPrice[] = useMemo(() => {
    return (liveItems || []).map((item: any) => ({
      ...item,
      priceValue: parsePrice(item.price),
      category: item.category || "",
      condition: item.condition || "",
      brand: item.brand || "",
      material: item.material || "",
      size: item.size || "",
      color: item.color || "",
    }));
  }, [liveItems]);

  // Filter state — initialized from URL query params for cross-page sync
  const [titleQuery, setTitleQuery] = useState("");
  const [category, setCategory] = useState("");
  const [designer, setDesigner] = useState("");
  const [condition, setCondition] = useState("");
  const [material, setMaterial] = useState("");
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  const [minPrice, setMinPrice] = useState<number | "">(0);
  const [maxPrice, setMaxPrice] = useState<number | "">(1000000);
  const [sortBy, setSortBy] = useState<SortValue>("newest");
  const [showFilters, setShowFilters] = useState(false);
  const [filtersInitialized, setFiltersInitialized] = useState(false);

  const [designerOptions, setDesignerOptions] = useState<string[]>(DEFAULT_DESIGNERS);

  // Initialize filters from URL query params on mount (for cross-page sync)
  useEffect(() => {
    if (!router.isReady) return;
    if (filtersInitialized) return;
    setFiltersInitialized(true);

    const parsed = queryToFilters(router.query);
    if (parsed.titleQuery) setTitleQuery(parsed.titleQuery);
    if (parsed.category) setCategory(parsed.category);
    if (parsed.designer) setDesigner(parsed.designer);
    if (parsed.condition) setCondition(parsed.condition);
    if (parsed.material) setMaterial(parsed.material);
    if (parsed.size) setSize(parsed.size);
    if (parsed.color) setColor(parsed.color);
    if (typeof parsed.minPrice === "number") setMinPrice(parsed.minPrice);
    if (typeof parsed.maxPrice === "number") setMaxPrice(parsed.maxPrice);
    if (parsed.sortBy) setSortBy(parsed.sortBy);

    // Auto-open filter panel if any filter params are active
    if (Object.keys(parsed).length > 0) setShowFilters(true);
  }, [router.isReady, router.query, filtersInitialized]);

  // CRITICAL FIX:
  // When navigating between /category/* pages, Next.js will update props,
  // but React state does NOT auto-sync. Without this, the previous category's
  // items/filters can "stick" (e.g. Women items showing on Men, then "No Results").
  useEffect(() => {
    // Sync items from SSR to state on every slug change
    setLiveItems(items || []);
    setLoading((items || []).length === 0);
    setClientLoaded(false);

    // Reset any filters from the previous category page
    // But keep filters that came from URL params on initial load
    if (filtersInitialized) {
      // Only read from URL params if we're navigating to a new category page
      const parsed = queryToFilters(router.query);
      setTitleQuery(parsed.titleQuery || "");
      setCategory(parsed.category || "");
      setDesigner(parsed.designer || "");
      setCondition(parsed.condition || "");
      setMaterial(parsed.material || "");
      setSize(parsed.size || "");
      setColor(parsed.color || "");
      setMinPrice(typeof parsed.minPrice === "number" ? parsed.minPrice : 0);
      setMaxPrice(typeof parsed.maxPrice === "number" ? parsed.maxPrice : 1000000);
      setSortBy(parsed.sortBy || "newest");

      if (Object.keys(parsed).length > 0) setShowFilters(true);
    }
  }, [slug]);

  // Client fallback loader
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
          image:
            l.displayImageUrl ||
            (Array.isArray(l.images) && l.images[0] ? l.images[0] : ""),
          href: `/product/${l.id}`,
        }));

        if (!alive) return;

        const finalItems = pageSlug === "new-arrivals" ? mapped.slice(0, 60) : mapped.slice(0, 60);

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

      const fromItems = Array.from(
        new Set(itemsWithPrice.map((i) => (i.brand || "").trim()).filter(Boolean))
      ).sort((a, b) => a.localeCompare(b));

      setDesignerOptions(fromItems.length > 0 ? fromItems : DEFAULT_DESIGNERS);
    }

    loadDesigners();
  }, [itemsWithPrice]);

  function resetFilters() {
    setTitleQuery("");
    setCategory("");
    setDesigner("");
    setCondition("");
    setMaterial("");
    setSize("");
    setColor("");
    setMinPrice(0);
    setMaxPrice(1000000);
    setSortBy("newest");
  }

  const filteredItems: ItemWithPrice[] = useMemo(() => {
    let result = [...itemsWithPrice];

    const tq = normalize(titleQuery);
    const cat = normalize(category);
    const des = normalize(designer);
    const cond = normalize(condition);
    const mat = normalize(material);
    const sz = normalize(size);
    const col = normalize(color);

    if (tq) {
      result = result.filter((item) => normalize(item.title).includes(tq));
    }
    if (cat) {
      result = result.filter((item) => normalize(item.category).includes(cat));
    }
    if (des) {
      result = result.filter((item) => normalize(item.brand).includes(des));
    }
    if (cond) {
      result = result.filter((item) => normalize(item.condition) === cond);
    }
    if (mat) {
      result = result.filter((item) => normalize(item.material).includes(mat));
    }
    if (sz) {
      result = result.filter((item) => normalize(item.size).includes(sz));
    }
    if (col) {
      result = result.filter((item) => normalize(item.color).includes(col));
    }

    result = result.filter((item) => {
      const price = item.priceValue || 0;
      if (typeof minPrice === "number" && price < minPrice) return false;
      if (typeof maxPrice === "number" && price > maxPrice) return false;
      return true;
    });

    if (sortBy === "price-asc") result.sort((a, b) => (a.priceValue || 0) - (b.priceValue || 0));
    if (sortBy === "price-desc") result.sort((a, b) => (b.priceValue || 0) - (a.priceValue || 0));

    return result;
  }, [
    itemsWithPrice,
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
        {designerOptions.map((o) => (<option key={o} value={o}>{o}</option>))}
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
    <div className="ff-page">
      <Head>
        <title>{label} | My Famous Finds</title>
        <meta name="description" content={`Browse ${label} on My Famous Finds`} />
      </Head>

      <Header
        showFilter={showFilters}
        onToggleFilter={() => setShowFilters(!showFilters)}
        filterContent={filterPanel}
      />

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
            <Link href="/#shop-by-category" className="admin-button">
              Back to Categories
            </Link>
          </div>
        </div>

        <div className="ff-category-layout">
          {/* RESULTS GRID */}
          <section className="ff-results">
            {loading ? (
              <div className="ff-loading">Loading items...</div>
            ) : filteredItems.length === 0 ? (
              <div className="ff-empty">
                <div className="ff-empty-title">No Results</div>
                <div className="ff-empty-sub">
                  Try removing filters or changing category.
                </div>
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
            margin-bottom: 18px;
          }
          .ff-category-title {
            margin: 0;
            font-size: 34px;
            letter-spacing: -0.02em;
          }
          .ff-category-sub {
            margin-top: 6px;
            color: #6b7280;
            font-size: 13px;
          }
          .ff-category-layout {
            display: grid;
            grid-template-columns: 1fr;
            gap: 18px;
          }
          .ff-results {
            min-height: 300px;
          }
          .ff-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 14px;
          }
          .ff-loading {
            padding: 28px;
            border: 1px dashed #e5e7eb;
            border-radius: 14px;
            background: #fff;
            color: #6b7280;
          }
          .ff-empty {
            padding: 28px;
            border: 1px dashed #e5e7eb;
            border-radius: 14px;
            background: #fff;
          }
          .ff-empty-title {
            font-size: 18px;
            font-weight: 800;
            margin-bottom: 6px;
          }
          .ff-empty-sub {
            font-size: 13px;
            color: #6b7280;
            margin-bottom: 12px;
          }

          @media (max-width: 1100px) {
            .ff-grid {
              grid-template-columns: repeat(3, 1fr);
            }
          }
          @media (max-width: 860px) {
            .ff-grid {
              grid-template-columns: repeat(2, 1fr);
            }
          }
          @media (max-width: 420px) {
            .ff-grid {
              grid-template-columns: 1fr;
            }
          }
        `}</style>
      </main>

      <Footer />
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const raw = String(ctx.params?.slug || "");
  const slug = canonicalSlug(raw);
  const label = labelMap[slug] || raw;

  try {
    const wantsCategory = slug !== "new-arrivals";

    const excludeIds = await getDeletedListingIds();
    const listings = await getPublicListings({
      category: wantsCategory ? slug : "",
      take: 500,
      excludeIds,
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
      image:
        l.displayImageUrl ||
        (Array.isArray(l.images) && l.images[0] ? l.images[0] : ""),
      href: `/product/${l.id}`,
    }));

    const items = slug === "new-arrivals" ? mapped.slice(0, 60) : mapped.slice(0, 60);

    return {
      props: {
        slug,
        label,
        items,
      },
    };
  } catch (e) {
    // SSR fail-safe
    return {
      props: {
        slug,
        label,
        items: [],
      },
    };
  }
};
