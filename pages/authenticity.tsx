// FILE: /pages/authenticity.tsx

import Head from "next/head";
import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";

const SITE_URL = "https://www.myfamousfinds.com";

/* ── Inline SVG icons (no external deps) ── */

const ShieldIcon = () => (
  <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="#111827" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <polyline points="9 12 11 14 15 10" />
  </svg>
);

const SearchIcon = () => (
  <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="#111827" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const EyeIcon = () => (
  <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="#111827" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const CpuIcon = () => (
  <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="#111827" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="4" width="16" height="16" rx="2" ry="2" />
    <rect x="9" y="9" width="6" height="6" />
    <line x1="9" y1="1" x2="9" y2="4" /><line x1="15" y1="1" x2="15" y2="4" />
    <line x1="9" y1="20" x2="9" y2="23" /><line x1="15" y1="20" x2="15" y2="23" />
    <line x1="20" y1="9" x2="23" y2="9" /><line x1="20" y1="14" x2="23" y2="14" />
    <line x1="1" y1="9" x2="4" y2="9" /><line x1="1" y1="14" x2="4" y2="14" />
  </svg>
);

const UserCheckIcon = () => (
  <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="#111827" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="8.5" cy="7" r="4" />
    <polyline points="17 11 19 13 23 9" />
  </svg>
);

const AlertIcon = () => (
  <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="#111827" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const RefreshIcon = () => (
  <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="#111827" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
);

const LockIcon = () => (
  <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="#111827" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

/* ── Inspection checkpoints data ── */

const checkpoints = [
  { label: "Materials & Leather", desc: "Grain pattern, texture, flexibility, and weight are examined against brand-specific standards." },
  { label: "Stitching & Craftsmanship", desc: "Stitch count per inch, thread quality, and seam alignment are compared to genuine construction methods." },
  { label: "Hardware & Engravings", desc: "Zippers, clasps, and buckles are inspected for weight, finish, and precision of brand engravings." },
  { label: "Serial Numbers & Date Codes", desc: "Format, font, placement, and encoding patterns are verified against known authentic records." },
  { label: "Typography & Logos", desc: "Brand stamps, heat stamps, and printed logos are scrutinized for font accuracy, spacing, and depth." },
  { label: "Packaging & Dust Bags", desc: "Boxes, dust bags, authenticity cards, and tags are checked for material quality and correct branding." },
  { label: "Color & Patina", desc: "Leather tone, hardware oxidation, and ageing characteristics are assessed for consistency with age and use." },
  { label: "Lining & Interior", desc: "Internal fabric, pocket construction, and label placement are matched to brand specifications." },
];

/* ── Process steps ── */

const steps = [
  {
    num: "01",
    title: "Seller Verification",
    desc: "Every seller is vetted before they can list a single item. We verify identities, review credentials, and require agreement to our strict authenticity standards. Only approved sellers gain access to our marketplace.",
    icon: <UserCheckIcon />,
  },
  {
    num: "02",
    title: "Digital Assessment",
    desc: "Every listing undergoes rigorous digital screening. Our team analyzes high-resolution photos, brand accuracy, descriptions, and pricing patterns to flag inconsistencies before an item ever goes live.",
    icon: <CpuIcon />,
  },
  {
    num: "03",
    title: "Expert Inspection",
    desc: "Trained authentication specialists examine every detail — materials, stitching, hardware, serial numbers, and more. We use sight, touch, and methodical brand-specific protocols to verify each item against known authentic standards.",
    icon: <SearchIcon />,
  },
  {
    num: "04",
    title: "Ongoing Monitoring",
    desc: "Authentication does not stop at listing approval. We continuously monitor seller activity, review buyer feedback, and re-examine any item that raises a question — even after sale.",
    icon: <RefreshIcon />,
  },
];

export default function AuthenticityPage() {
  const title = "Authenticity — How We Protect Every Purchase | Famous Finds";
  const description =
    "Learn how Famous Finds verifies every luxury item through expert inspection, digital screening, and rigorous authentication. Shop with confidence.";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Authenticity at Famous Finds",
    description,
    url: `${SITE_URL}/authenticity`,
    publisher: {
      "@type": "Organization",
      name: "Famous Finds",
      url: SITE_URL,
    },
  };

  return (
    <div className="page">
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={`${SITE_URL}/authenticity`} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={`${SITE_URL}/authenticity`} />
        <meta property="og:image" content={`${SITE_URL}/icons/icon-512x512.png`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </Head>

      <Header />

      <main>
        {/* ══════════ HERO ══════════ */}
        <section className="hero">
          <div className="hero-inner">
            <p className="hero-eyebrow">AUTHENTICITY AT FAMOUS FINDS</p>
            <h1 className="hero-title">
              Every Item. Verified.<br />Guaranteed Authentic.
            </h1>
            <p className="hero-sub">
              When you shop at Famous Finds, you are not just buying luxury — you are
              buying certainty. Our rigorous, multi-stage authentication process ensures
              that every item on our platform meets the highest standards of genuineness
              before it ever reaches your hands.
            </p>
            <div className="hero-badges">
              <div className="hero-badge">
                <ShieldIcon />
                <span>100% Authenticity<br />Guarantee</span>
              </div>
              <div className="hero-badge">
                <EyeIcon />
                <span>Multi-Stage<br />Verification</span>
              </div>
              <div className="hero-badge">
                <LockIcon />
                <span>Buyer Protection<br />On Every Order</span>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════ OUR PROMISE ══════════ */}
        <section className="section promise-section">
          <div className="section-inner">
            <h2 className="section-title">Our Promise to You</h2>
            <p className="section-lead">
              Counterfeits have no place on Famous Finds. Period. We built our entire
              platform around one conviction: that buying pre-loved luxury should feel
              every bit as trustworthy as buying from a brand boutique. Every process we
              follow, every tool we deploy, and every expert we train exists for one
              reason — to make sure the item you receive is exactly what it claims to be.
            </p>
            <p className="section-lead">
              We do not cut corners. We do not assume. We verify.
            </p>
          </div>
        </section>

        {/* ══════════ PROCESS ══════════ */}
        <section className="section process-section">
          <div className="section-inner">
            <p className="section-eyebrow">HOW WE AUTHENTICATE</p>
            <h2 className="section-title">A Rigorous, Multi-Stage Process</h2>
            <p className="section-sub">
              Every item listed on Famous Finds passes through multiple layers of
              verification — from the moment a seller applies to long after the sale is
              complete. Nothing is left to chance.
            </p>

            <div className="steps-grid">
              {steps.map((step) => (
                <div key={step.num} className="step-card">
                  <div className="step-icon">{step.icon}</div>
                  <div className="step-num">{step.num}</div>
                  <h3 className="step-title">{step.title}</h3>
                  <p className="step-desc">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════ WHAT WE INSPECT ══════════ */}
        <section className="section inspect-section">
          <div className="section-inner">
            <p className="section-eyebrow">LEAVING NOTHING TO CHANCE</p>
            <h2 className="section-title">What Our Experts Inspect</h2>
            <p className="section-sub">
              Authenticity hides in the details. Our specialists follow brand-specific
              protocols and use a combination of sight, touch, and methodical analysis
              to evaluate every aspect of an item. Here is what we look at:
            </p>

            <div className="checkpoint-grid">
              {checkpoints.map((cp) => (
                <div key={cp.label} className="checkpoint-card">
                  <h4 className="checkpoint-label">{cp.label}</h4>
                  <p className="checkpoint-desc">{cp.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════ TECHNOLOGY + EXPERTISE ══════════ */}
        <section className="section tech-section">
          <div className="section-inner">
            <div className="tech-grid">
              <div className="tech-content">
                <p className="section-eyebrow">INNOVATION MEETS CRAFTSMANSHIP</p>
                <h2 className="section-title">Technology Meets Human Expertise</h2>
                <p className="tech-body">
                  The best authentication combines the pattern-recognition power of
                  technology with the irreplaceable intuition of trained human eyes.
                  At Famous Finds, we use both.
                </p>
                <p className="tech-body">
                  Our digital screening tools analyze listing images and metadata to
                  flag inconsistencies at scale — unusual pricing patterns, image
                  anomalies, and description red flags are caught before a listing is
                  ever reviewed by a human.
                </p>
                <p className="tech-body">
                  Then our authentication specialists take over. They bring deep
                  brand knowledge, hands-on training, and meticulous attention to
                  detail that no algorithm can replicate. The result is a verification
                  process that is both efficient and uncompromising.
                </p>
              </div>
              <div className="tech-features">
                <div className="tech-feature">
                  <CpuIcon />
                  <div>
                    <h4>Digital Screening</h4>
                    <p>Automated photo analysis, pricing pattern detection, and listing consistency checks.</p>
                  </div>
                </div>
                <div className="tech-feature">
                  <SearchIcon />
                  <div>
                    <h4>Expert Review</h4>
                    <p>Brand-trained specialists with deep knowledge of materials, construction, and authentication markers.</p>
                  </div>
                </div>
                <div className="tech-feature">
                  <RefreshIcon />
                  <div>
                    <h4>Continuous Learning</h4>
                    <p>Our team stays current on evolving counterfeiting techniques and new brand releases through ongoing training.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════ BUYER PROTECTION ══════════ */}
        <section className="section protection-section">
          <div className="section-inner">
            <p className="section-eyebrow">YOUR SAFETY NET</p>
            <h2 className="section-title">Your Protection, Guaranteed</h2>
            <p className="section-sub">
              We stand behind every transaction on our platform. If something is not
              right, we make it right.
            </p>

            <div className="protection-grid">
              <div className="protection-card">
                <ShieldIcon />
                <h3>Authenticity Guarantee</h3>
                <p>
                  Every item sold on Famous Finds is covered by our Authenticity
                  Guarantee. If an item is determined to be inauthentic, you receive
                  a full refund — no exceptions.
                </p>
              </div>
              <div className="protection-card">
                <EyeIcon />
                <h3>72-Hour Inspection Window</h3>
                <p>
                  After delivery, you have a full 72-hour window to inspect your
                  item. If anything concerns you — a detail that does not match, a
                  material that feels wrong —{" "}
                  <Link href="/authentication-complaint" className="text-link">
                    submit a complaint
                  </Link>{" "}
                  and we investigate immediately.
                </p>
              </div>
              <div className="protection-card">
                <LockIcon />
                <h3>Secure Payments</h3>
                <p>
                  Your payment is held securely until you confirm your item. Funds are
                  only released to the seller after you have had time to inspect and
                  approve your purchase.
                </p>
              </div>
              <div className="protection-card">
                <AlertIcon />
                <h3>Dedicated Support</h3>
                <p>
                  Have a question about authenticity? Our team responds promptly.{" "}
                  <Link href="/authentication-complaint" className="text-link">
                    Submit an authenticity complaint
                  </Link>{" "}
                  and we will take immediate action.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════ ZERO TOLERANCE ══════════ */}
        <section className="section zero-section">
          <div className="zero-inner">
            <h2 className="zero-title">Zero Tolerance for Counterfeits</h2>
            <p className="zero-body">
              We take counterfeiting personally. Any seller found listing inauthentic
              items faces immediate suspension, permanent removal from our platform,
              and where applicable, referral to the appropriate authorities. We also
              work directly with brand rights-holders — verified IP complaints result
              in instant listing removal and a full investigation of the seller&apos;s
              account.
            </p>
            <p className="zero-body">
              This is not just policy. It is the foundation of everything we do.
            </p>
          </div>
        </section>

        {/* ══════════ CTA ══════════ */}
        <section className="section cta-section">
          <div className="section-inner cta-inner">
            <h2 className="cta-title">Shop with Absolute Confidence</h2>
            <p className="cta-sub">
              Every item on Famous Finds has been verified through our rigorous
              authentication process. Browse knowing that quality and authenticity
              are never in question.
            </p>
            <div className="cta-buttons">
              <Link href="/" className="cta-btn cta-btn-primary">
                Start Shopping
              </Link>
              <Link href="/buying" className="cta-btn cta-btn-secondary">
                Read Our Buying Guide
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />

      <style jsx>{`
        /* ── Page ── */
        .page {
          background: #ffffff;
          color: #111827;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }

        /* ── Hero ── */
        .hero {
          background: #111827;
          color: #f9fafb;
          padding: 80px 24px 72px;
          text-align: center;
        }
        .hero-inner {
          max-width: 800px;
          margin: 0 auto;
        }
        .hero-eyebrow {
          font-size: 11px;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          color: #9ca3af;
          margin: 0 0 20px;
          font-weight: 600;
        }
        .hero-title {
          font-family: "Georgia", serif;
          font-size: 44px;
          font-weight: 700;
          line-height: 1.15;
          margin: 0 0 24px;
          color: #ffffff;
          letter-spacing: -0.02em;
        }
        .hero-sub {
          font-size: 16px;
          line-height: 1.7;
          color: #d1d5db;
          max-width: 640px;
          margin: 0 auto 48px;
        }
        .hero-badges {
          display: flex;
          justify-content: center;
          gap: 40px;
          flex-wrap: wrap;
        }
        .hero-badge {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          min-width: 140px;
        }
        .hero-badge :global(svg) {
          stroke: #f9fafb;
        }
        .hero-badge span {
          font-size: 13px;
          font-weight: 600;
          line-height: 1.4;
          color: #e5e7eb;
          text-align: center;
        }

        /* ── Shared section ── */
        .section {
          padding: 72px 24px;
        }
        .section-inner {
          max-width: 1080px;
          margin: 0 auto;
        }
        .section-eyebrow {
          font-size: 11px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #6b7280;
          margin: 0 0 12px;
          font-weight: 600;
        }
        .section-title {
          font-family: "Georgia", serif;
          font-size: 32px;
          font-weight: 700;
          margin: 0 0 16px;
          color: #111827;
          letter-spacing: -0.015em;
        }
        .section-sub {
          font-size: 15px;
          color: #4b5563;
          line-height: 1.7;
          max-width: 700px;
          margin: 0 0 40px;
        }
        .section-lead {
          font-size: 16px;
          color: #374151;
          line-height: 1.8;
          max-width: 740px;
          margin: 0 auto 16px;
        }

        /* ── Promise ── */
        .promise-section {
          text-align: center;
          background: #f9fafb;
        }

        /* ── Process Steps ── */
        .process-section {
          background: #ffffff;
        }
        .steps-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 24px;
        }
        .step-card {
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 20px;
          padding: 28px 24px;
          box-shadow: 0 8px 30px rgba(15, 23, 42, 0.05);
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .step-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 16px 40px rgba(15, 23, 42, 0.09);
        }
        .step-icon {
          margin-bottom: 14px;
        }
        .step-num {
          font-size: 12px;
          font-weight: 700;
          color: #9ca3af;
          letter-spacing: 0.1em;
          margin-bottom: 6px;
        }
        .step-title {
          font-size: 18px;
          font-weight: 600;
          margin: 0 0 8px;
          color: #111827;
        }
        .step-desc {
          font-size: 14px;
          color: #4b5563;
          line-height: 1.7;
          margin: 0;
        }

        /* ── Inspection Checkpoints ── */
        .inspect-section {
          background: #f9fafb;
        }
        .checkpoint-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }
        .checkpoint-card {
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 14px;
          padding: 20px 18px;
          box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04);
        }
        .checkpoint-label {
          font-size: 14px;
          font-weight: 600;
          margin: 0 0 6px;
          color: #111827;
        }
        .checkpoint-desc {
          font-size: 13px;
          color: #6b7280;
          line-height: 1.6;
          margin: 0;
        }

        /* ── Technology ── */
        .tech-section {
          background: #ffffff;
        }
        .tech-grid {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 56px;
          align-items: flex-start;
        }
        .tech-content .section-title {
          margin-top: 8px;
        }
        .tech-body {
          font-size: 15px;
          color: #4b5563;
          line-height: 1.75;
          margin: 0 0 16px;
        }
        .tech-features {
          display: flex;
          flex-direction: column;
          gap: 24px;
          padding-top: 12px;
        }
        .tech-feature {
          display: flex;
          gap: 16px;
          align-items: flex-start;
        }
        .tech-feature :global(svg) {
          flex-shrink: 0;
          margin-top: 2px;
        }
        .tech-feature h4 {
          font-size: 15px;
          font-weight: 600;
          margin: 0 0 4px;
          color: #111827;
        }
        .tech-feature p {
          font-size: 13px;
          color: #6b7280;
          line-height: 1.6;
          margin: 0;
        }

        /* ── Buyer Protection ── */
        .protection-section {
          background: #f9fafb;
        }
        .protection-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 24px;
        }
        .protection-card {
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 20px;
          padding: 28px 24px;
          box-shadow: 0 8px 30px rgba(15, 23, 42, 0.05);
        }
        .protection-card :global(svg) {
          margin-bottom: 14px;
        }
        .protection-card h3 {
          font-size: 17px;
          font-weight: 600;
          margin: 0 0 8px;
          color: #111827;
        }
        .protection-card p {
          font-size: 14px;
          color: #4b5563;
          line-height: 1.7;
          margin: 0;
        }

        /* ── Zero Tolerance ── */
        .zero-section {
          background: #111827;
          color: #f9fafb;
          padding: 72px 24px;
        }
        .zero-inner {
          max-width: 760px;
          margin: 0 auto;
          text-align: center;
        }
        .zero-title {
          font-family: "Georgia", serif;
          font-size: 30px;
          font-weight: 700;
          margin: 0 0 20px;
          color: #ffffff;
        }
        .zero-body {
          font-size: 15px;
          color: #d1d5db;
          line-height: 1.75;
          margin: 0 0 14px;
        }

        /* ── CTA ── */
        .cta-section {
          background: #ffffff;
          padding: 72px 24px 80px;
        }
        .cta-inner {
          text-align: center;
        }
        .cta-title {
          font-family: "Georgia", serif;
          font-size: 28px;
          font-weight: 700;
          margin: 0 0 12px;
          color: #111827;
        }
        .cta-sub {
          font-size: 15px;
          color: #4b5563;
          line-height: 1.7;
          max-width: 560px;
          margin: 0 auto 28px;
        }
        .cta-buttons {
          display: flex;
          gap: 14px;
          justify-content: center;
          flex-wrap: wrap;
        }

        /* ── Mobile ── */
        @media (max-width: 768px) {
          .hero {
            padding: 56px 20px 52px;
          }
          .hero-title {
            font-size: 30px;
          }
          .hero-sub {
            font-size: 15px;
          }
          .hero-badges {
            gap: 24px;
          }
          .section {
            padding: 48px 20px;
          }
          .section-title {
            font-size: 24px;
          }
          .section-lead {
            font-size: 15px;
          }
          .steps-grid {
            grid-template-columns: 1fr;
          }
          .checkpoint-grid {
            grid-template-columns: 1fr 1fr;
          }
          .tech-grid {
            grid-template-columns: 1fr;
            gap: 32px;
          }
          .protection-grid {
            grid-template-columns: 1fr;
          }
          .zero-title {
            font-size: 24px;
          }
          .cta-title {
            font-size: 24px;
          }
        }

        @media (max-width: 480px) {
          .hero-title {
            font-size: 26px;
          }
          .hero-badges {
            flex-direction: column;
            align-items: center;
            gap: 20px;
          }
          .checkpoint-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {/* Global styles for Next.js Link components */}
      <style jsx global>{`
        .cta-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 14px 32px;
          border-radius: 999px;
          font-size: 15px;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.2s;
        }
        .cta-btn-primary {
          background: #111827;
          color: #ffffff;
        }
        .cta-btn-primary:hover {
          background: #000000;
        }
        .cta-btn-secondary {
          background: #ffffff;
          color: #111827;
          border: 1px solid #d1d5db;
        }
        .cta-btn-secondary:hover {
          border-color: #111827;
        }
        .text-link {
          color: #2563eb;
          text-decoration: underline;
          text-underline-offset: 2px;
        }
        .text-link:hover {
          color: #1d4ed8;
        }
      `}</style>
    </div>
  );
}
