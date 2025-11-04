// FILE: /pages/index.tsx
import Head from "next/head";
import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";
// Import the new DemoGrid component
import DemoGrid from "../components/DemoGrid";
import { ProductLike } from "../components/ProductCard";

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

// Using realistic placeholder images
const trending: ProductLike[] = [
  {
    id: "g1",
    title: "Gucci Marmont Mini",
    brand: "GUCCI",
    price: "$2,450",
    image:
      "https://images.unsplash.com/photo-1594223274512-ad4803739b7c?w=500&q=80",
    href: "/product/g1",
    badge: "New",
  },
  {
    id: "p1",
    title: "Prada Re-Edition 2005",
    brand: "PRADA",
    price: "$2,990",
    image:
      "https://images.unsplash.com/photo-1620138546368-356b907a7529?w=500&q=80",
    href: "/product/p1",
  },
  {
    id: "z1",
    title: "Zimmermann Silk Blouse",
    brand: "ZIMMERMANN",
    price: "$480",
    image:
      "https://images.unsplash.com/photo-1581044777550-4cfa60707c03?w=500&q=80",
    href: "/product/z1",
  },
  {
    id: "d1",
    title: "Dior Printed Dress",
    brand: "DIOR",
    price: "$1,950",
    image:
      "https://images.unsplash.com/photo-1590130603709-5d63030f146c?w=500&q=80",
    href: "/product/d1",
  },
  {
    id: "c1",
    title: "Chanel Slingbacks",
    brand: "CHANEL",
    price: "$1,250",
    image:
      "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=500&q=80",
    href: "/product/c1",
  },
  {
    id: "lv1",
    title: "LV Monogram Scarf",
    brand: "LOUIS VUITTON",
    price: "$620",
    image:
      "https://images.unsplash.com/photo-1616017006307-e4560b130e52?w=500&q=80",
    href: "/product/lv1",
  },
  {
    id: "r1",
    title: "Rolex Datejust 36",
    brand: "ROLEX",
    price: "$12,900",
    image:
      "https://images.unsplash.com/photo-1620625336423-6e31c3bf1c55?w=500&q=80",
    href: "/product/r1",
  },
  {
    id: "ct1",
    title: "Cartier Love Bracelet",
    brand: "CARTIER",
    price: "$9,800",
    image:
      "https://images.unsplash.com/photo-1601854638706-e1376e73c0f0?w=500&q=80",
    href: "/product/ct1",
  },
  // ### FIX: Added 2 more items to fill the grid ###
  {
    id: "a1",
    title: "Acne Studios Tee",
    brand: "ACNE",
    price: "$190",
    image:
      "https://images.unsplash.com/photo-1622337290659-c3600a26e636?w=500&q=80",
    href: "/product/a1",
  },
  {
    id: "ce1",
    title: "Celine Wool Coat",
    brand: "CELINE",
    price: "$2,650",
    image:
      "https://images.unsplash.com/photo-1600273760838-8e6878e104e9?w=500&q=80",
    href: "/product/ce1",
  },
];

// ### FIX: Added 1 more item to fill the grid (total 5) ###
const newArrivals: ProductLike[] = [
  { ...trending[4], id: "n-c1" }, // Chanel
  { ...trending[5], id: "n-lv1" }, // LV
  { ...trending[6], id: "n-r1" }, // Rolex
  { ...trending[7], id: "n-ct1" }, // Cartier
  { ...trending[0], id: "n-g1", badge: "New" }, // Gucci
];

export default function Home() {
  return (
    // Wrap page in .dark-theme-page to fix text colors
    <div className="dark-theme-page">
      <Head>
        <title>Famous Finds — US</title>
      </Head>
      <Header />

      <main className="wrap">
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
          </div>

          {/* Right: AI Butler (White Background Style) */}
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

        {/* Using the DemoGrid component */}
        <DemoGrid title="Now Trending" items={trending} />

        {/* Using the DemoGrid component */}
        <DemoGrid title="New Arrivals" items={newArrivals} />
      </main>

      <Footer />

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
          color: #9ca3af; /* This gray is fine on a dark background */
        }
        .lead {
          margin: 0 0 16px;
          color: #d1d5db; /* This gray is fine on a dark background */
          max-width: 34rem;
        }

        /* HERO VISUAL – (White Background Style) */
        .heroVisual {
          border-radius: 28px;
          padding: 22px 22px 24px;
          background: #ffffff;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
          border: 1px solid #e5e7eb; /* gray-200 */
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-height: 260px;
        }
        .heroIntro {
          font-size: 15px;
          line-height: 1.6;
          color: #374151; /* gray-700 */
          max-width: 380px;
          background: #f9fafb; /* gray-50 */
          border-radius: 20px;
          padding: 10px 14px;
          border: 1px solid #f3f4f6; /* gray-100 */
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
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2); /* Kept shadow */
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
          color: #111827; /* gray-900 */
          margin-bottom: 2px;
        }
        .butlerText {
          font-size: 13px;
          color: #4b5563; /* gray-600 */
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
          background: #f3f4f6; /* gray-100 */
          border: 1px solid #d1d5db; /* gray-300 */
          display: flex;
          flex-direction: column;
          justify-content: center;
          text-decoration: none;
        }
        .pillSecondary {
          background: #f9fafb; /* gray-50 */
        }
        .pillTitle {
          font-size: 18px;
          font-weight: 600;
          color: #1f2937; /* gray-800 */
        }
        .pillSub {
          font-size: 14px;
          color: #6b7280; /* gray-500 */
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
          border: 1px solid #374151; /* Darker border */
          border-radius: 10px;
          background: #1f2937; /* Dark tile */
          text-align: center;
          font-size: 13px;
          color: #e5e7eb; /* Light text */
        }
        .cat:hover {
          background: #374151;
          border-color: #4b5563;
        }

        /* Styles for .rowHeader and .grid are in DemoGrid.tsx */

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
