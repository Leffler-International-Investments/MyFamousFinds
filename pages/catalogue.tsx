// FILE: /pages/catalogue.tsx
// This version has a FIXED data query
// that will now find your listings.

import Head from "next/head";
import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";
import type { GetServerSideProps } from "next";
import { adminDb } from "../utils/firebaseAdmin";
import { ProductLike } from "../components/ProductCard"; // Re-using your type from index.tsx

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
          <Link href="/" className="cta">
            ← Back to Home
          </Link>
        </div>

        <section className="sell-card">
          <div className="table-overflow-wrapper">
            <table className="catalogue-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Brand</th>
                  <th>Price</th>
                </tr>
              </thead>
              <tbody>
                {!hasItems && (
                  <tr>
                    <td colSpan={3} className="table-message">
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
      `}</style>
    </div>
  );
}

// --- FIX: This data query now matches index.tsx ---
// It fetches listings and THEN filters them in code,
// which avoids the need for a special database index.
export const getServerSideProps: GetServerSideProps<CatalogueProps> = async () => {
  try {
    const snap = await adminDb
      .collection("listings")
      .orderBy("createdAt", "desc")
      .get(); // 1. Get all listings sorted by date

    const liveItems: ProductLike[] = [];

    snap.docs.forEach((doc) => {
      const d: any = doc.data() || {};

      // 2. Filter in code, just like the homepage
      const allowedStatuses = ["Live", "Active", "Approved"];
      if (d.status && !allowedStatuses.includes(d.status)) {
        return; // Skip non-live items
      }

      const priceNumber = Number(d.price) || 0;
      const price = priceNumber
        ? `US$${priceNumber.toLocaleString("en-US")}`
        : "";

      liveItems.push({
        id: doc.id,
        title: d.title || "Untitled listing",
        brand: d.brand || "",
        price,
        image: "", 
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
