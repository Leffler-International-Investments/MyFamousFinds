// FILE: /pages/designers/[slug].tsx
import Head from "next/head";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { adminDb } from "../../utils/firebaseAdmin";

export default function DesignerPage({ designer, items }) {
  return (
    <div className="page">
      <Head>
        <title>{designer ? designer.name : "Designer"} – Famous Finds</title>
      </Head>

      <Header />

      <main className="wrap">
        <Link href="/designers" className="back">← Designers</Link>

        {!designer ? (
          <p>Designer not found.</p>
        ) : (
          <>
            <h1>{designer.name}</h1>
            <p className="hint">All live items from this designer.</p>

            {items.length === 0 ? (
              <p>No items yet for this designer.</p>
            ) : (
              <div className="grid">
                {items.map((item) => (
                  <Link href={`/item/${item.id}`} key={item.id} className="card">
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
        )}
      </main>

      <Footer />

      <style jsx>{`
        .page { background:#fff; color:#111; }
        .wrap { max-width:1200px; margin:0 auto; padding:20px 16px 60px; }
        .back { font-size:13px; color:#6b7280; text-decoration:none; }
        h1 { font-size:26px; margin-bottom:8px; }
        .hint { font-size:13px; color:#444; margin-bottom:20px; }
        .grid {
          display:grid;
          grid-template-columns:repeat(auto-fill, minmax(200px,1fr));
          gap:20px;
        }
        .card {
          background:#fff;
          border:1px solid #e5e7eb;
          border-radius:10px;
          padding:12px;
          text-decoration:none;
          color:#111;
        }
        .card img {
          width:100%;
          height:220px;
          object-fit:cover;
          border-radius:8px;
          margin-bottom:8px;
        }
        .price { font-size:14px; color:#333; }
      `}</style>
    </div>
  );
}

export async function getServerSideProps(ctx) {
  try {
    const slug = (ctx.params.slug || "").toLowerCase().trim();

    // 1. GET DESIGNER
    const dSnap = await adminDb
      .collection("designers")
      .where("slug", "==", slug)
      .limit(1)
      .get();

    if (dSnap.empty)
      return { props: { designer: null, items: [] } };

    const d = dSnap.docs[0];
    const designer = {
      id: d.id,
      name: d.data().name,
      slug: d.data().slug,
    };

    // 2. GET ITEMS FOR DESIGNER
    const iSnap = await adminDb
      .collection("items")
      .where("designer", "==", designer.name)
      .where("live", "==", true)
      .get();

    const items = iSnap.docs.map((doc) => {
      const item = doc.data();
      return {
        id: doc.id,
        title: item.title || "",
        price: item.price || 0,
        images: item.images || [],
      };
    });

    return { props: { designer, items } };
  } catch (error) {
    return { props: { designer: null, items: [] } };
  }
}
