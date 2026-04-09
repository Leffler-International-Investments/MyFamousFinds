// FILE: /pages/catalogue.tsx
// Public marketplace catalogue showing all items as product cards with filtering.

import Head from "next/head";
import Link from "next/link";
import React, { useEffect, useMemo, useState, useCallback } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ProductCard, { ProductLike } from "../components/ProductCard";
import type { GetServerSideProps } from "next";
import { getPublicListings } from "../lib/publicListings";
import { getDeletedListingIds } from "../lib/deletedListings";
import {
  CATEGORY_OPTIONS,
  CONDITION_OPTIONS,
  MATERIAL_OPTIONS,
  COLOR_OPTIONS,
  DEFAULT_DESIGNERS,
  normalize,
  parsePrice,
} from "../lib/filterConstants";
import useFilterParams from "../hooks/useFilterParams";

type ItemWithMeta = ProductLike & {
  priceValue: number;
  category?: string;
  condition?: string;
  brand?: string;
  material?: string;
  size?: string;
  color?: string;
};

type CatalogueProps = {
  items: ItemWithMeta[];
};

type PublicDesignersResponse = {
  ok: boolean;
  designers?: { id: string; name: string; slug: string; active?: boolean }[];
  error?: string;
};

export default function PublicCatalogue({ items }: CatalogueProps) {
  const filters = useFilterParams({ pathname: "/catalogue" });

  const itemsWithPrice: ItemWithMeta[] = useMemo(() => {
    return (items || []).map((item: any) => ({
      ...item,
      priceValue: parsePrice(item.price),
      category: item.category || "",
      condition: item.condition || "",
      brand: item.brand || "",
      material: item.material || "",
      size: item.size || "",
      color: item.color || "",
    }));
  }, [items]);

  const [designerOptions, setDesignerOptions] = useState<string[]>(DEFAULT_DESIGNERS);

  // Load designer options from API
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
      } catch {
        // ignore
      }
      const fromItems = Array.from(
        new Set(itemsWithPrice.map((i) => (i.brand || "").trim()).filter(Boolean))
      ).sort((a, b) => a.localeCompare(b));
      setDesignerOptions(fromItems.length > 0 ? fromItems : DEFAULT_DESIGNERS);
    }
    loadDesigners();
  }, [itemsWithPrice]);

  // Client-side filtering
  const filteredItems: ItemWithMeta[] = useMemo(() => {
    let result = [...itemsWithPrice];

    const tq = normalize(filters.titleQuery);
    const cat = normalize(filters.category);
    const des = normalize(filters.designer);
    const cond = normalize(filters.condition);
    const mat = normalize(filters.material);
    const sz = normalize(filters.size);
    const col = normalize(filters.color);

    if (tq) result = result.filter((item) => normalize(item.title).includes(tq));
    if (cat) result = result.filter((item) => normalize(item.category).includes(cat));
    if (des) result = result.filter((item) => normalize(item.brand).includes(des));
    if (cond) result = result.filter((item) => normalize(item.condition) === cond);
    if (mat) result = result.filter((item) => normalize(item.material).includes(mat));
    if (sz) result = result.filter((item) => normalize(item.size).includes(sz));
    if (col) result = result.filter((item) => normalize(item.color).includes(col));

    result = result.filter((item) => {
      const price = item.priceValue || 0;
      if (typeof filters.minPrice === "number" && price < filters.minPrice) return false;
      if (typeof filters.maxPrice === "number" && price > filters.maxPrice) return false;
      return true;
    });

    if (filters.sortBy === "price-asc") result.sort((a, b) => (a.priceValue || 0) - (b.priceValue || 0));
    if (filters.sortBy === "price-desc") result.sort((a, b) => (b.priceValue || 0) - (a.priceValue || 0));

    return result;
  }, [itemsWithPrice, filters.titleQuery, filters.category, filters.designer, filters.condition, filters.material, filters.size, filters.color, filters.minPrice, filters.maxPrice, filters.sortBy]);

  const PAGE_SIZE = 40;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [filters.titleQuery, filters.category, filters.designer, filters.condition, filters.material, filters.size, filters.color, filters.minPrice, filters.maxPrice, filters.sortBy]);

  const resultsCount = filteredItems.length;
  const paginatedItems = filteredItems.slice(0, visibleCount);
  const hasMore = visibleCount < filteredItems.length;

  const fSty: Record<string, React.CSSProperties> = {
    wrap: { display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" },
    input: { border: "1px solid #e5e7eb", borderRadius: "12px", padding: "8px 12px", fontSize: "13px", outline: "none", background: "#fff", minWidth: "140px", flex: "1 1 140px" },
    select: { border: "1px solid #e5e7eb", borderRadius: "12px", padding: "8px 12px", fontSize: "13px", outline: "none", background: "#fff", minWidth: "120px" },
    clear: { border: "1px solid #cbd5e1", background: "#fff", color: "#0f172a", borderRadius: "999px", padding: "8px 14px", fontWeight: 700, fontSize: "12px", cursor: "pointer", whiteSpace: "nowrap" },
  };

  const filterPanel = (
    <div style={fSty.wrap}>
      <input style={fSty.input} placeholder="Search by title..." value={filters.titleQuery} onChange={(e) => filters.setTitleQuery(e.target.value)} />
      <select style={fSty.select} value={filters.category} onChange={(e) => filters.setCategory(e.target.value)}>
        <option value="">All Categories</option>
        {CATEGORY_OPTIONS.map((o) => (<option key={o} value={o}>{o}</option>))}
      </select>
      <select style={fSty.select} value={filters.designer} onChange={(e) => filters.setDesigner(e.target.value)}>
        <option value="">All Designers</option>
        {designerOptions.map((o) => (<option key={o} value={o}>{o}</option>))}
      </select>
      <select style={fSty.select} value={filters.condition} onChange={(e) => filters.setCondition(e.target.value)}>
        <option value="">Condition</option>
        {CONDITION_OPTIONS.map((o) => (<option key={o} value={o}>{o}</option>))}
      </select>
      <select style={fSty.select} value={filters.material} onChange={(e) => filters.setMaterial(e.target.value)}>
        <option value="">Material</option>
        {MATERIAL_OPTIONS.map((o) => (<option key={o} value={o}>{o}</option>))}
      </select>
      <select style={fSty.select} value={filters.color} onChange={(e) => filters.setColor(e.target.value)}>
        <option value="">Color</option>
        {COLOR_OPTIONS.map((c) => (<option key={c} value={c}>{c}</option>))}
      </select>
      <select style={fSty.select} value={filters.sortBy} onChange={(e) => filters.setSortBy(e.target.value as any)}>
        <option value="newest">Newest</option>
        <option value="price-asc">Price: Low to High</option>
        <option value="price-desc">Price: High to Low</option>
      </select>
      <button style={fSty.clear} type="button" onClick={filters.resetFilters}>Clear All</button>
    </div>
  );

  return (
    <div className="catalogue-page">
      <Head>
        <title>Famous Closets - Famous Finds</title>
        <meta name="description" content="Browse our curated catalogue of authenticated luxury designer items — bags, shoes, jewelry, watches and more at Famous Finds." />
        <meta property="og:title" content="Famous Closets - Famous Finds" />
        <meta property="og:description" content="Browse our curated catalogue of authenticated luxury designer items — bags, shoes, jewelry, watches and more at Famous Finds." />
        <meta name="twitter:title" content="Famous Closets - Famous Finds" />
      </Head>

      <Header
        showFilter={filters.showFilters}
        onToggleFilter={() => filters.setShowFilters(!filters.showFilters)}
        filterContent={filterPanel}
      />

      <main className="catalogue-main">
        <div className="catalogue-header">
          <h1>Famous Closets</h1>
          <p className="catalogue-sub">
            Curated collections from truly famous closets. Stay tuned for exclusive drops.
          </p>
        </div>

        <div className="famous-placeholder">
          <h3>Coming Soon</h3>
          <p>We are curating exclusive collections from celebrity and famous closets. Check back soon for unique, one-of-a-kind pieces.</p>
        </div>
      </main>

      <Footer />

      <style jsx>{`
        .catalogue-page {
          background: #ede8e0;
          min-height: 100vh;
        }
        .catalogue-main {
          max-width: 1200px;
          margin: 0 auto;
          padding: 32px 16px 64px;
        }
        .catalogue-header {
          margin-bottom: 24px;
        }
        .catalogue-header h1 {
          margin: 0 0 4px;
          font-size: 32px;
          font-weight: 600;
          color: #0f172a;
          letter-spacing: -0.02em;
        }
        .catalogue-sub {
          margin: 0;
          font-size: 14px;
          color: #6b7280;
        }
        .catalogue-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 14px;
        }
        .famous-placeholder {
          padding: 64px 24px;
          text-align: center;
          border: 1px dashed #d5cfc5;
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.4);
        }
        .famous-placeholder h3 {
          margin: 0 0 8px;
          font-size: 22px;
          font-weight: 700;
          color: #111827;
        }
        .famous-placeholder p {
          margin: 0;
          font-size: 14px;
          color: #6b7280;
          max-width: 480px;
          margin: 0 auto;
          line-height: 1.5;
        }
        .catalogue-empty {
          padding: 48px;
          text-align: center;
          background: #fff;
          border: 1px dashed #e5e7eb;
          border-radius: 16px;
        }
        .catalogue-empty h3 {
          margin: 0 0 6px;
          font-size: 18px;
          font-weight: 800;
          color: #111827;
        }
        .catalogue-empty-sub {
          margin: 0 0 12px;
          font-size: 13px;
          color: #6b7280;
        }
        .catalogue-reset-btn {
          border: 1px solid #111827;
          background: #111827;
          color: #fff;
          border-radius: 999px;
          padding: 10px 20px;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
        }
        .catalogue-reset-btn:hover {
          background: #1f2937;
        }
        .catalogue-load-more {
          margin-top: 32px;
          text-align: center;
        }
        .catalogue-load-more-btn {
          border: 1px solid #d1d5db;
          background: #fff;
          color: #111827;
          border-radius: 999px;
          padding: 12px 32px;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .catalogue-load-more-btn:hover {
          background: #111827;
          color: #fff;
        }
        @media (max-width: 980px) {
          .catalogue-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }
        @media (max-width: 640px) {
          .catalogue-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 10px;
          }
        }
      `}</style>
    </div>
  );
}

// DATA QUERY — uses getPublicListings (same data source as category pages)
export const getServerSideProps: GetServerSideProps<CatalogueProps> = async () => {
  try {
    const excludeIds = await getDeletedListingIds();
    const listings = await getPublicListings({ take: 500, excludeIds });

    const items: ItemWithMeta[] = (listings || []).map((l: any) => {
      const priceNum = typeof l.price === "number" ? l.price : (typeof l.priceUsd === "number" ? l.priceUsd : 0);
      return {
        id: l.id,
        title: l.title || "Untitled listing",
        brand: l.brand || "",
        price: priceNum ? `US$${priceNum.toLocaleString("en-US")}` : "",
        image: l.displayImageUrl || (Array.isArray(l.images) && l.images[0] ? l.images[0] : ""),
        href: `/product/${l.id}`,
        category: l.category || "",
        condition: l.condition || "",
        material: l.material || "",
        size: l.size || "",
        color: l.color || "",
        priceValue: priceNum || 0,
      };
    });

    return {
      props: { items },
    };
  } catch (err) {
    console.error("Error loading catalogue listings", err);
    return {
      props: { items: [] },
    };
  }
};
