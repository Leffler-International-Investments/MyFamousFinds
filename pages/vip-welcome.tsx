// FILE: /pages/vip-welcome.tsx
import React from "react";
import Head from "next/head";
import Link from "next/link";
import Header from "../components/Header";

// Simple, elegant SVG icons for the benefits
const TicketIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="#facc15" // Gold color
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

      {/* Google Fonts Import */}
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=Inter:wght@300;400&display=swap");

        .vip-welcome-page {
          /* Luxurious dark background */
          background: radial-gradient(
            ellipse at 50% -20%,
            #2a2a2a 0%,
            #0a0a0a 70%,
            #000 100%
          );
          font-family: "Inter", sans-serif;
          color: #e5e7eb; /* gray-200 */
          min-height: 100vh;
        }

        .hero-title {
          font-family: "Cormorant Garamond", serif;
          font-weight: 700;
          font-size: 4rem; /* 64px */
          color: #facc15; /* gold-400 */
          letter-spacing: -0.02em;
          line-height: 1.1;
        }

        @media (max-width: 768px) {
          .hero-title {
            font-size: 3rem; /* 48px */
          }
        }

        .hero-subtitle {
          font-family: "Inter", sans-serif;
          font-weight: 300;
          font-size: 1.25rem; /* 20px */
          color: #d1d5db; /* gray-300 */
          max-width: 600px;
          margin: 1.5rem auto 0 auto;
        }

        .benefit-card {
          /* Frosted glass effect */
          background: rgba(31, 41, 55, 0.3); /* gray-800 with 30% opacity */
          border: 1px solid rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(8px);
          border-radius: 1rem; /* 16px */
          padding: 2rem; /* 32px */
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .benefit-title {
          font-family: "Cormorant Garamond", serif;
          font-weight: 600;
          font-size: 1.75rem; /* 28px */
          color: #fff;
          margin-bottom: 0.5rem; /* 8px */
        }

        .benefit-description {
          font-weight: 300;
          color: #d1d5db; /* gray-300 */
        }

        /* Use the existing gold button style from globals.css */
        .cta-button {
          display: inline-block;
          margin-top: 2rem; /* 32px */
          /* These classes are defined in styles/globals.css */
          /* .admin-button .vip */
        }

        .secondary-link {
          margin-top: 1.5rem; /* 24px */
          font-size: 0.875rem; /* 14px */
          color: #9ca3af; /* gray-400 */
          transition: color 0.2s ease;
        }

        .secondary-link:hover {
          color: #f9fafb; /* gray-50 */
        }
      `}</style>

      <div className="vip-welcome-page">
        <Header />

        <main>
          {/* Hero Section */}
          <section className="hero-section py-20 px-6 text-center">
            <h1 className="hero-title">Welcome to the Front Row.</h1>
            <p className="hero-subtitle">
              Access a world of curated luxury, exclusive benefits, and rewards
              reserved only for our most valued members.
            </p>
          </section>

          {/* Benefits Section */}
          <section className="benefits-section max-w-6xl mx-auto px-6 pb-20">
            <div className="benefits-grid grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Benefit 1 */}
              <div className="benefit-card">
                <TicketIcon />
                <h2 className="benefit-title">Exclusive Access</h2>
                <p className="benefit-description">
                  Get early access to our most sought-after arrivals and private
                  sales before they're available to the public.
                </p>
              </div>

              {/* Benefit 2 */}
              <div className="benefit-card">
                <GemIcon />
                <h2 className="benefit-title">Earn Loyalty Rewards</h2>
                <p className="benefit-description">
                  Earn loyalty points on every single purchase. Unlock new tiers
                  and convert your points into exclusive rewards.
                </p>
              </div>

              {/* Benefit 3 */}
              <div className="benefit-card">
                <TagIcon />
                <h2 className="benefit-title">Member-Only Perks</h2>
                <p className="benefit-description">
                  Enjoy complimentary shipping, members-only discounts, saved
                  carts, and a dedicated quick-checkout experience.
                </p>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="cta-section pb-24 px-6 text-center">
            <h2 className="text-2xl font-semibold text-white">
              Your Front Row seat is waiting.
            </h2>
            <Link
              href="/club-register"
              className="cta-button admin-button vip text-lg px-8 py-3"
            >
              Join the Club
            </Link>
            <div className="secondary-link">
              <Link href="/club-login">
                Already a member?{" "}
                <span className="font-semibold underline">Sign In</span>
              </Link>
            </div>
          </section>
        </main>
      </div>
    </>
  );
}
