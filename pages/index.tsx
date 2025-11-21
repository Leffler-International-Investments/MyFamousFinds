// FILE: /pages/index.tsx
import Head from "next/head";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { adminDb } from "../utils/firebaseAdmin";
import type { GetServerSideProps, NextPage } from "next";

type Product = {
  id: string;
  title: string;
  brand: string;
  price: string;
  image: string;
  href: string;
};

type HomeProps = {
  items: Product[];
};

const Home: NextPage<HomeProps> = ({ items }) => {
  return (
    <div className="home-wrapper">
      <Head>
        <title>Famous Finds — US</title>
      </Head>

      <Header />

      <main className="wrap">

        <h2 className="section-header">New Arrivals</h2>

        <div className="grid">
          {items.map((p) => (
            <a href={p.href} key={p.id} className="card">
              <img src={p.image} alt={p.title} className="card-img" />
              <div className="card-body">
                <div className="card-title">{p.title}</div>
                {p.brand && <div className="card-brand">{p.brand}</div>}
                <div className="card-price">{p.price}</div>
              </div>
            </a>
          ))}
        </div>

      </main>

      <Footer />

      <style jsx>{`
        .home-wrapper {
          background: #ffffff;
          min-height: 100vh;
        }
        .wrap {
          max-width: 1200px;
          margin: 0 auto;
          padding: 24px;
        }
        .section-header {
          font-size: 22px;
          font-weight: 700;
          margin-bottom: 20px;
        }
        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 24px;
        }
        .card {
          border-radius: 14px;
          overflow: hidden;
          background: #fafafa;
          text-decoration: none;
          color: inherit;
          border: 1px solid #e5e7eb;
        }
        .card-img {
          width: 100%;
          height: 260px;
          object-fit: cover;
          background: #000;
        }
        .card-body {
          padding: 12px;
        }
        .card-title {
          font-size: 15px;
          font-weight: 600;
        }
        .card-brand {
          font-size: 13px;
          color: #6b7280;
        }
        .card-price {
          margin-top: 4px;
          font-weight: 700;
        }
      `}</style>
    </div>
  );
};

export const getServerSideProps: GetServerSideProps<HomeProps> = async () => {
  try {
    const snap = await adminDb
      .collection("listings")
      .orderBy("createdAt", "desc")
      .limit(60)
      .get();

    const items: Product[] = [];

    snap.docs.forEach((doc) => {
      const d: any = doc.data() || {};

      const allowedStatuses = ["Live", "Active", "Approved"];
      if (!allowedStatuses.includes(d.status)) return;

      const priceNum = Number(d.price) || 0;

      const image =
        d.image_url ||
        d.imageUrl ||
        d.image ||
        (Array.isArray(d.imageUrls) && d.imageUrls[0]) ||
        "";

      items.push({
        id: doc.id,
        title: d.title || "Untitled",
        brand: d.brand || "",
        price: priceNum ? `US$${priceNum.toLocaleString()}` : "",
        image,
        href: `/product/${doc.id}`,
      });
    });

    return { props: { items } };
  } catch (err) {
    console.error("index load error:", err);
    return { props: { items: [] } };
  }
};

export default Home;
