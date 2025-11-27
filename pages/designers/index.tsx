// FILE: /pages/designers/index.tsx

import Head from "next/head";
import Link from "next/link";
import type { GetServerSideProps } from "next";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { adminDb } from "../../utils/firebaseAdmin";

type Designer = {
  id: string;
  name: string;
  slug: string;
};

type DesignersPageProps = {
  designers: Designer[];
};

export default function DesignersIndexPage({ designers }: DesignersPageProps) {
  // Group designers A-Z for simple section headings
  const grouped: Record<string, Designer[]> = {};
  designers.forEach((d) => {
    const first = d.name.charAt(0).toUpperCase();
    const key = /[A-Z]/.test(first) ? first : "#";
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(d);
  });
  const letters = Object.keys(grouped).sort();

  return (
    <div className="designers-page">
      <Head>
        <title>Designers Directory – Famous Finds</title>
      </Head>

      <Header />

      <main className="wrap">
        {/* HERO */}
        <section className="hero">
          <h1>Featured Designers</h1>
          <p>
            Discover the world&apos;s most coveted luxury brands, authenticated
            and ready for a second life.
          </p>
        </section>

        {/* DIRECTORY A–Z */}
        {letters.length === 0 ? (
          <p className="empty">No designers found yet.</p>
        ) : (
          letters.map((letter) => (
            <section key={letter} className="letter-block">
              <div className="letter-heading">
                <span className="letter">{letter}</span>
                <div className="divider" />
              </div>

              <div className="designer-grid">
                {grouped[letter].map((d) => (
                  <Link
                    key={d.id}
                    href={`/designers/${d.slug || d.id}`}
                    className="designer-card"
                  >
                    <span className="designer-name">{d.name}</span>
                    <span className="designer-cta">View pieces →</span>
                  </Link>
                ))}
              </div>
            </section>
          ))
        )}
      </main>

      <Footer />

      <style jsx>{`
        .designers-page {
          background: #ffffff;
          color: #111827;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }
        .wrap {
          max-width: 1150px;
          margin: 0 auto;
          padding: 32px 16px 60px;
          width: 100%;
        }
        .hero {
          text-align: center;
          margin-bottom: 32px;
        }
        .hero h1 {
          font-family: "Georgia", serif;
          font-size: 32px;
          margin-bottom: 8px;
        }
        .hero p {
          max-width: 540px;
          margin: 0 auto;
          color: #6b7280;
          font-size: 14px;
        }
        .letter-block {
          margin-bottom: 32px;
        }
        .letter-heading {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }
        .letter {
          font-size: 26px;
          font-family: "Georgia", serif;
          color: #d1d5db;
        }
        .divider {
          flex: 1;
          height: 1px;
          background: #e5e7eb;
        }
        .designer-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 12px;
        }
        .designer-card {
          border-radius: 10px;
          border: 1px solid #e5e7eb;
          padding: 12px 14px;
          text-decoration: none;
          background: #f9fafb;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
          transition: background 0.15s ease, box-shadow 0.15s ease,
            transform 0.15s ease;
          color: inherit;
        }
        .designer-card:hover {
          background: #ffffff;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.04);
          transform: translateY(-1px);
        }
        .designer-name {
          font-size: 14px;
        }
        .designer-cta {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.14em;
          color: #9ca3af;
        }
        .empty {
          text-align: center;
          color: #6b7280;
          margin-top: 24px;
        }
      `}</style>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps<DesignersPageProps> =
  async () => {
    try {
      const snap = await adminDb.collection("designers").get(); // :contentReference[oaicite:0]{index=0}

      const designers: Designer[] = snap.docs
        .map((doc) => {
          const data = doc.data() as any;
          return {
            id: doc.id,
            name: data.name || doc.id,
            slug: data.slug || doc.id,
          };
        })
        .sort((a, b) => a.name.localeCompare(b.name));

      return { props: { designers } };
    } catch (err) {
      console.error("Error loading designers index", err);
      return { props: { designers: [] } };
    }
  };
