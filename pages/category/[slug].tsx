// FILE: /pages/category/[slug].tsx
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import type { GetServerSideProps } from "next";
import { useEffect, useMemo, useState } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import ProductCard, { ProductLike } from "../../components/ProductCard";
import { getPublicListings } from "../../lib/publicListings";

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

function normalize(raw: string | undefined | null): string {
  if (!raw) return "";
  return raw
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

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

const DEFAULT_DESIGNERS = [
  "Chanel",
  "Hermès",
  "Louis Vuitton",
  "Gucci",
  "Prada",
  "Dior",
  "Rolex",
];

const labelMap: Record<string, string> = {
  "new-arrivals": "New Arrivals",
  women: "Women",
  men: "Men",
  kids: "Kids",
  bags: "Bags",
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

  const [titleQuery, setTitleQuery] = useState("");
  const [category, setCategory] = useState("");
  const [designer, setDesigner] = useState("");
  const [condition, setCondition] = useState("");
  const [material, setMaterial] = useState("");
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  const [minPrice, setMinPrice] = useState<number | "">(0);
  const [maxPrice, setMaxPrice] = useState<number | "">(1000000);
  const [sortBy, setSortBy] = useState<"newest" | "price-asc" | "price-desc">(
    "newest"
  );

  const [designerOptions, setDesignerOptions] = useState<string[]>(DEFAULT_DESIGNERS);

  // ✅ CRITICAL FIX:
  // When navigating between /category/* pages, Next.js will update props,
  // but React state does NOT auto-sync. Without this, the previous category's
  // items/filters can "stick" (e.g. Women items showing on Men, then "No Results").
  useEffect(() => {
    // Sync items from SSR to state on every slug change
    setLiveItems(items || []);
    setLoading((items || []).length === 0);
    setClientLoaded(false);

    // Reset any filters from the previous category page
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
  }, [slug]);

  // ✅ Client fallback loader
  // Runs if SSR returned empty OR SSR returned items that don't match this category (common during migrations)
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

      // If SSR has good-looking items, keep them and skip fallback
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

        // New Arrivals: newest 60. Category pages: show up to 60 (change if you want more).
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

    router.replace({ pathname: `/category/${slug}`, query }, undefined, {
      shallow: true,
    });
  };

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
          {/* LEFT FILTER PANEL */}
          <aside className="ff-filters">
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
                        setMinPrice(e.target.value === "" ? "" : Number(e.target.value) || 0)
                      }
                    />
                  </div>
                  <div className="price-input">
                    <span>Max</span>
                    <input
                      type="number"
                      value={maxPrice}
                      onChange={(e) =>
                        setMaxPrice(e.target.value === "" ? "" : Number(e.target.value) || 0)
                      }
                    />
                  </div>
                </div>
                <button type="button" className="apply-btn" onClick={applyFiltersToUrl}>
                  Apply Filters
                </button>
              </div>
            </details>

            <details className="filter-block">
              <summary>Sort</summary>
              <div className="filter-body">
                <select
                  className="select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                >
                  <option value="newest">Newest</option>
                  <option value="price-asc">Price (Low → High)</option>
                  <option value="price-desc">Price (High → Low)</option>
                </select>
              </div>
            </details>
          </aside>

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
            grid-template-columns: 280px 1fr;
            gap: 18px;
          }
          .ff-filters {
            border: 1px solid #e5e7eb;
            border-radius: 14px;
            padding: 16px 18px 20px;
            background: #fafafa;
            height: fit-content;
            position: sticky;
            top: 14px;
          }
          .filters-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 12px;
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
            .ff-category-layout {
              grid-template-columns: 1fr;
            }
            .ff-filters {
              position: relative;
              top: auto;
            }
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

  // Use Firestore directly for SSR where possible
  // (but we still have client fallback via getPublicListings if SSR misses/looks wrong).
  try {
    const wantsCategory = slug !== "new-arrivals";

    // For SSR: use tolerant loader so you don't need perfect Firestore category equality
    // ✅ Updated: Using 'take' instead of 'max'
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
