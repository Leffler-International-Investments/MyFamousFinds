// FILE: /pages/store/[seller].tsx
import Head from "next/head";
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

export default function StorePage({
  sellerId,
  name,
  followers,
  bio,
  listings,
}: StorePageProps) {
  return (
    <div className="dark-theme-page">
      <Head>
        <title>{name} — Famous Finds Store</title>
      </Head>
      <Header />
      <main className="wrap">
        <section className="storeHeader">
          <div className="avatar">{name.charAt(0).toUpperCase()}</div>
          <div>
            <h1>{name}</h1>
            <p className="meta">
              {followers.toLocaleString()} followers · Seller ID {sellerId}
            </p>
            {bio && <p className="bio">{bio}</p>}
          </div>
        </section>

        <section className="grid">
          {listings.map((x) => (
            <article key={x.id} className="card">
              <img src={x.imageUrl} alt={x.title} className="cardImg" />
              <div className="cardBody">
                <h2>{x.title}</h2>
                <p className="price">
                  US$
                  {x.price.toLocaleString("en-US", {
                    maximumFractionDigits: 0,
                  })}
                </p>
              </div>
            </article>
          ))}
          {listings.length === 0 && (
            <p className="empty">No listings for this seller yet.</p>
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
        .storeHeader {
          display: flex;
          gap: 14px;
          align-items: center;
          margin-bottom: 24px;
        }
        .avatar {
          width: 48px;
          height: 48px;
          border-radius: 999px;
          background: #020617;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          font-weight: 600;
        }
        h1 {
          font-size: 22px;
        }
        .meta {
          font-size: 13px;
          color: #9ca3af;
        }
        .bio {
          font-size: 13px;
          color: #e5e7eb;
          margin-top: 4px;
        }
        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 16px;
        }
        .card {
          border-radius: 12px;
          border: 1px solid #1f2937;
          overflow: hidden;
          background: #020617;
        }
        .cardImg {
          width: 100%;
          height: 220px;
          object-fit: cover;
        }
        .cardBody {
          padding: 10px 12px 12px;
        }
        .price {
          margin-top: 4px;
          font-size: 14px;
        }
        .empty {
          font-size: 13px;
          color: #9ca3af;
        }
      `}</style>
    </div>
  );
}

export async function getServerSideProps(ctx: any) {
  const sellerId = ctx.params?.seller as string;
  if (!sellerId) {
    return { notFound: true };
  }

  const sellerSnap = await adminDb.collection("sellers").doc(sellerId).get();
  if (!sellerSnap.exists) {
    return { notFound: true };
  }

  const sellerData: any = sellerSnap.data() || {};

  const listingsSnap = await adminDb
    .collection("listings")
    .where("sellerId", "==", sellerId)
    .limit(100)
    .get();

  const listings = listingsSnap.docs.map((doc) => {
    const d: any = doc.data() || {};
    return {
      id: doc.id,
      title: d.title || "Listing",
      price: typeof d.price === "number" ? d.price : 0,
      // Prefer displayImageUrl (white background processed) over original
      imageUrl:
        d.displayImageUrl ||
        d.image_url ||
        d.imageUrl ||
        d.image ||
        (Array.isArray(d.imageUrls) && d.imageUrls[0]) ||
        "",
    };
  });

  return {
    props: {
      sellerId,
      name: sellerData.name || "Seller",
      followers: sellerData.followers || 0,
      bio: sellerData.bio || "",
      listings,
    },
  };
}
