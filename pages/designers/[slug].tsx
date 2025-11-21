// FILE: /pages/designers/[slug].tsx
import { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { adminDb } from "../../utils/firebaseAdmin";

type Designer = {
  id: string;
  name: string;
  slug: string;
};

type Item = {
  id: string;
  title: string;
  price: number;
  images?: string[];
};

type Props = {
  designer: Designer | null;
  items: Item[];
};

export default function DesignerPage({ designer, items }: Props) {
  return (
    <div className="designer-page">
      <Head>
        <title>{designer ? designer.name : "Designer"} – Famous Finds</title>
      </Head>

      <Header />

      <main className="wrap">
        <Link href="/designers" className="back">
          ← Designers
        </Link>

        {designer ? (
          <>
            <h1>{designer.name}</h1>

            <p className="hint">
              Viewing all live items from {designer.name}.
            </p>

            {items.length === 0 ? (
              <p>No items yet from this designer.</p>
            ) : (
              <div className="items-grid">
                {items.map((item) => (
                  <Link
                    key={item.id}
                    href={`/item/${item.id}`}
                    className="item-card"
                  >
                    {item.images?.[0] && (
                      <img
                        src={item.images[0]}
                        alt={item.title}
                        className="item-image"
                      />
                    )}
                    <h3>{item.title}</h3>
                    <p className="price">${item.price}</p>
                  </Link>
                ))}
              </div>
            )}
          </>
        ) : (
          <p>Designer not found.</p>
        )}
      </main>

      <Footer />

      <style jsx>{`
        .designer-page {
          background: #ffffff;
          color: #111827;
        }

        .wrap {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px 16px 80px;
        }

        .back {
          font-size: 13px;
          display: inline-block;
          margin-bottom: 14px;
          color: #6b7280;
          text-decoration: none;
        }

        .back:hover {
          color: #111827;
        }

        h1 {
          font-size: 24px;
          margin-bottom: 8px;
          letter-spacing: 0.14em;
        }

        .hint {
          font-size: 13px;
          color: #4b5563;
          margin-bottom: 24px;
        }

        .items-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 18px;
        }

        .item-card {
          text-decoration: none;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          background: #ffffff;
          padding: 10px;
          box-shadow: 0 4px 10px rgba(15, 23, 42, 0.03);
        }

        .item-card:hover {
          border-color: #111827;
          box-shadow: 0 6px 16px rgba(15, 23, 42, 0.05);
        }

        .item-image {
          width: 100%;
          height: 220px;
          object-fit: cover;
          border-radius: 8px;
          margin-bottom: 10px;
        }

        h3 {
          font-size: 14px;
          margin: 4px 0;
        }

        .price {
          font-size: 13px;
          color: #374151;
        }
      `}</style>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  try {
    const slug = ctx.params?.slug as string;

    // GET DESIGNER
    const designerSnap = await adminDb
      .collection("designers")
      .where("slug", "==", slug)
      .limit(1)
      .get();

    if (designerSnap.empty) {
      return { props: { designer: null, items: [] } };
    }

    const designerDoc = designerSnap.docs[0];
    const designer = {
      id: designerDoc.id,
      name: designerDoc.data().name,
      slug: designerDoc.data().slug,
    };

    // GET ITEMS FOR THIS DESIGNER
    const itemsSnap = await adminDb
      .collection("items")
      .where("designer", "==", designer.name)
      .where("live", "==", true)
      .get();

    const items: Item[] = itemsSnap.docs.map((doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        title: d.title || "",
        price: d.price || 0,
        images: d.images || [],
      };
    });

    return {
      props: {
        designer,
        items,
      },
    };
  } catch (err) {
    console.error("Error loading designer slug page:", err);
    return {
      props: {
        designer: null,
        items: [],
      },
    };
  }
};
