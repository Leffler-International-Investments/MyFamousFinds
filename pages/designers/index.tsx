// FILE: /pages/designers/index.tsx

import Head from "next/head";
import type { GetServerSideProps } from "next";
import { useState, useEffect, useMemo } from "react";

import Header from "../../components/Header";
import Footer from "../../components/Footer";
import ProductCard, { ProductLike } from "../../components/ProductCard";
import { adminDb } from "../../utils/firebaseAdmin";

// ------------------------------
// Helpers
// ------------------------------

const parsePrice = (p: string | number | undefined) => {
  if (!p) return 0;
  if (typeof p === "number") return p;
  return Number(p.replace(/[^0-9.-]+/g, "")) || 0;
};

type Props = {
  items: ProductLike[];
  designers: string[];
};

// ProductLike + extra fields we want to filter on
type ItemWithPrice = ProductLike & {
  priceValue: number;
  // optional fields – TS will now allow access
  designer?: string;
  category?: string;
  condition?: string;
};

// ------------------------------
// Data Constants
// ------------------------------

// Matches the consistent list used in /category/[slug]
const DESIGNER_LIST = [
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

const CATEGORY_LIST = [
  "Women",
  "Men",
  "Bags",
  "Shoes",
  "Accessories",
  "Jewelry",
  "Watches",
];

const CONDITION_LIST = ["New", "Excellent", "Very good", "Good"];

// ------------------------------
// Component
// ------------------------------

export default function DesignersPage({ items, designers }: Props) {
  const [itemsWithPrice, setItemsWithPrice] = useState<ItemWithPrice[]>([]);

  useEffect(() => {
    setItemsWithPrice(
      (items || []).map((it) => ({
        ...it,
        priceValue: parsePrice(it.price),
      }))
    );
  }, [items]);

  // Filters
  const [selectedDesigner, setSelectedDesigner] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string[]>([]);
  const [selectedCondition, setSelectedCondition] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(10000);

  const toggle = (list: string[], value: string) =>
    list.includes(value) ? list.filter((x) => x !== value) : [...list, value];

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

  // ------------------------------
  // Apply filters
  // ------------------------------

  const filteredItems = useMemo(() => {
    return itemsWithPrice.filter((item) => {
      // treat BRAND as the "designer" value; if not, fall back to designer field
      const designerName =
        (item.brand as string | undefined) || item.designer || "";

      if (
        selectedDesigner.length > 0 &&
        !selectedDesigner.includes(designerName)
      ) {
        return false;
      }

      if (
        selectedCategory.length > 0 &&
        !selectedCategory.includes(item.category || "")
      ) {
        return false;
      }

      if (
        selectedCondition.length > 0 &&
        !selectedCondition.includes(item.condition || "")
      ) {
        return false;
      }

      if (item.priceValue < minPrice || item.priceValue > maxPrice) {
        return false;
      }

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

  // ------------------------------
  // UI
  // ------------------------------

  return (
    <>
      <Head>
        <title>Featured Designers – Famous Finds</title>
      </Head>

      <Header />

      <main className="wrap">
        <h1>All Products</h1>

        {/* Filters */}
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
            {CATEGORY_LIST.map((c) => (
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

          {/* Designers (Using prop passed from Server, which is now consistent) */}
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
            {CONDITION_LIST.map((c) => (
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

        {/* Products grid */}
        <section className="items-grid">
          {filteredItems.length === 0 && (
            <p className="no-results">
              No items match these filters yet. Try adjusting your filters.
            </p>
          )}

          {filteredItems.map((item) => (
            <ProductCard key={item.id} {...item} />
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
          align-items: center;
        }

        .clear-btn {
          background: none;
          border: none;
          color: #6b7280;
          cursor: pointer;
          font-size: 13px;
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

        .price-row input {
          width: 100%;
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
          font-weight: 500;
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

// ------------------------------
// SERVER SIDE
// ------------------------------

export const getServerSideProps: GetServerSideProps = async () => {
  const snapshot = await adminDb.collection("listings").get();

  const items = snapshot.docs.map((doc) => {
    const data = doc.data() as any;

    const priceNum = Number(data.price) || 0;
    const image =
      data.image_url ||
      data.imageUrl ||
      data.image ||
      (Array.isArray(data.imageUrls) && data.imageUrls[0]) ||
      "";

    return {
      id: doc.id,
      title: data.title || "",
      brand: data.brand || "",
      price: priceNum ? `US$${priceNum.toLocaleString()}` : "",
      image,
      href: `/product/${doc.id}`,
      // extra fields if they exist
      designer: data.designer || data.brand || "",
      category: data.category || "",
      condition: data.condition || "",
    } as ProductLike & {
      designer?: string;
      category?: string;
      condition?: string;
    };
  });

  // Use the consistent list defined at the top of the file
  const designers = DESIGNER_LIST;

  return {
    props: {
      items,
      designers,
    },
  };
};
