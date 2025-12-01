// FILE: /pages/vip-loyalty-rewards.tsx

import Head from "next/head";
import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function VipLoyaltyRewardsPage() {
  return (
    <div className="vip-benefits-page">
      <Head>
        <title>VIP Loyalty Rewards – Famous Finds</title>
      </Head>
      <Header />

      <main className="vip-benefits-inner">
        <p className="vip-benefits-kicker">VIP BENEFITS</p>
        <h1 className="vip-benefits-title">Earn Loyalty Rewards</h1>
        <p className="vip-benefits-intro">
          Similar to Nike-style rewards programs, every purchase you make on
          Famous Finds earns points. Points unlock higher tiers, exclusive
          benefits, and special experiences.
        </p>

        <h2 className="vip-benefits-section-title">How points work</h2>
        <ul className="vip-benefits-section-subtitle" style={{ textAlign: "left" }}>
          <li>1 point for every $1 USD you spend on eligible items.</li>
          <li>Bonus points on selected launches and VIP events.</li>
          <li>Points are calculated on order completion (not pending).</li>
          <li>
            Your points never expire as long as you make at least one purchase
            every 12 months.
          </li>
        </ul>

        <h2 className="vip-benefits-section-title">Tiers &amp; thresholds</h2>

        <div className="vip-benefits-grid">
          <div className="vip-benefit-card">
            <h3>Tier 1 – Member</h3>
            <p>
              0 – 999 points.  
              Base rewards and access to VIP events and early emails.
            </p>
          </div>

          <div className="vip-benefit-card">
            <h3>Tier 2 – Silver</h3>
            <p>
              1,000 – 4,999 points.  
              Early access windows, birthday rewards, and priority customer
              care.
            </p>
          </div>

          <div className="vip-benefit-card">
            <h3>Tier 3 – Gold</h3>
            <p>
              5,000 – 14,999 points.  
              Priority support, higher rewards, and occasional free shipping on
              selected orders.
            </p>
          </div>

          <div className="vip-benefit-card">
            <h3>Tier 4 – Platinum</h3>
            <p>
              15,000+ points.  
              Highest-level access, invites to ultra-rare drops, and
              concierge-style service.
            </p>
          </div>
        </div>

        <h2 className="vip-benefits-section-title">How we calculate rewards</h2>
        <p className="vip-benefits-section-subtitle">
          Behind the scenes, each completed order is written into the{" "}
          <code>orders</code> collection. A VIP engine updates your{" "}
          <code>vip_members</code> record to:
        </p>
        <ul className="vip-benefits-section-subtitle" style={{ textAlign: "left" }}>
          <li>Add points based on the USD total.</li>
          <li>Increase lifetime spend.</li>
          <li>Recalculate your tier based on the thresholds above.</li>
        </ul>
        <p className="vip-benefits-section-subtitle">
          Later, this same engine can power dashboards inside the Management
          Admin area so you can audit points, manually adjust balances, or
          trigger bonus campaigns.
        </p>

        <div className="vip-benefits-cta">
          <p>
            Make purchases, collect points automatically, and watch your tier
            upgrade — just like the best sneaker and sportswear programs.
          </p>
          <Link href="/vip-signup" className="vip-benefits-cta-button">
            Start earning points
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
