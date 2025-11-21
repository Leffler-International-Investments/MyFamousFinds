// FILE: /pages/product/[id].tsx
import Head from "next/head";
import { GetServerSideProps } from "next";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { adminDb } from "../../utils/firebaseAdmin";

type ProductListing = {
  id: string;
  title: string;
  price: number;
  brand?: string;
  condition?: string;
  category?: string;
  color?: string;
  size?: string;
  description?: string;
  imageUrls: string[];
};

type Props = {
  listing: ProductListing | null;
};

function formatUsd(amount: number) {
  if (!amount || !isFinite(amount)) return "";
  return amount.toLocaleString("en-US", {
    maximumFractionDigits: 0,
  });
}

export default function ProductPage({ listing }: Props) {
  if (!listing) {
    return (
      <div className="dark-theme-page">
        <Header />
        <main className="section">
          <p>Listing not found.</p>
        </main>
        <Footer />
      </div>
    );
  }

  const heroImage =
    listing.imageUrls && listing.imageUrls.length > 0
      ? listing.imageUrls[0]
      : null;

  return (
    <div className="dark-theme-page">
      <Head>
        <title>{listing.title} | Famous Finds</title>
      </Head>

      <Header />

      <main className="section">
        {/* Breadcrumb */}
        <div style={{ fontSize: 12, marginBottom: 16, color: "#9ca3af" }}>
          Home / {listing.category || "Women"} / {listing.title}
        </div>

        <div className="product-layout">
          {/* LEFT: image */}
          <div className="product-media">
            {heroImage ? (
              <div className="product-image-wrapper">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={heroImage} alt={listing.title} />
              </div>
            ) : (
              <div className="product-image-placeholder">
                No image uploaded
              </div>
            )}
          </div>

          {/* RIGHT: details */}
          <div className="product-details">
            <h1>{listing.title}</h1>
            <p className="product-price">${formatUsd(listing.price)}</p>

            <p className="product-note">
              All prices in USD. Taxes and shipping calculated at checkout.
            </p>

            <dl className="product-meta">
              {listing.condition && (
                <>
                  <dt>Condition</dt>
                  <dd>{listing.condition}</dd>
                </>
              )}
              {listing.category && (
                <>
                  <dt>Category</dt>
                  <dd>{listing.category}</dd>
                </>
              )}
              {listing.size && (
                <>
                  <dt>Size</dt>
                  <dd>{listing.size}</dd>
                </>
              )}
              {listing.brand && (
                <>
                  <dt>Brand</dt>
                  <dd>{listing.brand}</dd>
                </>
              )}
              {listing.color && (
                <>
                  <dt>Color</dt>
                  <dd>{listing.color}</dd>
                </>
              )}
            </dl>

            <section className="product-description">
              <h2>Description</h2>
              <p>
                {listing.description && listing.description.trim().length > 0
                  ? listing.description
                  : "No additional description provided."}
              </p>
            </section>

            <button className="product-buy-button">Buy now</button>

            <section className="product-protection">
              <h3>How Famous-Finds protects you</h3>
              <ul>
                <li>Funds held securely until your item is authenticated.</li>
                <li>If the item is not as described, you are fully refunded.</li>
                <li>All payments processed in USD via Stripe.</li>
              </ul>
            </section>
          </div>
        </div>
      </main>

      <Footer />

      <style jsx>{`
        .product-layout {
          display: flex;
          flex-direction: column;
          gap: 32px;
        }

        @media (min-width: 900px) {
          .product-layout {
            flex-direction: row;
            align-items: flex-start;
          }
        }

        .product-media {
          flex: 1;
        }

        .product-details {
          flex: 1;
        }

        h1 {
          font-size: 28px;
          font-weight: 600;
          margin-bottom: 8px;
        }

        .product-price {
          font-size: 24px;
          font-weight: 600;
          margin-bottom: 8px;
        }

        .product-note {
          font-size: 12px;
          color: #6b7280;
          margin-bottom: 24px;
        }

        .product-image-wrapper {
          border-radius: 16px;
          overflow: hidden;
          background: #000;
          max-width: 500px;
        }

        .product-image-wrapper img {
          display: block;
          width: 100%;
          height: auto;
          object-fit: cover;
        }

        .product-image-placeholder {
          max-width: 500px;
          height: 360px;
          border-radius: 16px;
          border: 1px dashed #4b5563;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          color: #6b7280;
        }

        .product-meta {
          display: grid;
          grid-template-columns: max-content 1fr;
          gap: 4px 24px;
          font-size: 14px;
          margin-bottom: 24px;
        }

        .product-meta dt {
          color: #6b7280;
          font-weight: 500;
        }

        .product-meta dd {
          margin: 0;
        }

        .product-description h2 {
          font-size: 16px;
          margin-bottom: 4px;
        }

        .product-description p {
          font-size: 14px;
          color: #4b5563;
        }

        .product-buy-button {
          margin-top: 24px;
          display: inline-block;
          border-radius: 999px;
          padding: 12px 32px;
          border: none;
          font-size: 14px;
          font-weight: 600;
          background: #111827;
          color: #ffffff;
          cursor: pointer;
        }

        .product-buy-button:hover {
          opacity: 0.9;
        }

        .product-protection {
          margin-top: 24px;
          padding: 16px;
          border-radius: 16px;
          background: #f3f4f6;
        }

        .product-protection h3 {
          font-size: 14px;
          margin-bottom: 8px;
        }

        .product-protection ul {
          margin: 0;
          padding-left: 16px;
          font-size: 13px;
          color: #4b5563;
        }
      `}</style>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const id = ctx.params?.id as string;

  if (!id) {
    return { props: { listing: null } };
  }

  try {
    const doc = await adminDb.collection("listings").doc(id).get();
    if (!doc.exists) {
      return { props: { listing: null } };
    }

    const d: any = doc.data() || {};

    const imageUrls: string[] =
      d.imageUrls || d.photos || d.images || d.image_urls || [];

    const listing: ProductListing = {
      id,
      title: d.title || "Untitled listing",
      price: Number(d.price || 0),
      brand: d.brand || d.designer || "",
      condition: d.condition || "",
      category: d.category || "",
      color: d.color || "",
      size: d.size || d.size_label || "",
      description: d.description || "",
      imageUrls: Array.isArray(imageUrls) ? imageUrls : [],
    };

    return { props: { listing } };
  } catch (err) {
    console.error("Error loading listing", err);
    return { props: { listing: null } };
  }
};
