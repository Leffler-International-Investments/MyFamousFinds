// FILE: /pages/designers/[slug].tsx

import Head from "next/head";
import Link from "next/link";
import type { GetServerSideProps } from "next";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { adminDb } from "../../utils/firebaseAdmin";
import ProductCard, { ProductLike } from "../../components/ProductCard";

/* ---------- helpers ---------- */
const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

type DesignerProps = {
  designer: { id: string; name: string; slug?: string };
  items: ProductLike[];
};

/* ---------- page ---------- */
export default function DesignerPage({ designer, items }: DesignerProps) {
  return (
    <div className="page">
      <Head>
        <title>{designer.name} – Famous Finds</title>
        <meta
          name="description"
          content={`Shop authenticated ${designer.name} items available on Famous Finds.`}
        />
        <link
          rel="canonical"
          href={`https://www.myfamousfinds.com/designers/${designer.slug}`}
        />
      </Head>

      <Header />

      <main className="wrap">
        <Link href="/designers" className="back">
          ← All designers
        </Link>

        <header className="header-block">
          <h1>{designer.name}</h1>
          <p className="hint">
            All live, authenticated pieces currently available from this
            designer.
          </p>
          <p className="count">
            {items.length === 1
              ? "1 item available"
              : `${items.length} items available`}
          </p>
        </header>

        {items.length === 0 ? (
          <p className="empty">
            No live items yet for this designer. Please check back soon.
          </p>
        ) : (
          <section className="grid">
            {items.map((p) => (
              <ProductCard key={p.id} {...p} />
            ))}
          </section>
        )}
      </main>

      <Footer />

      <style jsx>{`
        .page {
          background: #ffffff;
          color: #111827;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }
        .wrap {
          max-width: 1150px;
          margin: 0 auto;
          padding: 24px 16px 60px;
          width: 100%;
        }
        .back {
          font-size: 13px;
          color: #6b7280;
          text-decoration: none;
        }
        .back:hover {
          color: #111827;
        }
        .header-block {
          margin-top: 10px;
          margin-bottom: 20px;
        }
        h1 {
          font-family: "Georgia", serif;
          font-size: 28px;
          margin-bottom: 4px;
        }
        .hint {
          font-size: 14px;
          color: #4b5563;
        }
        .count {
          font-size: 13px;
          color: #9ca3af;
          margin-top: 4px;
        }
        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 18px;
        }
        .empty {
          margin-top: 18px;
          font-size: 14px;
          color: #6b7280;
        }
      `}</style>
    </div>
  );
}

/* ---------- server ---------- */
export const getServerSideProps: GetServerSideProps<DesignerProps> = async (
  ctx
) => {
  try {
    const raw = String(ctx.params?.slug || "");
    const decoded = decodeURIComponent(raw);
    const slug = slugify(decoded);

    let docSnap = await adminDb.collection("designers").doc(raw).get();

    if (!docSnap.exists) {
      docSnap = await adminDb.collection("designers").doc(slug).get();
    }

    if (!docSnap.exists) {
      const bySlug = await adminDb
        .collection("designers")
        .where("slug", "==", slug)
        .limit(1)
        .get();
      if (!bySlug.empty) docSnap = bySlug.docs[0];
    }

    // ✅ REAL 404 (fixes Soft 404 in Google Search Console)
    if (!docSnap.exists) {
      return { notFound: true };
    }

    const data: any = docSnap.data() || {};
    const designer = {
      id: docSnap.id,
      name: data.name || decoded || docSnap.id,
      slug: data.slug || slug,
    };

    const allowedStatuses = ["Live", "Active", "Approved"];

    let listingSnap = await adminDb
      .collection("listings")
      .where("brand", "==", designer.name)
      .where("status", "in", allowedStatuses)
      .get();

    if (listingSnap.empty) {
      listingSnap = await adminDb
        .collection("listings")
        .where("designer", "==", designer.name)
        .where("status", "in", allowedStatuses)
        .get();
    }

    const items: ProductLike[] = listingSnap.docs.map((doc) => {
      const l: any = doc.data() || {};
      const priceNumber = Number(l.price) || 0;
      const image =
        l.image_url ||
        l.imageUrl ||
        l.image ||
        (Array.isArray(l.imageUrls) && l.imageUrls[0]) ||
        "";

      return {
        id: doc.id,
        title: l.title || "",
        brand: l.brand || designer.name,
        price: priceNumber ? `US$${priceNumber.toLocaleString("en-US")}` : "",
        image,
        href: `/product/${doc.id}`,
        badge: l.badge || undefined,
      };
    });

    return { props: { designer, items } };
  } catch (e) {
    console.error("Designer page error:", e);
    return { notFound: true };
  }
};
