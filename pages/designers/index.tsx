// FILE: /pages/designers/index.tsx
import Head from "next/head";
import Link from "next/link";
import type { GetServerSideProps } from "next";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import ProductCard, { ProductLike } from "../../components/ProductCard";
import { adminDb } from "../../utils/firebaseAdmin";

type DesignersPageProps = {
  items: ProductLike[];
};

export default function DesignersPage({ items }: DesignersPageProps) {
  const slug = "designers";
  const label = "DESIGNERS";

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
            ? `Live listings from approved designers.`
            : `No live listings yet in the "${slug}" section.`}
        </p>

        <section className="grid">
          {items.length > 0 ? (
            items.map((p) => <ProductCard key={p.id} {...p} />)
          ) : (
            <div className="empty">
              <p>
                Once your team approves listings from vetted designers, they
                will appear here.
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
          gap: 12px;
          margin-bottom: 8px;
        }
        .back {
          font-size: 13px;
          color: #6b7280;
          text-decoration: none;
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
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 18px;
        }
        .empty {
          border-radius: 8px;
          border: 1px dashed #d1d5db;
          padding: 24px 18px;
          font-size: 14px;
          color: #4b5563;
        }
      `}</style>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps<
  DesignersPageProps
> = async () => {
  try {
    const snap = await adminDb
      .collection("listings")
      .where("status", "==", "Live")
      .orderBy("brand")
      .limit(60)
      .get();

    const items: ProductLike[] = [];

    snap.forEach((doc) => {
      const d: any = doc.data();

      const priceNumber =
        typeof d.price_usd === "number"
          ? d.price_usd
          : parseFloat(d.price_usd || d.price || "0");

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

    return {
      props: {
        items,
      },
    };
  } catch (err) {
    console.error("Error loading designers page", err);
    return {
      props: {
        items: [],
      },
    };
  }
};
