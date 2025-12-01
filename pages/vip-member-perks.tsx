// FILE: /pages/vip-member-perks.tsx

import Head from "next/head";
import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function VipMemberPerksPage() {
  return (
    <div className="vip-benefits-page">
      <Head>
        <title>VIP Member-Only Perks – Famous Finds</title>
      </Head>
      <Header />

      <main className="vip-benefits-inner">
        <p className="vip-benefits-kicker">VIP BENEFITS</p>
        <h1 className="vip-benefits-title">Member-Only Perks</h1>
        <p className="vip-benefits-intro">
          Beyond points and access, VIP members receive practical perks that
          make every purchase smoother — modelled on how Nike-style
          memberships reward ongoing loyalty.
        </p>

        <h2 className="vip-benefits-section-title">Everyday perks you can feel</h2>
        <p className="vip-benefits-section-subtitle">
          These benefits are designed to make shopping with Famous Finds easier,
          faster, and more personal every time you log in.
        </p>

        <div className="vip-benefits-grid">
          <div className="vip-benefit-card">
            <h3>Complimentary &amp; discounted shipping</h3>
            <p>
              VIP members receive occasional free-shipping promotions and
              tier-based discounted shipping rates on eligible orders — ideal
              for regular buyers and collectors.
            </p>
          </div>

          <div className="vip-benefit-card">
            <h3>Saved carts &amp; wishlists</h3>
            <p>
              Stay signed in on your devices and keep track of pieces you love.
              When something on your wishlist goes on promotion or low in
              stock, you&apos;ll be the first to know.
            </p>
          </div>

          <div className="vip-benefit-card">
            <h3>VIP service &amp; support</h3>
            <p>
              High-tier members get faster support routing and priority handling
              on authentication questions, returns, delivery issues, and
              after-care for special pieces.
            </p>
          </div>

          <div className="vip-benefit-card">
            <h3>Birthday &amp; anniversary rewards</h3>
            <p>
              Add your key dates to your VIP profile to receive special offers
              or bonus points during your celebration month — perfect for
              treating yourself or someone you love.
            </p>
          </div>
        </div>

        <p className="vip-benefits-section-subtitle">
          The more you engage with Famous Finds, the smarter your benefits
          become — personalised offers, tailored drops, and private events
          curated around your favourite designers and categories.
        </p>

        <div className="vip-benefits-cta">
          <p>Log in to your VIP profile and start using your perks today.</p>
          <Link href="/vip-login" className="vip-benefits-cta-button">
            Unlock your perks
          </Link>
          <p className="vip-benefits-cta-small">
            Not a VIP yet?{" "}
            <Link href="/vip-signup">Join the Famous Finds VIP Club</Link>
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
