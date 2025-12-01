// FILE: /pages/vip-exclusive-access.tsx

import Head from "next/head";
import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function VipExclusiveAccessPage() {
  return (
    <div className="vip-benefits-page">
      <Head>
        <title>VIP Exclusive Access – Famous Finds</title>
      </Head>
      <Header />

      <main className="vip-benefits-inner">
        <p className="vip-benefits-kicker">VIP BENEFITS</p>
        <h1 className="vip-benefits-title">Exclusive Access</h1>
        <p className="vip-benefits-intro">
          Inspired by leading programs like Nike Membership, your Famous Finds
          VIP status unlocks private drops, early access windows, and
          invite-only experiences around our most sought-after pieces.
        </p>

        <h2 className="vip-benefits-section-title">What you unlock</h2>
        <p className="vip-benefits-section-subtitle">
          The more you spend in a season, the earlier and more often you see our
          best inventory.
        </p>

        <div className="vip-benefits-grid">
          <div className="vip-benefit-card">
            <h3>Early access windows</h3>
            <p>
              VIP members see selected drops up to 48 hours before the public.
              The more you spend in a season, the longer your early access
              window becomes.
            </p>
          </div>

          <div className="vip-benefit-card">
            <h3>Invite-only previews</h3>
            <p>
              High-tier members receive digital lookbooks and curated previews
              for celebrity, archive, and one-of-one drops — just like a private
              showroom appointment.
            </p>
          </div>

          <div className="vip-benefit-card">
            <h3>Reserved sizes &amp; pieces</h3>
            <p>
              For selected launches, we ring-fence inventory for VIP members,
              reducing the “sold-out in seconds” frustration on rare sizes and
              iconic pieces.
            </p>
          </div>

          <div className="vip-benefit-card">
            <h3>Priority notifications</h3>
            <p>
              Turn on VIP alerts to be first in line when a designer or category
              you love goes live — watches, bags, jewellery, sneakers, and
              more.
            </p>
          </div>
        </div>

        <p className="vip-benefits-section-subtitle">
          As your tier increases, your access level upgrades — from early
          emails at Member level to guaranteed access windows at our highest
          tiers.
        </p>

        <div className="vip-benefits-cta">
          <p>Your seat in the Front Row is waiting.</p>
          <Link href="/vip-signup" className="vip-benefits-cta-button">
            Join the Club
          </Link>
          <p className="vip-benefits-cta-small">
            Already a VIP member?{" "}
            <Link href="/vip-login">Sign in to your VIP profile</Link>
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
