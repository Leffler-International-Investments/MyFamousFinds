// FILE: /pages/categories/[slug].tsx
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

export default function CategoriesPage({ slug, label, items }: CategoryProps) {
  return (
    <div className="dark-theme-page">
      <Head>
        <title>{label} – Famous Finds</title>
      </Head>

      <Header />

      <main className="wrap">
        <header className="heading">
          <Link href="/" className="back">
            ← Home
          </Link>
          <h1>{label}</h1>
        </header>

        <p className="hint">
          {items.length
            ? `Live listings in the "${slug}" category.`
            : `No live listings yet in the "${slug}" category.`}
        </p>

        <section className="grid">
          {items.length > 0 ? (
            items.map((p) => <ProductCard key={p.id} {...p} />)
          ) : (
            <div className="empty">
              <p>
                Check back soon or browse other categories from the home page.
              </p>
            </div>
          )}
        </section>
      </main>

      <Footer />

      <style jsx>{`
        .wrap {
          max-width: 1200px;
          margin: 0 auto;
          padding: 16px 16px 80px;
        }
        .heading {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 12px;
          margin-top: 16px;
          margin-bottom: 4px;
        }
        .back {
          font-size: 13px;
          text-decoration: none;
          color: #4b5563;
        }
        .back:hover {
          color: #111827;
        }
        h1 {
          font-size: 22px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
        }
        .hint {
          font-size: 13px;
          color: #6b7280;
          margin-bottom: 16px;
        }
        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 18px;
        }
        .empty {
          grid-column: 1 / -1;
          padding: 24px;
          border-radius: 12px;
          border: 1px dashed #d1d5db;
          text-align: center;
          color: #6b7280;
          background: #f9fafb;
        }
        @media (max-width: 640px) {
          .wrap {
            padding-bottom: 40px;
          }
          .heading {
            flex-direction: column;
            align-items: flex-start;
          }
          h1 {
            font-size: 18px;
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
      .where("category", "==", normalized)
      .orderBy("createdAt", "desc")
      .limit(50)
      .get();

    const items: ProductLike[] = [];

    snap.docs.forEach((doc) => {
      const d: any = doc.data() || {};

      const allowedStatuses = ["Live", "Active", "Approved"];
      if (d.status && !allowedStatuses.includes(d.status)) {
        return;
      }

      const priceNumber = Number(d.price) || 0;
      const price = priceNumber
        ? `US$${priceNumber.toLocaleString("en-US")}`
        : "";

      const image: string =
        d.image_url ||
        d.imageUrl ||
        d.image ||
        (Array.isArray(d.imageUrls) && d.imageUrls[0]) ||
        "";

      items.push({
        id: doc.id,
        title: d.title || "Untitled listing",
        brand: d.brand || "",
        price,
        image,
        href: `/product/${doc.id}`,
        badge: d.badge || undefined,
      });
    });

    const labelMap: Record<string, string> = {
      bags: "BAGS",
      men: "MEN",
      women: "WOMEN",
      "new-arrivals": "NEW ARRIVALS",
      designers: "DESIGNERS",
      jewelry: "JEWELRY",
      watches: "WATCHES",
    };

    return {
      props: {
        slug: normalized,
        label: labelMap[normalized] || normalized.toUpperCase(),
        items,
      },
    };
  } catch (err) {
    console.error("Error loading category page", err);
    return {
      props: {
        slug: normalized,
        label: normalized.toUpperCase(),
        items: [],
      },
    };
  }
};
