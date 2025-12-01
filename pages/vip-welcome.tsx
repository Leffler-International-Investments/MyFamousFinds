// FILE: /pages/vip-welcome.tsx

import React from "react";
import Head from "next/head";
import Link from "next/link";
import Header from "../components/Header";

// Simple SVG icons for the benefits
const TicketIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="#facc15"
    className="w-10 h-10 mb-4"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-1.5h.008v.008H7.5V16.5zm.008-3h.008v.008H7.5v-.008zm.008-3h.008v.008H7.5V10.5zm.008-3h.008v.008H7.5V7.5z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3.75 4.5v15a2.25 2.25 0 002.25 2.25h12a2.25 2.25 0 002.25-2.25v-15m-16.5 0h16.5c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H2.625c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
    />
  </svg>
);

const GemIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="#facc15"
    className="w-10 h-10 mb-4"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18c-2.305 0-4.408.867-6 2.292m0-14.25v14.25"
    />
  </svg>
);

const TagIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="#facc15"
    className="w-10 h-10 mb-4"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.372l2.16-1.08c.775-.387 1.17-.676 1.17-1.08V11.25c0-.614-.384-1.185-.95-1.486L14.568 8.41a2.25 2.25 0 00-1.591-.659h-1.91l-3.414-3.414z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15.75 9.75l-4.5-4.5"
    />
  </svg>
);

export default function VipWelcomePage() {
  return (
    <>
      <Head>
        <title>The Front Row — Famous Finds VIP Club</title>
      </Head>

      {/* VIP styles */}
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=Inter:wght@300;400&display=swap");

        .vip-welcome-page {
          background: radial-gradient(
            ellipse at 50% -20%,
            #2a2a2a 0%,
            #0a0a0a 70%,
            #000 100%
          );
          font-family: "Inter", sans-serif;
          color: #e5e7eb;
          min-height: 100vh;
        }

        .vip-main {
          max-width: 1120px;
          margin: 0 auto;
          padding: 48px 16px 80px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .hero-section,
        .benefits-section,
        .cta-section {
          width: 100%;
          text-align: center;
        }

        .hero-title {
          font-family: "Cormorant Garamond", serif;
          font-weight: 700;
          font-size: 4rem;
          color: #facc15;
          letter-spacing: -0.02em;
          line-height: 1.1;
        }

        @media (max-width: 768px) {
          .hero-title {
            font-size: 3rem;
          }
        }

        .hero-subtitle {
          font-family: "Inter", sans-serif;
          font-weight: 300;
          font-size: 1.25rem;
          color: #d1d5db;
          max-width: 600px;
          margin: 1.5rem auto 0 auto;
        }

        .benefits-section {
          margin-top: 2rem;
        }

        /* Center the three boxes */
        .benefits-wrapper {
          width: 100%;
          display: flex;
          justify-content: center;
        }

        .benefits-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 32px;
          width: max-content;
          margin: 0 auto;
        }

        @media (max-width: 900px) {
          .benefits-grid {
            grid-template-columns: 1fr;
          }
        }

        .benefit-card {
          background: rgba(31, 41, 55, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(8px);
          border-radius: 1rem;
          padding: 2rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          text-decoration: none;
          transition: transform 0.18s ease, box-shadow 0.18s ease,
            border-color 0.18s ease;
        }

        .benefit-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 18px 45px rgba(0, 0, 0, 0.6);
          border-color: rgba(250, 204, 21, 0.8);
        }

        .benefit-title {
          font-family: "Cormorant Garamond", serif;
          font-weight: 600;
          font-size: 1.75rem;
          color: #fff;
          margin-bottom: 0.5rem;
        }

        .benefit-description {
          font-weight: 300;
          color: #d1d5db;
        }

        .benefit-card-link {
          margin-top: 1.25rem;
          font-size: 0.8rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #fde68a;
        }

        .benefit-card:hover .benefit-card-link {
          color: #ffffff;
        }

        .cta-section h2 {
          margin-bottom: 0.75rem;
        }

        .cta-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin-top: 2rem;
          padding: 14px 42px;
          border-radius: 9999px;
          font-size: 1.25rem;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          background-color: #facc15;
          color: #111827;
          border: none;
          text-decoration: none;
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.45);
          transition: all 0.18s ease;
        }

        .cta-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 18px 45px rgba(0, 0, 0, 0.6);
          background-color: #fde047;
        }

        .secondary-link {
          margin-top: 1.5rem;
          font-size: 0.875rem;
          color: #9ca3af;
          transition: color 0.2s ease;
        }

        .secondary-link:hover {
          color: #f9fafb;
        }
      `}</style>

      <div className="vip-welcome-page">
        <Header />

        <main className="vip-main">
          {/* Hero Section */}
          <section className="hero-section py-20 px-6 text-center">
            <h1 className="hero-title">Welcome to the Front Row.</h1>
            <p className="hero-subtitle">
              Access a world of curated luxury, exclusive benefits, and rewards
              reserved only for our most valued members.
            </p>
          </section>

          {/* Benefits Section */}
          <section className="benefits-section px-6 pb-20">
            <div className="benefits-wrapper">
              <div className="benefits-grid">
                <Link href="/vip-exclusive-access" className="benefit-card">
                  <TicketIcon />
                  <h2 className="benefit-title">Exclusive Access</h2>
                  <p className="benefit-description">
                    Get early access to our most sought-after arrivals and
                    private sales before they&apos;re available to the public.
                  </p>
                  <span className="benefit-card-link">Click here →</span>
                </Link>

                <Link href="/vip-loyalty-rewards" className="benefit-card">
                  <GemIcon />
                  <h2 className="benefit-title">Earn Loyalty Rewards</h2>
                  <p className="benefit-description">
                    Earn loyalty points on every single purchase. Unlock new
                    tiers and convert your points into exclusive rewards.
                  </p>
                  <span className="benefit-card-link">Click here →</span>
                </Link>

                <Link href="/vip-member-perks" className="benefit-card">
                  <TagIcon />
                  <h2 className="benefit-title">Member-Only Perks</h2>
                  <p className="benefit-description">
                    Enjoy complimentary shipping, member-only discounts, saved
                    carts, and a dedicated quick-checkout experience.
                  </p>
                  <span className="benefit-card-link">Click here →</span>
                </Link>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="cta-section text-center">
            <h2 className="text-xl text-gray-200">
              Your Front Row seat is waiting.
            </h2>

            <Link href="/vip-signup" className="cta-button">
              Join the Club
            </Link>

            <p className="secondary-link">
              Already a member?{" "}
              <Link href="/vip-login" className="underline">
                Sign in
              </Link>
            </p>
          </section>
        </main>
      </div>
    </>
  );
}
