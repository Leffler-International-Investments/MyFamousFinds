// FILE: /pages/product/[id].tsx
import React, { useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Header from "../../components/Header";
import Footer from "../../components/Footer";

const sampleImage =
  "https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=900&q=80";

export default function ProductDetail() {
  const { query } = useRouter();
  const id = String(query.id || "");

  const [rating, setRating] = useState<number | null>(null);
  const [rated, setRated] = useState(false);

  const demo = {
    title: "Gucci Marmont Mini Bag",
    price: "$2,450",
    image: sampleImage,
    description:
      "Classic Gucci Marmont Mini bag crafted in matelassé leather with signature GG motif. Includes dust bag and authenticity card.",
    delivery: "Ships within 3–5 business days across the US.",
    payment: "Visa, Mastercard, PayPal, Afterpay.",
  };

  function handleRate(value: number) {
    setRating(value);
    setRated(true);
  }

  return (
    <>
      <Head>
        <title>{demo.title} | Famous Finds</title>
      </Head>
      <Header />
      <main className="wrap">
        <div className="prod">
          <img src={demo.image} alt={demo.title} />
          <div className="info">
            <h1>{demo.title}</h1>
            <p className="sku">ID: {id || "demo"}</p>
            <p className="price">{demo.price}</p>
            <p>{demo.description}</p>
            <h4>Delivery</h4>
            <p>{demo.delivery}</p>
            <h4>Payment</h4>
            <p>{demo.payment}</p>

            <button className="buy">Buy Now</button>

            {/* Review stars */}
            <div className="reviewBlock">
              <div className="reviewLabel">Rate this item</div>
              <div className="stars">
                {[5, 4, 3, 2, 1].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => handleRate(v)}
                    className={
                      "starBtn" +
                      (rating && v <= rating ? " starBtnActive" : "")
                    }
                  >
                    {v}★
                  </button>
                ))}
              </div>
              {rated && (
                <div className="thanks">
                  Thank you for your {rating}-star review! In a full version
                  this would be saved to the seller&apos;s rating history.
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />

      <style jsx>{`
        .wrap {
          max-width: 1080px;
          margin: 40px auto;
          padding: 0 16px;
          color: #eaeaea;
        }
        .prod {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
        }
        img {
          width: 100%;
          border-radius: 12px;
          object-fit: cover;
        }
        .sku {
          opacity: 0.7;
          margin: 4px 0 0;
        }
        .price {
          margin: 8px 0 12px;
          font-size: 20px;
          font-weight: 600;
        }
        h4 {
          margin-top: 14px;
          font-size: 14px;
        }
        .buy {
          margin-top: 16px;
          padding: 10px 24px;
          border-radius: 999px;
          border: none;
          background: #ffffff;
          color: #000;
          font-weight: 700;
        }
        .reviewBlock {
          margin-top: 18px;
          padding-top: 14px;
          border-top: 1px solid #1f2933;
          font-size: 13px;
        }
        .reviewLabel {
          margin-bottom: 6px;
          font-weight: 600;
        }
        .stars {
          display: flex;
          gap: 6px;
        }
        .starBtn {
          padding: 4px 8px;
          border-radius: 999px;
          background: #111827;
          border: 1px solid #374151;
          cursor: pointer;
        }
        .starBtnActive {
          background: #f59e0b;
          border-color: #f59e0b;
          color: #111827;
        }
        .thanks {
          margin-top: 8px;
          color: #a7f3d0;
        }
        @media (max-width: 768px) {
          .prod {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
}
