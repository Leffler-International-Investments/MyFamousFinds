// FILE: /pages/index.tsx
import Head from "next/head";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ProductCard, { ProductLike } from "../components/ProductCard";
import Link from "next/link";

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

const demo: ProductLike[] = [
  { id:"g1", title:"Gucci Marmont Mini", brand:"GUCCI", price:"$2,450", image:"/demo/gucci-bag-1.jpg", href:"/product/g1", badge:"New", details:"Ships 3–5 days. Authenticity guaranteed." },
  { id:"p1", title:"Prada Re-Edition 2005", brand:"PRADA", price:"$2,990", image:"/demo/prada-2005.jpg", href:"/product/p1" },
  { id:"z1", title:"Zimmermann Silk Blouse", brand:"ZIMMERMANN", price:"$480", image:"/demo/zimmermann.jpg", href:"/product/z1" },
  { id:"d1", title:"Dior Printed Dress", brand:"DIOR", price:"$1,950", image:"/demo/dior-dress.jpg", href:"/product/d1" },
  { id:"c1", title:"Chanel Slingbacks", brand:"CHANEL", price:"$1,250", image:"/demo/chanel-shoes.jpg", href:"/product/c1" },
  { id:"lv1", title:"LV Monogram Scarf", brand:"LOUIS VUITTON", price:"$620", image:"/demo/lv-scarf.jpg", href:"/product/lv1" },
  { id:"r1", title:"Rolex Datejust 36", brand:"ROLEX", price:"$12,900", image:"/demo/rolex-36.jpg", href:"/product/r1" },
  { id:"ct1", title:"Cartier Love Bracelet", brand:"CARTIER", price:"$9,800", image:"/demo/cartier-love.jpg", href:"/product/ct1" },
  { id:"a1", title:"Acne Studios Tee", brand:"ACNE", price:"$190", image:"/demo/acne-tee.jpg", href:"/product/a1" },
  { id:"ce1", title:"Celine Wool Coat", brand:"CELINE", price:"$2,650", image:"/demo/celine-coat.jpg", href:"/product/ce1" },
];

export default function Home() {
  return (
    <>
      <Head><title>Famous Finds — US</title></Head>
      <Header />

      <main className="wrap">
        <h1 className="h1">FAMOUS FINDS</h1>
        <p className="tag">Curated luxury & premium resale — <b>US</b>.</p>

        {/* Categories */}
        <section className="cats">
          {categories.map(c => (
            <Link key={c.slug} href={`/category/${c.slug}`} className="cat">
              {c.name}
            </Link>
          ))}
        </section>

        {/* Grid */}
        <div className="rowHeader">
          <h3>Now Trending</h3>
          <a className="viewAll">View all</a>
        </div>
        <section className="grid">
          {demo.map(p => <ProductCard key={p.id} {...p} />)}
        </section>

        <div className="rowHeader">
          <h3>New Arrivals</h3>
          <a className="viewAll">View all</a>
        </div>
        <section className="grid">
          {demo.slice(0,8).map(p => <ProductCard key={`n-${p.id}`} {...p} />)}
        </section>
      </main>

      <Footer />

      <style jsx>{`
        .wrap{ max-width:1200px; margin:0 auto; padding:24px 16px; }
        .h1{ margin:8px 0 4px; letter-spacing:.18em; }
        .tag{ margin:0 0 20px; color:#bdbdbd; }
        .cats{ display:grid; grid-template-columns:repeat(6,1fr); gap:10px; margin:8px 0 20px; }
        .cat{ padding:10px 12px; border:1px solid #1a1a1a; border-radius:10px; background:#0f0f0f; text-align:center; }
        .rowHeader{ margin:18px 0 10px; display:flex; justify-content:space-between; align-items:center; }
        .grid{ display:grid; gap:12px; grid-template-columns:repeat(5,1fr); }
        @media (max-width:1100px){ .grid{ grid-template-columns:repeat(4,1fr);} .cats{grid-template-columns:repeat(4,1fr);} }
        @media (max-width:900px){ .grid{ grid-template-columns:repeat(3,1fr);} }
        @media (max-width:640px){ .grid{ grid-template-columns:repeat(2,1fr);} .cats{grid-template-columns:repeat(3,1fr);} }
      `}</style>
    </>
  );
}
