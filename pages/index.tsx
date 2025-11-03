// FILE: /pages/index.tsx

import React from "react";
import Head from "next/head";
import DemoGrid from "../components/DemoGrid";
import { ProductLike } from "../components/ProductCard";
import styles from "../styles/home.module.css";

// ---- DEMO DATA (fills every box until real uploads) ----
const stock = (overrides: Partial<ProductLike> = {}): ProductLike => ({
  title: "Classic Tote",
  brand: "LOUIS VUITTON",
  price: "A$1,250",
  image:
    "https://images.unsplash.com/photo-1547949003-9792a18a2601?q=80&w=800&auto=format&fit=crop",
  condition: "Very Good",
  location: "Australia",
  badge: "Trending",
  href: "#",
  ...overrides,
});

const demoProducts: ProductLike[] = [
  stock({ title: "Silk Blouse", brand: "ROBERTO CAVALLI", price: "A$450",
          image: "https://images.unsplash.com/photo-1520975922284-0f49c89c7c8f?q=80&w=800&auto=format&fit=crop" }),
  stock({ title: "Boyfriend Jeans", brand: "DIESEL", price: "A$295",
          image: "https://images.unsplash.com/photo-1503341504253-dff4815485f1?q=80&w=800&auto=format&fit=crop" }),
  stock({ title: "Leather Crossbody", brand: "CELINE", price: "A$1,850",
          image: "https://images.unsplash.com/photo-1602810318383-3a9dea62b0d5?q=80&w=800&auto=format&fit=crop" }),
  stock({ title: "Mini Pouch", brand: "BALLY", price: "A$220",
          image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=800&auto=format&fit=crop" }),
  stock({ title: "Combat Boots", brand: "PRADA", price: "A$990",
          image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=800&auto=format&fit=crop" }),
  stock({ title: "Classic Trench", brand: "BURBERRY", price: "A$1,390",
          image: "https://images.unsplash.com/photo-1519744792095-2f2205e87b6f?q=80&w=800&auto=format&fit=crop" }),
  stock({ title: "Statement Heels", brand: "JIMMY CHOO", price: "A$560",
          image: "https://images.unsplash.com/photo-1520976220700-6e0a1f4d2c6e?q=80&w=800&auto=format&fit=crop" }),
  stock({ title: "City Backpack", brand: "SAINT LAURENT", price: "A$1,180",
          image: "https://images.unsplash.com/photo-1603566234499-65676b1dc9e9?q=80&w=800&auto=format&fit=crop" }),
  // extra items ensure every section is full, even on wide screens:
  stock({ title: "Iconic Shoulder Bag", brand: "CHANEL", price: "A$4,950",
          image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?q=80&w=800&auto=format&fit=crop" }),
  stock({ title: "Leather Loafers", brand: "GUCCI", price: "A$720",
          image: "https://images.unsplash.com/photo-1520975930418-1e0adf6c7d94?q=80&w=800&auto=format&fit=crop" }),
  stock({ title: "Denim Jacket", brand: "LEVI’S", price: "A$180",
          image: "https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?q=80&w=800&auto=format&fit=crop" }),
  stock({ title: "Wool Cardigan", brand: "ACNE STUDIOS", price: "A$390",
          image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=800&auto=format&fit=crop" }),
];

export default function Home() {
  return (
    <>
      <Head>
        <title>Famous Finds — Pre-Loved Luxury in Australia</title>
        <meta
          name="description"
          content="Curated luxury fashion — shop bags, clothing, shoes and accessories. Famous Finds, Australia."
        />
      </Head>

      {/* HERO */}
      <header className="bg-[url('https://images.unsplash.com/photo-1450101215322-bf5cd27642fc?q=80&w=1600&auto=format&fit=crop')] bg-cover bg-center">
        <div className="bg-black/60">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-widest text-white">
              FAMOUS FINDS
            </h1>
            <p className="mt-3 text-zinc-200 max-w-xl">
              Curated luxury with better prices — sustainable, authenticated.
            </p>
            <a
              href="#categories"
              className="inline-block mt-5 px-4 py-2 rounded-lg bg-white text-black text-sm font-medium"
            >
              Shop by Category
            </a>
          </div>
        </div>
      </header>

      {/* CATEGORIES (demo tiles only) */}
      <section id="categories" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {["Bags","Clothing","Shoes","Accessories","Watches","Jewelry"].map((c) => (
            <div
              key={c}
              className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-center text-zinc-200"
            >
              {c}
            </div>
          ))}
        </div>
      </section>

      {/* NOW TRENDING / BESTSELLERS / NEW ARRIVALS */}
      <DemoGrid title="Now Trending" subtitle="Popular right now" items={demoProducts.slice(0, 8)} />
      <DemoGrid title="Bestselling Bags" subtitle="Fan favourites" items={demoProducts.slice(2, 10)} />
      <DemoGrid title="New Arrivals" subtitle="Fresh drops, updated daily" items={demoProducts.slice(4, 12)} />

      {/* EMAIL CAPTURE (static demo) */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 sm:p-8">
          <h3 className="text-lg font-semibold text-white">
            Get exclusive drops & price alerts
          </h3>
          <p className="mt-1 text-sm text-zinc-400">
            Join the list. We’ll only email when it’s worth it.
          </p>
          <form className="mt-4 flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              placeholder="you@example.com"
              className="flex-1 rounded-lg bg-black border border-zinc-700 px-3 py-2 text-sm text-white"
            />
            <button className="rounded-lg bg-white text-black px-4 py-2 text-sm font-medium">
              Subscribe
            </button>
          </form>
        </div>
      </section>

      <footer className="border-t border-zinc-800 py-8 text-center text-xs text-zinc-500">
        © {new Date().getFullYear()} Famous Finds — All rights reserved.
      </footer>
    </>
  );
}
