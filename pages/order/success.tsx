// FILE: /pages/order/success.tsx
import Head from "next/head";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";

export default function OrderSuccessPage() {
  return (
    <div className="dark-theme-page">
      <Head>
        <title>Order successful – Famous Finds</title>
      </Head>
      <Header />

      <main className="wrap">
        <h1>Thank you for your purchase</h1>
        <p className="lead">
          Your payment was successful and your order has been placed with the seller.
        </p>

        <p className="authDisclaimer">
          Note: Famous Finds acts solely as a marketplace platform connecting buyers
          and independent sellers. Authenticity of items is the sole responsibility
          of the seller.
        </p>

        <Link href="/" className="back">
          Back to homepage
        </Link>
      </main>

      <Footer />

      <style jsx>{`
        .wrap {
          max-width: 640px;
          margin: 0 auto;
          padding: 32px 16px 80px;
          text-align: center;
        }
        h1 {
          font-size: 26px;
          margin-bottom: 12px;
        }
        .lead {
          font-size: 15px;
          color: #e5e7eb;
          margin-bottom: 20px;
        }
        .authDisclaimer {
          font-size: 12px;
          color: #9ca3af;
          line-height: 1.5;
          margin-bottom: 28px;
        }
        .back {
          display: inline-block;
          padding: 10px 18px;
          border-radius: 999px;
          background: #ffffff;
          color: #000000;
          text-decoration: none;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
}
