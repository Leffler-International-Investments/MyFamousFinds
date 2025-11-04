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

// Unsplash demo image (allowed in next.config.js)
const baseImg =
  "https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=900&q=";

const trending: ProductLike[] = [
  {
    id: "g1",
    title: "Gucci Marmont Mini",
    brand: "GUCCI",
    price: "$2,450",
    image: baseImg + "80",
    href: "/product/g1",
    badge: "New",
    details: "Ships 3–5 days. Authenticity guaranteed.",
  },
  {
    id: "p1",
    title: "Prada Re-Edition 2005",
    brand: "PRADA",
    price: "$2,990",
    image: baseImg + "79",
    href: "/product/p1",
  },
  {
    id: "z1",
    title: "Zimmermann Silk Blouse",
    brand: "ZIMMERMANN",
    price: "$480",
    image: baseImg + "78",
    href: "/product/z1",
  },
  {
    id: "d1",
    title: "Dior Printed Dress",
    brand: "DIOR",
    price: "$1,950",
    image: baseImg + "77",
    href: "/product/d1",
  },
  {
    id: "c1",
    title: "Chanel Slingbacks",
    brand: "CHANEL",
    price: "$1,250",
    image: baseImg + "76",
    href: "/product/c1",
  },
  {
    id: "lv1",
    title: "LV Monogram Scarf",
    brand: "LOUIS VUITTON",
    price: "$620",
    image: baseImg + "75",
    href: "/product/lv1",
  },
  {
    id: "r1",
    title: "Rolex Datejust 36",
    brand: "ROLEX",
    price: "$12,900",
    image: baseImg + "74",
    href: "/product/r1",
  },
  {
    id: "ct1",
    title: "Cartier Love Bracelet",
    brand: "CARTIER",
    price: "$9,800",
    image: baseImg + "73",
    href: "/product/ct1",
  },
];

const newArrivals: ProductLike[] = [
  {
    id: "a1",
    title: "Acne Studios Tee",
    brand: "ACNE",
    price: "$190",
    image: baseImg + "72",
    href: "/product/a1",
  },
  {
    id: "ce1",
    title: "Celine Wool Coat",
    brand: "CELINE",
    price: "$2,650",
    image: baseImg + "71",
    href: "/product/ce1",
  },
  ...trending.slice(0, 6),
];

export default function Home() {
  return (
    <>
      <Head>
        <title>Famous Finds — US</title>
      </Head>
      <Header />

      <main className="wrap">
        {/* HERO */}
        <section className="hero">
          <div className="heroCopy">
            <p className="eyebrow">WELCOME TO OUR WORLD OF LUXURY</p>
            <h1>Famous Finds for every shade of style.</h1>
            <p className="heroText">
              Curated, authenticated designer pieces — loved once and ready to
              be loved again. A marketplace where every customer belongs, in all
              colours and all stories.
            </p>
            <div className="heroButtons">
              <Link href="/store/seller-demo-001" className="btnPrimary">
                Start shopping
              </Link>
              <Link href="/sell" className="btnGhost">
                Sell an item
              </Link>
            </div>
          </div>
          <div className="heroImg" />
        </section>

        {/* CATEGORIES */}
        <section className="cats">
          {categories.map((c) => (
            <Link
              key={c.slug}
              href={`/category/${c.slug}`}
              className="cat"
            >
              {c.name}
            </Link>
          ))}
        </section>

        {/* NOW TRENDING */}
        <div className="rowHeader">
          <h3>Now Trending</h3>
          <a className="viewAll">View all</a>
        </div>
        <section className="grid">
          {trending.map((p) => (
            <ProductCard key={p.id} {...p} />
          ))}
        </section>

        {/* NEW ARRIVALS */}
        <div className="rowHeader">
          <h3>New Arrivals</h3>
          <a className="viewAll">View all</a>
        </div>
        <section className="grid">
          {newArrivals.map((p) => (
            <ProductCard key={`n-${p.id}`} {...p} />
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
        .hero {
          display: grid;
          grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
          gap: 24px;
          margin-bottom: 24px;
          align-items: center;
        }
        .heroCopy h1 {
          font-size: 32px;
          line-height: 1.2;
          margin: 8px 0 6px;
          letter-spacing: 0.08em;
        }
        .heroText {
          margin-top: 4px;
          color: #d4d4d4;
          font-size: 14px;
        }
        .eyebrow {
          font-size: 11px;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          color: #a3a3a3;
        }
        .heroButtons {
          margin-top: 14px;
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }
        .btnPrimary {
          padding: 10px 18px;
          border-radius: 999px;
          background: #ffffff;
          color: #000000;
          font-size: 13px;
          font-weight: 700;
        }
        .btnGhost {
          padding: 10px 18px;
          border-radius: 999px;
          border: 1px solid #404040;
          font-size: 13px;
        }
        .heroImg {
          border-radius: 20px;
          min-height: 220px;
          background-image: url("https://images.unsplash.com/photo-1528701800489-20be3c30c1d5?auto=format&fit=crop&w=900&q=80");
          background-size: cover;
          background-position: center;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
        }
        .cats {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 10px;
          margin: 24px 0 20px;
        }
        .cat {
          padding: 10px 12px;
          border: 1px solid #1a1a1a;
          border-radius: 10px;
          background: #0f0f0f;
          text-align: center;
          font-size: 13px;
        }
        .rowHeader {
          margin: 18px 0 10px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .grid {
          display: grid;
          gap: 12px;
          grid-template-columns: repeat(5, 1fr);
        }
        @media (max-width: 1100px) {
          .grid {
            grid-template-columns: repeat(4, 1fr);
          }
          .cats {
            grid-template-columns: repeat(4, 1fr);
          }
        }
        @media (max-width: 900px) {
          .hero {
            grid-template-columns: 1fr;
          }
          .grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
        @media (max-width: 640px) {
          .grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .cats {
            grid-template-columns: repeat(3, 1fr);
          }
        }
      `}</style>
    </>
  );
}
