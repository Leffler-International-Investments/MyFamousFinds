// FILE: /pages/index.tsx
import Head from "next/head";
import Link from "next/link";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { CookieBar } from "../components/CookieBar";
import { CategoryTile } from "../components/CategoryTile";
import { ProductCard } from "../components/ProductCard";
import styles from "../styles/home.module.css";

const categories = [
  { key: "bags", title: "Bags", img: "/images/cat-bags.jpg" },
  { key: "clothing", title: "Clothing", img: "/images/cat-clothing.jpg" },
  { key: "shoes", title: "Shoes", img: "/images/cat-shoes.jpg" },
  { key: "watches", title: "Watches", img: "/images/cat-watches.jpg" },
];

const trending = [
  { id: "p1", brand: "CHANEL", name: "Caviar Mini Flap", price: "AU$4,850", img: "/images/p1.jpg" },
  { id: "p2", brand: "DIOR", name: "Book Tote Medium", price: "AU$3,290", img: "/images/p2.jpg" },
  { id: "p3", brand: "LOUIS VUITTON", name: "Neverfull MM", price: "AU$2,650", img: "/images/p3.jpg" },
  { id: "p4", brand: "GUCCI", name: "Horsebit 1955", price: "AU$2,890", img: "/images/p4.jpg" },
  { id: "p5", brand: "PRADA", name: "Re-Edition 2005", price: "AU$2,350", img: "/images/p5.jpg" },
  { id: "p6", brand: "SAINT LAURENT", name: "Loulou Small", price: "AU$3,150", img: "/images/p6.jpg" }
];

export default function Home() {
  return (
    <>
      <Head>
        <title>Famous Finds — Luxury Resale</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <Header />

      {/* HERO */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>FAMOUS FINDS</h1>
          <p className={styles.heroSub}>Curated luxury. Authenticated. Australia-ready.</p>
          <div className={styles.heroCtas}>
            <Link className={styles.ctaPrimary} href="#categories">Shop by Category</Link>
            <Link className={styles.ctaSecondary} href="#trending">See What’s Trending</Link>
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section id="categories" className={styles.section}>
        <div className={styles.sectionHead}>
          <h2>Shop by Category</h2>
          <Link className={styles.viewAll} href="/shop">View all →</Link>
        </div>
        <div className={styles.catGrid}>
          {categories.map((c) => (
            <CategoryTile key={c.key} title={c.title} img={c.img} href={`/shop?cat=${c.key}`} />
          ))}
        </div>
      </section>

      {/* TRENDING */}
      <section id="trending" className={styles.section}>
        <div className={styles.sectionHead}>
          <h2>Now Trending</h2>
          <Link className={styles.viewAll} href="/trending">View all →</Link>
        </div>
        <div className={styles.prodGrid}>
          {trending.map((p) => (
            <ProductCard key={p.id} {...p} />
          ))}
        </div>
      </section>

      {/* LONG LISTS / EDITORIAL ROWS (like VC) */}
      <section className={styles.section}>
        <div className={styles.sectionHead}><h2>Bestselling Bags</h2></div>
        <div className={styles.prodRow}>
          {trending.slice(0,4).map((p) => <ProductCard key={`b-${p.id}`} compact {...p} />)}
        </div>
      </section>

      <section className={styles.sectionAlt}>
        <div className={styles.sectionHead}><h2>New Arrivals</h2></div>
        <div className={styles.prodGrid}>
          {trending.reverse().map((p) => <ProductCard key={`n-${p.id}`} {...p} />)}
        </div>
      </section>

      {/* NEWSLETTER */}
      <section className={styles.newsletter}>
        <h3>Get exclusive drops & price alerts</h3>
        <form className={styles.newsForm} action="/api/subscribe" method="post">
          <input className={styles.input} type="email" name="email" placeholder="Your email" required />
          <button className={styles.ctaPrimary} type="submit">Subscribe</button>
        </form>
        <small className={styles.note}>By subscribing you agree to our Terms & Privacy.</small>
      </section>

      <Footer />
      <CookieBar />
    </>
  );
}
