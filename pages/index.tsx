// FILE: /pages/index.tsx

import Head from "next/head";
import Link from "next/link";
import type { GetServerSideProps, NextPage } from "next";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";

import Header from "../components/Header";
import Footer from "../components/Footer";
import ProductCard, { ProductLike } from "../components/ProductCard";
import RecentlyViewed from "../components/RecentlyViewed";
import { getPublicListings } from "../lib/publicListings";
import { getDeletedListingIds } from "../lib/deletedListings";
import { adminDb } from "../utils/firebaseAdmin";
import { auth, db, firebaseClientReady } from "../utils/firebaseClient";

// --------------------------------------------------
// Types
// --------------------------------------------------

type BuyerMessage = {
  id: string;
  text: string;
  linkText?: string;
  linkUrl?: string;
  imageUrl?: string;
  videoUrl?: string;
  type: "info" | "promo" | "alert";
  active?: boolean;
  createdAt?: number;
};

type HomeProps = {
  trending: ProductLike[];
  newArrivals: ProductLike[];
  activeMessages: BuyerMessage[];
  designerOptions: string[];
};

const CATEGORY_OPTIONS = ["Women", "Men", "Kids", "Bags", "Shoes", "Accessories", "Jewelry", "Watches"];

const CONDITION_OPTIONS = ["New with tags", "New (never used)", "Excellent", "Very good", "Good", "Fair"];

const COLOR_OPTIONS: { label: string; hex: string }[] = [
  { label: "Black", hex: "#000000" },
  { label: "White", hex: "#FFFFFF" },
  { label: "Cream", hex: "#FFFDD0" },
  { label: "Beige", hex: "#D2B48C" },
  { label: "Brown", hex: "#8B4513" },
  { label: "Tan", hex: "#C8A97E" },
  { label: "Burgundy", hex: "#800020" },
  { label: "Red", hex: "#DC2626" },
  { label: "Pink", hex: "#EC4899" },
  { label: "Orange", hex: "#F97316" },
  { label: "Yellow", hex: "#EAB308" },
  { label: "Green", hex: "#16A34A" },
  { label: "Blue", hex: "#2563EB" },
  { label: "Navy", hex: "#1E3A5F" },
  { label: "Purple", hex: "#7C3AED" },
  { label: "Grey", hex: "#9CA3AF" },
  { label: "Silver", hex: "#C0C0C0" },
  { label: "Gold", hex: "#D4AF37" },
  { label: "Multi", hex: "conic-gradient(red,orange,yellow,green,blue,purple,red)" },
];

const MATERIAL_OPTIONS = [
  "Leather",
  "Exotic Leather",
  "Silk",
  "Cashmere",
  "Wool",
  "Linen",
  "Cotton",
  "Cotton Blend",
  "Denim",
  "Velvet",
  "Suede",
  "Canvas",
  "Metal",
  "Gold",
  "Silver",
  "Plated Metal",
  "Ceramic",
  "Crystal",
  "Resin",
  "Synthetic",
  "Other",
];

function normalize(raw: any): string {
  if (!raw) return "";
  return String(raw).toString().trim().toLowerCase();
}

function parseNum(v: any): number {
  if (typeof v === "number") return v;
  const n = Number(String(v || "").replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function safeUrl(u?: string) {
  const s = String(u || "").trim();
  if (!s) return "";
  // allow relative internal links OR absolute links
  if (s.startsWith("/")) return s;
  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  return "";
}

function isMp4(u?: string) {
  const s = String(u || "").trim().toLowerCase();
  return s.endsWith(".mp4");
}

const HomePage: NextPage<HomeProps> = ({
  trending,
  newArrivals,
  activeMessages,
  designerOptions: serverDesignerOptions,
}) => {
  // Same filter UX as /pages/designers/index.tsx
  const [titleQuery, setTitleQuery] = useState("");
  const [category, setCategory] = useState("");
  const [designer, setDesigner] = useState("");
  const [condition, setCondition] = useState("");
  const [material, setMaterial] = useState("");
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  const [minPrice, setMinPrice] = useState<number | "">(0);
  const [maxPrice, setMaxPrice] = useState<number | "">(100000);
  const [sortBy, setSortBy] = useState<"newest" | "price-asc" | "price-desc">("newest");
  const [showFilters, setShowFilters] = useState(false);

  // Wishlist state
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentUidRef = useRef<string | null>(null);

  useEffect(() => {
    if (!firebaseClientReady || !auth || !db) return;
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setSavedIds(new Set());
        currentUidRef.current = null;
        return;
      }
      if (currentUidRef.current === user.uid) return;
      currentUidRef.current = user.uid;
      try {
        const snap = await getDocs(
          query(collection(db, "buyerSavedItems"), where("userId", "==", user.uid))
        );
        const ids = new Set(snap.docs.map((d) => (d.data() as any).listingId || ""));
        setSavedIds(ids);
      } catch {
        // ignore — user can still browse
      }
    });
    return () => unsub();
  }, []);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(null), 2500);
  }, []);

  const handleToggleWishlist = useCallback(
    async (productId: string) => {
      if (!auth?.currentUser) {
        window.location.href = "/login";
        return;
      }
      const wasSaved = savedIds.has(productId);
      const newSaved = new Set(savedIds);
      if (wasSaved) {
        newSaved.delete(productId);
        showToast("Product removed from your wishlist");
      } else {
        newSaved.add(productId);
        showToast("Product added to your wishlist");
      }
      setSavedIds(newSaved);

      try {
        const token = await auth.currentUser.getIdToken();
        await fetch("/api/wishlist/toggle", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ productId, on: !wasSaved }),
        });
      } catch {
        // Revert on failure
        setSavedIds(savedIds);
      }
    },
    [savedIds, showToast]
  );

  const resetFilters = () => {
    setTitleQuery("");
    setCategory("");
    setDesigner("");
    setCondition("");
    setMaterial("");
    setSize("");
    setColor("");
    setMinPrice(0);
    setMaxPrice(100000);
    setSortBy("newest");
  };

  // Combined pool (newArrivals + trending) used for homepage browsing
  const poolItems = useMemo(() => {
    const combined = [...(newArrivals || []), ...(trending || [])];

    const seen = new Set<string>();
    const uniq: any[] = [];
    for (const p of combined) {
      const id = String((p as any).id || "");
      if (!id || seen.has(id)) continue;
      seen.add(id);
      uniq.push(p);
    }
    return uniq;
  }, [newArrivals, trending]);

  const designerOptions = useMemo(() => {
    if (Array.isArray(serverDesignerOptions) && serverDesignerOptions.length > 0) {
      return serverDesignerOptions;
    }
    return Array.from(new Set(poolItems.map((x: any) => String(x.brand || "").trim()).filter(Boolean))).sort(
      (a, b) => a.localeCompare(b)
    );
  }, [poolItems, serverDesignerOptions]);

  const filteredItems = useMemo(() => {
    let result = [...(poolItems as any[])];

    const tq = normalize(titleQuery);
    const cat = normalize(category);
    const des = normalize(designer);
    const cond = normalize(condition);
    const mat = normalize(material);
    const sz = normalize(size);
    const col = normalize(color);

    if (tq) result = result.filter((x) => normalize(x.title).includes(tq));
    if (cat) result = result.filter((x) => normalize(x.category).includes(cat));
    if (des) result = result.filter((x) => normalize(x.brand).includes(des));
    if (cond) result = result.filter((x) => normalize(x.condition) === cond);

    if (mat) result = result.filter((x: any) => normalize(x.material).includes(mat));
    if (sz) result = result.filter((x: any) => normalize(x.size).includes(sz));
    if (col) result = result.filter((x: any) => normalize(x.color).includes(col));

    result = result.filter((x: any) => {
      const pv = parseNum(x.priceValue ?? x.price);
      const min = typeof minPrice === "number" ? minPrice : 0;
      const max = typeof maxPrice === "number" ? maxPrice : 999999999;
      return pv >= min && pv <= max;
    });

    if (sortBy === "price-asc")
      result.sort((a: any, b: any) => parseNum(a.priceValue ?? a.price) - parseNum(b.priceValue ?? b.price));
    if (sortBy === "price-desc")
      result.sort((a: any, b: any) => parseNum(b.priceValue ?? b.price) - parseNum(a.priceValue ?? a.price));
    if (sortBy === "newest") result.sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0));

    return result.slice(0, 48);
  }, [poolItems, titleQuery, category, designer, condition, material, size, color, minPrice, maxPrice, sortBy]);

  const topMessages = useMemo(() => {
    return Array.isArray(activeMessages) ? activeMessages.filter((m) => m && m.text && m.text.trim()).slice(0, 2) : [];
  }, [activeMessages]);

  const fSty: Record<string, React.CSSProperties> = {
    wrap: { display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" },
    input: { border: "1px solid #e5e7eb", borderRadius: "12px", padding: "8px 12px", fontSize: "13px", outline: "none", background: "#fff", minWidth: "140px", flex: "1 1 140px" },
    select: { border: "1px solid #e5e7eb", borderRadius: "12px", padding: "8px 12px", fontSize: "13px", outline: "none", background: "#fff", minWidth: "120px" },
    clear: { border: "1px solid #cbd5e1", background: "#fff", color: "#0f172a", borderRadius: "999px", padding: "8px 14px", fontWeight: 700, fontSize: "12px", cursor: "pointer", whiteSpace: "nowrap" },
  };

  const filterPanel = (
    <div style={fSty.wrap}>
      <input style={fSty.input} placeholder="Search by title..." value={titleQuery} onChange={(e) => setTitleQuery(e.target.value)} />
      <select style={fSty.select} value={category} onChange={(e) => setCategory(e.target.value)}>
        <option value="">All Categories</option>
        {CATEGORY_OPTIONS.map((o) => (<option key={o} value={o}>{o}</option>))}
      </select>
      <select style={fSty.select} value={designer} onChange={(e) => setDesigner(e.target.value)}>
        <option value="">All Designers</option>
        {designerOptions.map((o) => (<option key={o} value={o}>{o}</option>))}
      </select>
      <select style={fSty.select} value={condition} onChange={(e) => setCondition(e.target.value)}>
        <option value="">Condition</option>
        {CONDITION_OPTIONS.map((o) => (<option key={o} value={o}>{o}</option>))}
      </select>
      <select style={fSty.select} value={material} onChange={(e) => setMaterial(e.target.value)}>
        <option value="">Material</option>
        {MATERIAL_OPTIONS.map((o) => (<option key={o} value={o}>{o}</option>))}
      </select>
      <select style={fSty.select} value={color} onChange={(e) => setColor(e.target.value)}>
        <option value="">Color</option>
        {COLOR_OPTIONS.map((c) => (<option key={c.label} value={c.label}>{c.label}</option>))}
      </select>
      <select style={fSty.select} value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}>
        <option value="newest">Newest</option>
        <option value="price-asc">Price: Low to High</option>
        <option value="price-desc">Price: High to Low</option>
      </select>
      <button style={fSty.clear} type="button" onClick={resetFilters}>Clear All</button>
    </div>
  );

  return (
    <div className="home-wrapper">
      <Head>
        <title>Famous Finds — Shop authenticated designer pieces</title>
        <meta
          name="description"
          content="Discover curated, authenticated pre-loved designer bags, jewelry, watches and ready-to-wear from trusted sellers."
        />
      </Head>

      <Header
        showFilter={showFilters}
        onToggleFilter={() => setShowFilters(!showFilters)}
        filterContent={filterPanel}
      />

      <main className="wrap">
        {/* ✅ MESSAGE BOARD (RESTORED) */}
        {topMessages.length > 0 && (
          <section className="msgBoard">
            {topMessages.map((m) => {
              const link = safeUrl(m.linkUrl);
              const img = safeUrl(m.imageUrl);
              const vid = safeUrl(m.videoUrl);

              return (
                <div key={m.id} className={`msgCard msg-${m.type || "info"}`}>
                  <div className="msgTop">
                    <span className={`msgBadge badge-${m.type || "info"}`}>
                      {(m.type || "info").toUpperCase()}
                    </span>
                    <div className="msgText">{m.text}</div>
                  </div>

                  {(link || img || vid) && (
                    <div className="msgExtras">
                      {link && (
                        <div className="msgLinkWrap">
                          <Link href={link} className="msgLink">
                            {m.linkText?.trim() ? m.linkText : "View more"}
                          </Link>
                        </div>
                      )}

                      {img && (
                        <div className="msgMedia">
                          <img className="msgImg" src={img} alt="Announcement" />
                        </div>
                      )}

                      {vid && (
                        <div className="msgMedia">
                          {isMp4(vid) ? (
                            <video className="msgVid" controls>
                              <source src={vid} />
                            </video>
                          ) : (
                            <a className="msgVideoLink" href={vid} target="_blank" rel="noreferrer">
                              Watch video
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </section>
        )}

        {/* HERO */}
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">Curated pre-loved luxury</p>
            <h1>Famous Closets, Famous Finds</h1>
          </div>
        </section>

        {/* PRODUCT GRID */}
        {filteredItems.length === 0 ? (
          <div className="empty-state">
            <h3>No items match these filters.</h3>
            <p className="empty-hint">Try adjusting the FILTER in the header, or click below to reset.</p>
            <button className="resetBtn" onClick={resetFilters}>
              Reset filters
            </button>
          </div>
        ) : (
          <div className="cards">
            {filteredItems.map((p: any) => (
              <ProductCard
                key={p.id}
                {...p}
                isSaved={savedIds.has(p.id)}
                onToggleWishlist={handleToggleWishlist}
              />
            ))}
          </div>
        )}

        {/* Recently Viewed */}
        <RecentlyViewed />
      </main>

      {/* Wishlist toast notification */}
      {toastMsg && (
        <div className="wishlist-toast">
          <span className="wishlist-toast-icon">{toastMsg.includes("added") ? "\u2764" : "\u2661"}</span>
          {toastMsg}
        </div>
      )}

      <Footer />

      <style jsx>{`
        .home-wrapper {
          background: #ffffff;
        }
        .wrap {
          max-width: 1200px;
          margin: 0 auto;
          padding: 32px 16px 64px;
        }

        /* ✅ Message Board */
        .msgBoard {
          display: grid;
          gap: 10px;
          margin-bottom: 18px;
        }
        .msgCard {
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          padding: 12px 14px;
          box-shadow: 0 1px 0 rgba(15, 23, 42, 0.03);
        }
        .msgTop {
          display: flex;
          gap: 10px;
          align-items: flex-start;
        }
        .msgBadge {
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 0.12em;
          padding: 5px 8px;
          border-radius: 999px;
          line-height: 1;
          border: 1px solid #e5e7eb;
          color: #111827;
          background: #f3f4f6;
          flex: 0 0 auto;
        }
        .badge-info {
          background: #f3f4f6;
          border-color: #e5e7eb;
        }
        .badge-promo {
          background: #ecfdf5;
          border-color: #a7f3d0;
          color: #065f46;
        }
        .badge-alert {
          background: #fef2f2;
          border-color: #fecaca;
          color: #991b1b;
        }
        .msgText {
          font-size: 13px;
          color: #111827;
          line-height: 1.45;
          font-weight: 600;
          padding-top: 1px;
        }
        .msgExtras {
          margin-top: 10px;
          display: grid;
          gap: 10px;
        }
        .msgLinkWrap {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .msgLink {
          font-size: 13px;
          font-weight: 800;
          text-decoration: none;
          color: #0f172a;
          border: 1px solid #e5e7eb;
          padding: 8px 12px;
          border-radius: 999px;
          background: #fff;
          display: inline-flex;
          width: fit-content;
        }
        .msgMedia {
          border: 1px solid #eef2f7;
          border-radius: 14px;
          overflow: hidden;
          background: #fafafa;
        }
        .msgImg {
          display: block;
          width: 100%;
          max-height: 260px;
          object-fit: cover;
        }
        .msgVid {
          display: block;
          width: 100%;
          max-height: 320px;
        }
        .msgVideoLink {
          display: block;
          padding: 12px;
          font-weight: 800;
          color: #0f172a;
          text-decoration: none;
        }

        .hero {
          display: flex;
          justify-content: center;
          margin-bottom: 30px;
        }
        .hero-copy {
          text-align: center;
        }
        .eyebrow {
          font-size: 12px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #6b7280;
          margin: 0 0 8px;
        }
        h1 {
          margin: 0 0 10px;
          font-size: 44px;
          letter-spacing: -0.03em;
          line-height: 1.05;
          color: #0f172a;
        }
        .cards {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 14px;
        }
        .empty-state {
          padding: 48px 18px;
          border: 1px dashed #e5e7eb;
          border-radius: 16px;
          text-align: center;
          background: #fff;
        }
        .empty-state h3 {
          margin: 0 0 6px;
          font-size: 16px;
          color: #111827;
        }
        .empty-hint {
          margin: 0 0 14px;
          font-size: 13px;
          color: #6b7280;
        }
        .resetBtn {
          border: 1px solid #cbd5e1;
          background: #fff;
          color: #0f172a;
          border-radius: 999px;
          padding: 10px 14px;
          font-weight: 700;
          cursor: pointer;
        }

        /* Wishlist toast */
        .wishlist-toast {
          position: fixed;
          bottom: 32px;
          left: 50%;
          transform: translateX(-50%);
          background: #111827;
          color: #fff;
          padding: 12px 20px;
          border-radius: 999px;
          font-size: 14px;
          font-weight: 500;
          z-index: 9999;
          display: flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 4px 24px rgba(0, 0, 0, 0.18);
          animation: toastIn 0.3s ease;
          white-space: nowrap;
        }
        .wishlist-toast-icon {
          font-size: 16px;
        }
        @keyframes toastIn {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }

        @media (max-width: 980px) {
          .cards {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }
        @media (max-width: 640px) {
          h1 {
            font-size: 34px;
          }
          .cards {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 10px;
          }
        }
      `}</style>
    </div>
  );
};

export const getServerSideProps: GetServerSideProps = async () => {
  // Use getPublicListings (client SDK) — same data source as category pages
  // which successfully show all items. The Admin SDK may point to different data.
  let items: any[] = [];
  try {
    const excludeIds = await getDeletedListingIds();
    const listings = await getPublicListings({ take: 500, excludeIds });
    items = (listings || []).map((l: any) => {
      const priceNum = typeof l.price === "number" ? l.price : (typeof l.priceUsd === "number" ? l.priceUsd : 0);
      return {
        id: l.id,
        title: l.title || "Untitled",
        brand: l.brand || "",
        price: priceNum ? `US$${priceNum.toLocaleString("en-US")}` : "",
        priceValue: priceNum || 0,
        image: l.displayImageUrl || (Array.isArray(l.images) && l.images[0] ? l.images[0] : ""),
        href: `/product/${l.id}`,
        category: l.category || "",
        condition: l.condition || "",
        material: l.material || "",
        size: l.size || "",
        color: l.color || "",
        createdAt: l.createdAt?.toMillis?.() || (l.createdAt instanceof Date ? l.createdAt.getTime() : 0),
        viewCount: 0,
        sellerId: "",
      };
    });
  } catch (err) {
    console.error("Error fetching listings via getPublicListings:", err);
  }

  const newArrivals = items.slice();
  const trending = items.slice();

  let activeMessages: BuyerMessage[] = [];
  try {
    const messagesRef = adminDb.collection("buyer_messages");
    let snap = await messagesRef.where("active", "==", true).get();
    if (snap.empty) snap = await messagesRef.get();

    activeMessages = snap.docs
      .map((doc) => {
        const d = doc.data() as any;
        return {
          id: doc.id,
          text: d.text || "",
          linkText: d.linkText || "",
          linkUrl: d.linkUrl || "",
          imageUrl: d.imageUrl || "",
          videoUrl: d.videoUrl || "",
          type: (d.type as BuyerMessage["type"]) || "info",
          active: d.active ?? true,
          createdAt: d.createdAt?.toMillis?.() || 0,
        } as BuyerMessage;
      })
      .filter((m) => m.active !== false && m.text.trim().length > 0)
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  } catch (err) {
    console.error("Error fetching messages:", err);
  }

  let designerOptions: string[] = [];
  try {
    const ds = await adminDb.collection("designers").get();
    designerOptions = ds.docs
      .map((doc) => {
        const data = doc.data() as any;
        const name = String(data?.name ?? doc.id).trim();
        const active = data?.active !== false;
        return active ? name : "";
      })
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));
  } catch (err) {
    console.error("Error fetching designers for homepage:", err);
    designerOptions = Array.from(new Set(items.map((i) => String(i.brand || "").trim()).filter(Boolean))).sort((a, b) =>
      a.localeCompare(b)
    );
  }

  return {
    props: {
      trending,
      newArrivals,
      activeMessages,
      designerOptions,
    },
  };
};

export default HomePage;
