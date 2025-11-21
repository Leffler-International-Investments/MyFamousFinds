// FILE: /pages/designers/[slug].tsx
import Head from "next/head";
import Link from "next/link";
import type { GetServerSideProps } from "next";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { adminDb } from "../../utils/firebaseAdmin";

type Designer = {
  id: string;
  name: string;
  slug: string;
  itemTypes?: string;
  notes?: string;
};

type DesignerPageProps = {
  designer: Designer | null;
};

export default function DesignerDetailPage({ designer }: DesignerPageProps) {
  return (
    <div className="designer-page">
      <Head>
        <title>
          {designer ? `${designer.name} – Designers – Famous Finds` : "Designer – Famous Finds"}
        </title>
      </Head>

      <Header />

      <main className="wrap">
        <header className="heading">
          <Link href="/designers" className="back">
            ← Designers
          </Link>
          <h1>{designer ? designer.name : "Designer"}</h1>
        </header>

        {!designer ? (
          <p className="not-found">Designer not found.</p>
        ) : (
          <>
            <section className="card">
              {designer.itemTypes && (
                <p className="line">
                  <strong>Typical items: </strong>
                  {designer.itemTypes}
                </p>
              )}
              {designer.notes && (
                <p className="line">
                  <strong>Notes: </strong>
                  {designer.notes}
                </p>
              )}
              {!designer.itemTypes && !designer.notes && (
                <p className="line muted">
                  Listings for this designer will appear here as they go live.
                </p>
              )}
            </section>

            <section className="card">
              <h2>Items from this designer</h2>
              <p className="muted">
                Marketplace listings for {designer.name} will be shown on this
                page when they are added.
              </p>
            </section>
          </>
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
          padding: 16px 16px 80px;
        }

        .heading {
          display: flex;
          align-items: baseline;
          gap: 12px;
          margin-bottom: 8px;
        }

        .back {
          font-size: 13px;
          color: #6b7280;
          text-decoration: none;
        }

        .back:hover {
          color: #111827;
        }

        h1 {
          font-size: 22px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
        }

        .card {
          background: #ffffff;
          border-radius: 16px;
          border: 1px solid #e5e7eb;
          padding: 18px 18px 20px;
          box-shadow: 0 4px 10px rgba(15, 23, 42, 0.04);
          margin-top: 16px;
        }

        .line {
          font-size: 14px;
          margin-bottom: 4px;
        }

        .muted {
          color: #6b7280;
        }

        .not-found {
          font-size: 14px;
          color: #b91c1c;
        }

        h2 {
          font-size: 16px;
          margin-bottom: 6px;
        }

        @media (max-width: 640px) {
          h1 {
            font-size: 20px;
            letter-spacing: 0.14em;
          }
        }
      `}</style>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps<
  DesignerPageProps
> = async (context) => {
  const slugParam = String(context.params?.slug || "");
  const slugOrId = slugParam;

  try {
    let designerDoc:
      | FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData>
      | null = null;

    // 1) Try by document ID
    const byId = await adminDb.collection("designers").doc(slugOrId).get();
    if (byId.exists) {
      designerDoc = byId;
    }

    // 2) Try by slug field
    if (!designerDoc) {
      const bySlugSnap = await adminDb
        .collection("designers")
        .where("slug", "==", slugOrId)
        .limit(1)
        .get();
      if (!bySlugSnap.empty) {
        designerDoc = bySlugSnap.docs[0];
      }
    }

    // 3) Try by name (handles old URLs like "Alexander McQueen")
    if (!designerDoc) {
      const decoded = decodeURIComponent(slugOrId);
      const altName = decoded.replace(/-/g, " ");
      const byNameSnap = await adminDb
        .collection("designers")
        .where("name", "==", altName)
        .limit(1)
        .get();
      if (!byNameSnap.empty) {
        designerDoc = byNameSnap.docs[0];
      }
    }

    if (!designerDoc || !designerDoc.exists) {
      return {
        props: {
          designer: null,
        },
      };
    }

    const data = designerDoc.data() as any;

    const designer: Designer = {
      id: designerDoc.id,
      name: data.name || designerDoc.id,
      slug: data.slug || designerDoc.id,
      itemTypes: data.itemTypes || data.item_types || "",
      notes: data.notes || "",
    };

    return {
      props: {
        designer,
      },
    };
  } catch (err) {
    console.error("Error loading designer detail", err);
    return {
      props: {
        designer: null,
      },
    };
  }
};
