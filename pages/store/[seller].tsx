// FILE: /pages/store/[seller].tsx
import Head from "next/head";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { adminDb, isFirebaseAdminReady } from "../../utils/firebaseAdmin";
import { getDeletedListingIds } from "../../lib/deletedListings";

type StorePageProps = {
  sellerId: string;
  name: string;
  followers: number;
  bio?: string;
  verified: boolean;
  memberSince: string;
  itemsSold: number;
  listings: {
    id: string;
    title: string;
    brand: string;
    price: number;
    imageUrl: string;
    condition: string;
  }[];
};

export default function StorePage({
  sellerId,
  name,
  followers,
  bio,
  verified,
  memberSince,
  itemsSold,
  listings,
}: StorePageProps) {
  return (
    <div className="dark-theme-page">
      <Head>
        <title>{name} — Famous Finds Store</title>
        <meta name="description" content={`Shop authenticated luxury items from ${name} on Famous Finds. ${listings.length} items available.`} />
      </Head>
      <Header />
      <main className="wrap">
        {/* Enhanced Store Header */}
        <section className="storeHeader">
          <div className="avatar">{name.charAt(0).toUpperCase()}</div>
          <div className="storeHeaderInfo">
            <div className="nameRow">
              <h1>{name}</h1>
              {verified && <span className="verifiedBadge">Verified Seller</span>}
            </div>
            <div className="statsRow">
              <span>{followers.toLocaleString()} followers</span>
              <span className="dot" />
              <span>{itemsSold} items sold</span>
              {memberSince && (
                <>
                  <span className="dot" />
                  <span>Member since {memberSince}</span>
                </>
              )}
            </div>
            {bio && <p className="bio">{bio}</p>}
          </div>
        </section>

        {/* Listings Count */}
        <div className="listingsCount">
          <h2>{listings.length} {listings.length === 1 ? "Item" : "Items"} Available</h2>
        </div>

        <section className="grid">
          {listings.map((x) => (
            <Link key={x.id} href={`/product/${x.id}`} className="card">
              <img src={x.imageUrl || "/Famous-Finds-Logo-Transparent.png"} alt={x.title} className="cardImg" />
              <div className="cardBody">
                <span className="cardBrand">{x.brand}</span>
                <h2 className="cardTitle">{x.title}</h2>
                <span className="cardCondition">{x.condition}</span>
                <p className="price">
                  US$
                  {x.price.toLocaleString("en-US", {
                    maximumFractionDigits: 0,
                  })}
                </p>
              </div>
            </Link>
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
          gap: 16px;
          align-items: flex-start;
          margin-bottom: 28px;
          padding: 20px;
          border: 1px solid #1f2937;
          border-radius: 16px;
          background: #0f172a;
        }
        .storeHeaderInfo {
          flex: 1;
        }
        .avatar {
          width: 56px;
          height: 56px;
          border-radius: 999px;
          background: #1e40af;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          font-weight: 700;
          color: #fff;
          flex-shrink: 0;
        }
        .nameRow {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        h1 {
          font-size: 22px;
          margin: 0;
        }
        .verifiedBadge {
          background: #dbeafe;
          color: #1d4ed8;
          font-size: 10px;
          font-weight: 800;
          padding: 3px 8px;
          border-radius: 999px;
          letter-spacing: 0.04em;
        }
        .statsRow {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: #9ca3af;
          margin-top: 6px;
          flex-wrap: wrap;
        }
        .dot {
          width: 3px;
          height: 3px;
          border-radius: 999px;
          background: #6b7280;
        }
        .bio {
          font-size: 13px;
          color: #d1d5db;
          margin-top: 8px;
          line-height: 1.5;
        }
        .listingsCount {
          margin-bottom: 16px;
        }
        .listingsCount h2 {
          font-size: 16px;
          font-weight: 700;
          color: #e5e7eb;
          margin: 0;
        }
        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 16px;
        }
        .card {
          border-radius: 12px;
          border: 1px solid #1f2937;
          overflow: hidden;
          background: #020617;
          text-decoration: none;
          color: inherit;
          transition: border-color 0.15s, transform 0.15s;
        }
        .card:hover {
          border-color: #3b82f6;
          transform: translateY(-2px);
        }
        .cardImg {
          width: 100%;
          height: 220px;
          object-fit: cover;
          background: #ffffff;
        }
        .cardBody {
          padding: 10px 12px 14px;
        }
        .cardBrand {
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: #6b7280;
        }
        .cardTitle {
          font-size: 13px;
          font-weight: 600;
          margin: 3px 0;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .cardCondition {
          font-size: 11px;
          color: #9ca3af;
        }
        .price {
          margin-top: 6px;
          font-size: 14px;
          font-weight: 700;
        }
        .empty {
          font-size: 13px;
          color: #9ca3af;
          grid-column: 1 / -1;
          text-align: center;
          padding: 40px 0;
        }
        @media (max-width: 640px) {
          .storeHeader {
            flex-direction: column;
            align-items: center;
            text-align: center;
          }
          .nameRow {
            justify-content: center;
            flex-wrap: wrap;
          }
          .statsRow {
            justify-content: center;
          }
          .grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
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

  if (!isFirebaseAdminReady || !adminDb) {
    return { notFound: true };
  }

  const sellerSnap = await adminDb.collection("sellers").doc(sellerId).get();
  if (!sellerSnap.exists) {
    return { notFound: true };
  }

  const sellerData: any = sellerSnap.data() || {};

  // Seller stats
  let memberSince = "";
  const joinDate = sellerData.createdAt?.toDate?.() || sellerData.registeredAt?.toDate?.();
  if (joinDate) {
    memberSince = joinDate.toLocaleDateString("en-US", { year: "numeric", month: "short" });
  }

  let itemsSold = 0;
  try {
    const soldSnap = await adminDb.collection("orders")
      .where("sellerId", "==", sellerId)
      .limit(500)
      .get();
    itemsSold = soldSnap.size;
  } catch { /* skip */ }

  const verified = sellerData.verified === true || sellerData.status === "approved";

  const deletedIds = await getDeletedListingIds();

  const listingsSnap = await adminDb
    .collection("listings")
    .where("sellerId", "==", sellerId)
    .limit(100)
    .get();

  const listings = listingsSnap.docs
    .filter((doc) => {
      if (deletedIds.has(doc.id)) return false;
      const d: any = doc.data() || {};
      const status = String(d.status || "").toLowerCase();
      return status !== "sold" && status !== "removed" && status !== "deleted" && d.isSold !== true;
    })
    .map((doc) => {
      const d: any = doc.data() || {};
      return {
        id: doc.id,
        title: d.title || "Listing",
        brand: String(d.brand || d.designer || ""),
        price: typeof d.priceUsd === "number" ? d.priceUsd : (typeof d.price === "number" ? d.price : 0),
        imageUrl:
          d.displayImageUrl ||
          d.display_image_url ||
          d.image_url ||
          d.imageUrl ||
          d.image ||
          (Array.isArray(d.imageUrls) && d.imageUrls[0]) ||
          "",
        condition: String(d.condition || "").trim(),
      };
    });

  return {
    props: {
      sellerId,
      name: sellerData.name || sellerData.businessName || "Seller",
      followers: sellerData.followers || 0,
      bio: sellerData.bio || "",
      verified,
      memberSince,
      itemsSold,
      listings,
    },
  };
}
