// FILE: /pages/category/[slug].tsx
import Head from "next/head";
import Link from "next/link";
import type { GetServerSideProps } from "next";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import ProductCard, { ProductLike } from "../../components/ProductCard";
import { adminDb } from "../../utils/firebaseAdmin";

type CategoryProps = {
  slug: string;
  label: string;
  items: ProductLike[];
};

export default function CategoryPage({ slug, label, items }: CategoryProps) {
  return (
    <div className="dark-theme-page">
      <Head>
        <title>{label} – Famous Finds</title>
      </Head>
      <Header />

      <main className="wrap">
        <div className="topRow">
          <Link href="/" className="back">
            ← Home
          </Link>
          <h1>{label}</h1>
        </div>

        <p className="hint">
          {items.length
            ? `Live listings in the "${slug}" category.`
            : `No live listings yet in the "${slug}" category.`}
        </p>

        <section className="grid">
          {items.map((p) => (
            <ProductCard key={p.id} {...p} />
          ))}
          {!items.length && (
            <p className="empty">
              Check back soon or browse other categories from the home page.
            </p>
          )}
        </section>
      </main>

      <Footer />

      <style jsx>{`
        .wrap {
          max-width: 1200px;
          margin: 0 auto;
          padding: 24px 16px 80px;
        }
        .topRow {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 18px;
          margin-bottom: 6px;
        }
        h1 {
          letter-spacing: 0.14em;
          text-transform: uppercase;
          font-size: 18px;
        }
        .back {
          font-size: 13px;
          color: #9ca3af;
          text-decoration: none;
        }
        .back:hover {
          color: #e5e5e5;
        }
        .hint {
          font-size: 13px;
          color: #9ca3af;
          margin-bottom: 16px;
        }
        .grid {
          display: grid;
          gap: 12px;
          grid-template-columns: repeat(5, minmax(0, 1fr));
        }
        .empty {
          grid-column: 1 / -1;
          font-size: 13px;
          color: #9ca3af;
          padding: 16px;
          border-radius: 12px;
          border: 1px dashed #374151;
          text-align: center;
        }
        @media (max-width: 1100px) {
          .grid {
            grid-template-columns: repeat(4, minmax(0, 1fr));
          }
        }
        @media (max-width: 900px) {
          .grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }
        @media (max-width: 640px) {
          .grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
      `}</style>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps<CategoryProps> = async (
  ctx
) => {
  const raw = ctx.params?.slug;
  const slug = (Array.isArray(raw) ? raw[0] : raw) || "";
  if (!slug) return { notFound: true };

  const normalized = slug.toLowerCase();

  try {
    const snap = await adminDb
      .collection("listings")
      .where("status", "==", "Active")
      .where("category", "==", normalized)
      .orderBy("createdAt", "desc")
      .limit(60)
      .get();

    const items: ProductLike[] = snap.docs.map((doc) => {
      const d: any = doc.data() || {};
      const priceNumber = Number(d.price) || 0;
      const price = priceNumber
        ? `AU$${priceNumber.toLocaleString("en-AU")}`
        : "";
      const image: string =
        d.imageUrl ||
        "https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=800&q=80";

      return {
        id: doc.id,
        title: d.title || "Untitled listing",
        brand: d.brand || "",
        price,
        image,
        href: `/product/${doc.id}`,
        badge: d.badge || undefined,
      };
    });

    const label =
      normalized.charAt(0).toUpperCase() +
      normalized.slice(1).replace(/-/g, " ");

    return {
      props: {
        slug: normalized,
        label,
        items,
      },
    };
  } catch (err) {
    console.error("Error loading category page", err);
    return {
      props: {
        slug: normalized,
        label: normalized,
        items: [],
      },
    };
  }
};
