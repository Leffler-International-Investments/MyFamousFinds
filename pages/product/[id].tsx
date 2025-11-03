// FILE: /pages/product/[id].tsx
import { useRouter } from "next/router";
import Head from "next/head";
import Header from "../../components/Header";
import Footer from "../../components/Footer";

export default function ProductDetail() {
  const router = useRouter();
  const { id } = router.query;

  // Temporary demo data (replace later with dynamic fetch)
  const demo = {
    title: "Gucci Marmont Mini Bag",
    price: "AU$2,450",
    image: "/demo/gucci-bag-1.jpg",
    description:
      "Classic Gucci Marmont Mini Bag crafted in matelassé leather with the signature GG motif. Includes dust bag and authenticity card.",
    delivery: "Ships within 3–5 business days across Australia.",
    payment: "We accept Visa, Mastercard, PayPal, and Afterpay.",
  };

  return (
    <>
      <Head><title>{demo.title} | Famous Finds</title></Head>
      <Header />
      <main className="wrap">
        <div className="prod">
          <div className="left">
            <img src={demo.image} alt={demo.title} />
          </div>
          <div className="info">
            <h1>{demo.title}</h1>
            <p className="price">{demo.price}</p>
            <p>{demo.description}</p>

            <h4>Delivery</h4>
            <p>{demo.delivery}</p>

            <h4>Payment</h4>
            <p>{demo.payment}</p>

            <button>Buy Now</button>
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
        .left img {
          width: 100%;
          border-radius: 12px;
          object-fit: cover;
        }
        h1 {
          font-size: 24px;
          font-weight: 700;
          margin-bottom: 10px;
        }
        .price {
          font-size: 22px;
          font-weight: bold;
          margin: 12px 0;
        }
        button {
          background: #fff;
          color: #000;
          border: none;
          border-radius: 8px;
          padding: 10px 20px;
          font-weight: 700;
          cursor: pointer;
          margin-top: 20px;
        }
        button:hover {
          background: #ccc;
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
