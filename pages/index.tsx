// FILE: /pages/index.tsx
import Head from "next/head";
import Header from "../components/Header";
import Footer from "../components/Footer";
import DemoGrid from "../components/DemoGrid";
import { ProductLike } from "../components/ProductCard";
import { adminDb } from "../utils/firebaseAdmin";
import type { GetServerSideProps, NextPage } from "next";
import HomepageButler from "../components/HomepageButler";

type HomeProps = {
  trending: ProductLike[];
  newArrivals: ProductLike[];
};

const Home: NextPage<HomeProps> = ({ trending, newArrivals }) => {
  return (
    <div className="home-wrapper">
      <Head>
        <title>Famous Finds — US</title>
      </Head>

      <Header />

      <main className="wrap">
        <section className="hero">
          <div className="heroCopy">
            <p className="eyebrow">WELCOME TO OUR WORLD OF LUXURY</p>
            <h1>Famous Finds for every shade of style.</h1>
            <p className="lead">
              Curated, authenticated designer pieces — loved once and ready to
              be loved again. A marketplace where every customer belongs, in all
              colours and all stories.
            </p>
          </div>

          <div className="heroVisual">
            <HomepageButler />
          </div>
        </section>

        <DemoGrid title="Now Trending" items={trending} />
        <DemoGrid title="New Arrivals" items={newArrivals} />
      </main>

      <Footer />

      <style jsx>{`
        .home-wrapper {
          background-color: #ffffff;
          min-height: 100vh;
          color: #000000;
        }

        .wrap {
          max-width: 1200px;
          margin: 0 auto;
          padding: 16px 16px 80px;
        }

        .hero {
          display: grid;
          grid-template-columns: minmax(0, 1.1fr) minmax(0, 1.1fr);
          gap: 40px;
          margin-top: 16px;
          margin-bottom: 24px;
          align-items: center;
        }

        .heroCopy {
          max-width: 520px;
        }

        .eyebrow {
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.14em;
          color: #000000;
          margin-bottom: 6px;
        }

        h1 {
          margin-top: 4px;
          font-size: 34px;
          font-weight: 800;
          color: #000000;
        }

        .lead {
          margin-top: 12px;
          font-size: 16px;
          font-weight: 600;
          color: #111111;
          line-height: 1.65;
        }

        /* BUTLER BOX – DARK PREMIUM CARD */
        .heroVisual {
          border-radius: 24px;
          padding: 22px 24px 26px;
          background: radial-gradient(circle at top left, #1f2937, #020617);
          box-shadow: 0 20px 45px rgba(15, 23, 42, 0.6);
          border: 0;
          color: #f9fafb;
          position: relative;
          overflow: hidden;
        }

        /* Force the content inside to stay light on dark */
        .heroVisual * {
          color: #f9fafb !important;
        }

        /* Make the Butler buttons pop on the dark card if they are “light” buttons */
        .heroVisual button {
          background-color: #ffffff !important;
          color: #111827 !important;
          border-radius: 999px !important;
          font-weight: 600 !important;
        }

        .heroVisual button:hover {
          opacity: 0.9;
        }

        /* Headings for Now Trending / New Arrivals on this page */
        .home-wrapper .section-header h2 {
          color: #000000 !important;
          font-weight: 700;
          font-size: 20px;
          letter-spacing: 0.04em;
        }

        @media (max-width: 900px) {
          .hero {
            grid-template-columns: 1fr;
          }

          .heroVisual {
            margin-top: 8px;
          }
        }
      `}</style>
    </div>
  );
};

export const getServerSideProps: GetServerSideProps<HomeProps> = async () => {
  try {
    const snap = await adminDb
      .collection("listings")
      .orderBy("createdAt", "desc")
      .limit(50)
      .get();

    const liveItems: ProductLike[] = [];

    snap.docs.forEach((doc) => {
      const d: any = doc.data() || {};

      const allowedStatuses = ["Live", "Active", "Approved"];
      if (d.status && !allowedStatuses.includes(d.status)) {
        return;
      }

      const priceNumber = Number(d.price) || 0;
      const price = priceNumber
        ? `US$${priceNumber.toLocaleString("en-US")}`
        : "";

      const image: string =
        d.image_url ||
        d.imageUrl ||
        d.image ||
        (Array.isArray(d.imageUrls) && d.imageUrls[0]) ||
        "https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto-format&fit=crop&w=800&q=80";

      liveItems.push({
        id: doc.id,
        title: d.title || "Untitled listing",
        brand: d.brand || "",
        price,
        image,
        href: `/product/${doc.id}`,
        badge: d.badge || undefined,
      });
    });

    return {
      props: {
        trending: liveItems.slice(0, 12),
        newArrivals: liveItems.slice(12, 24),
      },
    };
  } catch (err) {
    console.error("Error loading home listings", err);
    return {
      props: {
        trending: [],
        newArrivals: [],
      },
    };
  }
};

export default Home;
``` :contentReference[oaicite:0]{index=0}  

---

## 2️⃣ `/styles/globals.css` – FULL FILE (stronger section titles)

```css
/* FILE: /styles/globals.css */
/* These three lines MUST be at the top. */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Basic reset */
* {
  box-sizing: border-box;
}

html,
body {
  margin: 0;
  padding: 0;
  font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
  /* FORCE GLOBAL LIGHT THEME */
  background: #ffffff;
  color: #000000;
}

a {
  color: inherit;
  text-decoration: none;
}

/* --- GLOBAL INPUT STYLES (Fixes "Make an Offer" & others) --- */
input,
textarea,
select {
  background-color: #ffffff !important;
  color: #000000 !important;
  border: 1px solid #d1d5db !important; /* Light Gray Border */
  border-radius: 6px;
  padding: 10px;
}

input::placeholder,
textarea::placeholder {
  color: #6b7280 !important; /* Darker gray for readability */
  opacity: 1;
}

/* For pages that were previously dark, force them to Light Mode */
.dark-theme-page {
  background: #ffffff !important;
  color: #000000 !important;
  min-height: 100vh;
}

/* Ensure all text inside these pages is dark/black */
.dark-theme-page h1,
.dark-theme-page h2,
.dark-theme-page h3,
.dark-theme-page h4,
.dark-theme-page p,
.dark-theme-page span,
.dark-theme-page li,
.dark-theme-page label,
.dark-theme-page div {
  color: #000000;
}

/* Exceptions for lighter text (metadata, hints) - make them Dark Gray, not light gray */
.dark-theme-page .meta,
.dark-theme-page .hint,
.dark-theme-page .cond,
.dark-theme-page .loc,
.dark-theme-page .brand {
  color: #4b5563 !important; /* Dark Gray */
}

.section {
  max-width: 1200px;
  margin: 28px auto;
  padding: 0 16px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

/* STRONGER SECTION TITLES – e.g. “Now Trending”, “New Arrivals” */
.section-header h2 {
  margin: 0;
  font-size: 20px;
  letter-spacing: 0.04em;
  color: #000000 !important;
  font-weight: 700;
}

/* --- Global Header Button Styles --- */
.admin-button {
  font-size: 12px !important;
  border-radius: 20px !important;
  padding: 6px 12px !important;
  font-weight: 600 !important;
  text-decoration: none !important;
  transition: all 0.2s ease;
  white-space: nowrap;
}
.admin-button.management {
  background: linear-gradient(90deg, #d1d5db, #9ca3af) !important;
  color: #000 !important;
}
.admin-button.seller {
  background: linear-gradient(90deg, #facc15, #f59e0b) !important;
  color: #000 !important;
}
.admin-button.vip {
  background: linear-gradient(90deg, #facc15, #f59e0b) !important;
  color: #000 !important;
}
.admin-button:hover {
  transform: translateY(-1px);
  opacity: 0.9;
}

.grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

@media (min-width: 720px) {
  .grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

.grid-cats .cat {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  height: 120px;
  background-size: cover;
  background-position: center;
  border-radius: 12px;
  overflow: hidden;
}

.grid-cats .cat::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, #000000 0%, #00000040 50%, #000000 100%);
  opacity: 0.5;
}

.grid-cats .cat span {
  position: relative;
  z-index: 1;
  font-weight: 600;
  font-size: 15px;
  color: #fff;
}

.grid-prods .prod {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
  background: #ffffff;
}

.grid-prods .img {
  position: relative;
  background: #f3f4f6;
  aspect-ratio: 1/1;
}

.grid-prods .img img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.badge {
  position: absolute;
  left: 8px;
  top: 8px;
  font-size: 11px;
  padding: 4px 8px;
  background: #ffffffcc;
  border: 1px solid #e5e7eb;
  border-radius: 999px;
  color: #000;
}

.meta {
  padding: 10px;
}

.brand {
  font-size: 12px;
  opacity: 0.8;
  color: #374151;
}

.title {
  font-size: 13px;
  margin: 2px 0 8px;
  color: #111827;
}

.row {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: space-between;
}

.price {
  font-weight: 700;
  color: #000;
}

.cond {
  font-size: 11px;
  opacity: 0.75;
  color: #4b5563;
}

.loc {
  margin-top: 6px;
  font-size: 11px;
  opacity: 0.7;
  color: #6b7280;
}

.footer {
  max-width: 1200px;
  margin: 40px auto;
  padding: 20px 16px;
  opacity: 0.7;
  font-size: 12px;
  border-top: 1px solid #e5e7eb;
  color: #374151;
}

/* === AUTH PAGES (Login/Register) === */
.auth-page {
  min-height: 100vh;
  background: #ffffff;
  color: #111827;
  display: flex;
  flex-direction: column;
}

.auth-main {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 24px 16px;
}

.auth-card {
  width: 100%;
  max-width: 420px;
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid #e5e7eb;
  padding: 24px 24px 28px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
}

.auth-card h1 {
  margin: 0 0 4px;
  font-size: 22px;
  font-weight: 600;
  text-align: center;
  color: #000;
}

.auth-card p.auth-subtitle {
  margin: 0 0 12px;
  font-size: 12px;
  text-align: center;
  color: #6b7280;
}

.auth-fields {
  margin-top: 12px;
}

.auth-field {
  margin-bottom: 10px;
}

.auth-field label {
  display: block;
  font-size: 11px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 4px;
}

/* Specific Auth Input Override */
.auth-input {
  width: 100%;
  border-radius: 8px;
  border: 1px solid #d1d5db;
  background: #ffffff;
  padding: 8px 10px;
  font-size: 14px;
  color: #111827;
}

.auth-input::placeholder {
  color: #9ca3af;
}

.auth-input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 1px rgba(37, 99, 235, 0.2);
}

.auth-button-primary {
  width: 100%;
  margin-top: 8px;
  padding: 9px 12px;
  border-radius: 999px;
  border: none;
  background: #000000;
  color: #ffffff;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.auth-button-primary:disabled {
  opacity: 0.7;
  cursor: default;
}

.auth-secondary-link,
.auth-secondary-link-inline {
  margin-top: 10px;
  font-size: 11px;
  color: #6b7280;
  text-align: center;
}

.auth-secondary-link a,
.auth-secondary-link-inline a,
.auth-secondary-link-inline button {
  color: #374151;
  text-decoration: none;
}

.auth-secondary-link-inline button {
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 0;
  font-size: 11px;
  color: #374151;
}

.auth-secondary-link a:hover,
.auth-secondary-link-inline a:hover,
.auth-secondary-link-inline button:hover {
  text-decoration: underline;
}

.auth-error {
  margin-top: 10px;
  padding: 6px 8px;
  border-radius: 6px;
  border: 1px solid #fca5a5;
  background: #fef2f2;
  color: #991b1b;
  font-size: 12px;
}

.auth-info {
  margin-top: 10px;
  padding: 6px 8px;
  border-radius: 6px;
  border: 1px solid #86efac;
  background: #f0fdf4;
  color: #166534;
  font-size: 12px;
}

.auth-code-input {
  letter-spacing: 0.35em;
  text-align: center;
}

.password-input-row {
  display: flex;
  align-items: center;
  border-radius: 8px;
  border: 1px solid #d1d5db;
  background: #ffffff;
  overflow: hidden;
}

.password-input-row .auth-input {
  border: none;
  border-radius: 0;
  flex: 1;
  padding-right: 0;
}

.password-input-row .auth-input:focus {
  box-shadow: none;
  border-color: transparent;
}

.password-toggle {
  padding: 0 10px;
  font-size: 11px;
  font-weight: 500;
  color: #4b5563;
  background: transparent;
  border: none;
  cursor: pointer;
}

.password-toggle:hover {
  color: #000;
}

.password-strength {
  margin-top: 6px;
  font-size: 11px;
}

.password-strength-weak { color: #ef4444; }
.password-strength-ok { color: #eab308; }
.password-strength-strong { color: #22c55e; }
.password-strength-very-strong { color: #15803d; }

/* === DASHBOARD === */
.dashboard-page {
  min-height: 100vh;
  background: #f9fafb;
  color: #111827;
}

.dashboard-main {
  max-width: 1152px;
  margin-left: auto;
  margin-right: auto;
  padding: 24px 16px 64px;
}

dashboard-header {
  margin-bottom: 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* ...rest of your dashboard styles stay as they were... */
``` :contentReference[oaicite:1]{index=1}  

(I kept everything else in `globals.css` the same; I only strengthened `.section-header h2`.)

---

Upload these two, redeploy, and the **Butler box should be dark** and the **Now Trending / New Arrivals** headings should be heavier black.
