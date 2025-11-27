// FILE: /pages/designers/index.tsx

import Head from "next/head";
import Link from "next/link";
import type { GetServerSideProps } from "next";
import { useState, useEffect, useMemo } from "react";

import Header from "../../components/Header";
import Footer from "../../components/Footer";
import ProductCard, { ProductLike } from "../../components/ProductCard";
import { adminDb } from "../../utils/firebaseAdmin";

// --------------------------------------------------
// Page Props
// --------------------------------------------------

type Props = {
  items: ProductLike[];
  designers: string[];
};

// --------------------------------------------------
// Helpers
// --------------------------------------------------

const parsePrice = (p: string | number | undefined) => {
  if (!p) return 0;
  if (typeof p === "number") return p;
  return Number(p.replace(/[^0-9.-]+/g, "")) || 0;
};

// --------------------------------------------------
// Component
// --------------------------------------------------

export default function DesignersPage({ items, designers }: Props) {
  // Numeric price field added
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

  // Filters --------------------------
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

  // Apply filters
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

  // Designer checkbox handler
  const toggleDesigner = (d: string) => {
    setSelectedDesigner((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
    );
  };

  const toggleCategory = (c: string) => {
    setSelectedCategory((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    );
  };

  const toggleCondition = (c: string) => {
    setSelectedCondition((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    );
  };

  const resetFilters = () => {
    setSelectedDesigner([]);
    setSelectedCategory([]);
    setSelectedCondition([]);
    setMinPrice(0);
    setMaxPrice(10000);
  };

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

        {/* Filter Section */}
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

        {/* Items grid */}
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
        }
        .filter-section h3 {
          margin-top: 20px;
        }
        .filter-row {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 4px 0;
        }
        .price-row {
          display: flex;
          gap: 8px;
          align-items: center;
        }
        .apply-btn {
          margin-top: 18px;
          width: 100%;
          background: #111;
          color: #fff;
          padding: 10px;
          border-radius: 10px;
          border: none;
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
// Server Side: Load items + designers
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
        .filter((d) => d && typeof d === "string")
    )
  ).sort();

  return {
    props: {
      items,
      designers,
    },
  };
};// FILE: /pages/designers/index.tsx

import Head from "next/head";
import Link from "next/link";
import type { GetServerSideProps } from "next";
import { useState, useEffect, useMemo } from "react";

import Header from "../../components/Header";
import Footer from "../../components/Footer";
import ProductCard, { ProductLike } from "../../components/ProductCard";
import { adminDb } from "../../utils/firebaseAdmin";

// --------------------------------------------------
// Page Props
// --------------------------------------------------

type Props = {
  items: ProductLike[];
  designers: string[];
};

// --------------------------------------------------
// Helpers
// --------------------------------------------------

const parsePrice = (p: string | number | undefined) => {
  if (!p) return 0;
  if (typeof p === "number") return p;
  return Number(p.replace(/[^0-9.-]+/g, "")) || 0;
};

// --------------------------------------------------
// Component
// --------------------------------------------------

export default function DesignersPage({ items, designers }: Props) {
  // Numeric price field added
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

  // Filters --------------------------
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

  // Apply filters
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

  // Designer checkbox handler
  const toggleDesigner = (d: string) => {
    setSelectedDesigner((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
    );
  };

  const toggleCategory = (c: string) => {
    setSelectedCategory((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    );
  };

  const toggleCondition = (c: string) => {
    setSelectedCondition((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    );
  };

  const resetFilters = () => {
    setSelectedDesigner([]);
    setSelectedCategory([]);
    setSelectedCondition([]);
    setMinPrice(0);
    setMaxPrice(10000);
  };

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

        {/* Filter Section */}
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

        {/* Items grid */}
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
        }
        .filter-section h3 {
          margin-top: 20px;
        }
        .filter-row {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 4px 0;
        }
        .price-row {
          display: flex;
          gap: 8px;
          align-items: center;
        }
        .apply-btn {
          margin-top: 18px;
          width: 100%;
          background: #111;
          color: #fff;
          padding: 10px;
          border-radius: 10px;
          border: none;
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
// Server Side: Load items + designers
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
        .filter((d) => d && typeof d === "string")
    )
  ).sort();

  return {
    props: {
      items,
      designers,
    },
  };
}; 
