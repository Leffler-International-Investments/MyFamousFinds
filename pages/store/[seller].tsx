// FILE: /pages/store/[seller].tsx
import Head from "next/head";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import FollowButton from "../../components/FollowButton";
import Link from "next/link";

export default function Storefront() {
  // Demo seller info
  const seller = {
    id: "seller-demo-001",
    name: "LuxeCloset",
    followers: 1280,
    bio: "Pre-loved luxury bags & shoes.",
  };

  // ✅ Updated sample listings with Unsplash demo images
  const sampleImg =
    "https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=800&q=80";

  const listings = [
    { id: "g1", title: "Gucci Marmont Mini", price: 2450, image: sampleImg },
    { id: "d1", title: "Dior Printed Dress", price: 1950, image: sampleImg },
    { id: "c1", title: "Chanel Classic Flap Bag", price: 5890, image: sampleImg },
    { id: "lv1", title: "Louis Vuitton Scarf", price: 820, image: sampleImg },
    { id: "z1", title: "Zimmermann Silk Top", price: 460, image: sampleImg },
  ];

  return (
    <>
      <Head>
        <title>{seller.name} — Storefront</title>
      </Head>
      <Header />

      <main className="wrap">
        <div className="hero">
          <div className="name">{seller.name}</div>
          <div className="meta">{seller.followers} followers</div>
          <p className="bio">{seller.bio}</p>
          <FollowButton sellerId={seller.id} />
        </div>

        <section className="grid">
          {listings.map((x) => (
            <Link href={`/product/${x.id}`} key={x.id} className="card">
              <div
                className="thumb"
                style={{ backgroundImage: `url(${x.image})` }}
              />
              <div className="t">{x.title}</div>
              <div className="p">${x.price}</div>
            </Link>
          ))}
        </section>
      </main>

      <Footer />

      <style jsx>{`
        .wrap {
          max-width: 1100px;
          margin: 0 auto;
          padding: 24px 16px;
        }
        .hero {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-bottom: 14px;
        }
        .name {
          font-size: 22px;
          font-weight: 700;
        }
        .meta {
          color: #bbb;
        }
        .bio {
          color: #ddd;
        }
        .grid {
          display: grid;
          gap: 12px;
          grid-template-columns: repeat(5, 1fr);
        }
        .card {
          border: 1px solid #1a1a1a;
          border-radius: 12px;
          overflow: hidden;
          background: #0f0f0f;
        }
        .thumb {
          background-size: cover;
          background-position: center;
          aspect-ratio: 1/1;
        }
        .t {
          padding: 8px 10px;
        }
        .p {
          padding: 0 10px 10px;
          font-weight: 700;
        }
        @media (max-width: 900px) {
          .grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
    </>
  );
}
