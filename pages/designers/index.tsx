// FILE: /pages/designers/index.tsx

import Head from "next/head";
import type { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import { useMemo } from "react";

import Header from "../../components/Header";
import Footer from "../../components/Footer";
import ProductCard, { ProductLike } from "../../components/ProductCard";
import { adminDb } from "../../utils/firebaseAdmin";

// ------------------------------------
// Constants
// ------------------------------------

const CATEGORY_FILTERS = [
  "Women",
  "Men",
  "Bags",
  "Shoes",
  "Accessories",
  "Jewelry",
  "Watches",
];

const DESIGNER_FILTERS = [
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

// MATCHED 1:1 WITH /seller/bulk-simple CONDITION DROPDOWN
const CONDITION_FILTERS = [
  "New with tags",
  "New (never used)",
  "Excellent",
  "Very good",
  "Good",
  "Fair",
];

type DesignersPageProps = {
  items: ProductLike[];
  selectedCategories: string[];
  selectedDesigner: string | null;
  selectedConditions: string[];
  minPrice: number;
  maxPrice: number;
};

// ------------------------------------
// Helpers
// ------------------------------------

function toArray(value: string | string[] | undefined): string[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function parseNumber(value: string | string[] | undefined, fallback: number) {
  if (!value) return fallback;
  const s = Array.isArray(value) ? value[0] : value;
  const n = Number(s);
  return Number.isFinite(n) ? n : fallback;
}

// ------------------------------------
// Page Component
// ------------------------------------

export default function DesignersPage(props: DesignersPageProps) {
  const {
    items,
    selectedCategories,
    selectedDesigner,
    selectedConditions,
    minPrice,
    maxPrice,
  } = props;

  const router = useRouter();

  const resultsLabel = useMemo(() => {
    if (!items.length) return "0 results";
    if (items.length === 1) return "1 result";
    return `${items.length} results`;
  }, [items]);

  return (
    <>
      <Head>
        <title>Designers – All Products | Famous Finds</title>
        <meta
          name="description"
          content="Shop authenticated luxury pieces by designer, category, condition and price on Famous Finds."
        />
      </Head>

      <Header />

      <main className="ff-page-shell">
        <div className="ff-page-inner">
          {/* Breadcrumb */}
          <div className="ff-breadcrumb">
            <span>Home</span>
            <span className="ff-breadcrumb-sep">/</span>
            <span>Designers</span>
          </div>

          <div className="ff-products-layout">
            {/* -------------------- */}
            {/* Filters sidebar     */}
            {/* -------------------- */}
            <aside className="ff-filters">
              <div className="ff-filters-header">
                <h2 className="ff-filters-title">Filters</h2>
                <button
                  type="button"
                  className="ff-filters-clear"
                  onClick={() => router.push("/designers")}
                >
                  Clear All
                </button>
              </div>

              {/* We use a GET form so filters map directly to URL query
                  and SSR picks them up in getServerSideProps */}
              <form method="get" action="/designers" className="ff-filters-form">
                {/* CATEGORY */}
                <section className="ff-filter-block">
                  <h3 className="ff-filter-heading">Category</h3>
                  <div className="ff-filter-options">
                    {CATEGORY_FILTERS.map((cat) => (
                      <label key={cat} className="ff-filter-checkbox">
                        <input
                          type="checkbox"
                          name="category"
                          value={cat}
                          defaultChecked={selectedCategories.includes(cat)}
                        />
                        <span>{cat}</span>
                      </label>
                    ))}
                  </div>
                </section>

                {/* DESIGNER */}
                <section className="ff-filter-block">
                  <h3 className="ff-filter-heading">Designer</h3>
                  <div className="ff-filter-options">
                    {DESIGNER_FILTERS.map((d) => (
                      <label key={d} className="ff-filter-checkbox">
                        <input
                          type="radio"
                          name="designer"
                          value={d}
                          defaultChecked={selectedDesigner === d}
                        />
                        <span>{d}</span>
                      </label>
                    ))}
                  </div>
                </section>

                {/* CONDITION – EXACT MATCH WITH SELLER CONDITIONS */}
                <section className="ff-filter-block">
                  <h3 className="ff-filter-heading">Condition</h3>
                  <div className="ff-filter-options">
                    {CONDITION_FILTERS.map((cond) => (
                      <label key={cond} className="ff-filter-checkbox">
                        <input
                          type="checkbox"
                          name="condition"
                          value={cond}
                          defaultChecked={selectedConditions.includes(cond)}
                        />
                        <span>{cond}</span>
                      </label>
                    ))}
                  </div>
                </section>

                {/* PRICE */}
                <section className="ff-filter-block">
                  <h3 className="ff-filter-heading">Price</h3>
                  <div className="ff-price-row">
                    <div className="ff-price-field">
                      <label htmlFor="minPrice">Min</label>
                      <input
                        id="minPrice"
                        name="minPrice"
                        type="number"
                        min={0}
                        defaultValue={minPrice}
                      />
                    </div>
                    <span className="ff-price-sep">–</span>
                    <div className="ff-price-field">
                      <label htmlFor="maxPrice">Max</label>
                      <input
                        id="maxPrice"
                        name="maxPrice"
                        type="number"
                        min={0}
                        defaultValue={maxPrice || ""}
                      />
                    </div>
                  </div>
                </section>

                <button type="submit" className="ff-apply-btn">
                  Apply Filters
                </button>
              </form>
            </aside>

            {/* -------------------- */}
            {/* Results grid        */}
            {/* -------------------- */}
            <section className="ff-products-section">
              <div className="ff-products-header">
                <h1 className="ff-products-title">All Products</h1>
                <div className="ff-products-meta">
                  <span className="ff-results-count">{resultsLabel}</span>
                  {/* Sort placeholder – wired later if needed */}
                  <div className="ff-sort">
                    <label htmlFor="sort">Sort</label>
                    <select id="sort" name="sort" defaultValue="Newest">
                      <option value="Newest">Newest</option>
                      <option value="PriceLowHigh">Price: Low to High</option>
                      <option value="PriceHighLow">Price: High to Low</option>
                    </select>
                  </div>
                </div>
              </div>

              {items.length === 0 ? (
                <div className="ff-empty-state">
                  <p className="ff-empty-title">
                    No items match these filters yet.
                  </p>
                  <p className="ff-empty-sub">
                    Try adjusting your filters or checking back soon.
                  </p>
                </div>
              ) : (
                <div className="ff-products-grid">
                  {items.map((item) => (
                    <ProductCard key={item.id} product={item} />
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </main>

      <Footer />

      {/* PAGE STYLES – matches existing layout */}
      <style jsx>{`
        .ff-page-shell {
          background: #f7f4f0;
          min-height: 100vh;
        }
        .ff-page-inner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 32px 16px 64px;
        }
        .ff-breadcrumb {
          font-size: 13px;
          color: #777;
          margin-bottom: 16px;
        }
        .ff-breadcrumb-sep {
          margin: 0 6px;
        }
        .ff-products-layout {
          display: grid;
          grid-template-columns: 280px minmax(0, 1fr);
          gap: 32px;
        }
        @media (max-width: 900px) {
          .ff-products-layout {
            grid-template-columns: 1fr;
          }
        }
        .ff-filters {
          background: #fff;
          border-radius: 12px;
          padding: 20px 18px 24px;
          box-shadow: 0 6px 18px rgba(15, 23, 42, 0.06);
        }
        .ff-filters-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }
        .ff-filters-title {
          font-size: 18px;
          font-weight: 600;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }
        .ff-filters-clear {
          font-size: 13px;
          color: #6b7280;
          text-decoration: underline;
          background: none;
          border: none;
          cursor: pointer;
        }
        .ff-filter-block {
          margin-top: 16px;
          padding-top: 14px;
          border-top: 1px solid #e5e7eb;
        }
        .ff-filter-heading {
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 10px;
        }
        .ff-filter-options {
          display: grid;
          gap: 4px;
        }
        .ff-filter-checkbox {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: #111827;
        }
        .ff-filter-checkbox input {
          width: 14px;
          height: 14px;
          accent-color: #111827;
        }
        .ff-price-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .ff-price-field {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .ff-price-field label {
          font-size: 12px;
          color: #6b7280;
        }
        .ff-price-field input {
          border-radius: 999px;
          border: 1px solid #d1d5db;
          padding: 6px 10px;
          font-size: 13px;
          width: 100%;
        }
        .ff-price-sep {
          font-size: 12px;
          color: #6b7280;
        }
        .ff-apply-btn {
          margin-top: 18px;
          width: 100%;
          border-radius: 999px;
          border: none;
          padding: 10px 14px;
          font-size: 14px;
          font-weight: 600;
          background: #020617;
          color: #f9fafb;
          cursor: pointer;
        }
        .ff-apply-btn:hover {
          background: #111827;
        }

        .ff-products-section {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .ff-products-header {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 16px;
        }
        .ff-products-title {
          font-size: 28px;
          font-weight: 700;
        }
        .ff-products-meta {
          display: flex;
          align-items: center;
          gap: 16px;
          font-size: 13px;
        }
        .ff-sort {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .ff-sort select {
          border-radius: 999px;
          border: 1px solid #d1d5db;
          padding: 4px 10px;
          font-size: 13px;
          background: #fff;
        }
        .ff-products-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 24px;
        }
        .ff-empty-state {
          margin-top: 40px;
          padding: 32px 24px;
          background: #fff;
          border-radius: 16px;
          text-align: center;
          box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
        }
        .ff-empty-title {
          font-weight: 600;
          margin-bottom: 6px;
        }
        .ff-empty-sub {
          font-size: 14px;
          color: #6b7280;
        }
      `}</style>
    </>
  );
}

// ------------------------------------
// Server-side data (Firestore)
// ------------------------------------

export const getServerSideProps: GetServerSideProps<
  DesignersPageProps
> = async (ctx) => {
  const q = ctx.query;

  const selectedCategories = toArray(q.category);
  const selectedDesignerArr = toArray(q.designer);
  const selectedDesigner = selectedDesignerArr[0] || null;
  const selectedConditions = toArray(q.condition);

  const minPrice = parseNumber(q.minPrice, 0);
  const maxPrice = parseNumber(q.maxPrice, 100000);

  // Base query – only LIVE listings
  let query: FirebaseFirestore.Query = adminDb
    .collection("listings")
    .where("status", "==", "Live");

  if (selectedDesigner) {
    query = query.where("designer", "==", selectedDesigner);
  }

  // Condition: exact match with seller bulk-simple values
  if (selectedConditions.length > 0) {
    // Only valid values
    const validConds = selectedConditions.filter((c) =>
      CONDITION_FILTERS.includes(c)
    );
    if (validConds.length > 0) {
      // Firestore "in" query on condition
      query = query.where("condition", "in", validConds);
    }
  }

  // Price range
  if (minPrice > 0) {
    query = query.where("price", ">=", minPrice);
  }
  if (maxPrice > 0) {
    query = query.where("price", "<=", maxPrice);
  }

  // Fetch docs
  const snap = await query.limit(200).get();

  let items: ProductLike[] = snap.docs.map((doc) => {
    const data = doc.data() as any;
    return {
      id: doc.id,
      title: data.title || "",
      price: data.price || 0,
      brand: data.designer || data.designerName || "",
      designer: data.designer || data.designerName || "",
      imageUrl:
        (data.images && (data.images[0]?.url || data.images[0])) ||
        "/placeholder-product.png",
      category: data.category || "",
      condition: data.condition || "",
      // spread the rest so ProductCard has anything else it expects
      ...data,
    } as unknown as ProductLike;
  });

  // If multiple categories were checked, filter in memory.
  if (selectedCategories.length > 0) {
    items = items.filter((item: any) =>
      selectedCategories.includes(item.category)
    );
  }

  // Sort newest first if we have createdAt
  items.sort((a: any, b: any) => {
    const ta = (a.createdAt?._seconds || a.createdAt?._seconds) ?? 0;
    const tb = (b.createdAt?._seconds || b.createdAt?._seconds) ?? 0;
    return tb - ta;
  });

  return {
    props: {
      items,
      selectedCategories,
      selectedDesigner,
      selectedConditions,
      minPrice,
      maxPrice,
    },
  };
};
