// FILE: /pages/designers/[slug].tsx

import Head from "next/head";
import Link from "next/link";
import type { GetServerSideProps } from "next";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { adminDb } from "../../utils/firebaseAdmin";
import { getDeletedListingIds } from "../../lib/deletedListings";
import ProductCard, { ProductLike } from "../../components/ProductCard";

/* ---------- helpers ---------- */
const slugify = (s: string) =>
  s
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

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
  // ✅ Added Admin Guard to avoid random 500s
  if (!adminDb) {
    return {
      props: {
        designer: { 
          id: String(ctx.params?.slug || ""), 
          name: String(ctx.params?.slug || ""), 
          slug: String(ctx.params?.slug || "") 
        },
        items: [],
      },
    };
  }

  try {
    const raw = String(ctx.params?.slug || "");
    const decoded = decodeURIComponent(raw);
    const slug = slugify(decoded);

    // 1. Try doc ID = raw URL param
    let docSnap = await adminDb.collection("designers").doc(raw).get();

    // 2. Try doc ID = slugified URL param
    if (!docSnap.exists && slug !== raw) {
      docSnap = await adminDb.collection("designers").doc(slug).get();
    }

    // 3. Query by slug field
    if (!docSnap.exists) {
      const bySlug = await adminDb
        .collection("designers")
        .where("slug", "==", slug)
        .limit(1)
        .get();
      if (!bySlug.empty) docSnap = bySlug.docs[0];
    }

    // 4. Also try slug without & → and conversion (legacy slugs)
    if (!docSnap.exists) {
      const legacySlug = decoded
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      if (legacySlug !== slug) {
        const byLegacy = await adminDb
          .collection("designers")
          .where("slug", "==", legacySlug)
          .limit(1)
          .get();
        if (!byLegacy.empty) docSnap = byLegacy.docs[0];
      }
    }

    // 5. Full-scan fallback: slugify every designer name and compare
    //    (designers collection is small, typically <100 docs)
    if (!docSnap.exists) {
      const allSnap = await adminDb.collection("designers").get();
      for (const d of allSnap.docs) {
        const data = d.data() as any;
        const name = String(data?.name ?? d.id).trim();
        if (slugify(name) === slug) {
          docSnap = d;
          break;
        }
      }
    }

    // Real 404 only after exhausting all lookup methods
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

    const deletedIds = await getDeletedListingIds();

    const items: ProductLike[] = listingSnap.docs
      .filter((doc) => !deletedIds.has(doc.id))
      .map((doc) => {
      const l: any = doc.data() || {};
      const priceNumber = Number(l.price) || 0;
      const image =
        l.displayImageUrl ||
        l.display_image_url ||
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
