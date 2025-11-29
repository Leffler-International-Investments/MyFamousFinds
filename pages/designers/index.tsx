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

// Extend ProductLike with calculated + optional fields
type ItemWithPrice = ProductLike & {
  priceValue: number;
  category?: string;
  condition?: string;
};

type DesignersPageProps = {
  items: ProductLike[];
};

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

// FULL STATIC DESIGNERS LIST
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

// Helper: parse "US$1,200" → 1200
function parsePrice(price?: string | null): number {
  if (!price) return 0;
  const cleaned = price.replace(/[^0-9.,]/g, "").replace(/,/g, "");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

const DesignersPage: NextPage<DesignersPageProps> = ({ items }) => {
  const router = useRouter();

  // Base items with numeric prices
  const baseItems: ItemWithPrice[] = (items || []).map((it: any) => ({
    ...it,
    priceValue: parsePrice(it.price),
    category: it.category || "",
    condition: it.condition || "",
  }));

  // Filters
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedDesigners, setSelectedDesigners] = useState<string[]>([]);
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState<number | "">(0);
  const [maxPrice, setMaxPrice] = useState<number | "">(100000);
  const [sortBy, setSortBy] = useState<"newest" | "price-asc" | "price-desc">(
    "newest"
  );

  // Helpers
  function toggleInList(list: string[], value: string): string[] {
    return list.includes(value)
      ? list.filter((v) => v !== value)
      : [...list, value];
  }

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

  // Apply button = sync to URL (engine is already live)
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

  // CLIENT-SIDE engine: category + designer + condition + price + sort
  const filteredItems = useMemo(() => {
    let result = [...baseItems];

    // Normalize helpers
    const normList = (arr: string[]) =>
      arr.map((v) => v.toLowerCase().trim());
    const normSelectedCategories = normList(selectedCategories);
    const normSelectedDesigners = normList(selectedDesigners);
    const normSelectedConditions = normList(selectedConditions);

    if (selectedCategories.length > 0) {
      result = result.filter((i) => {
        const cat = (i.category || "").toLowerCase().trim();
        return cat && normSelectedCategories.includes(cat);
      });
    }

    if (selectedDesigners.length > 0) {
      result = result.filter((i) => {
        const brand = (i.brand || "").toLowerCase().trim();
        return brand && normSelectedDesigners.includes(brand);
      });
    }

    if (selectedConditions.length > 0) {
      result = result.filter((i) => {
        const cond = (i.condition || "").toLowerCase().trim();
        return cond && normSelectedConditions.includes(cond);
      });
    }

    result = result.filter((i) => {
      const p = i.priceValue;
      if (typeof minPrice === "number" && p < minPrice) return false;
      if (typeof maxPrice === "number" && p > maxPrice) return false;
      return true;
    });

    if (sortBy === "price-asc") {
      result.sort((a, b) => a.priceValue - b.priceValue);
    } else if (sortBy === "price-desc") {
      result.sort((a, b) => b.priceValue - a.priceValue);
    }
    // "newest" keeps server order

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
            {/* FILTERS */}
            <aside className="filters">
              <div className="filters-header">
                <h2>Filters</h2>
                <button type="button" onClick={resetFilters}>
                  Clear All
                </button>
              </div>

              {/* Category */}
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

              {/* Designer – FULL STATIC LIST */}
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

              {/* Condition */}
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

              {/* Price */}
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
                          e.target.value === ""
                            ? ""
                            : Number(e.target.value) || 0
                        )
                      }
                    />
                  </div>
                  <span className="price-separator">-</span>
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

            {/* RESULTS */}
            <section className="results">
              <div className="results-header">
                <div>
                  <h1>All Products</h1>
                  <p className="results-count">
                    {resultsCount}{" "}
                    {resultsCount === 1 ? "result" : "results"}
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
                      <option value="price-asc">
                        Price: Low to High
                      </option>
                      <option value="price-desc">
                        Price: High to Low
                      </option>
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
};

export default DesignersPage;

// ----------------------
// SERVER-SIDE DATA LOAD
// ----------------------
export const getServerSideProps: GetServerSideProps<
  DesignersPageProps
> = async () => {
  try {
    // EXACTLY LIKE HOMEPAGE: only Live listings (approved)
    const snapshot = await adminDb
      .collection("listings")
      .where("status", "==", "Live")
      .get();

    const items: ProductLike[] = snapshot.docs.map((doc) => {
      const data = doc.data() as any;

      return {
        id: doc.id,
        title: data.title || "",
        brand: data.brand || "",
        price: data.price ? `US$${Number(data.price).toLocaleString()}` : "",
        image:
          data.image_url ||
          data.imageUrl ||
          data.image ||
          (Array.isArray(data.imageUrls) && data.imageUrls.length > 0
            ? data.imageUrls[0]
            : ""),
        href: `/product/${doc.id}`,
        category: data.category || "",
        condition: data.condition || "",
      } as ProductLike & { category?: string; condition?: string };
    });

    return {
      props: { items },
    };
  } catch (err) {
    console.error("Error loading designers listings", err);
    return {
      props: { items: [] },
    };
  }
};
