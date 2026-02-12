// FILE: /pages/catalogue.tsx
// Public marketplace catalogue with "View" action for each item.

import Head from "next/head";
import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";
import type { GetServerSideProps } from "next";
import { adminDb } from "../utils/firebaseAdmin";
import { ProductLike } from "../components/ProductCard";

type CatalogueProps = {
  items: ProductLike[];
};

export default function PublicCatalogue({ items }: CatalogueProps) {
  const hasItems = items && items.length > 0;

  return (
    <div className="dark-theme-page">
      <Head>
        <title>Catalogue - Famous Finds</title>
      </Head>

      <Header />

      <main className="section">
        <div className="section-header">
          <div>
            <h1>Catalogue</h1>
            <p style={{ opacity: 0.8, marginTop: 4 }}>
              Browse all live listings in our marketplace.
            </p>
          </div>
        </div>

        <section className="sell-card">
          <div className="table-overflow-wrapper">
            <table className="catalogue-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Brand</th>
                  <th>Price</th>
                  <th>View item</th>
                </tr>
              </thead>
              <tbody>
                {!hasItems && (
                  <tr>
                    <td colSpan={4} className="table-message">
                      No listings found.
                    </td>
                  </tr>
                )}

                {hasItems &&
                  items.map((x) => (
                    <tr key={x.id}>
                      <td>
                        <Link href={x.href} className="product-link">
                          {x.title}
                        </Link>
                      </td>
                      <td>{x.brand}</td>
                      <td>{x.price}</td>
                      <td className="actions-cell">
                        <Link href={x.href} className="btn-table-view">
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      <Footer />

      <style jsx>{`
        .sell-card {
          background: #111827;
          border-radius: 16px;
          padding: 18px 18px 20px;
          border: 1px solid #1f2937;
        }
        .table-overflow-wrapper {
          overflow-x: auto;
        }
        .catalogue-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 14px;
          color: #e5e7eb;
        }
        .catalogue-table th,
        .catalogue-table td {
          padding: 10px 12px;
          text-align: left;
          border-bottom: 1px solid #374151;
        }
        .catalogue-table th {
          font-size: 12px;
          text-transform: uppercase;
          color: #9ca3af;
          font-weight: 500;
        }
        .catalogue-table tr:last-child td {
          border-bottom: none;
        }
        .table-message {
          text-align: center;
          color: #9ca3af;
          padding: 24px;
        }
        .product-link {
          color: #e5e7eb;
          text-decoration: none;
        }
        .product-link:hover {
          text-decoration: underline;
        }
        .cta {
          font-size: 13px;
          padding: 6px 12px;
          border-radius: 999px;
          border: 1px solid #374151;
          color: #e5e7eb;
          text-decoration: none;
        }
        .actions-cell {
          text-align: right;
        }
        .btn-table-view {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 4px 12px;
          border-radius: 999px;
          border: 1px solid #374151;
          font-size: 12px;
          font-weight: 500;
          text-decoration: none;
          color: #e5e7eb;
          background: #1f2937;
        }
        .btn-table-view:hover {
          border-color: #6b7280;
        }
      `}</style>
    </div>
  );
}

// DATA QUERY
export const getServerSideProps: GetServerSideProps<CatalogueProps> = async () => {
  try {
    const snap = await adminDb
      .collection("listings")
      .orderBy("createdAt", "desc")
      .get();

    const liveItems: ProductLike[] = [];

    snap.docs.forEach((doc) => {
      const d: any = doc.data() || {};

      // Case-insensitive status check matching publicListings.ts
      const status = String(d.status || "").trim().toLowerCase();
      const isLive =
        !status ||
        status === "live" ||
        status === "active" ||
        status === "approved" ||
        status === "published" ||
        status === "pending";
      if (!isLive) return;

      // Filter out sold items
      const isSold =
        d.isSold === true ||
        d.sold === true ||
        status === "sold" ||
        status === "inactive_sold";
      if (isSold) return;

      const priceNumber =
        typeof d.priceUsd === "number"
          ? d.priceUsd
          : typeof d.price === "number"
          ? d.price
          : Number(d.price || 0);
      const price = priceNumber
        ? `US$${priceNumber.toLocaleString("en-US")}`
        : "";

      // Extract image (same logic as homepage)
      const fromArray = Array.isArray(d.displayImageUrls)
        ? d.displayImageUrls
        : Array.isArray(d.images)
        ? d.images
        : Array.isArray(d.imageUrls)
        ? d.imageUrls
        : Array.isArray(d.photos)
        ? d.photos
        : [];
      const image =
        (Array.isArray(fromArray) && fromArray[0] ? String(fromArray[0]) : "") ||
        d.displayImageUrl ||
        d.display_image_url ||
        d.image_url ||
        d.imageUrl ||
        d.image ||
        "";

      liveItems.push({
        id: doc.id,
        title: d.title || d.name || "Untitled listing",
        brand: d.brand || d.designer || "",
        price,
        image,
        href: `/product/${doc.id}`,
      });
    });

    return {
      props: {
        items: liveItems,
      },
    };
  } catch (err) {
    console.error("Error loading catalogue listings", err);
    return {
      props: {
        items: [],
      },
    };
  }
};
