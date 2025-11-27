// FILE: /pages/designers/index.tsx

import Head from "next/head";
import Link from "next/link";
import type { GetServerSideProps } from "next";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import ProductCard, { ProductLike } from "../../components/ProductCard";
import { adminDb } from "../../utils/firebaseAdmin";

type Designer = {
  id: string;
  name: string;
  slug: string;
};

type DesignersPageProps = {
  designers: Designer[];
  items: ProductLike[];
};

type ItemWithPrice = ProductLike & { priceValue: number };

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

// You can edit these lists any time.
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

const DEFAULT_DESIGNERS = [
  "Chanel",
  "Hermès",
  "Louis Vuitton",
  "Gucci",
  "Prada",
  "Dior",
  "Rolex",
];

export default function DesignersIndexPage({
  designers,
  items,
}: DesignersPageProps) {
  // A–Z grouping for directory section
  const grouped: Record<string, Designer[]> = {};
  designers.forEach((d) => {
    const first = d.name.charAt(0).toUpperCase();
    const key = /[A-Z]/.test(first) ? first : "#";
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(d);
  });
  const letters = Object.keys(grouped).sort();

  // Products with numeric price
  const [itemsWithPrice] = useState<ItemWithPrice[]>(() =>
    (items || []).map((item) => ({
      ...item,
      priceValue: parsePrice(item.price),
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

  const [designerOptions, setDesignerOptions] =
    useState<string[]>(DEFAULT_DESIGNERS);

  // Load designer names for filter (from API, then fallback)
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

      // Fallback: from items or constant list
      const fromItems = Array.from(
        new Set(
          itemsWithPrice
            .map((i) => (i.brand || "").trim())
            .filter(Boolean)
        )
      ).sort((a, b) => a.localeCompare(b));

      if (fromItems.length > 0) {
        setDesignerOptions(fromItems);
      } else {
        setDesignerOptions(DEFAULT_DESIGNERS);
      }
    }

    loadDesigners();
  }, [itemsWithPrice]);

  // Helpers to toggle selections
  function toggle(list: string[], value: string): string[] {
    return list.includes(value)
      ? list.filter((v) => v !== value)
      : [...list, value];
  }
  const onCategoryChange = (name: string) =>
    setSelectedCategories((prev) => toggle(prev, name));
  const onDesignerChange = (name: string) =>
    setSelectedDesigners((prev) => toggle(prev, name));
  const onConditionChange = (name: string) =>
    setSelectedConditions((prev) => toggle(prev, name));

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

    if (selectedDesigners.length > 0) {
      result = result.filter((item) =>
        item.brand ? selectedDesigners.includes(item.brand) : false
      );
    }

    result = result.filter((item) => {
      const price = item.priceValue;
      if (typeof minPrice === "number" && price < minPrice) return false;
      if (typeof maxPrice === "number" && price > maxPrice) return false;
      return true;
    });

    // Category + condition filters can be wired to real fields later.

    if (sortBy === "price-asc") {
      result.sort((a, b) => a.priceValue - b.priceValue);
    } else if (sortBy === "price-desc") {
      result.sort((a, b) => b.priceValue - a.priceValue);
    }

    return result;
  }, [itemsWithPrice, selectedDesigners, minPrice, maxPrice, sortBy]);

  const resultsCount = filteredItems.length;

  return (
    <div className="designers-page">
      <Head>
        <title>Designers Directory – Famous Finds</title>
      </Head>

      <Header />

      <main className="page-main">
        <div className="page-inner">
          {/* HERO */}
          <section className="hero">
            <h1>Featured Designers</h1>
            <p>
              Discover the world&apos;s most coveted luxury brands,
              authenticated and ready for a second life.
            </p>
          </section>

          {/* FILTERS + PRODUCTS */}
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
                          e.target.value === ""
                            ? ""
                            : Number(e.target.value) || 0
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
                  onClick={() => {
                    // filters are live already
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
                  <h2>All Products</h2>
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
                  <h3>No designers found yet.</h3>
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

          {/* A–Z Directory under the products */}
          {letters.length > 0 && (
            <section className="directory">
              {letters.map((letter) => (
                <section key={letter} className="letter-block">
                  <div className="letter-heading">
                    <span className="letter">{letter}</span>
                    <div className="divider" />
                  </div>

                  <div className="designer-grid">
                    {grouped[letter].map((d) => (
                      <Link
                        key={d.id}
                        href={`/designers/${d.slug || d.id}`}
                        className="designer-card"
                      >
                        <span className="designer-name">{d.name}</span>
                        <span className="designer-cta">View pieces →</span>
                      </Link>
                    ))}
                  </div>
                </section>
              ))}
            </section>
          )}
        </div>
      </main>

      <Footer />

      <style jsx>{`
        .designers-page {
          background: #ffffff;
          color: #111827;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }
        .page-main {
          padding: 24px 0 64px;
        }
        .page-inner {
          max-width: 1150px;
          margin: 0 auto;
          padding: 0 16px 60px;
          width: 100%;
        }
        .hero {
          text-align: left;
          margin-bottom: 24px;
        }
        .hero h1 {
          font-family: "Georgia", serif;
          font-size: 32px;
          margin-bottom: 8px;
        }
        .hero p {
          max-width: 540px;
          color: #6b7280;
          font-size: 14px;
        }
        .layout {
          display: grid;
          grid-template-columns: 260px minmax(0, 1fr);
          gap: 24px;
          margin-bottom: 40px;
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
          color: #ffffff;
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
        .results-header h2 {
          font-family: Georgia, "Times New Roman", serif;
          font-size: 24px;
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
        .empty-state h3 {
          margin: 0 0 4px;
          font-size: 18px;
        }
        .empty-state p {
          margin: 0;
          color: #6b7280;
          font-size: 14px;
        }
        .directory {
          margin-top: 24px;
        }
        .letter-block {
          margin-bottom: 32px;
        }
        .letter-heading {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }
        .letter {
          font-size: 26px;
          font-family: "Georgia", serif;
          color: #d1d5db;
        }
        .divider {
          flex: 1;
          height: 1px;
          background: #e5e7eb;
        }
        .designer-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 12px;
        }
        .designer-card {
          border-radius: 10px;
          border: 1px solid #e5e7eb;
          padding: 12px 14px;
          text-decoration: none;
          background: #f9fafb;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
          transition: background 0.15s ease, box-shadow 0.15s ease,
            transform 0.15s ease;
          color: inherit;
        }
        .designer-card:hover {
          background: #ffffff;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.04);
          transform: translateY(-1px);
        }
        .designer-name {
          font-size: 14px;
        }
        .designer-cta {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.14em;
          color: #9ca3af;
        }
      `}</style>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps<DesignersPageProps> =
  async () => {
    try {
      // Designers for the directory
      const designerSnap = await adminDb.collection("designers").get();

      const designers: Designer[] = designerSnap.docs
        .map((doc) => {
          const data = doc.data() as any;
          return {
            id: doc.id,
            name: data.name || doc.id,
            slug: data.slug || doc.id,
          };
        })
        .sort((a, b) => a.name.localeCompare(b.name));

      // Listings for the products grid
      const allowedStatuses = ["Live", "Active", "Approved"];
      const listingSnap = await adminDb
        .collection("listings")
        .where("status", "in", allowedStatuses)
        .orderBy("createdAt", "desc")
        .limit(60)
        .get();

      const items: ProductLike[] = listingSnap.docs.map((doc) => {
        const d = doc.data() as any;

        const image =
          d.image_url ||
          d.imageUrl ||
          d.image ||
          (Array.isArray(d.imageUrls) && d.imageUrls[0]) ||
          "";

        const priceNum = Number(d.price) || 0;

        return {
          id: doc.id,
          title: d.title || "",
          brand: d.brand || "",
          price: priceNum ? `US$${priceNum.toLocaleString()}` : "",
          image,
          href: `/product/${doc.id}`,
        };
      });

      return { props: { designers, items } };
    } catch (err) {
      console.error("Error loading designers index", err);
      return { props: { designers: [], items: [] } };
    }
  };
