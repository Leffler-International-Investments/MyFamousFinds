// FILE: /pages/store/[seller].tsx
import Head from "next/head";
import Link from "next/link";
import type { GetServerSideProps } from "next";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { adminDb } from "../../utils/firebaseAdmin";

type StorePageProps = {
  sellerId: string;
  name: string;
  followers: number;
  bio?: string;
  listings: {
    id: string;
    title: string;
    price: number;
    imageUrl: string;
  }[];
};

export default function Storefront({
  sellerId,
  name,
  followers,
  bio,
  listings,
}: StorePageProps) {
  return (
    <div className="dark-theme-page">
      <Head>
        <title>{name} — Storefront | Famous Finds</title>
      </Head>
      <Header />

      <main className="wrap">
        <div className="hero">
          <div>
            <div className="name">{name}</div>
            <div className="meta">
              {followers.toLocaleString("en-US")} followers
            </div>
            {bio && <p className="bio">{bio}</p>}
          </div>
          <div className="sellerBox">
            <div className="idLabel">Seller ID</div>
            <div className="idVal">{sellerId}</div>
          </div>
        </div>

        <section className="grid">
          {listings.map((x) => (
            <Link href={`/product/${x.id}`} key={x.id} className="card">
              <div
                className="thumb"
                style={{ backgroundImage: `url(${x.imageUrl})` }}
              />
              <div className="t">{x.title}</div>
              <div className="p">
                US$
                {x.price.toLocaleString("en-US", {
                  maximumFractionDigits: 0,
                })}
              </div>
            </Link>
          ))}

          {!listings.length && (
            <p className="empty">
              This seller has no active listings yet.
            </p>
          )}
        </section>
      </main>

      <Footer />

      <style jsx>{`
        .wrap {
          max-width: 1100px;
          margin: 0 auto;
          padding: 24px 16px 80px;
        }
        .hero {
          display: flex;
          justify-content: space-between;
          gap: 18px;
          padding-bottom: 16px;
        }
        .name {
          font-size: 24px;
          font-weight: 600;
        }
        .meta {
          font-size: 13px;
          color: #9ca3af;
          margin-top: 4px;
        }
        .bio {
          font-size: 13px;
          color: #e5e7eb;
          margin-top: 8px;
          max-width: 26rem;
        }
        .sellerBox {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          justify-content: center;
        }
        .idLabel {
          font-size: 11px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: #9ca3af;
        }
        .idVal {
          font-family: monospace;
          font-size: 12px;
          padding: 4px 10px;
          border-radius: 999px;
          border: 1px solid #374151;
          background: #020617;
        }
        .grid {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 12px;
          margin-top: 24px;
        }
        .card {
          display: block;
          border-radius: 16px;
          overflow: hidden;
          border: 1px solid #111827;
          background: #020617;
          text-decoration: none;
        }
        .thumb {
          padding-top: 100%;
          background-size: cover;
          background-position: center;
        }
        .t {
          font-size: 14px;
          padding: 8px 10px 0;
        }
        .p {
          font-size: 13px;
          padding: 4px 10px 10px;
          color: #e5e7eb;
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
        @media (max-width: 1024px) {
          .grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }
        @media (max-width: 640px) {
          .grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .hero {
            flex-direction: column;
            align-items: flex-start;
          }
          .sellerBox {
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps<StorePageProps> = async (
  ctx
) => {
  const sellerParam = String(ctx.params?.seller || "");
  if (!sellerParam) return { notFound: true };

  try {
    const sellerDoc = await adminDb.collection("sellers").doc(sellerParam).get();
    const sData: any = sellerDoc.exists ? sellerDoc.data() : {};

    const snap = await adminDb
      .collection("listings")
      .where("sellerId", "==", sellerParam)
      .where("status", "==", "Active")
      .orderBy("createdAt", "desc")
      .limit(100)
      .get();

    const listings = snap.docs.map((doc) => {
      // --- THIS IS YOUR FIX ---
      const d: any = doc.data();
      // ------------------------
      return {
        id: doc.id,
        title: d.title || "Listing",
        price: typeof d.price === "number" ? d.price : 0,
        imageUrl:
          d.imageUrl ||
          d.image || // Added fallback
          (Array.isArray(d.imageUrls) && d.imageUrls[0]) || // Added fallback
          "https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto-format&fit=crop&w=800&q=80",
      };
    });

    return {
      props: {
        sellerId: sellerParam,
        name: sData.name || sData.displayName || sellerParam,
        followers: Number(sData.followers || 0),
        bio: sData.bio || "",
        listings,
      },
    };
  } catch (err) {
    console.error("Error loading storefront", err);
    return { notFound: true };
  }
};
