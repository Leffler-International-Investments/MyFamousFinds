// FILE: /pages/index.tsx
// This is your homepage, now updated to use the
// functional <HomepageButler /> component.

import Head from "next/head";
import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";
import DemoGrid from "../components/DemoGrid";
import { ProductLike } from "../components/ProductCard";
import { adminDb } from "../utils/firebaseAdmin";
import type { GetServerSideProps } from "next";

// --- FIX: Import the new component ---
import HomepageButler from "../components/HomepageButler";

const categories = [
  { name: "Bags", slug: "bags" },
  { name: "Watches", slug: "watches" },
  { name: "Kids", slug: "kids" },
  { name: "Clothing", slug: "clothing" },
  { name: "Jewelry", slug: "jewelry" },
  { name: "Home", slug: "home" },
  { name: "Shoes", slug: "shoes" },
  { name: "Men", slug: "men" },
  { name: "Beauty", slug: "beauty" },
  { name: "Accessories", slug: "accessories" },
  { name: "Women", slug: "women" },
  { name: "Sale", slug: "sale" },
];

type HomeProps = {
  trending: ProductLike[];
  newArrivals: ProductLike[];
};

export default function Home({ trending, newArrivals }: HomeProps) {
  return (
    <div className="dark-theme-page">
      <Head>
        <title>Famous Finds — US</title>
      </Head>
      <Header />
      <main className="wrap">
        <section className="hero">
          <div className="heroCopy">
            <p className="eyebrow">WELCOME TO OUR WORLD OF LUXURY</p>
            <h1>Famous Finds for every shade of style.</h1>
            <p className="lead">
              Curated, authenticated designer pieces — loved once and ready to
              be loved again. A marketplace where every customer belongs, in all
              colours and all stories.
            </p>
          </div>
          <div className="heroVisual">
            
            {/* --- FIX: Replaced the old static buttons --- */}
            {/* ---    with the new functional component   --- */}
            <HomepageButler />
            {/* ------------------------------------------- */}

          </div>
        </section>

        <section className="categories">
          {categories.map((c) => (
            <Link key={c.slug} href={`/category/${c.slug}`} className="cat">
              {c.name}
            </Link>
          ))}
        </section>

        <DemoGrid title="Now Trending" items={trending} />
        <DemoGrid title="New Arrivals" items={newArrivals} />
      </main>
      <Footer />

      <style jsx>{`
        .wrap {
          max-width: 1200px;
          margin: 0 auto;
          padding: 16px 16px 80px;
        }
        .hero {
          display: grid;
          grid-template-columns: minmax(0, 1.1fr) minmax(0, 1.1fr);
          gap: 40px;
          margin-top: 16px;
          margin-bottom: 24px;
        }
        .heroCopy {
          max-width: 520px;
        }
        .eyebrow {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: #9ca3af;
        }
        h1 {
          margin-top: 4px;
          font-size: 32px;
          letter-spacing: 0.02em;
        }
        .lead {
          margin-top: 10px;
          font-size: 15px;
          color: #e5e7eb;
          line-height: 1.6;
        }
        .heroVisual {
          border-radius: 16px;
          padding: 18px 18px 20px;
          background: radial-gradient(circle at top, #334155, #020617);
          border: 1px solid rgba(148, 163, 184, 0.3);
        }
        /* Removed styles for .heroIntro, .heroButlerRow, etc. */
        /* as they are now inside the HomepageButler component */
        
        .categories {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-bottom: 16px;
        }
        .cat {
          font-size: 13px;
          padding: 6px 12px;
          border-radius: 999px;
          border: 1px solid #374151;
          color: #e5e7eb;
          text-decoration: none;
        }
        @media (max-width: 900px) {
          .hero {
            grid-template-columns: minmax(0, 1fr);
          }
        }
      `}</style>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps<HomeProps> = async () => {
  try {
    const snap = await adminDb
      .collection("listings")
      .orderBy("createdAt", "desc")
      .limit(50)
      .get();

    const liveItems: ProductLike[] = [];

    snap.docs.forEach((doc) => {
      const d: any = doc.data() || {};

      const allowedStatuses = ["Live", "Active", "Approved"];
      if (d.status && !allowedStatuses.includes(d.status)) {
        return;
      }
      
      const priceNumber = Number(d.price) || 0;
      const price = priceNumber
        ? `US$${priceNumber.toLocaleString("en-US")}`
        : "";

      const image: string =
        d.image_url ||
        d.imageUrl ||
        d.image ||
        (Array.isArray(d.imageUrls) && d.imageUrls[0]) ||
        "https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto-format&fit=crop&w=800&q=80";

      liveItems.push({
        id: doc.id,
        title: d.title || "Untitled listing",
        brand: d.brand || "",
        price,
        image,
        href: `/product/${doc.id}`,
        badge: d.badge || undefined,
      });
    });

    return {
      props: {
        trending: liveItems.slice(0, 12),
        newArrivals: liveItems.slice(12, 24),
      },
    };
  } catch (err) {
    console.error("Error loading home listings", err);
    return {
      props: {
        trending: [],
        newArrivals: [],
      },
    };
  }
};
