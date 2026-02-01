// FILE: /pages/designers/index.tsx

import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useMemo, useState } from "react";
import type { GetServerSideProps, NextPage } from "next";

import Header from "../../components/Header";
import Footer from "../../components/Footer";
import ProductCard, { ProductLike } from "../../components/ProductCard";
import { adminDb } from "../../utils/firebaseAdmin";

// --------------------------------------------------
// Types
// --------------------------------------------------

type ItemWithMeta = ProductLike & {
  priceValue: number;
  category?: string;
  condition?: string;
  brand?: string;
};

type DesignersPageProps = {
  items: ItemWithMeta[];
};

// --------------------------------------------------
// Filter options
// --------------------------------------------------

const CATEGORY_OPTIONS = [
  "Women",
  "Men",
  "Bags",
  "Shoes",
  "Accessories",
  "Jewelry",
  "Watches",
];

// ✅ MATCHED TO /pages/seller/bulk-simple.tsx CONDITIONS
const CONDITION_OPTIONS = [
  "New with tags",
  "New (never used)",
  "Excellent",
  "Very good",
  "Good",
  "Fair",
];

const DESIGNER_OPTIONS = [
  "Alexander McQueen",
  "Balenciaga",
  "Bottega Veneta",
  "Burberry",
  "Dior",
  "Fendi",
  "Givenchy",
  "Goyard",
  "Gucci",
  "Hermès",
  "Louis Vuitton",
  "Prada",
  "Saint Laurent",
  "Valentino",
  "Versace",
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
    .trim()
    .replace(/[^a-z0-9]+/g, "");
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  const aLen = a.length;
  const bLen = b.length;
  if (aLen === 0) return bLen;
  if (bLen === 0) return aLen;

  const matrix: number[][] = [];
  for (let i = 0; i <= bLen; i++) matrix[i] = [i];
  for (let j = 0; j <= aLen; j++) matrix[0][j] = j;

  for (let i = 1; i <= bLen; i++) {
    for (let j = 1; j <= aLen; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + 1
        );
      }
    }
  }

  return matrix[bLen][aLen];
}

// canonical tokens used for matching
function canonCategory(raw: string): string {
  const n = normalize(raw);
  if (!n) return "";
  if (n === "women") return "women";
  if (n === "men") return "men";
  if (n === "bags" || n === "bag") return "bags";
  if (n === "shoes" || n === "shoe" || n === "footwear") return "shoes";
  if (n === "accessories" || n === "accessory") return "accessories";
  if (n === "jewelry" || n === "jewellery") return "jewelry";
  if (n === "watches" || n === "watch") return "watches";
  return n;
}

// ✅ SIMPLIFIED: just normalise, so the exact labels match
function canonCondition(raw: string): string {
  return normalize(raw);
}

function canonBrand(raw: string): string {
  return normalize(raw);
}

// MUCH SMARTER BRAND MATCHING:
// - exact
// - substring (e.g. "louis vuitton heels")
// - small typo distance
function brandMatches(selected: string, actual: string): boolean {
  const sel = canonBrand(selected);
  const act = canonBrand(actual);
  if (!sel || !act) return false;

  // substring match first
  if (act.includes(sel) || sel.includes(act)) return true;

  // fuzzy match for typos / small differences
  const dist = levenshtein(sel, act);
  return dist <= 4;
}

const pickImage = (data: any): string => {
  if (data.image_url) return data.image_url;
  if (data.imageUrl) return data.imageUrl;
  if (data.image) return data.image;
  if (Array.isArray(data.imageUrls) && data.imageUrls.length > 0) {
    return data.imageUrls[0];
  }
  return "";
};

// --------------------------------------------------
// Component
// --------------------------------------------------

const DesignersPage: NextPage<DesignersPageProps> = ({ items }) => {
  const router = useRouter();

  const baseItems: ItemWithMeta[] = (items || []).map((it: any) => ({
    ...it,
    priceValue: parsePrice(it.price),
    category: it.category || "",
    condition: it.condition || "",
    brand: it.brand || "",
  }));

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedDesigners, setSelectedDesigners] = useState<string[]>([]);
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState<number | "">(0);
  const [maxPrice, setMaxPrice] = useState<number | "">(100000);
  const [sortBy, setSortBy] = useState<"newest" | "price-asc" | "price-desc">(
    "newest"
  );

  const toggleInList = (list: string[], value: string): string[] =>
    list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

  const onCategoryChange = (name: string) =>
    setSelectedCategories((prev) => toggleInList(prev, name));
  const onDesignerChange = (name: string) =>
    setSelectedDesigners((prev) => toggleInList(prev, name));
  const onConditionChange = (name: string) =>
    setSelectedConditions((prev) => toggleInList(prev, name));

  const resetFilters = () => {
    setSelectedCategories([]);
    setSelectedDesigners([]);
    setSelectedConditions([]);
    setMinPrice(0);
    setMaxPrice(100000);
  };

  // keep URL in sync (optional – real filtering is client-side below)
  const applyFiltersToUrl = () => {
    const query: Record<string, string> = {};

    if (selectedCategories[0]) query.category = selectedCategories[0];
    if (selectedDesigners[0]) query.designer = selectedDesigners[0];
    if (selectedConditions[0]) query.condition = selectedConditions[0];
    if (typeof minPrice === "number") query.minPrice = String(minPrice);
    if (typeof maxPrice === "number") query.maxPrice = String(maxPrice);

    router.replace({ pathname: "/designers", query }, undefined, {
      shallow: true,
    });
  };

  const filteredItems = useMemo(() => {
    let result = [...baseItems];

    const normSelectedCats = selectedCategories.map((c) => canonCategory(c));
    const normSelectedConds = selectedConditions.map((c) => canonCondition(c));

    // CATEGORY FILTER – smart, partial match
    if (selectedCategories.length > 0) {
      result = result.filter((item) => {
        const itemCatNorm = normalize(item.category || "");
        if (!itemCatNorm) return false;
        return normSelectedCats.some((sel) =>
          itemCatNorm.includes(canonCategory(sel))
        );
      });
    }

    // DESIGNER FILTER – uses brandMatches
    if (selectedDesigners.length > 0) {
      result = result.filter((item) => {
        const actualBrand = item.brand || "";
        if (!actualBrand) return false;
        return selectedDesigners.some((sel) => brandMatches(sel, actualBrand));
      });
    }

    // CONDITION FILTER – smart, matches the *normalised* labels
    if (selectedConditions.length > 0) {
      result = result.filter((item) => {
        const itemCondNorm = canonCondition(item.condition || "");
        if (!itemCondNorm) return false;
        return normSelectedConds.some((sel) => itemCondNorm === sel);
      });
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
    selectedCategories,
    selectedDesigners,
    selectedConditions,
    minPrice,
    maxPrice,
    sortBy,
  ]);

  const resultsCount = filteredItems.length;

  return (
    <div className="designers-page">
      <Head>
        <title>Designers – All Products | Famous Finds</title>
      </Head>

      <Header />

      <main className="page-main">
        <div className="page-inner">
          <div className="breadcrumb">
            <Link href="/">Home</Link>
            <span>/</span>
            <span>Designers</span>
          </div>

          <div className="layout">
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
                  {DESIGNER_OPTIONS.map((name) => (
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

                {/* ✅ FIXED: stack Min and Max vertically (Max under Price) */}
                <div className="price-row">
                  <div className="price-input">
                    <span>Min</span>
                    <input
                      type="number"
                      value={minPrice}
                      onChange={(e) =>
                        setMinPrice(
                          e.target.value === ""
                            ? ""
                            : Number(e.target.value) || 0
                        )
                      }
                    />
                  </div>

                  <div className="price-input">
                    <span>Max</span>
                    <input
                      type="number"
                      value={maxPrice}
                      onChange={(e) =>
                        setMaxPrice(
                          e.target.value === ""
                            ? ""
                            : Number(e.target.value) || 0
                        )
                      }
                    />
                  </div>
                </div>

                <button
                  type="button"
                  className="apply-btn"
                  onClick={applyFiltersToUrl}
                >
                  Apply Filters
                </button>
              </div>
            </aside>

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

        /* ✅ FIXED: vertical layout so Max never spills out */
        .price-row {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-bottom: 10px;
        }
        .price-input {
          display: flex;
          flex-direction: column;
          gap: 4px;
          font-size: 13px;
        }
        .price-input input {
          width: 100%;
          box-sizing: border-box;
          border-radius: 999px;
          border: 1px solid #d1d5db;
          padding: 6px 10px;
          font-size: 14px;
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
};

export default DesignersPage;

// --------------------------------------------------
// SERVER-SIDE DATA LOAD
// --------------------------------------------------

export const getServerSideProps: GetServerSideProps<
  DesignersPageProps
> = async () => {
  try {
    const snapshot = await adminDb
      .collection("listings")
      .where("status", "==", "Live")
      .get();

    const items: ItemWithMeta[] = snapshot.docs.map((doc) => {
      const d: any = doc.data() || {};

      // try all possible field names used in forms
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

      const priceNum =
        typeof d.price === "number" ? d.price : Number(d.price || 0);
      const price = priceNum
        ? `US$${priceNum.toLocaleString("en-US")}`
        : "";

      const image = pickImage(d);

      return {
        id: doc.id,
        title: d.title || "",
        brand: brandRaw,
        category: categoryRaw,
        condition: conditionRaw,
        price,
        image,
        href: `/product/${doc.id}`,
        priceValue: priceNum || 0,
      };
    });

    return { props: { items } };
  } catch (err) {
    console.error("Error loading designers listings", err);
    return { props: { items: [] } };
  }
};
