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
    <div className="dark-theme-page">
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
          <div className="heroVisual">
            <HomepageButler />
          </div>
        </section>

        <DemoGrid title="Now Trending" items={trending} />
        <DemoGrid title="New Arrivals" items={newArrivals} />
      </main>

      <Footer />

      <style jsx>{`
        .wrap {
          max-width: 1200px;
          margin: 0 auto;
          padding: 16px 16px 80px;
        }

        .hero {
          display: grid;
          grid-template-columns: minmax(0, 1.1fr) minmax(0, 1.1fr);
          gap: 40px;
          margin-top: 16px;
          margin-bottom: 24px;
          align-items: center;
        }

        .heroCopy {
          max-width: 520px;
        }

        .eyebrow {
          font-size: 11px;
          font-weight: 700; /* Bolder */
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: #111827; /* Darker (was light gray) */
          margin-bottom: 4px;
        }

        h1 {
          margin-top: 4px;
          font-size: 32px;
          letter-spacing: 0.02em;
          color: #000000; /* Pure black */
        }

        .lead {
          margin-top: 10px;
          font-size: 15px;
          color: #111827; /* Darker (was medium gray) */
          line-height: 1.6;
          font-weight: 500; /* Slightly bolder */
        }

        /* The Butler Box - Now White */
        .heroVisual {
          border-radius: 16px;
          padding: 18px 18px 20px;
          background: #ffffff; /* White background */
          border: 1px solid #e5e7eb; /* Light gray border */
          color: #000000; /* Dark text inside */
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px 2px rgba(0, 0, 0, 0.05);
        }

        @media (max-width: 900px) {
          .hero {
            grid-template-columns: minmax(0, 1fr);
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
        "https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto-format&fit=crop&w=800&q=80";

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
