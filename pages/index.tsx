// FILE: /pages/index.tsx
import Head from "next/head";
import { useRouter } from "next/router";
import Header from "../components/Header";
import { CategoryTile, Category } from "../components/CategoryTile";
import ProductCard, { ProductLike } from "../components/ProductCard";
import styles from "../styles/home.module.css";

// --- Demo categories (click to filter) ---
const CATS: Category[] = [
  { slug: "bags", label: "Bags" },
  { slug: "clothing", label: "Clothing" },
  { slug: "shoes", label: "Shoes" },
  { slug: "accessories", label: "Accessories" },
  { slug: "watches", label: "Watches" },
  { slug: "jewelry", label: "Jewelry" },
  { slug: "mens", label: "Men" },
  { slug: "womens", label: "Women" },
  { slug: "kids", label: "Kids" },
  { slug: "home", label: "Home" },
  { slug: "beauty", label: "Beauty" },
  { slug: "sale", label: "Sale" },
];

// --- Demo inventory (shown until user uploads products) ---
const DEMO: (ProductLike & { cat: string })[] = [
  { cat: "bags", title: "Gucci Marmont Mini", brand: "GUCCI", price: "AU$2,450", image: "/demo/gucci-bag-1.jpg", badge: "New" },
  { cat: "bags", title: "Prada Re-Edition 2005", brand: "PRADA", price: "AU$2,990", image: "/demo/prada-bag-1.jpg" },
  { cat: "clothing", title: "Zimmermann Silk Blouse", brand: "ZIMMERMANN", price: "AU$480", image: "/demo/zimmermann.jpg" },
  { cat: "clothing", title: "Dior Printed Dress", brand: "DIOR", price: "AU$1,950", image: "/demo/dior-dress.jpg" },
  { cat: "shoes", title: "Chanel Slingbacks", brand: "CHANEL", price: "AU$1,250", image: "/demo/chanel-shoes.jpg" },
  { cat: "accessories", title: "LV Monogram Scarf", brand: "LOUIS VUITTON", price: "AU$620", image: "/demo/lv-scarf.jpg" },
  { cat: "watches", title: "Rolex Datejust 36", brand: "ROLEX", price: "AU$12,900", image: "/demo/rolex.jpg" },
  { cat: "jewelry", title: "Cartier Love Bracelet", brand: "CARTIER", price: "AU$9,800", image: "/demo/cartier-love.jpg" },
  { cat: "mens", title: "Acne Studios Tee", brand: "ACNE", price: "AU$190", image: "/demo/acne-tee.jpg" },
  { cat: "womens", title: "Celine Wool Coat", brand: "CELINE", price: "AU$2,650", image: "/demo/celine-coat.jpg" },
  { cat: "kids", title: "Burberry Kids Jacket", brand: "BURBERRY", price: "AU$430", image: "/demo/bb-kids.jpg" },
  { cat: "home", title: "Hermès Avalon Throw", brand: "HERMÈS", price: "AU$2,200", image: "/demo/hermes-throw.jpg" },
  { cat: "beauty", title: "Dior Lip Glow Set", brand: "DIOR", price: "AU$120", image: "/demo/dior-beauty.jpg" },
  { cat: "sale", title: "Chloé Faye Small (Sale)", brand: "CHLOÉ", price: "AU$990", image: "/demo/chloe-faye.jpg", badge: "-30%" },
];

export default function Home() {
  const router = useRouter();
  const activeCat = (router.query.cat as string) || "";

  const filtered = activeCat
    ? DEMO.filter((p) => p.cat === activeCat)
    : DEMO;

  return (
    <>
      <Head>
        <title>Famous Finds</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div style={{ background:"#0a0a0a", minHeight:"100vh" }}>
        <Header />

        <main className={styles.wrap}>
          {/* Hero */}
          <section className={styles.hero}>
            <h1 className={styles.heroTitle}>FAMOUS FINDS</h1>
            <p className={styles.heroSub}>
              Curated luxury & premium resale — Australia.
            </p>
          </section>

          {/* Categories (click filters the grid using `?cat=`) */}
          <section>
            <div className={styles.section}>
              <h3>Shop by Category</h3>
              {activeCat ? (
                <a href="/" aria-label="Clear filter">Clear filter</a>
              ) : <span />}
            </div>
            <div className={styles.catGrid}>
              {CATS.map((c) => (<CategoryTile key={c.slug} c={c} />))}
            </div>
          </section>

          {/* Product grids */}
          <section>
            <div className={styles.section}>
              <h3>{activeCat ? `Now Trending · ${activeCat}` : "Now Trending"}</h3>
              {!activeCat && <a href="/shop">View all</a>}
            </div>
            <div className={styles.grid}>
              {filtered.slice(0, 10).map((p, i) => (
                <ProductCard key={`${p.cat}-${i}`} p={p} />
              ))}
            </div>
          </section>

          <section>
            <div className={styles.section}>
              <h3>New Arrivals</h3>
              {!activeCat && <a href="/new">View all</a>}
            </div>
            <div className={styles.grid}>
              {filtered.slice(4, 14).map((p, i) => (
                <ProductCard key={`na-${p.cat}-${i}`} p={p} />
              ))}
            </div>
          </section>
        </main>
      </div>
    </>
  );
}
