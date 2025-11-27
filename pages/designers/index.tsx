// FILE: /pages/designers/index.tsx

import Head from "next/head";
import type { GetServerSideProps } from "next";
import { useState, useEffect, useMemo } from "react";

import Header from "../../components/Header";
import Footer from "../../components/Footer";
import ProductCard, { ProductLike } from "../../components/ProductCard";
import { adminDb } from "../../utils/firebaseAdmin";

// --------------------------------------------------
// Helpers
// --------------------------------------------------

const parsePrice = (p: string | number | undefined) => {
  if (!p) return 0;
  if (typeof p === "number") return p;
  return Number(p.replace(/[^0-9.-]+/g, "")) || 0;
};

// --------------------------------------------------
// Page Component
// --------------------------------------------------

type Props = {
  items: ProductLike[];
  designers: string[];
};

export default function DesignersPage({ items, designers }: Props) {
  type ItemWithPrice = ProductLike & { priceValue: number };

  const [itemsWithPrice, setItemsWithPrice] = useState<ItemWithPrice[]>([]);

  useEffect(() => {
    setItemsWithPrice(
      (items || []).map((it) => ({
        ...it,
        priceValue: parsePrice(it.price),
      }))
    );
  }, [items]);

  // -------------------------
  // Filters
  // -------------------------
  const [selectedDesigner, setSelectedDesigner] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string[]>([]);
  const [selectedCondition, setSelectedCondition] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(10000);

  const categories = [
    "Women",
    "Men",
    "Bags",
    "Shoes",
    "Accessories",
    "Jewelry",
    "Watches",
  ];

  const conditions = ["New", "Excellent", "Very good", "Good"];

  const toggle = (list: string[], value: string) =>
    list.includes(value)
      ? list.filter((x) => x !== value)
      : [...list, value];

  const toggleDesigner = (d: string) =>
    setSelectedDesigner((prev) => toggle(prev, d));

  const toggleCategory = (c: string) =>
    setSelectedCategory((prev) => toggle(prev, c));

  const toggleCondition = (c: string) =>
    setSelectedCondition((prev) => toggle(prev, c));

  const resetFilters = () => {
    setSelectedDesigner([]);
    setSelectedCategory([]);
    setSelectedCondition([]);
    setMinPrice(0);
    setMaxPrice(10000);
  };

  // -------------------------
  // Apply filters
  // -------------------------

  const filteredItems = useMemo(() => {
    return itemsWithPrice.filter((item) => {
      if (
        selectedDesigner.length > 0 &&
        !selectedDesigner.includes(item.designer || "")
      )
        return false;

      if (
        selectedCategory.length > 0 &&
        !selectedCategory.includes(item.category || "")
      )
        return false;

      if (
        selectedCondition.length > 0 &&
        !selectedCondition.includes(item.condition || "")
      )
        return false;

      if (item.priceValue < minPrice || item.priceValue > maxPrice)
        return false;

      return true;
    });
  }, [
    itemsWithPrice,
    selectedDesigner,
    selectedCategory,
    selectedCondition,
    minPrice,
    maxPrice,
  ]);

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  return (
    <>
      <Head>
        <title>Featured Designers – Famous Finds</title>
      </Head>

      <Header />

      <main className="wrap">
        <h1>All Products</h1>

        {/* --------------------- */}
        {/* Filters */}
        {/* --------------------- */}

        <div className="filters-box">
          <div className="filters-header">
            <h2>Filters</h2>
            <button className="clear-btn" onClick={resetFilters}>
              Clear All
            </button>
          </div>

          {/* Category */}
          <div className="filter-section">
            <h3>Category</h3>
            {categories.map((c) => (
              <label key={c} className="filter-row">
                <input
                  type="checkbox"
                  checked={selectedCategory.includes(c)}
                  onChange={() => toggleCategory(c)}
                />
                {c}
              </label>
            ))}
          </div>

          {/* Designers */}
          <div className="filter-section">
            <h3>Designer</h3>
            {designers.map((d) => (
              <label key={d} className="filter-row">
                <input
                  type="checkbox"
                  checked={selectedDesigner.includes(d)}
                  onChange={() => toggleDesigner(d)}
                />
                {d}
              </label>
            ))}
          </div>

          {/* Condition */}
          <div className="filter-section">
            <h3>Condition</h3>
            {conditions.map((c) => (
              <label key={c} className="filter-row">
                <input
                  type="checkbox"
                  checked={selectedCondition.includes(c)}
                  onChange={() => toggleCondition(c)}
                />
                {c}
              </label>
            ))}
          </div>

          {/* Price */}
          <div className="filter-section">
            <h3>Price</h3>
            <div className="price-row">
              <input
                type="number"
                value={minPrice}
                onChange={(e) => setMinPrice(Number(e.target.value))}
              />
              <span>-</span>
              <input
                type="number"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
              />
            </div>
          </div>

          <button className="apply-btn">Apply Filters</button>
        </div>

        {/* --------------------- */}
        {/* Products Grid */}
        {/* --------------------- */}

        <section className="items-grid">
          {filteredItems.length === 0 && (
            <p className="no-results">
              No items match these filters yet. Try adjusting your filters.
            </p>
          )}

          {filteredItems.map((item) => (
            <ProductCard key={item.id} product={item} />
          ))}
        </section>
      </main>

      <Footer />

      {/* --------------------- */}
      {/* Styling */}
      {/* --------------------- */}

      <style jsx>{`
        .wrap {
          max-width: 1300px;
          margin: 40px auto;
          padding: 0 16px;
        }

        h1 {
          font-family: Georgia, serif;
        }

        .filters-box {
          margin-top: 16px;
          margin-bottom: 24px;
          padding: 20px;
          border: 1px solid #e5e7eb;
          border-radius: 20px;
          background: #fff;
        }

        .filters-header {
          display: flex;
          justify-content: space-between;
        }

        .clear-btn {
          background: none;
          border: none;
          color: #6b7280;
          cursor: pointer;
        }

        .filter-section h3 {
          margin-top: 20px;
          font-size: 16px;
          font-weight: 600;
        }

        .filter-row {
          display: flex;
          gap: 8px;
          align-items: center;
          padding: 4px 0;
          font-size: 14px;
        }

        .price-row {
          display: flex;
          gap: 8px;
          align-items: center;
          margin-top: 4px;
        }

        .apply-btn {
          margin-top: 18px;
          width: 100%;
          background: #111;
          color: #fff;
          padding: 10px;
          border-radius: 10px;
          border: none;
          cursor: pointer;
        }

        .items-grid {
          margin-top: 30px;
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 20px;
        }

        .no-results {
          color: #6b7280;
        }
      `}</style>
    </>
  );
}

// --------------------------------------------------
// SERVER SIDE
// --------------------------------------------------

export const getServerSideProps: GetServerSideProps = async () => {
  const snapshot = await adminDb.collection("listings").get();

  const items = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as ProductLike[];

  const designers = Array.from(
    new Set(
      items
        .map((i) => i.designer)
        .filter((d) => typeof d === "string" && d.length > 0)
    )
  ).sort();

  return {
    props: {
      items,
      designers,
    },
  };
};
