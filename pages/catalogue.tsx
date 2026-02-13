// FILE: /pages/catalogue.tsx
// Public marketplace catalogue showing all items as product cards.

import Head from "next/head";
import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ProductCard, { ProductLike } from "../components/ProductCard";
import type { GetServerSideProps } from "next";
import { getPublicListings } from "../lib/publicListings";

type CatalogueProps = {
  items: (ProductLike & { category?: string; condition?: string })[];
};

export default function PublicCatalogue({ items }: CatalogueProps) {
  const hasItems = items && items.length > 0;

  return (
    <div className="catalogue-page">
      <Head>
        <title>Catalogue - Famous Finds</title>
      </Head>

      <Header />

      <main className="catalogue-main">
        <div className="catalogue-header">
          <h1>Catalogue</h1>
          <p className="catalogue-sub">
            Browse all {items.length} listings in our marketplace.
          </p>
        </div>

        {!hasItems ? (
          <div className="catalogue-empty">
            <h3>No listings found.</h3>
            <Link href="/" className="catalogue-home-link">
              Back to homepage
            </Link>
          </div>
        ) : (
          <div className="catalogue-grid">
            {items.map((x) => (
              <ProductCard key={x.id} {...x} />
            ))}
          </div>
        )}
      </main>

      <Footer />

      <style jsx>{`
        .catalogue-page {
          background: #f7f7f5;
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
        .catalogue-empty {
          padding: 48px;
          text-align: center;
          background: #fff;
          border: 1px dashed #e5e7eb;
          border-radius: 16px;
        }
        .catalogue-empty h3 {
          margin: 0 0 12px;
          font-size: 16px;
          color: #111827;
        }
        .catalogue-home-link {
          font-size: 13px;
          color: #0f172a;
          font-weight: 700;
          text-decoration: none;
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
    const listings = await getPublicListings({ take: 500 });

    const items: (ProductLike & { category?: string; condition?: string })[] = (listings || []).map((l: any) => {
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
