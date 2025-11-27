// FILE: /pages/designers/[slug].tsx

import Head from "next/head";
import Link from "next/link";
import type { GetServerSideProps } from "next";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { adminDb } from "../../utils/firebaseAdmin";
import ProductCard, {
  ProductLike,
} from "../../components/ProductCard";

// same helper as before
const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

type DesignerProps = {
  designer: { id: string; name: string; slug?: string } | null;
  items: ProductLike[];
};

export default function DesignerPage({ designer, items }: DesignerProps) {
  return (
    <div className="page">
      <Head>
        <title>
          {designer ? designer.name : "Designer"} – Famous Finds
        </title>
      </Head>

      <Header />

      <main className="wrap">
        <Link href="/designers" className="back">
          ← All designers
        </Link>

        {designer ? (
          <>
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
          </>
        ) : (
          <p className="error">Designer not found.</p>
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
        .error {
          margin-top: 16px;
          color: #b91c1c;
          font-size: 14px;
        }
      `}</style>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps<DesignerProps> = async (
  ctx
) => {
  try {
    const raw = String(ctx.params?.slug || "");
    const decoded = decodeURIComponent(raw);
    const slugFromName = slugify(decoded);

    // 1. Find designer document (same robust logic as original file)
    let docSnap = await adminDb.collection("designers").doc(raw).get(); // :contentReference[oaicite:1]{index=1}

    if (!docSnap.exists) {
      docSnap = await adminDb.collection("designers").doc(slugFromName).get();
    }
    if (!docSnap.exists) {
      const bySlug = await adminDb
        .collection("designers")
        .where("slug", "==", raw.toLowerCase())
        .limit(1)
        .get();
      if (!bySlug.empty) docSnap = bySlug.docs[0];
    }
    if (!docSnap.exists) {
      const byName = await adminDb
        .collection("designers")
        .where("name", "==", decoded)
        .limit(1)
        .get();
      if (!byName.empty) docSnap = byName.docs[0];
    }

    if (!docSnap.exists) {
      return { props: { designer: null, items: [] } };
    }

    const d = docSnap;
    const data: any = d.data() || {};
    const designer = {
      id: d.id,
      name: data.name || decoded || d.id,
      slug: data.slug || raw,
    };

    const allowedStatuses = ["Live", "Active", "Approved"];

    // 2. Fetch listings for this designer (try "brand" first, then "designer")
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
      const image: string =
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
  } catch (error) {
    console.error("Error loading designer page", error);
    return { props: { designer: null, items: [] } };
  }
};
