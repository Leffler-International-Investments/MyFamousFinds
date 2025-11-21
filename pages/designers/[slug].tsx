// FILE: /pages/designers/[slug].tsx
import Head from "next/head";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { adminDb } from "../../utils/firebaseAdmin";

// simple slug helper (same logic as seed-designers API)
const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

export default function DesignerPage(props: any) {
  const { designer, items } = props;

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
          ← Designers
        </Link>

        {designer ? (
          <>
            <h1>{designer.name}</h1>
            <p className="hint">All live items from this designer.</p>

            {items.length === 0 ? (
              <p>No items yet for this designer.</p>
            ) : (
              <div className="grid">
                {items.map((item: any) => (
                  <Link
                    href={`/item/${item.id}`}
                    key={item.id}
                    className="card"
                  >
                    {item.images?.[0] && (
                      <img src={item.images[0]} alt={item.title} />
                    )}
                    <h3>{item.title}</h3>
                    <p className="price">${item.price}</p>
                  </Link>
                ))}
              </div>
            )}
          </>
        ) : (
          <p className="error">Designer not found.</p>
        )}
      </main>

      <Footer />

      <style jsx>{`
        .page {
          background: #fff;
          color: #111;
        }
        .wrap {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px 16px 60px;
        }
        .back {
          font-size: 13px;
          color: #6b7280;
          text-decoration: none;
        }
        h1 {
          font-size: 26px;
          margin: 8px 0 6px;
        }
        .hint {
          font-size: 13px;
          color: #444;
          margin-bottom: 20px;
        }
        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 20px;
        }
        .card {
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          padding: 12px;
          text-decoration: none;
          color: #111;
        }
        .card img {
          width: 100%;
          height: 220px;
          object-fit: cover;
          border-radius: 8px;
          margin-bottom: 8px;
        }
        .price {
          font-size: 14px;
          color: #333;
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

export async function getServerSideProps(ctx: any) {
  try {
    const raw = String(ctx.params?.slug || "");
    const decoded = decodeURIComponent(raw);
    const slugFromName = slugify(decoded);

    let docSnap = await adminDb.collection("designers").doc(raw).get();

    if (!docSnap.exists) {
      docSnap = await adminDb.collection("designers").doc(slugFromName).get();
    }

    if (!docSnap.exists) {
      const bySlug = await adminDb
        .collection("designers")
        .where("slug", "==", raw.toLowerCase())
        .limit(1)
        .get();

      if (!bySlug.empty) {
        docSnap = bySlug.docs[0];
      }
    }

    if (!docSnap.exists) {
      const byName = await adminDb
        .collection("designers")
        .where("name", "==", decoded)
        .limit(1)
        .get();

      if (!byName.empty) {
        docSnap = byName.docs[0];
      }
    }

    if (!docSnap.exists) {
      return { props: { designer: null, items: [] } };
    }

    const d = docSnap;
    const data: any = d.data();
    const designer = {
      id: d.id,
      name: data.name,
      slug: data.slug,
    };

    const iSnap = await adminDb
      .collection("items")
      .where("designer", "==", designer.name)
      .where("live", "==", true)
      .get();

    const items = iSnap.docs.map((doc) => {
      const item: any = doc.data();
      return {
        id: doc.id,
        title: item.title || "",
        price: item.price || 0,
        images: item.images || [],
      };
    });

    return { props: { designer, items } };
  } catch (error) {
    console.error("Error loading designer page", error);
    return { props: { designer: null, items: [] } };
  }
}
