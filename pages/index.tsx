// FILE: /pages/index.tsx
import Head from "next/head";
import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";
import DemoGrid from "../components/DemoGrid";
import { ProductLike } from "../components/ProductCard"; // This import is unchanged
import { adminDb } from "../utils/firebaseAdmin";
import type { GetServerSideProps } from "next";

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
  // (Your existing React component code is unchanged)
  return (
    <div className="dark-theme-page">
      <Head>
        <title>Famous Finds — US</title>
      </Head>
      <Header />
      <main className="wrap">
        {/* (All your Hero and Category JSX is unchanged) */}
        <section className="hero">
          <div className="heroCopy">
            <p className="eyebrow">WELCOME TO OUR WORLD OF LUXURY</p>
            <h1>Famous Finds for every shade of style.</h1>
            <p className="lead">
              Curated, authenticated designer pieces — loved once and ready to be loved
              again. A marketplace where every customer belongs, in all colours and all
              stories.
            </p>
          </div>
          <div className="heroVisual">
            <p className="heroIntro">
              Meet your Famous Finds AI Butler – a friendly concierge to help you discover
              the perfect piece, by voice or chat, from our curated catalogue.
            </p>
            <div className="heroButlerRow">
              <div className="butlerAvatar">
                <span className="butlerEmoji">🤵‍♂️</span>
              </div>
              <div className="butlerCopy">
                <div className="butlerTitle">Your personal style butler</div>
                <div className="butlerText">
                  Tell me what you&apos;re looking for – a Chanel bag, a Rolex, or a
                  special dress – and the Butler will search only within Famous Finds.
                </div>
              </div>
            </div>
            <div className="heroPills">
              <Link href="/concierge" className="pill">
                <span className="pillTitle">AI Butler</span>
                <span className="pillSub">Ask by voice or chat</span>
              </Link>
              <Link href="/catalogue" className="pill pillSecondary">
                <span className="pillTitle">Browse the catalogue</span>
              </Link>
            </div>
          </div>
        </section>
        <section className="cats">
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
      {/* (All your styles are unchanged) */}
      <style jsx>{`
        .wrap {
          max-width: 1200px;
          margin: 0 auto;
          padding: 24px 16px 40px;
        }
        .hero {
          display: grid;
          grid-template-columns: minmax(0, 1.4fr) minmax(0, 1.1fr);
          gap: 40px;
          align-items: center;
          margin: 32px 0 32px;
        }
        .heroCopy h1 {
          margin: 8px 0 10px;
          letter-spacing: 0.04em;
          font-size: 32px;
        }
        .eyebrow {
          font-size: 12px;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: #9ca3af;
        }
        .lead {
          margin: 0 0 16px;
          color: #d1d5db;
          max-width: 34rem;
        }
        .heroVisual {
          border-radius: 28px;
          padding: 22px 22px 24px;
          background: #ffffff;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
          border: 1px solid #e5e7eb;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-height: 260px;
        }
        .heroIntro {
          font-size: 15px;
          line-height: 1.6;
          color: #374151;
          max-width: 380px;
          background: #f9fafb;
          border-radius: 20px;
          padding: 10px 14px;
          border: 1px solid #f3f4f6;
        }
        .heroButlerRow {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-top: 18px;
        }
        .butlerAvatar {
          width: 64px;
          height: 64px;
          border-radius: 999px;
          background: radial-gradient(circle at 30% 20%, #facc15, #1d4ed8);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
        }
        .butlerEmoji {
          font-size: 34px;
        }
        .butlerCopy {
          flex: 1 1 0;
          min-width: 0;
        }
        .butlerTitle {
          font-size: 16px;
          font-weight: 600;
          color: #111827;
          margin-bottom: 2px;
        }
        .butlerText {
          font-size: 13px;
          color: #4b5563;
        }
        .heroPills {
          margin-top: 18px;
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
        }
        .pill {
          flex: 1 1 0;
          min-width: 0;
          padding: 12px 14px;
          border-radius: 18px;
          background: #f3f4f6;
          border: 1px solid #d1d5db;
          display: flex;
          flex-direction: column;
          justify-content: center;
          text-decoration: none;
        }
        .pillSecondary {
          background: #f9fafb;
        }
        .pillTitle {
          font-size: 18px;
          font-weight: 600;
          color: #1f2937;
        }
        .pillSub {
          font-size: 14px;
          color: #6b7280;
          margin-top: 2px;
        }
        .cats {
          display: grid;
          grid-template-columns: repeat(6, minmax(0, 1fr));
          gap: 10px;
          margin: 8px 0 20px;
        }
        .cat {
          padding: 10px 12px;
          border: 1px solid #374151;
          border-radius: 10px;
          background: #1f2937;
          text-align: center;
          font-size: 13px;
          color: #e5e7eb;
        }
        .cat:hover {
          background: #374151;
          border-color: #4b5563;
        }
        @media (max-width: 1100px) {
          .hero {
            grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
            gap: 28px;
          }
          .cats {
            grid-template-columns: repeat(4, minmax(0, 1fr));
          }
        }
        @media (max-width: 900px) {
          .hero {
            grid-template-columns: minmax(0, 1fr);
          }
          .heroVisual {
            order: -1;
          }
        }
        @media (max-width: 640px) {
          .cats {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
          .heroPills {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}

// --- UPDATED data-loading function ---
export const getServerSideProps: GetServerSideProps<HomeProps> = async () => {
  try {
    // 1. Fetch recent listings
    const snap = await adminDb
      .collection("listings")
      .orderBy("createdAt", "desc")
      .limit(50) 
      .get();

    // 2. Filter for "Live" items in the code
    const liveItems: ProductLike[] = [];
    
    snap.docs.forEach((doc) => {
      const d: any = doc.data() || {};
      
      // --- THIS IS THE FIX ---
      // Only proceed if the status is "Live"
      if (d.status !== "Live") {
        return;
      }
      // ---------------------

      const priceNumber = Number(d.price) || 0;
      
      const price = priceNumber
        ? `US$${priceNumber.toLocaleString("en-US")}` // Correct USD
        : "";
      
      const image: string =
        d.imageUrl ||
        d.image || 
        (Array.isArray(d.imageUrls) && d.imageUrls[0]) || 
        "https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto-format&fit=crop&w=800&q=80";

      // This item is "Live", so add it to the list
      liveItems.push({
        id: doc.id,
        title: d.title || "Untitled listing",
        brand: d.brand || "",
        price,
        image,
        href: `/product/${doc.id}`,
        badge: d.badge || undefined,
        // No 'status' property is added here, so it matches ProductLike
      });
    });

    return {
      props: {
        // Now we slice the already-filtered 'liveItems'
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
