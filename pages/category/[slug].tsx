// FILE: /pages/category/[slug].tsx
import Head from "next/head";
import Link from "next/link";
import type { GetServerSideProps } from "next";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import ProductCard, { ProductLike } from "../../components/ProductCard";
import { adminDb } from "../../utils/firebaseAdmin";

type CategoryProps = {
  slug: string;
  label: string;
  items: ProductLike[];
  count: number;
};

export default function CategoryPage({ slug, label, items, count }: CategoryProps) {
  return (
    <div className="dark-theme-page">
      <Head>
        <title>{label} – Famous Finds</title>
      </Head>

      <Header />

      <main className="wrap">
        <header className="heading">
          <div className="crumbs">
            <Link href="/" className="back">
              ← Home
            </Link>
            <span className="divider">/</span>
            <span className="crumb-label">{label}</span>
          </div>
          <div className="heading-main">
            <h1>All Products</h1>
            <div className="summary">
              <span className="count">{count} results</span>
              <form method="get" className="sort-form">
                <label htmlFor="sort" className="sort-label">
                  Sort
                </label>
                <select id="sort" name="sort" className="sort-select" defaultValue="">
                  <option value="">Newest</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                </select>
              </form>
            </div>
          </div>
        </header>

        <div className="layout">
          {/* FILTERS SIDEBAR */}
          <aside className="filters">
            <div className="filters-header">
              <h2>Filters</h2>
              <Link href={`/category/${slug}`} className="clear-link">
                Clear All
              </Link>
            </div>

            <form method="get" className="filters-form">
              {/* CATEGORY GROUP */}
              <section className="filter-group">
                <div className="filter-title-row">
                  <h3>Category</h3>
                </div>
                <div className="filter-options">
                  <label className="check">
                    <input type="checkbox" name="category" value="women" />
                    <span>Women&apos;s</span>
                  </label>
                  <label className="check">
                    <input type="checkbox" name="category" value="men" />
                    <span>Men&apos;s</span>
                  </label>
                  <label className="check">
                    <input type="checkbox" name="category" value="bags" />
                    <span>Bags</span>
                  </label>
                  <label className="check">
                    <input type="checkbox" name="category" value="shoes" />
                    <span>Shoes</span>
                  </label>
                  <label className="check">
                    <input type="checkbox" name="category" value="accessories" />
                    <span>Accessories</span>
                  </label>
                  <label className="check">
                    <input type="checkbox" name="category" value="jewelry" />
                    <span>Jewelry</span>
                  </label>
                  <label className="check">
                    <input type="checkbox" name="category" value="watches" />
                    <span>Watches</span>
                  </label>
                </div>
              </section>

              {/* DESIGNER GROUP */}
              <section className="filter-group">
                <div className="filter-title-row">
                  <h3>Designer</h3>
                </div>
                <div className="filter-options">
                  <label className="check">
                    <input type="checkbox" name="designer" value="chanel" />
                    <span>Chanel</span>
                  </label>
                  <label className="check">
                    <input type="checkbox" name="designer" value="louis vuitton" />
                    <span>Louis Vuitton</span>
                  </label>
                  <label className="check">
                    <input type="checkbox" name="designer" value="prada" />
                    <span>Prada</span>
                  </label>
                  <label className="check">
                    <input type="checkbox" name="designer" value="gucci" />
                    <span>Gucci</span>
                  </label>
                  <label className="check">
                    <input type="checkbox" name="designer" value="hermes" />
                    <span>Hermès</span>
                  </label>
                  <label className="check">
                    <input type="checkbox" name="designer" value="rolex" />
                    <span>Rolex</span>
                  </label>
                </div>
              </section>

              {/* CONDITION GROUP */}
              <section className="filter-group">
                <div className="filter-title-row">
                  <h3>Condition</h3>
                </div>
                <div className="filter-options">
                  <label className="check">
                    <input type="checkbox" name="condition" value="new" />
                    <span>New</span>
                  </label>
                  <label className="check">
                    <input type="checkbox" name="condition" value="excellent" />
                    <span>Excellent</span>
                  </label>
                  <label className="check">
                    <input type="checkbox" name="condition" value="very good" />
                    <span>Very good</span>
                  </label>
                  <label className="check">
                    <input type="checkbox" name="condition" value="good" />
                    <span>Good</span>
                  </label>
                </div>
              </section>

              {/* PRICE GROUP */}
              <section className="filter-group">
                <div className="filter-title-row">
                  <h3>Price</h3>
                </div>
                <div className="price-row">
                  <div className="price-field">
                    <label htmlFor="minPrice">Min</label>
                    <input
                      id="minPrice"
                      name="minPrice"
                      type="number"
                      min={0}
                      placeholder="0"
                    />
                  </div>
                  <div className="dash">–</div>
                  <div className="price-field">
                    <label htmlFor="maxPrice">Max</label>
                    <input
                      id="maxPrice"
                      name="maxPrice"
                      type="number"
                      min={0}
                      placeholder="10000"
                    />
                  </div>
                </div>
              </section>

              <button type="submit" className="btn-apply">
                Apply Filters
              </button>
            </form>
          </aside>

          {/* PRODUCTS GRID */}
          <section className="results">
            {items.length > 0 ? (
              <div className="grid">
                {items.map((p) => (
                  <ProductCard key={p.id} {...p} />
                ))}
              </div>
            ) : (
              <div className="empty">
                <p>
                  No items match these filters yet. Try adjusting your filters
                  or checking back soon.
                </p>
              </div>
            )}
          </section>
        </div>
      </main>

      <Footer />

      <style jsx>{`
        .dark-theme-page {
          background-color: #ffffff;
          color: #111827;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }
        .wrap {
          max-width: 1200px;
          margin: 0 auto;
          padding: 24px 16px 48px;
          width: 100%;
        }
        .heading {
          border-bottom: 1px solid #e5e7eb;
          padding-bottom: 12px;
          margin-bottom: 16px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .crumbs {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: #6b7280;
        }
        .back {
          text-decoration: none;
          color: #4b5563;
        }
        .back:hover {
          color: #111827;
        }
        .divider {
          color: #d1d5db;
        }
        .crumb-label {
          color: #4b5563;
        }
        .heading-main {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 12px;
        }
        h1 {
          font-family: "Georgia", serif;
          font-size: 24px;
          letter-spacing: -0.02em;
          margin: 0;
        }
        .summary {
          display: flex;
          align-items: center;
          gap: 16px;
          font-size: 13px;
        }
        .count {
          color: #6b7280;
        }
        .sort-form {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .sort-label {
          font-size: 12px;
          color: #6b7280;
        }
        .sort-select {
          border-radius: 999px;
          border: 1px solid #d1d5db;
          padding: 6px 10px;
          font-size: 13px;
          background: #ffffff;
        }
        .layout {
          display: grid;
          grid-template-columns: 260px minmax(0, 1fr);
          gap: 24px;
          margin-top: 20px;
        }
        .filters {
          border-right: 1px solid #e5e7eb;
          padding-right: 16px;
        }
        .filters-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }
        .filters-header h2 {
          font-size: 16px;
          font-weight: 600;
        }
        .clear-link {
          font-size: 12px;
          color: #6b7280;
          text-decoration: none;
        }
        .clear-link:hover {
          color: #111827;
        }
        .filters-form {
          display: flex;
          flex-direction: column;
          gap: 18px;
          font-size: 13px;
        }
        .filter-group {
          border-bottom: 1px solid #e5e7eb;
          padding-bottom: 14px;
        }
        .filter-title-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
        }
        .filter-title-row h3 {
          font-size: 13px;
          font-weight: 600;
        }
        .filter-options {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .check {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #4b5563;
        }
        .check input {
          width: 14px;
          height: 14px;
        }
        .price-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .price-field {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
          font-size: 12px;
        }
        .price-field input {
          border-radius: 8px;
          border: 1px solid #d1d5db;
          padding: 6px 8px;
          font-size: 13px;
        }
        .dash {
          font-size: 14px;
          color: #6b7280;
        }
        .btn-apply {
          margin-top: 4px;
          width: 100%;
          border-radius: 999px;
          border: none;
          background: #111827;
          color: white;
          padding: 9px 14px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
        }
        .btn-apply:hover {
          opacity: 0.92;
        }
        .results {
          min-height: 200px;
        }
        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 18px;
        }
        .empty {
          border-radius: 12px;
          border: 1px dashed #d1d5db;
          padding: 24px;
          text-align: center;
          color: #6b7280;
          background: #f9fafb;
        }
        @media (max-width: 900px) {
          .heading-main {
            flex-direction: column;
            align-items: flex-start;
            gap: 6px;
          }
          .layout {
            grid-template-columns: 1fr;
          }
          .filters {
            border-right: none;
            border-bottom: 1px solid #e5e7eb;
            padding-right: 0;
            padding-bottom: 16px;
          }
        }
      `}</style>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps<CategoryProps> = async (ctx) => {
  const raw = ctx.params?.slug;
  const slug = (Array.isArray(raw) ? raw[0] : raw) || "";
  if (!slug) return { notFound: true };

  const normalized = slug.toLowerCase();

  const q = ctx.query || {};
  const toArray = (value: string | string[] | undefined): string[] => {
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
  };

  let categories = toArray(q.category as any).map((v) => v.toLowerCase());
  const designers = toArray(q.designer as any).map((v) => v.toLowerCase());
  const conditions = toArray(q.condition as any).map((v) => v.toLowerCase());

  if (!categories.length) {
    const defaultCats = ["women", "men", "bags", "shoes", "accessories", "jewelry", "watches"];
    if (defaultCats.includes(normalized)) {
      categories = [normalized];
    }
  }

  const minPrice =
    typeof q.minPrice === "string" ? parseInt(q.minPrice, 10) || undefined : undefined;
  const maxPrice =
    typeof q.maxPrice === "string" ? parseInt(q.maxPrice, 10) || undefined : undefined;
  const sortParam = typeof q.sort === "string" ? q.sort : "";

  try {
    const snap = await adminDb
      .collection("listings")
      .orderBy("createdAt", "desc")
      .limit(200)
      .get();

    const allowedStatuses = ["Live", "Active", "Approved"];

    type Raw = { id: string; priceNumber: number; createdAt: number; d: any };
    const rows: Raw[] = [];

    snap.docs.forEach((doc) => {
      const d: any = doc.data() || {};

      if (d.status && !allowedStatuses.includes(d.status)) {
        return;
      }

      const catValue = (d.category || "").toString().toLowerCase();
      if (categories.length && !categories.includes(catValue)) {
        return;
      }

      const brandValue = (d.brand || "").toString().toLowerCase();
      if (designers.length && !designers.includes(brandValue)) {
        return;
      }

      const condValue = (d.condition || "").toString().toLowerCase();
      if (conditions.length && !conditions.includes(condValue)) {
        return;
      }

      const priceNumber = Number(d.price) || 0;
      if (minPrice && priceNumber < minPrice) return;
      if (maxPrice && priceNumber > maxPrice) return;

      const createdAtRaw: any = d.createdAt;
      let createdAt = 0;
      if (createdAtRaw && typeof createdAtRaw === "object") {
        if (typeof createdAtRaw.seconds === "number") createdAt = createdAtRaw.seconds;
        else if (typeof createdAtRaw._seconds === "number") createdAt = createdAtRaw._seconds;
      }

      rows.push({ id: doc.id, priceNumber, createdAt, d });
    });

    const sortKey = sortParam || (normalized === "new-arrivals" ? "newest" : "default");

    rows.sort((a, b) => {
      if (sortKey === "price-asc") return a.priceNumber - b.priceNumber;
      if (sortKey === "price-desc") return b.priceNumber - a.priceNumber;
      return b.createdAt - a.createdAt; // newest first
    });

    const items: ProductLike[] = rows.map(({ id, priceNumber, d }) => {
      const price = priceNumber ? `US$${priceNumber.toLocaleString("en-US")}` : "";
      const image: string =
        d.image_url ||
        d.imageUrl ||
        d.image ||
        (Array.isArray(d.imageUrls) && d.imageUrls[0]) ||
        "";

      return {
        id,
        title: d.title || "Untitled listing",
        brand: d.brand || "",
        price,
        image,
        href: `/product/${id}`,
        badge: d.badge || undefined,
      };
    });

    const labelMap: Record<string, string> = {
      bags: "BAGS",
      men: "MEN",
      women: "WOMEN",
      "new-arrivals": "NEW ARRIVALS",
      jewelry: "JEWELRY",
      watches: "WATCHES",
      shoes: "SHOES",
      accessories: "ACCESSORIES",
    };

    return {
      props: {
        slug: normalized,
        label: labelMap[normalized] || normalized.toUpperCase(),
        items,
        count: items.length,
      },
    };
  } catch (err) {
    console.error("Error loading category page", err);
    return {
      props: {
        slug: normalized,
        label: normalized.toUpperCase(),
        items: [],
        count: 0,
      },
    };
  }
};
