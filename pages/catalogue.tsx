// FILE: /pages/catalogue.tsx

import Head from "next/head";
import { useRouter } from "next/router";
import Header from "../components/Header";
import Footer from "../components/Footer";

const categories = [
  { name: "All", slug: "all" },
  { name: "Bags", slug: "bags" },
  { name: "Watches", slug: "watches" },
  { name: "Jewelry", slug: "jewelry" },
  { name: "Clothing", slug: "clothing" },
  { name: "Shoes", slug: "shoes" },
  { name: "Kids", slug: "kids" },
  { name: "Home & Lifestyle", slug: "home" },
];

export default function CataloguePage() {
  const router = useRouter();
  const activeCategory =
    typeof router.query.category === "string"
      ? router.query.category
      : "all";

  return (
    <>
      <Head>
        <title>Catalogue | Famous-Finds</title>
        <meta
          name="description"
          content="Explore the Famous-Finds catalogue of curated pre-loved luxury fashion, accessories and lifestyle pieces."
        />
      </Head>

      <div className="min-h-screen flex flex-col bg-neutral-50">
        <Header />

        <main className="flex-1">
          {/* Hero / heading */}
          <section className="border-b border-neutral-200 bg-white">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-neutral-900">
                Famous-Finds Catalogue
              </h1>
              <p className="mt-2 max-w-2xl text-sm sm:text-base text-neutral-600">
                A curated selection of authenticated pre-loved luxury pieces.
                New items are added regularly as our sellers submit and our team
                completes their checks.
              </p>
            </div>
          </section>

          {/* Filters */}
          <section className="border-b border-neutral-200 bg-white">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => {
                  const isActive =
                    activeCategory === cat.slug ||
                    (activeCategory === "all" && cat.slug === "all");

                  return (
                    <button
                      key={cat.slug}
                      type="button"
                      onClick={() => {
                        const query =
                          cat.slug === "all"
                            ? {}
                            : { category: cat.slug };
                        router.push(
                          {
                            pathname: "/catalogue",
                            query,
                          },
                          undefined,
                          { shallow: true }
                        );
                      }}
                      className={[
                        "px-3 py-1.5 rounded-full text-xs sm:text-sm border transition",
                        isActive
                          ? "bg-neutral-900 text-white border-neutral-900"
                          : "bg-white text-neutral-700 border-neutral-200 hover:border-neutral-400",
                      ].join(" ")}
                    >
                      {cat.name}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-2 text-xs sm:text-sm text-neutral-500">
                <span>Sort by</span>
                <select
                  className="border border-neutral-200 rounded-full px-3 py-1 bg-neutral-50 text-neutral-700 text-xs sm:text-sm"
                  defaultValue="new"
                >
                  <option value="new">Newest arrivals</option>
                  <option value="price-low">Price: low to high</option>
                  <option value="price-high">Price: high to low</option>
                </select>
              </div>
            </div>
          </section>

          {/* Items grid placeholder */}
          <section className="bg-neutral-50">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
              <div className="rounded-2xl border border-dashed border-neutral-200 bg-white/60 px-4 py-8 sm:px-8 sm:py-10 text-center">
                <h2 className="text-lg sm:text-xl font-medium text-neutral-900">
                  Catalogue is being populated
                </h2>
                <p className="mt-2 text-sm sm:text-base text-neutral-600 max-w-2xl mx-auto">
                  Your verification and listing flows are live. As approved
                  pieces come through from sellers, they will appear here with
                  full details, pricing and filters — ready for buyers to
                  explore.
                </p>
                <p className="mt-4 text-xs sm:text-sm text-neutral-500">
                  In the meantime, you can{" "}
                  <a
                    href="/sell"
                    className="underline underline-offset-4 decoration-neutral-400 hover:decoration-neutral-800"
                  >
                    submit items to sell
                  </a>{" "}
                  or{" "}
                  <a
                    href="/concierge"
                    className="underline underline-offset-4 decoration-neutral-400 hover:decoration-neutral-800"
                  >
                    ask our concierge
                  </a>{" "}
                  to help source a specific piece.
                </p>
              </div>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
}

