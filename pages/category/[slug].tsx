// FILE: /pages/category/[slug].tsx
import Head from "next/head";
import Link from "next/link";
import type { GetServerSideProps } from "next";
import { useEffect, useMemo, useState } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import ProductCard, { ProductLike } from "../../components/ProductCard";
import { adminDb } from "../../utils/firebaseAdmin";
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

const CATEGORY_OPTIONS = ["Women", "Bags", "Men", "Jewelry", "Watches"];
const CONDITION_OPTIONS = ["New", "Excellent", "Very good", "Good"];
const DEFAULT_DESIGNERS = ["Chanel", "Hermès", "Louis Vuitton", "Gucci", "Prada", "Dior", "Rolex"];

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

  const itemsWithPrice: ItemWithPrice[] = useMemo(() => {
    return (liveItems || []).map((item: any) => ({
      ...item,
      priceValue: parsePrice(item.price),
      category: item.category || "",
      condition: item.condition || "",
    }));
  }, [liveItems]);

  const [sortBy, setSortBy] = useState<"newest" | "price-asc" | "price-desc">("newest");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedDesigners, setSelectedDesigners] = useState<string[]>([]);
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState<number | "">(0);
  const [maxPrice, setMaxPrice] = useState<number | "">(1000000);

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
    setSortBy("newest");
    setSelectedCategories([]);
    setSelectedDesigners([]);
    setSelectedConditions([]);
    setMinPrice(0);
    setMaxPrice(1000000);
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
          price: toUsdString(l.price ?? l.priceUsd),
          image: Array.isArray(l.images) && l.images[0] ? l.images[0] : "",
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

  function toggleInList(list: string[], value: string): string[] {
    return list.includes(value) ? list.filter((x) => x !== value) : [...list, value];
  }

  function resetFilters() {
    setSortBy("newest");
    setSelectedCategories([]);
    setSelectedDesigners([]);
    setSelectedConditions([]);
    setMinPrice(0);
    setMaxPrice(1000000);
  }

  const filteredItems: ItemWithPrice[] = useMemo(() => {
    let result = [...itemsWithPrice];

    if (selectedCategories.length > 0) {
      result = result.filter((item) =>
        selectedCategories.some(
          (cat) => cat.toLowerCase() === (item.category || "").trim().toLowerCase()
        )
      );
    }

    if (selectedDesigners.length > 0) {
      result = result.filter((item) =>
        selectedDesigners.some(
          (des) => des.toLowerCase() === (item.brand || "").trim().toLowerCase()
        )
      );
    }

    if (selectedConditions.length > 0) {
      result = result.filter((item) => selectedConditions.includes((item.condition || "").trim()));
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
    selectedCategories,
    selectedDesigners,
    selectedConditions,
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
            <div className="filters-head">
              <div className="filters-title">Filters</div>
              <button className="filters-reset" onClick={resetFilters}>
                Reset
              </button>
            </div>

            <div className="filter-block">
              <h3>Sort</h3>
              <select
                className="ff-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
              >
                <option value="newest">Newest</option>
                <option value="price-asc">Price (Low → High)</option>
                <option value="price-desc">Price (High → Low)</option>
              </select>
            </div>

            <div className="filter-block">
              <h3>Category</h3>
              <div className="filter-list">
                {CATEGORY_OPTIONS.map((c) => (
                  <label key={c} className="filter-option">
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(c)}
                      onChange={() => setSelectedCategories((prev) => toggleInList(prev, c))}
                    />
                    <span>{c}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="filter-block">
              <h3>Designer</h3>
              <div className="filter-list">
                {designerOptions.map((d) => (
                  <label key={d} className="filter-option">
                    <input
                      type="checkbox"
                      checked={selectedDesigners.includes(d)}
                      onChange={() => setSelectedDesigners((prev) => toggleInList(prev, d))}
                    />
                    <span>{d}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="filter-block">
              <h3>Condition</h3>
              <div className="filter-list">
                {CONDITION_OPTIONS.map((c) => (
                  <label key={c} className="filter-option">
                    <input
                      type="checkbox"
                      checked={selectedConditions.includes(c)}
                      onChange={() => setSelectedConditions((prev) => toggleInList(prev, c))}
                    />
                    <span>{c}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="filter-block">
              <h3>Price (USD)</h3>
              <div className="price-stack">
                <div className="price-input">
                  <span>Min</span>
                  <input
                    type="number"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="0"
                  />
                </div>
                <div className="price-input">
                  <span>Max</span>
                  <input
                    type="number"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="1000000"
                  />
                </div>
              </div>
            </div>
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
            padding: 14px;
            background: #fff;
            height: fit-content;
            position: sticky;
            top: 14px;
          }
          .filters-head {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 12px;
          }
          .filters-title {
            font-weight: 700;
            font-size: 14px;
          }
          .filters-reset {
            background: transparent;
            border: none;
            color: #111827;
            font-size: 12px;
            text-decoration: underline;
            cursor: pointer;
          }
          .filter-block {
            border-top: 1px solid #f3f4f6;
            padding-top: 12px;
            margin-top: 12px;
          }
          .filter-block h3 {
            margin: 0 0 8px;
            font-size: 13px;
            color: #111827;
          }
          .filter-list {
            display: flex;
            flex-direction: column;
            gap: 8px;
            max-height: 220px;
            overflow: auto;
            padding-right: 6px;
          }
          .filter-option {
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 13px;
            color: #111827;
          }
          .price-stack {
            display: flex;
            flex-direction: column;
            gap: 10px;
            margin-bottom: 10px;
            width: 100%;
          }
          .price-input {
            display: flex;
            flex-direction: column;
            gap: 6px;
            width: 100%;
          }
          .price-input span {
            font-size: 12px;
            color: #6b7280;
          }
          .price-input input {
            width: 100%;
            min-width: 0;
            box-sizing: border-box;
            border-radius: 999px;
            border: 1px solid #d1d5db;
            padding: 6px 10px;
            font-size: 14px;
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
      price: toUsdString(l.price ?? l.priceUsd),
      image: Array.isArray(l.images) && l.images[0] ? l.images[0] : "",
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
