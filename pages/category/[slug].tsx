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
          max: 500,
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
    return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
  }

  function clearAllFilters() {
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
      result = result.filter((item) =>
        selectedConditions.includes((item.condition || "").trim())
      );
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
  }, [itemsWithPrice, selectedCategories, selectedDesigners, selectedConditions, minPrice, maxPrice, sortBy]);

  const resultsCount = filteredItems.length;

  return (
    <div className="page">
      <Head>
        <title>{label} – Famous Finds</title>
        <meta name="description" content={`Browse ${label} items available on Famous Finds.`} />
        <link rel="canonical" href={`https://www.myfamousfinds.com/category/${slug}`} />
      </Head>

      <Header />

      <main className="wrap">
        <div className="breadcrumb">
          <Link href="/">Home</Link> / <span>{label}</span>
        </div>

        <div className="layout">
          <aside className="filters">
            <div className="filters-header">
              <h2>Filters</h2>
              <button type="button" className="clear-btn" onClick={clearAllFilters}>
                Clear All
              </button>
            </div>

            <div className="filter-block">
              <h3>Category</h3>
              <div className="filter-list">
                {CATEGORY_OPTIONS.map((cat) => (
                  <label key={cat} className="filter-option">
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(cat)}
                      onChange={() => setSelectedCategories((prev) => toggleInList(prev, cat))}
                    />
                    <span>{cat}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="filter-block">
              <h3>Designer</h3>
              <div className="filter-list">
                {designerOptions.map((name) => (
                  <label key={name} className="filter-option">
                    <input
                      type="checkbox"
                      checked={selectedDesigners.includes(name)}
                      onChange={() => setSelectedDesigners((prev) => toggleInList(prev, name))}
                    />
                    <span>{name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="filter-block">
              <h3>Condition</h3>
              <div className="filter-list">
                {CONDITION_OPTIONS.map((cond) => (
                  <label key={cond} className="filter-option">
                    <input
                      type="checkbox"
                      checked={selectedConditions.includes(cond)}
                      onChange={() => setSelectedConditions((prev) => toggleInList(prev, cond))}
                    />
                    <span>{cond}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="filter-block">
              <h3>Price</h3>

              <div className="price-stack">
                <div className="price-input">
                  <span>Min</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value === "" ? "" : Number(e.target.value) || 0)}
                  />
                </div>

                <div className="price-input">
                  <span>Max</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value === "" ? "" : Number(e.target.value) || 0)}
                  />
                </div>
              </div>

              <button type="button" className="apply-btn" onClick={() => {}}>
                Apply Filters
              </button>
            </div>
          </aside>

          <section className="results">
            <div className="results-header">
              <div>
                <h1>{label}</h1>
                <p className="results-count">
                  {loading ? "Loading…" : `${resultsCount} ${resultsCount === 1 ? "result" : "results"}`}
                  {!loading && clientLoaded ? " (synced)" : ""}
                </p>
              </div>
              <div className="sort">
                <label>
                  Sort
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                  >
                    <option value="newest">Newest</option>
                    <option value="price-asc">Price: Low to High</option>
                    <option value="price-desc">Price: High to Low</option>
                  </select>
                </label>
              </div>
            </div>

            {loading ? (
              <div className="empty-state">
                <h2>Loading listings…</h2>
                <p>Please wait a moment.</p>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="empty-state">
                <h2>No results</h2>
                <p>Try clearing filters or adjusting your selection.</p>
              </div>
            ) : (
              <div className="grid">
                {filteredItems.map((p) => (
                  <ProductCard key={p.id} {...p} />
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      <Footer />

      <style jsx>{`
        .page {
          background: #ffffff;
          color: #111827;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }
        .wrap {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px 16px 70px;
          width: 100%;
        }
        .breadcrumb {
          font-size: 12px;
          color: #6b7280;
          margin-bottom: 14px;
        }
        .breadcrumb a {
          color: #6b7280;
          text-decoration: none;
        }
        .breadcrumb a:hover {
          color: #111827;
          text-decoration: underline;
        }
        .layout {
          display: grid;
          grid-template-columns: 280px 1fr;
          gap: 18px;
          align-items: start;
        }
        .filters {
          min-width: 0;
          overflow: hidden;
          border: 1px solid #e5e7eb;
          border-radius: 14px;
          padding: 14px;
          background: #fbfbfb;
        }
        .filters-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 10px;
        }
        .filters h2 {
          margin: 0;
          font-size: 16px;
        }
        .clear-btn {
          border: none;
          background: transparent;
          color: #6b7280;
          cursor: pointer;
          font-size: 12px;
          text-decoration: underline;
        }
        .filter-block {
          margin-top: 14px;
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
        .apply-btn {
          width: 100%;
          border-radius: 999px;
          border: none;
          background: #111827;
          color: #ffffff;
          padding: 10px 12px;
          font-weight: 700;
          cursor: pointer;
        }
        .results {
          min-width: 0;
        }
        .results-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 14px;
        }
        .results h1 {
          margin: 0;
          font-size: 28px;
          font-family: "Georgia", serif;
        }
        .results-count {
          margin: 3px 0 0;
          font-size: 13px;
          color: #6b7280;
        }
        .sort label {
          display: flex;
          flex-direction: column;
          gap: 6px;
          font-size: 12px;
          color: #6b7280;
        }
        .sort select {
          border-radius: 999px;
          border: 1px solid #d1d5db;
          padding: 6px 10px;
          font-size: 14px;
          background: #ffffff;
        }
        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 18px;
          margin-top: 12px;
        }
        .empty-state {
          margin-top: 32px;
          border-radius: 16px;
          border: 1px solid #e5e7eb;
          padding: 24px;
          text-align: center;
          background: #f9fafb;
        }
        .empty-state h2 {
          margin: 0 0 4px;
          font-size: 18px;
        }
        .empty-state p {
          margin: 0;
          color: #6b7280;
          font-size: 14px;
        }
        @media (max-width: 980px) {
          .layout {
            grid-template-columns: 1fr;
          }
          .filters {
            order: 2;
          }
          .results {
            order: 1;
          }
        }
      `}</style>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps<CategoryProps> = async (ctx) => {
  const rawSlug = String(ctx.params?.slug || "");
  const normalized = canonicalSlug(rawSlug);

  const categoryLabel =
    labelMap[normalized] ||
    normalized.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  const norm = (v: any) => String(v || "").trim().toLowerCase().replace(/\s+/g, " ");
  const normSlug = (v: any) => norm(v).replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

  const wantedLabel = labelMap[normalized] || categoryLabel;

  try {
    // ✅ FIX: case-insensitive status allowlist
    const allowedStatuses = ["live", "active", "approved", "published"];

    let snap;
    try {
      snap = await adminDb.collection("listings").orderBy("createdAt", "desc").limit(500).get();
    } catch {
      snap = await adminDb.collection("listings").limit(500).get();
    }

    const allItems: any[] = snap.docs.map((doc) => {
      const d: any = doc.data() || {};
      const image =
        d.image_url ||
        d.imageUrl ||
        d.image ||
        (Array.isArray(d.imageUrls) && d.imageUrls[0]) ||
        "";

      const rawStatus = String(d.status ?? d.moderationStatus ?? d.listingStatus ?? "").trim();
      const rawStatusLc = rawStatus.toLowerCase();

      const isExcluded = /pending/i.test(rawStatus) || /reject/i.test(rawStatus) || /sold/i.test(rawStatus);
      const isPublic = !rawStatus || allowedStatuses.includes(rawStatusLc);

      const category = d.category || d.categoryLabel || d.categoryName || d.menuCategory || "";
      const brand = d.brand || d.designer || d.designerName || d.brandName || "";
      const priceNumber = Number(d.price) || Number(d.priceUsd) || 0;
      const price = priceNumber ? `US$${priceNumber.toLocaleString("en-US")}` : "";

      return {
        id: doc.id,
        title: d.title || "Untitled listing",
        brand: String(brand),
        category: String(category),
        condition: String(d.condition || ""),
        price,
        image,
        href: `/product/${doc.id}`,
        createdAt: d.createdAt || null,
        _isExcluded: isExcluded,
        _isPublic: isPublic,
      };
    });

    let filtered = allItems.filter((it) => it._isPublic && !it._isExcluded);

    if (normalized !== "new-arrivals") {
      filtered = filtered.filter((it) => {
        const c = String(it.category || "").trim();
        if (!c) return false;
        return normSlug(c) === normSlug(wantedLabel);
      });
    }

    filtered = filtered
      .slice()
      .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0))
      .slice(0, 60);

    const items: ProductLike[] = filtered.map(({ _isExcluded, _isPublic, createdAt, ...rest }) => rest);

    return {
      props: {
        slug: normalized,
        label: categoryLabel,
        items,
      },
    };
  } catch (err) {
    console.error("Error loading category page", err);
    return {
      props: {
        slug: normalized,
        label: categoryLabel,
        items: [],
      },
    };
  }
};
