// FILE: /pages/category/[slug].tsx
// Category listing page: /category/[slug]
// Uses single public loader to prevent category mismatches and avoid admin SDK in client bundle

import Head from "next/head";
import Link from "next/link";
import { GetServerSideProps } from "next";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import ProductGrid from "../../components/ProductGrid";
import FiltersPanel from "../../components/FiltersPanel";
import { getPublicListings } from "../../lib/publicListings";
import { useMemo, useState } from "react";

type ProductLike = any;

const TITLE_MAP: Record<string, string> = {
  "new-arrivals": "New Arrivals",
  catalogue: "Catalogue",
  designers: "Designers",
  women: "Women",
  bags: "Bags",
  men: "Men",
  jewelry: "Jewelry",
  watches: "Watches",
};

function safeTitle(slug: string) {
  const s = (slug || "").toLowerCase();
  return TITLE_MAP[s] || s.replace(/(^|-)\w/g, (m) => m.toUpperCase());
}

export default function CategoryPage({
  pageSlug,
  initialItems,
}: {
  pageSlug: string;
  initialItems: ProductLike[];
}) {
  const [items, setItems] = useState<ProductLike[]>(initialItems || []);
  const title = safeTitle(pageSlug);

  const allItems = useMemo(() => items || [], [items]);

  return (
    <>
      <Head>
        <title>{title} – Famous Finds</title>
      </Head>

      <Header />

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-semibold">{title}</h1>
          <Link href="/catalogue" className="text-sm font-medium hover:underline">
            Back to Catalogue
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-[280px_1fr]">
          <FiltersPanel
            pageSlug={pageSlug}
            allItems={allItems}
            onFiltered={(filtered) => setItems(filtered)}
          />

          <section>
            <div className="mb-3 text-sm text-gray-600">
              {items?.length || 0} results (refreshed)
            </div>
            <ProductGrid items={items} emptyTitle="No Results" />
          </section>
        </div>
      </main>

      <Footer />
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const pageSlug = String(ctx.params?.slug || "").toLowerCase();

  try {
    const items = await getPublicListings({
      category: pageSlug === "new-arrivals" ? "" : pageSlug,
      take: 500,
    });

    return {
      props: {
        pageSlug,
        initialItems: items || [],
      },
    };
  } catch (e) {
    // Keep the page alive even if loader fails (no firebase-admin fallback here).
    return {
      props: {
        pageSlug,
        initialItems: [],
      },
    };
  }
};


