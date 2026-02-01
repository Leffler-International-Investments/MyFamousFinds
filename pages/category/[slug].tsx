// FILE: /pages/category/[slug].tsx
import Head from "next/head";
import Link from "next/link";
import { GetServerSideProps } from "next";
import { useEffect, useMemo, useState } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import ProductCard from "../../components/ProductCard";
import { getPublicListings } from "../../lib/publicListings";
import { adminDb } from "../../utils/firebaseAdmin";

type ProductLike = {
  id: string;
  title: string;
  brand?: string;
  designer?: string;
  price?: number;
  currency?: string;
  images?: string[];
  imageUrls?: string[];
  imageUrl?: string;
  category?: string;
  categorySlug?: string;
  condition?: string;
  material?: string;
  size?: string;
  color?: string;
  createdAt?: any;
};

const CATEGORY_LABELS: Record<string, string> = {
  "new-arrivals": "New Arrivals",
  catalogue: "Catalogue",
  women: "Women",
  bags: "Bags",
  men: "Men",
  jewelry: "Jewelry",
  watches: "Watches",
};

const CANON_CATS = ["women", "bags", "men", "jewelry", "watches"] as const;

// Used ONLY for UI text.
function titleCase(s: string) {
  return s
    .split("-")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

function safeNumber(n: any, fallback = 0) {
  const v = Number(n);
  return Number.isFinite(v) ? v : fallback;
}

function normalize(raw: any): string {
  if (raw == null) return "";
  return String(raw)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function canonicalSlug(slug: string): string {
  const s = normalize(slug);
  if (s === "mens") return "men";
  if (s === "jewellery") return "jewelry";
  if (s === "watch") return "watches";
  return s;
}

// Kept deliberately short so it doesn’t change your layout dramatically.
const MATERIAL_OPTIONS = [
  "Leather",
  "Exotic Leather",
  "Silk",
  "Cashmere",
  "Wool",
  "Linen",
  "Cotton",
  "Denim",
  "Velvet",
  "Suede",
  "Canvas",
  "Metal",
  "Gold",
  "Silver",
  "Ceramic",
  "Crystal",
  "Synthetic",
  "Other",
];

type PublicDesignersResponse = {
  ok: boolean;
  designers?: { id: string; name: string; slug: string; active?: boolean }[];
  error?: string;
};

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const rawSlug = String(ctx.params?.slug || "");
  const pageSlug = canonicalSlug(rawSlug);

  // category param to loader: blank for "new-arrivals" and "catalogue"
  try {
    const listings = await getPublicListings({
      category: pageSlug === "new-arrivals" || pageSlug === "catalogue" ? "" : pageSlug,
      take: 500,
    });

    const mapped: ProductLike[] = (listings || []).map((l: any) => ({
      id: l.id,
      title: String(l.title || l.name || "Untitled"),
      brand: l.brand || l.designer || "",
      designer: l.designer || l.brand || "",
      price: safeNumber(l.price, 0),
      currency: l.currency || "USD",
      images: Array.isArray(l.images) ? l.images : undefined,
      imageUrls: Array.isArray(l.imageUrls) ? l.imageUrls : undefined,
      imageUrl: l.imageUrl || "",
      category: l.category || "",
      categorySlug: l.categorySlug || "",
      condition: l.condition || "",
      material: l.material || "",
      size: l.size || "",
      color: l.color || "",
      createdAt: l.createdAt || null,
    }));

    return {
      props: {
        pageSlug,
        items: mapped,
      },
    };
  } catch (e) {
    // ✅ Safe fallback (keeps the page working even if loader errors)
    try {
      const snap = await adminDb.collection("listings").where("status", "==", "Live").get();

      const mapped: ProductLike[] = snap.docs.map((doc) => {
        const d: any = doc.data() || {};
        const priceNum = typeof d.price === "number" ? d.price : safeNumber(d.price, 0);

        return {
          id: doc.id,
          title: String(d.title || "Untitled"),
          brand: String(d.brand || ""),
          designer: String(d.designer || d.brand || ""),
          price: priceNum,
          currency: String(d.currency || "USD"),
          images: Array.isArray(d.images) ? d.images : undefined,
          imageUrls: Array.isArray(d.imageUrls) ? d.imageUrls : undefined,
          imageUrl: String(d.imageUrl || d.image_url || d.image || (d.imageUrls?.[0] || "")),
          category: String(d.category || ""),
          categorySlug: String(d.categorySlug || ""),
          condition: String(d.condition || ""),
          material: String(d.material || ""),
          size: String(d.size || ""),
          color: String(d.color || ""),
          createdAt: d.createdAt || null,
        };
      });

      return { props: { pageSlug, items: mapped } };
    } catch {
      return { props: { pageSlug, items: [] } };
    }
  }
};

export default function CategoryPage({
  pageSlug,
  items,
}: {
  pageSlug: string;
  items: ProductLike[];
}) {
  const pageTitle = CATEGORY_LABELS[pageSlug] || titleCase(pageSlug);

  const [q, setQ] = useState("");

  // Existing checkbox filters
  const [selectedCats, setSelectedCats] = useState<Record<string, boolean>>({});
  const [selectedDesigners, setSelectedDesigners] = useState<Record<string, boolean>>({});
  const [selectedConds, setSelectedConds] = useState<Record<string, boolean>>({});
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(1000000);
  const [sort, setSort] = useState<"newest" | "price_asc" | "price_desc">("newest");

  // ✅ Missing bulk-simple fields added (without changing your layout structure)
  const [material, setMaterial] = useState("");
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");

  // ✅ Designers source-of-truth from Firestore via your API (synced list)
  const [designerOptions, setDesignerOptions] = useState<string[] | null>(null);

  const normalizedItems = useMemo(() => {
    return (items || []).map((p) => {
      // Build a stable category slug from either categorySlug or category label
      const rawCat = p.categorySlug || p.category || "";
      let catSlug =
        rawCat
          .toString()
          .trim()
          .toLowerCase()
          .replace(/\s+/g, "-") || "";

      // Normalize common variants so filtering doesn’t “drift”
      catSlug = canonicalSlug(catSlug);

      const designerName = (p.designer || p.brand || "").toString().trim();
      const condition = (p.condition || "").toString().trim();
      const mat = (p.material || "").toString().trim();
      const sz = (p.size || "").toString().trim();
      const col = (p.color || "").toString().trim();
      const price = safeNumber(p.price, 0);

      return {
        ...p,
        _catSlug: catSlug,
        _designer: designerName,
        _condition: condition,
        _material: mat,
        _size: sz,
        _color: col,
        _price: price,
      } as any;
    });
  }, [items]);

  // ✅ Load designers list from your API (Firestore-synced)
  useEffect(() => {
    let alive = true;

    async function loadDesigners() {
      try {
        const res = await fetch("/api/public/designers");
        const data: PublicDesignersResponse = await res.json();

        if (!alive) return;

        if (data.ok && Array.isArray(data.designers) && data.designers.length > 0) {
          const names = Array.from(
            new Set(
              data.designers
                .filter((d) => d && d.active !== false)
                .map((d) => (d.name || "").trim())
                .filter(Boolean)
            )
          ).sort((a, b) => a.localeCompare(b));

          setDesignerOptions(names.length ? names : null);
          return;
        }

        setDesignerOptions(null);
      } catch {
        if (!alive) return;
        setDesignerOptions(null);
      }
    }

    loadDesigners();

    return () => {
      alive = false;
    };
  }, []);

  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    normalizedItems.forEach((p: any) => {
      if (p._catSlug) set.add(p._catSlug);
    });

    // keep stable order
    const ordered = CANON_CATS.filter((c) => set.has(c));
    const extras = Array.from(set)
      .filter((c) => !ordered.includes(c as any))
      .sort();
    return [...ordered, ...extras];
  }, [normalizedItems]);

  // ✅ Designers: union of Firestore-synced list + what exists in items
  const availableDesigners = useMemo(() => {
    const fromItems = new Set<string>();
    normalizedItems.forEach((p: any) => {
      if (p._designer) fromItems.add(p._designer);
    });

    const merged = new Set<string>();
    (designerOptions || []).forEach((d) => merged.add(d));
    Array.from(fromItems).forEach((d) => merged.add(d));

    return Array.from(merged).sort((a, b) => a.localeCompare(b));
  }, [normalizedItems, designerOptions]);

  const availableConditions = useMemo(() => {
    const set = new Set<string>();
    normalizedItems.forEach((p: any) => {
      if (p._condition) set.add(p._condition);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [normalizedItems]);

  const filteredItems = useMemo(() => {
    let list = [...normalizedItems];

    // hard page category (except catalogue / new-arrivals)
    if (pageSlug !== "catalogue" && pageSlug !== "new-arrivals") {
      list = list.filter((p: any) => p._catSlug === pageSlug);
    }

    // search
    const query = q.trim().toLowerCase();
    if (query) {
      list = list.filter((p: any) => {
        const hay = `${p.title || ""} ${p._designer || ""} ${p._catSlug || ""} ${p._material || ""} ${p._size || ""} ${p._color || ""}`.toLowerCase();
        return hay.includes(query);
      });
    }

    // category checkboxes
    const activeCats = Object.keys(selectedCats).filter((k) => selectedCats[k]);
    if (activeCats.length) {
      list = list.filter((p: any) => activeCats.includes(p._catSlug));
    }

    // designer checkboxes
    const activeDesigners = Object.keys(selectedDesigners).filter((k) => selectedDesigners[k]);
    if (activeDesigners.length) {
      list = list.filter((p: any) => activeDesigners.includes(p._designer));
    }

    // condition checkboxes
    const activeConds = Object.keys(selectedConds).filter((k) => selectedConds[k]);
    if (activeConds.length) {
      list = list.filter((p: any) => activeConds.includes(p._condition));
    }

    // ✅ Material / Size / Color (bulk-simple fields)
    const matQ = normalize(material);
    if (matQ) list = list.filter((p: any) => normalize(p._material).includes(matQ));

    const sizeQ = normalize(size);
    if (sizeQ) list = list.filter((p: any) => normalize(p._size).includes(sizeQ));

    const colorQ = normalize(color);
    if (colorQ) list = list.filter((p: any) => normalize(p._color).includes(colorQ));

    // price range
    list = list.filter((p: any) => p._price >= minPrice && p._price <= maxPrice);

    // sort
    if (sort === "price_asc") list.sort((a: any, b: any) => a._price - b._price);
    if (sort === "price_desc") list.sort((a: any, b: any) => b._price - a._price);

    // newest (default): already ordered by createdAt desc from loader
    return list;
  }, [
    normalizedItems,
    pageSlug,
    q,
    selectedCats,
    selectedDesigners,
    selectedConds,
    material,
    size,
    color,
    minPrice,
    maxPrice,
    sort,
  ]);

  function resetFilters() {
    setQ("");
    setSelectedCats({});
    setSelectedDesigners({});
    setSelectedConds({});
    setMaterial("");
    setSize("");
    setColor("");
    setMinPrice(0);
    setMaxPrice(1000000);
    setSort("newest");
  }

  return (
    <>
      <Head>
        <title>{pageTitle} • Famous Finds</title>
      </Head>

      <Header />

      <main className="ff-page">
        <div className="ff-top">
          <Link href="/dashboard" className="ff-back">
            ← Back to Dashboard
          </Link>
        </div>

        <div className="ff-headerRow">
          <h1 className="ff-title">{pageTitle}</h1>
          <div className="ff-titleMeta">
            <span>{filteredItems.length} results</span>
            <Link href="/category/catalogue" className="ff-backCatalogue">
              Back to Catalogue
            </Link>
          </div>
        </div>

        <div className="ff-searchRow">
          <input
            className="ff-search"
            placeholder="Search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        <div className="ff-layout">
          <aside className="ff-filters">
            <div className="ff-filtersHeader">
              <div className="ff-filtersTitle">Filters</div>
              <button className="ff-reset" onClick={resetFilters}>
                Reset
              </button>
            </div>

            <div className="ff-block">
              <div className="ff-blockTitle">Sort</div>
              <select
                className="ff-select"
                value={sort}
                onChange={(e) => setSort(e.target.value as any)}
              >
                <option value="newest">Newest</option>
                <option value="price_asc">Price (Low → High)</option>
                <option value="price_desc">Price (High → Low)</option>
              </select>
            </div>

            <div className="ff-block">
              <div className="ff-blockTitle">Category</div>
              {availableCategories.map((c) => (
                <label key={c} className="ff-check">
                  <input
                    type="checkbox"
                    checked={Boolean(selectedCats[c])}
                    onChange={(e) =>
                      setSelectedCats((prev) => ({ ...prev, [c]: e.target.checked }))
                    }
                  />
                  <span>{titleCase(c)}</span>
                </label>
              ))}
            </div>

            <div className="ff-block">
              <div className="ff-blockTitle">Designer</div>
              {availableDesigners.map((d) => (
                <label key={d} className="ff-check">
                  <input
                    type="checkbox"
                    checked={Boolean(selectedDesigners[d])}
                    onChange={(e) =>
                      setSelectedDesigners((prev) => ({ ...prev, [d]: e.target.checked }))
                    }
                  />
                  <span>{d}</span>
                </label>
              ))}
            </div>

            <div className="ff-block">
              <div className="ff-blockTitle">Material</div>
              <input
                className="ff-input"
                list="ff-materials"
                placeholder="Select or type…"
                value={material}
                onChange={(e) => setMaterial(e.target.value)}
              />
              <datalist id="ff-materials">
                {MATERIAL_OPTIONS.map((m) => (
                  <option key={m} value={m} />
                ))}
              </datalist>
            </div>

            <div className="ff-block">
              <div className="ff-blockTitle">Size</div>
              <input
                className="ff-input"
                placeholder="Type size…"
                value={size}
                onChange={(e) => setSize(e.target.value)}
              />
            </div>

            <div className="ff-block">
              <div className="ff-blockTitle">Color</div>
              <input
                className="ff-input"
                placeholder="Type color…"
                value={color}
                onChange={(e) => setColor(e.target.value)}
              />
            </div>

            <div className="ff-block">
              <div className="ff-blockTitle">Condition</div>
              {availableConditions.map((c) => (
                <label key={c} className="ff-check">
                  <input
                    type="checkbox"
                    checked={Boolean(selectedConds[c])}
                    onChange={(e) =>
                      setSelectedConds((prev) => ({ ...prev, [c]: e.target.checked }))
                    }
                  />
                  <span>{c}</span>
                </label>
              ))}
            </div>

            <div className="ff-block">
              <div className="ff-blockTitle">Price (USD)</div>
              <div className="ff-price">
                <div>
                  <div className="ff-priceLabel">Min</div>
                  <input
                    className="ff-input"
                    value={minPrice}
                    onChange={(e) => setMinPrice(safeNumber(e.target.value, 0))}
                  />
                </div>
                <div>
                  <div className="ff-priceLabel">Max</div>
                  <input
                    className="ff-input"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(safeNumber(e.target.value, 1000000))}
                  />
                </div>
              </div>
            </div>
          </aside>

          <section className="ff-results">
            {filteredItems.length === 0 ? (
              <div className="ff-empty">
                <h3>No Results</h3>
                <p>Try removing filters or changing category.</p>
                <button className="ff-emptyBtn" onClick={resetFilters}>
                  Reset filters
                </button>
              </div>
            ) : (
              <div className="ff-grid">
                {filteredItems.map((p: any) => (
                  <ProductCard key={p.id} {...p} />
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      <Footer />
    </>
  );
}
