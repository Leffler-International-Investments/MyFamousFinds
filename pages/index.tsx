// FILE: /pages/index.tsx
import Head from "next/head";
import Link from "next/link";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { CookieBar } from "../components/CookieBar";
import { CategoryTile } from "../components/CategoryTile";
import { ProductCard } from "../components/ProductCard";
import styles from "../styles/home.module.css";

// Demo categories
const categories = [
  { key: "bags", title: "Bags", img: "/images/cat-bags.jpg" },
  { key: "clothing", title: "Clothing", img: "/images/cat-clothing.jpg" },
  { key: "shoes", title: "Shoes", img: "/images/cat-shoes.jpg" },
  { key: "watches", title: "Watches", img: "/images/cat-watches.jpg" },
  { key: "accessories", title: "Accessories", img: "/images/cat-accessories.jpg" },
  { key: "jewelry", title: "Jewelry", img: "/images/cat-jewelry.jpg" },
];

// Demo products (shown across all grids)
const demoProducts = [
  { id: "p1", brand: "CHANEL", name: "Caviar Mini Flap", price: "AU$4,850", img: "/images/p1.jpg" },
  { id: "p2", brand: "DIOR", name: "Book Tote Medium", price: "AU$3,290", img: "/images/p2.jpg" },
  { id: "p3", brand: "LOUIS VUITTON", name: "Neverfull MM", price: "AU$2,650", img: "/images/p3.jpg" },
  { id: "p4", brand: "GUCCI", name: "Horsebit 1955", price: "AU$2,890", img: "/images/p4.jpg" },
  { id: "p5", brand: "PRADA", name: "Re-Edition 2005", price: "AU$2,350", img: "/images/p5.jpg" },
  { id: "p6", brand: "SAINT LAURENT", name: "Loulou Small", price: "AU$3,150", img: "/images/p6.jpg" },
  { id: "p7", brand: "HERMÈS", name: "Kelly 25 Sellier", price: "AU$9,500", img: "/images/p7.jpg" },
  { id: "p8", brand: "BALENCIAGA", name: "City Classic", price: "AU$2,980", img: "/images/p8.jpg" },
  { id: "p9", brand: "BURBERRY", name: "Lola Bag", price: "AU$2,190", img: "/images/p9.jpg" },
  { id: "p10", brand: "BOTTEGA VENETA", name: "Cassette Bag", price: "AU$3,250", img: "/images/p10.jpg" },
  { id: "p11", brand: "VERSACE", name: "Greca Sneakers", price: "AU$950", img: "/images/p11.jpg" },
  { id: "p12", brand: "MIU MIU", name: "Mini Matelassé", price: "AU$2,480", img: "/images/p12.jpg" },
];

export default function Home() {
  return (
    <>
      <Head>
        <title>Famous Finds — Luxury Resale</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta
          name="description"
          content="Curated luxury & designer resale marketplace — demo inventory loaded until user uploads."
        />
      </Head>

      <Header />

      {/* HERO */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>FAMOUS FINDS</h1>
          <p className={styles.heroSub}>
            Curated luxury. Authenticated. Australia-ready.
          </p>
          <div className={styles.heroCtas}>
            <Link className={styles.ctaPrimary} href="#categories">
              Shop by Category
            </Link>
            <Link className={styles.ctaSecondary} href="#trending">
              See What’s Trending
            </Link>
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section id="categories" className={styles.section}>
        <div className={styles.sectionHead}>
          <h2>Shop by Category</h2>
          <Link className={styles.viewAll} href="/shop">
            View all →
          </Link>
        </div>
        <div className={styles.catGrid}>
          {categories.map((c) => (
            <CategoryTile
              key={c.key}
              title={c.title}
              img={c.img}
              href={`/shop?cat=${c.key}`}
            />
          ))}
        </div>
      </section>

      {/* NOW TRENDING */}
      <section id="trending" className={styles.section}>
        <div className={styles.sectionHead}>
          <h2>Now Trending</h2>
          <Link className={styles.viewAll} href="/trending">
            View all →
          </Link>
        </div>
        <div className={styles.prodGrid}>
          {demoProducts.slice(0, 8).map((p) => (
            <ProductCard key={p.id} {...p} />
          ))}
        </div>
      </section>

      {/* BESTSELLING BAGS */}
      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <h2>Bestselling Bags</h2>
        </div>
        <div className={styles.prodRow}>
          {demoProducts.slice(0, 6).map((p) => (
            <ProductCard key={`b-${p.id}`} compact {...p} />
          ))}
        </div>
      </section>

      {/* NEW ARRIVALS */}
      <section className={styles.sectionAlt}>
        <div className={styles.sectionHead}>
          <h2>New Arrivals</h2>
        </div>
        <div className={styles.prodGrid}>
          {demoProducts.slice(6, 12).map((p) => (
            <ProductCard key={`n-${p.id}`} {...p} />
          ))}
        </div>
      </section>

      {/* NEWSLETTER */}
      <section className={styles.newsletter}>
        <h3>Get exclusive drops & price alerts</h3>
        <form className={styles.newsForm} action="/api/subscribe" method="post">
          <input
            className={styles.input}
            type="email"
            name="email"
            placeholder="Your email"
            required
          />
          <button className={styles.ctaPrimary} type="submit">
            Subscribe
          </button>
        </form>
        <small className={styles.note}>
          By subscribing you agree to our Terms & Privacy.
        </small>
      </section>

      <Footer />
      <CookieBar />
    </>
  );
}
