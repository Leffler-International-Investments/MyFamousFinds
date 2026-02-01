// FILE: /pages/category/[slug].tsx
import Head from "next/head";
import Link from "next/link";
import type { GetServerSideProps } from "next";
import { useEffect, useMemo, useState } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import ProductCard, { ProductLike } from "../../components/ProductCard";
import { adminDb } from "../../utils/firebaseAdmin";

type CategoryProps = {
  slug: string;
  label: string;
  items: ProductLike[];
};

// NOTE: we add category + condition as optionals on top of ProductLike
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

// ---- Helper: "US$1,200" -> 1200 ----
function parsePrice(price?: string | null): number {
  if (!price) return 0;
  const cleaned = price.replace(/[^0-9.,]/g, "").replace(/,/g, "");
  const asNumber = Number(cleaned);
  return Number.isFinite(asNumber) ? asNumber : 0;
}

// You can EDIT these lists any time.
// Add / remove entries and the filters will update automatically.
const CATEGORY_OPTIONS = [
  "Women",
  "Men",
  "Bags",
  "Shoes",
  "Accessories",
  "Jewelry",
  "Watches",
];

const CONDITION_OPTIONS = ["New", "Excellent", "Very good", "Good"];

// Fallback list if /api/public/designers has none
const DEFAULT_DESIGNERS = [
  "Chanel",
  "Hermès",
  "Louis Vuitton",
  "Gucci",
  "Prada",
  "Dior",
  "Rolex",
];

export default function CategoryPage({ slug, label, items }: CategoryProps) {
  // Pre-compute numeric prices once
  const [itemsWithPrice] = useState<ItemWithPrice[]>(() =>
    (items || []).map((item: any) => ({
      ...item,
      priceValue: parsePrice(item.price),
      category: item.category || "",
      condition: item.condition || "",
    }))
  );

  const [sortBy, setSortBy] = useState<"newest" | "price-asc" | "price-desc">(
    "newest"
  );
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedDesigners, setSelectedDesigners] = useState<string[]>([]);
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState<number | "">(0);
  const [maxPrice, setMaxPrice] = useState<number | "">(10000);

  // Designers list for the filter
  const [designerOptions, setDesignerOptions] =
    useState<string[]>(DEFAULT_DESIGNERS);

  // Load designers from your public API once on mount
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
      } catch (err) {
        console.error("Failed to load designers for filters", err);
      }

      // Fallback: use brands from items or DEFAULT_DESIGNERS
      const fromItems = Array.from(
        new Set(itemsWithPrice.map((i) => (i.brand || "").trim()).filter(Boolean))
      ).sort((a, b) => a.localeCompare(b));

      if (fromItems.length > 0) {
        setDesignerOptions(fromItems);
      } else {
        setDesignerOptions(DEFAULT_DESIGNERS);
      }
    }

    loadDesigners();
  }, [itemsWithPrice]);

  // Simple helpers to toggle filters
  function toggleInList(list: string[], value: string): string[] {
    return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
  }

  function onCategoryChange(name: string) {
    setSelectedCategories((prev) => toggleInList(prev, name));
  }
  function onDesignerChange(name: string) {
    setSelectedDesigners((prev) => toggleInList(prev, name));
  }
  function onConditionChange(name: string) {
    setSelectedConditions((prev) => toggleInList(prev, name));
  }

  function resetFilters() {
    setSelectedCategories([]);
    setSelectedDesigners([]);
    setSelectedConditions([]);
    setMinPrice(0);
    setMaxPrice(10000);
  }

  // Apply filters + sort
  const filteredItems: ItemWithPrice[] = useMemo(() => {
    let result = [...itemsWithPrice];

    // 1) Category
    if (selectedCategories.length > 0) {
      result = result.filter((item) =>
        item.category ? selectedCategories.includes(item.category) : false
      );
    }

    // 2) Designer
    if (selectedDesigners.length > 0) {
      result = result.filter((item) =>
        item.brand ? selectedDesigners.includes(item.brand) : false
      );
    }

    // 3) Condition
    if (selectedConditions.length > 0) {
      result = result.filter((item) =>
        item.condition ? selectedConditions.includes(item.condition) : false
      );
    }

    // 4) Price
    result = result.filter((item) => {
      const price = item.priceValue;
      if (typeof minPrice === "number" && price < minPrice) return false;
      if (typeof maxPrice === "number" && price > maxPrice) return false;
      return true;
    });

    // 5) Sort
    if (sortBy === "price-asc") {
      result.sort((a, b) => a.priceValue - b.priceValue);
    } else if (sortBy === "price-desc") {
      result.sort((a, b) => b.priceValue - a.priceValue);
    } else {
      // "newest" – keep server order (createdAt desc)
    }

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

  const breadcrumbLabel =
    label || slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="category-page">
      <Head>
        <title>{breadcrumbLabel} – All Products | Famous Finds</title>
      </Head>

      <Header />

      <main className="page-main">
        <div className="page-inner">
          {/* Breadcrumb */}
          <div className="breadcrumb">
            <Link href="/">Home</Link>
            <span>/</span>
            <span>{breadcrumbLabel}</span>
          </div>

          <div className="layout">
            {/* LEFT – Filters */}
            <aside className="filters">
              <div className="filters-header">
                <h2>Filters</h2>
                <button type="button" onClick={resetFilters}>
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
                        onChange={() => onCategoryChange(cat)}
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
                        onChange={() => onDesignerChange(name)}
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
                        onChange={() => onConditionChange(cond)}
                      />
                      <span>{cond}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="filter-block">
                <h3>Price</h3>
                <div className="price-row">
                  <div className="price-input">
                    <span>Min</span>
                    <input
                      type="number"
                      value={minPrice}
                      onChange={(e) =>
                        setMinPrice(
                          e.target.value === "" ? "" : Number(e.target.value) || 0
                        )
                      }
                    />
                  </div>
                  <span className="price-separator">–</span>
                  <div className="price-input">
                    <span>Max</span>
                    <input
                      type="number"
                      value={maxPrice}
                      onChange={(e) =>
                        setMaxPrice(
                          e.target.value === "" ? "" : Number(e.target.value) || 0
                        )
                      }
                    />
                  </div>
                </div>
                <button
                  type="button"
                  className="apply-btn"
                  onClick={() => {
                    // Filters are already live – button is just for UX
                  }}
                >
                  Apply Filters
                </button>
              </div>
            </aside>

            {/* RIGHT – Results */}
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
                        setSortBy(e.target.value as "newest" | "price-asc" | "price-desc")
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
        .category-page {
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
          padding-top: 12px;
          margin-top: 12px;
        }
        .filter-block:first-of-type {
          border-top: none;
          padding-top: 0;
          margin-top: 0;
        }
        .filter-block h3 {
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 6px;
        }
        .filter-list {
          display: flex;
          flex-direction: column;
          gap: 4px;
          font-size: 14px;
        }
        .filter-option {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .filter-option input {
          accent-color: #111827;
        }
        .price-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 10px;
        }
        .price-input {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
          font-size: 13px;
        }
        .price-input input {
          border-radius: 999px;
          border: 1px solid #d1d5db;
          padding: 6px 10px;
          font-size: 14px;
        }
        .price-separator {
          font-size: 14px;
          color: #6b7280;
        }
        .apply-btn {
          width: 100%;
          margin-top: 4px;
          border-radius: 999px;
          background: #111827;
          color: white;
          padding: 8px 12px;
          border: none;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
        }
        .results {
          min-height: 200px;
        }
        .results-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 12px;
        }
        .results-header h1 {
          font-family: Georgia, "Times New Roman", serif;
          font-size: 26px;
          margin: 0;
        }
        .results-count {
          font-size: 13px;
          color: #6b7280;
          margin-top: 2px;
        }
        .sort label {
          font-size: 13px;
          display: flex;
          flex-direction: column;
          gap: 4px;
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
      `}</style>
    </div>
  );
}

// Map pretty labels for slug -> heading
const labelMap: Record<string, string> = {
  "new-arrivals": "New Arrivals",
  women: "Women",
  men: "Men",
  bags: "Bags",
  jewelry: "Jewelry",
  watches: "Watches",
};

export const getServerSideProps: GetServerSideProps<CategoryProps> = async (ctx) => {
  const rawSlug = String(ctx.params?.slug || "");
  const normalized = rawSlug.toLowerCase();

  // NOTE: keep category pages index-free.
  // We intentionally avoid compound Firestore queries (e.g. status IN + orderBy createdAt)
  // because they require composite indexes and were causing empty results.

  const categoryLabel =
    labelMap[normalized] ||
    normalized.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  try {
    // 1) Pull live items (single-condition query = no composite index needed)
    const snap = await adminDb
      .collection("listings")
      .where("status", "==", "Live")
      .limit(250)
      .get();

    const rawItems: (ProductLike & {
      category?: string;
      condition?: string;
      createdAt?: any;
    })[] = snap.docs.map((doc) => {
      const d = doc.data() as any;

      const image =
        d.image_url ||
        d.imageUrl ||
        d.image ||
        (Array.isArray(d.imageUrls) && d.imageUrls[0]) ||
        "";

      // Price can be stored as number or string. Normalize to number.
      const priceNum =
        typeof d.price === "number"
          ? d.price
          : typeof d.price === "string"
          ? parsePrice(d.price)
          : 0;

      return {
        id: doc.id,
        title: d.title || "",
        brand: d.brand || "",
        category: d.category || "",
        condition: d.condition || "",
        price: priceNum ? `US$${priceNum.toLocaleString()}` : "",
        image,
        href: `/product/${doc.id}`,
        createdAt: d.createdAt || null,
      } as ProductLike & { category?: string; condition?: string };
    });

    // Helpers
    const norm = (v: any) => String(v || "").trim().toLowerCase().replace(/\s+/g, " ");
    const normSlug = (v: any) =>
      norm(v).replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

    // 2) Filter items per category page
    let filtered = rawItems;

    if (normalized === "new-arrivals") {
      // nothing else, just sort
    } else {
      const wantedLabel = norm(categoryLabel);
      const wantedSlug = normalized;

      filtered = rawItems.filter((it) => {
        const cat = norm((it as any).category);
        if (!cat) return false;
        return (
          cat === wantedLabel ||
          normSlug(cat) === wantedSlug ||
          cat.replace(/\s|-/g, "") === wantedLabel.replace(/\s|-/g, "")
        );
      });
    }

    // 3) Sort newest first (server didn't order)
    filtered = filtered
      .slice()
      .sort((a: any, b: any) => {
        const aTime = a.createdAt?.toMillis?.() || 0;
        const bTime = b.createdAt?.toMillis?.() || 0;
        return bTime - aTime;
      })
      .slice(0, 60);

    const items: ProductLike[] = filtered.map(({ createdAt, ...rest }: any) => rest);

    return {
      props: {
        slug: normalized,
        label: labelMap[normalized] || normalized.toUpperCase(),
        items,
      },
    };
  } catch (err) {
    console.error("Error loading category page", err);
    return {
      props: {
        slug: normalized,
        label: labelMap[normalized] || normalized.toUpperCase(),
        items: [],
      },
    };
  }
};
