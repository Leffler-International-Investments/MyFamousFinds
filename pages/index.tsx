// FILE: /pages/index.tsx
import Head from "next/head";
import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ProductCard, { ProductLike } from "../components/ProductCard";

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

// Small helper to generate a brand-specific image as an SVG
const brandImage = (label: string, emoji: string, bg: string) => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="800" height="800">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${bg}"/>
          <stop offset="100%" stop-color="#111827"/>
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#g)"/>
      <text x="50%" y="44%" text-anchor="middle" fill="#ffffff"
        font-family="system-ui, -apple-system, BlinkMacSystemFont"
        font-size="64">${emoji}</text>
      <text x="50%" y="62%" text-anchor="middle" fill="#ffffff"
        font-family="system-ui, -apple-system, BlinkMacSystemFont"
        font-size="32">${label}</text>
    </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

// Each product now has a brand-specific visual
const trending: ProductLike[] = [
  {
    id: "g1",
    title: "Gucci Marmont Mini",
    brand: "GUCCI",
    price: "$2,450",
    image: brandImage("Gucci bag", "👜", "#db2777"),
    href: "/product/g1",
    badge: "New",
    details: "Signature chain-detail shoulder bag.",
  },
  {
    id: "p1",
    title: "Prada Re-Edition 2005",
    brand: "PRADA",
    price: "$2,990",
    image: brandImage("Prada nylon", "👜", "#22c55e"),
    href: "/product/p1",
  },
  {
    id: "z1",
    title: "Zimmermann Silk Blouse",
    brand: "ZIMMERMANN",
    price: "$480",
    image: brandImage("Silk blouse", "👗", "#6366f1"),
    href: "/product/z1",
  },
  {
    id: "d1",
    title: "Dior Printed Dress",
    brand: "DIOR",
    price: "$1,950",
    image: brandImage("Dior dress", "👗", "#eab308"),
    href: "/product/d1",
  },
  {
    id: "c1",
    title: "Chanel Slingbacks",
    brand: "CHANEL",
    price: "$1,250",
    image: brandImage("Chanel shoes", "👠", "#ec4899"),
    href: "/product/c1",
  },
  {
    id: "lv1",
    title: "LV Monogram Scarf",
    brand: "LOUIS VUITTON",
    price: "$620",
    image: brandImage("LV scarf", "🧣", "#f97316"),
    href: "/product/lv1",
  },
  {
    id: "r1",
    title: "Rolex Datejust 36",
    brand: "ROLEX",
    price: "$12,900",
    image: brandImage("Rolex watch", "⌚️", "#22d3ee"),
    href: "/product/r1",
  },
  {
    id: "ct1",
    title: "Cartier Love Bracelet",
    brand: "CARTIER",
    price: "$9,800",
    image: brandImage("Cartier love", "💎", "#facc15"),
    href: "/product/ct1",
  },
  {
    id: "a1",
    title: "Acne Studios Tee",
    brand: "ACNE",
    price: "$190",
    image: brandImage("Acne tee", "👕", "#a855f7"),
    href: "/product/a1",
  },
  {
    id: "ce1",
    title: "Celine Wool Coat",
    brand: "CELINE",
    price: "$2,650",
    image: brandImage("Celine coat", "🧥", "#4ade80"),
    href: "/product/ce1",
  },
];

// New arrivals reuse the same visuals but have distinct IDs
const newArrivals: ProductLike[] = [
  { ...trending[0], id: "n-g1", badge: "New" },
  { ...trending[1], id: "n-p1" },
  { ...trending[2], id: "n-z1" },
  { ...trending[3], id: "n-d1" },
  { ...trending[4], id: "n-c1" },
  { ...trending[5], id: "n-lv1" },
  { ...trending[6], id: "n-r1" },
  { ...trending[7], id: "n-ct1" },
];

export default function Home() {
  return (
    <>
      <Head>
        <title>Famous Finds — US</title>
      </Head>
      <Header />

      <main className="wrap">
        {/* TOP ADMIN STRIP – ALWAYS VISIBLE ON DASHBOARD */}
        <section className="adminStrip">
          <div className="adminStripText">
            <span className="adminStripLabel">Admin access</span>
            <span className="adminStripHint">
              Store Owners use Management Admin. Sellers use Seller Admin.
            </span>
          </div>
          <div className="adminStripButtons">
            <Link href="/admin" className="adminPrimary">
              Management Admin Login
            </Link>
            <Link href="/seller/orders" className="adminSecondary">
              Seller Admin Login
            </Link>
          </div>
        </section>

        {/* HERO  */}
        <section className="hero">
          <div className="heroCopy">
            <p className="eyebrow">WELCOME TO OUR WORLD OF LUXURY</p>
            <h1>Famous Finds for every shade of style.</h1>
            <p className="lead">
              Curated, authenticated designer pieces — loved once and ready to be loved
              again. A marketplace where every customer belongs, in all colours and all
              stories.
            </p>
            <div className="heroCta">
              <Link href="#now-trending" className="primary">
                Start shopping
              </Link>
              <Link href="/sell" className="ghost">
                Sell an item
              </Link>
            </div>
          </div>
           </p>
            <div className="heroPills">
              <Link href="/concierge" className="pill">
                <span className="pillTitle">AI</span>
                <span className="pillSub">Butler to guide you</span>
              </Link>
              <Link href="/help" className="pill">
                <span className="pillTitle">24/7</span>
                <span className="pillSub">Shopping from your sofa</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Category chips */}
        <section className="cats">
          {categories.map((c) => (
            <Link key={c.slug} href={`/category/${c.slug}`} className="cat">
              {c.name}
            </Link>
          ))}
        </section>

        {/* Trending grid */}
        <div className="rowHeader">
          <h3>Now Trending</h3>
          <a className="viewAll">View all</a>
        </div>
        <section className="grid" id="now-trending">
          {trending.map((p) => (
            <ProductCard key={p.id} {...p} />
          ))}
        </section>

        {/* New arrivals */}
        <div className="rowHeader">
          <h3>New Arrivals</h3>
          <a className="viewAll">View all</a>
        </div>
        <section className="grid">
          {newArrivals.map((p) => (
            <ProductCard key={p.id} {...p} />
          ))}
        </section>
      </main>

      <Footer />

      <style jsx>{`
        .wrap {
          max-width: 1200px;
          margin: 0 auto;
          padding: 24px 16px 40px;
        }

        /* ADMIN STRIP AT TOP */
        .adminStrip {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 10px 14px;
          border-radius: 999px;
          background: #020617;
          border: 1px solid #1f2937;
          margin-bottom: 18px;
        }
        .adminStripText {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }
        .adminStripLabel {
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.16em;
          color: #e5e7eb;
        }
        .adminStripHint {
          font-size: 11px;
          color: #9ca3af;
        }
        .adminStripButtons {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .adminPrimary,
        .adminSecondary {
          font-size: 11px;
          padding: 6px 12px;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #4b5563;
          white-space: nowrap;
        }
        .adminPrimary {
          background: #f9fafb;
          color: #000;
          font-weight: 600;
        }
        .adminSecondary {
          color: #e5e7eb;
          background: transparent;
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
          font-size: 11px;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: #9ca3af;
        }
        .lead {
          margin: 0 0 16px;
          color: #d1d5db;
          max-width: 34rem;
        }
        .heroCta {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          align-items: center;
        }
        .primary,
        .ghost {
          font-size: 13px;
          padding: 8px 16px;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 1px solid transparent;
        }
        .primary {
          background: #f9fafb;
          color: #000;
          font-weight: 600;
        }
        .ghost {
          border-color: #4b5563;
          color: #f9fafb;
        }

        /* HERO VISUAL – BRIGHTER BOX + BIGGER TEXT PILL */
        .heroVisual {
          border-radius: 28px;
          padding: 22px 22px 24px;
          background-image: radial-gradient(
              circle at 0% 0%,
              rgba(244, 63, 94, 0.35),
              transparent 60%
            ),
            radial-gradient(
              circle at 100% 100%,
              rgba(56, 189, 248, 0.45),
              transparent 60%
            ),
            linear-gradient(135deg, #020617, #111827, #1e293b);
          box-shadow: 0 28px 90px rgba(0, 0, 0, 0.8);
          border: 1px solid rgba(148, 163, 184, 0.4);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-height: 260px;
        }
        .heroIntro {
          font-size: 14px;
          line-height: 1.5;
          color: #f9fafb;
          max-width: 360px;
          background: rgba(15, 23, 42, 0.7);
          border-radius: 999px;
          padding: 10px 14px;
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
          background: rgba(15, 23, 42, 0.95);
          border: 1px solid rgba(148, 163, 184, 0.7);
          display: flex;
          flex-direction: column;
          justify-content: center;
          text-decoration: none;
        }
        .pillTitle {
          font-size: 16px;
          font-weight: 600;
          color: #e5e7eb;
        }
        .pillSub {
          font-size: 13px;
          color: #c4c9d4;
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
          border: 1px solid #1f2933;
          border-radius: 10px;
          background: #020617;
          text-align: center;
          font-size: 13px;
        }

        .rowHeader {
          margin: 18px 0 10px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .rowHeader h3 {
          font-size: 16px;
          font-weight: 700;
        }
        .viewAll {
          font-size: 12px;
          color: #9ca3af;
        }

        .grid {
          display: grid;
          gap: 12px;
          grid-template-columns: repeat(5, minmax(0, 1fr));
        }

        @media (max-width: 1100px) {
          .hero {
            grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
            gap: 28px;
          }
          .grid {
            grid-template-columns: repeat(4, minmax(0, 1fr));
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
          .grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
          .adminStrip {
            flex-direction: column;
            align-items: flex-start;
          }
        }
        @media (max-width: 640px) {
          .grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .cats {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
          .heroPills {
            flex-direction: column;
          }
        }
      `}</style>
    </>
  );
}
