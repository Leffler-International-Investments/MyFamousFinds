// FILE: /pages/designers/index.tsx

import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";

type Designer = {
  id: string;
  name: string;
  slug: string;
};

export default function DesignersPage() {
  const [designers, setDesigners] = useState<Designer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadDesigners() {
      try {
        const res = await fetch("/api/public/designers");
        const json = await res.json();
        if (!cancelled && json?.ok && Array.isArray(json.designers)) {
          setDesigners(json.designers);
        }
      } catch (err) {
        console.error("Failed to load designers", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadDesigners();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="dark-theme-page">
      <Head>
        <title>Designers | Famous Finds</title>
      </Head>

      <Header />

      <main className="wrap">
        <section className="page-hero">
          <h1 className="page-title">Designers</h1>
          <p className="page-sub">
            Browse the designers featured in Famous Finds. Tap a name to see
            items in our catalogue from that designer.
          </p>
        </section>

        <section className="grid-wrap">
          {loading && <p className="muted">Loading designers…</p>}

          {!loading && designers.length === 0 && (
            <p className="muted">
              Designers will appear here as they are added.
            </p>
          )}

          {!loading && designers.length > 0 && (
            <div className="designer-grid">
              {designers.map((d) => (
                <Link
                  key={d.id}
                  href={`/designers/${encodeURIComponent(d.slug || d.id)}`}
                  className="designer-card"
                >
                  <span className="designer-name">{d.name}</span>
                  <span className="designer-cta">View pieces</span>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>

      <Footer />

      <style jsx>{`
        .wrap {
          max-width: 1100px;
          margin: 0 auto;
          padding: 24px 16px 80px;
        }
        .page-hero {
          margin-bottom: 24px;
        }
        .page-title {
          font-size: 28px;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: #111827;
        }
        .page-sub {
          margin-top: 8px;
          font-size: 14px;
          color: #4b5563;
          max-width: 520px;
        }
        .grid-wrap {
          margin-top: 8px;
        }
        .muted {
          font-size: 14px;
          color: #6b7280;
        }
        .designer-grid {
          margin-top: 8px;
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 12px;
        }
        .designer-card {
          border-radius: 999px;
          border: 1px solid #e5e7eb;
          background: #ffffff;
          padding: 10px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 14px;
          color: #111827;
          text-decoration: none;
          transition: border-color 0.15s ease, box-shadow 0.15s ease,
            transform 0.15s ease, background-color 0.15s ease;
        }
        .designer-card:hover {
          background: #f9fafb;
          border-color: #111827;
          box-shadow: 0 8px 24px rgba(15, 23, 42, 0.12);
          transform: translateY(-1px);
        }
        .designer-name {
          font-weight: 500;
        }
        .designer-cta {
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.16em;
          color: #6b7280;
        }
      `}</style>
    </div>
  );
}
