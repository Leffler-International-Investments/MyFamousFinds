// FILE: /pages/index.tsx

import Head from "next/head";
import Header from "../components/Header";
import Footer from "../components/Footer";
import DemoGrid from "../components/DemoGrid";
import { ProductLike } from "../components/ProductCard";
import { adminDb } from "../utils/firebaseAdmin";
import type { GetServerSideProps, NextPage } from "next";
import HomepageButler from "../components/HomepageButler";

type HomeProps = {
  trending: ProductLike[];
  newArrivals: ProductLike[];
};

const Home: NextPage<HomeProps> = ({ trending, newArrivals }) => {
  return (
    <div className="home-wrapper">
      <Head>
        <title>Famous Finds — US</title>
      </Head>

      <Header />

      <main className="wrap">
        <section className="hero">
          <div className="heroCopy">
            <p className="eyebrow">WELCOME TO OUR WORLD OF LUXURY</p>
            <h1>Famous Finds for every shade of style.</h1>
            <p className="lead">
              Curated, authenticated designer pieces — loved once and ready to
              be loved again. A marketplace where every customer belongs, in all
              colours and all stories.
            </p>
          </div>
        </section>

        <DemoGrid title="Now Trending" items={trending} />
        <DemoGrid title="New Arrivals" items={newArrivals} />
      </main>

      <Footer />

      {/* Corner Butler only */}
      <HomepageButler />

      <style jsx>{`
        .home-wrapper {
          background-color: #ffffff;
          min-height: 100vh;
          color: #000000;
        }

        .wrap {
          max-width: 1200px;
          margin: 0 auto;
          padding: 16px 16px 80px;
        }

        .hero {
          margin-top: 16px;
          margin-bottom: 24px;
        }

        .heroCopy {
          max-width: 520px;
        }

        .eyebrow {
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.14em;
          color: #000000;
          margin-bottom: 6px;
        }

        h1 {
          margin-top: 4px;
          font-size: 34px;
          font-weight: 800;
          color: #000000;
        }

        .lead {
          margin-top: 12px;
          font-size: 16px;
          font-weight: 600;
          color: #111111;
          line-height: 1.65;
        }

        .home-wrapper .section-header h2 {
          color: #000000 !important;
          font-weight: 700;
          font-size: 20px;
          letter-spacing: 0.04em;
        }

        @media (max-width: 900px) {
          .hero {
            margin-top: 8px;
          }
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
      .limit(50)
      .get();

    const liveItems: ProductLike[] = [];

    snap.docs.forEach((doc) => {
      const d: any = doc.data() || {};

      const allowedStatuses = ["Live", "Active", "Approved"];
      if (d.status && !allowedStatuses.includes(d.status)) {
        return;
      }

      const priceNumber = Number(d.price) || 0;
      const price = priceNumber
        ? `US$${priceNumber.toLocaleString("en-US")}`
        : "";

      const image: string =
        d.image_url ||
        d.imageUrl ||
        d.image ||
        (Array.isArray(d.imageUrls) && d.imageUrls[0]) ||
        "";

      liveItems.push({
        id: doc.id,
        title: d.title || "Untitled listing",
        brand: d.brand || "",
        price,
        image,
        href: `/product/${doc.id}`,
        badge: d.badge || undefined,
      });
    });

    return {
      props: {
        trending: liveItems.slice(0, 12),
        newArrivals: liveItems.slice(12, 24),
      },
    };
  } catch (err) {
    console.error("Error loading home listings", err);
    return {
      props: {
        trending: [],
        newArrivals: [],
      },
    };
  }
};

export default Home;
