// FILE: /pages/designers/index.tsx

import Head from "next/head";
import type { GetServerSideProps } from "next";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";

import Header from "../../components/Header";
import Footer from "../../components/Footer";
import ProductCard, { ProductLike } from "../../components/ProductCard";
import { adminDb } from "../../utils/firebaseAdmin";

// ------------------------------
// Static designers list (same as category pages)
// ------------------------------
const STATIC_DESIGNERS = [
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

// Helper to ensure price is a string for the UI
const formatPrice = (num: number): string => {
  return `US$${num.toLocaleString()}`;
};

type Props = {
  items: ProductLike[];
  designers: string[]; // full list for filters
};

// ------------------------------
// Component
// ------------------------------

export default function DesignersPage({ items, designers }: Props) {
  const router = useRouter();
  const { query } = router;

  // Initialize state from URL query to keep UI in sync
  const [selectedDesigner, setSelectedDesigner] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string[]>([]);
  const [selectedCondition, setSelectedCondition] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(100000);

  // Sync state with URL when page loads/updates
  useEffect(() => {
    if (!router.isReady) return;

    if (query.category) {
      setSelectedCategory((query.category as string).split(","));
    } else {
      setSelectedCategory([]);
    }

    if (query.designer) {
      setSelectedDesigner((query.designer as string).split(","));
    } else {
      setSelectedDesigner([]);
    }

    if (query.minPrice) setMinPrice(Number(query.minPrice));
    if (query.maxPrice) setMaxPrice(Number(query.maxPrice));
  }, [router.isReady, query]);

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
    list.includes(value) ? list.filter((x) => x !== value) : [...list, value];

  const toggleDesigner = (d: string) => {
    setSelectedDesigner((prev) => toggle(prev, d.toLowerCase()));
  };

  const toggleCategory = (c: string) =>
    setSelectedCategory((prev) => toggle(prev, c));

  const toggleCondition = (c: string) =>
    setSelectedCondition((prev) => toggle(prev, c));

  const selectedCategoriesCount = selectedCategory.length;

  const resetFilters = () => {
    setSelectedDesigner([]);
    setSelectedCategory([]);
    setSelectedCondition([]);
    setMinPrice(0);
    setMaxPrice(100000);
    router.push("/designers");
  };

  // ------------------------------
  // Apply Filters (Triggers Server Reload)
  // ------------------------------
  const applyFilters = () => {
    const params = new URLSearchParams();

    if (selectedCategoriesCount > 0) {
      params.set("category", selectedCategory.join(","));
    }

    if (selectedDesigner.length > 0) {
      params.set("designer", selectedDesigner.join(",").toLowerCase());
    }

    if (minPrice > 0) params.set("minPrice", String(minPrice));
    if (maxPrice < 100000) params.set("maxPrice", String(maxPrice));

    router.push(`/designers?${params.toString()}`);
  };

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

          {/* Designers (same list as other pages) */}
          <div className="filter-section">
            <h3>Designer</h3>
            {designers.map((d) => (
              <label key={d} className="filter-row">
                <input
                  type="checkbox"
                  checked={selectedDesigner.includes(d.toLowerCase())}
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

          <button className="apply-btn" onClick={applyFilters}>
            Apply Filters
          </button>
        </div>

        {/* Products grid */}
        <section className="items-grid">
          {items.length === 0 && (
            <p className="no-results">
              No items match these filters. Try adjusting your selection.
            </p>
          )}

          {items.map((item) => (
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

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { query } = ctx;

  const selectedCategories = (query.category as string)?.split(",") || [];
  const selectedDesigners = (query.designer as string)?.split(",") || [];
  const minPrice = Number(query.minPrice || 0);
  const maxPrice = Number(query.maxPrice || 100000);

  // 1. Fetch Active Designers and merge with static list
  let designers: string[] = STATIC_DESIGNERS.slice();
  try {
    const designersSnap = await adminDb
      .collection("designers")
      .where("active", "==", true)
      .get();

    const fromDb = designersSnap.docs
      .map((d) => (d.data() as any).name as string)
      .filter(Boolean);

    designers = Array.from(new Set([...STATIC_DESIGNERS, ...fromDb])).sort();
  } catch (error) {
    console.error("Error fetching designers:", error);
  }

  // 2. Build Listings Query
  let ref = adminDb.collection("listings").where("status", "==", "Live");

  if (selectedCategories.length > 0) {
    ref = ref.where("category", "in", selectedCategories);
  }

  const snap = await ref.get();

  // 3. Map Data
  let items = snap.docs.map((d) => {
    const data = d.data() as any;

    const image =
      data.primaryImageUrl ||
      data.image_url ||
      data.imageUrl ||
      data.image ||
      (Array.isArray(data.imageUrls) && data.imageUrls[0]) ||
      "";

    return {
      id: d.id,
      title: data.title || "Untitled",
      designer: data.designer || data.brand || "",
      category: data.category || "",
      rawPrice: Number(data.price || 0),
      image,
    };
  });

  // 4. Apply JS Filters (Designer + Price)
  if (selectedDesigners.length > 0) {
    items = items.filter((i) =>
      selectedDesigners.includes((i.designer || "").toLowerCase())
    );
  }

  items = items.filter((i) => i.rawPrice >= minPrice && i.rawPrice <= maxPrice);

  // 5. Final formatting for UI
  const formattedItems: ProductLike[] = items.map((i) => ({
    id: i.id,
    title: i.title,
    brand: i.designer,
    price: formatPrice(i.rawPrice),
    image: i.image,
    href: `/product/${i.id}`,
  }));

  return {
    props: {
      items: formattedItems,
      designers,
    },
  };
};
