// FILE: /pages/designers/index.tsx

import Head from "next/head";
import Link from "next/link";
import React from "react";
import type { GetServerSideProps, NextPage } from "next";

import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { adminDb } from "../../utils/firebaseAdmin";

// --------------------------------------------------
// Types
// --------------------------------------------------

type DesignerEntry = {
  name: string;
  slug: string;
  designerCategory?: "top" | "trending" | "emerging" | "";
};

type DesignersPageProps = {
  designerOptions: DesignerEntry[];
  topDesigners: DesignerEntry[];
  trendingDesigners: DesignerEntry[];
  emergingBrands: DesignerEntry[];
};

// --------------------------------------------------
// Helpers
// --------------------------------------------------

function slugify(input: string) {
  return input
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// --------------------------------------------------
// Designer Section Component
// --------------------------------------------------

function DesignerSection({
  title,
  designers,
}: {
  title: string;
  designers: DesignerEntry[];
}) {
  if (!designers.length) return null;
  return (
    <div className="designer-section">
      <h3 className="designer-section-title">{title}</h3>
      <div className="designer-chips">
        {designers.map((d) => (
          <Link
            key={d.slug}
            href={`/designers/${d.slug}`}
            className="designer-chip"
          >
            {d.name}
          </Link>
        ))}
      </div>
      <style jsx>{`
        .designer-section {
          margin-bottom: 24px;
        }
        .designer-section-title {
          font-size: 16px;
          font-weight: 700;
          color: #111827;
          margin: 0 0 12px;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          border-bottom: 2px solid #111827;
          padding-bottom: 6px;
          display: inline-block;
        }
        .designer-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
      `}</style>
    </div>
  );
}

// --------------------------------------------------
// Component
// --------------------------------------------------

const DesignersPage: NextPage<DesignersPageProps> = ({
  designerOptions,
  topDesigners,
  trendingDesigners,
  emergingBrands,
}) => {
  return (
    <div className="designers-page">
      <Head>
        <title>Designers | Famous Finds</title>
      </Head>

      <Header />

      <main className="page-main">
        <div className="page-inner">
          <div className="breadcrumb">
            <Link href="/">Home</Link>
            <span>/</span>
            <span>Designers</span>
          </div>

          <h1>Designers</h1>

          <section className="designers-directory">
            <DesignerSection
              title="Top Designers"
              designers={topDesigners}
            />
            <DesignerSection
              title="Trending Designers"
              designers={trendingDesigners}
            />
            <DesignerSection
              title="Emerging Brands"
              designers={emergingBrands}
            />

            {/* All Designers A-Z */}
            <div className="all-designers">
              <h3 className="all-designers-title">All Designers</h3>
              <div className="designer-chips-all">
                {(designerOptions || []).map((d) => (
                  <Link
                    key={d.slug}
                    href={`/designers/${d.slug}`}
                    className="designer-chip-small"
                  >
                    {d.name}
                  </Link>
                ))}
              </div>
            </div>
          </section>
        </div>
      </main>

      <Footer />

      <style jsx>{`
        .designers-page {
          background: #ffffff;
          color: #111827;
          min-height: 100vh;
        }
        .page-main {
          padding: 24px 0 64px;
        }
        .page-inner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 16px;
        }
        .breadcrumb {
          font-size: 13px;
          color: #6b7280;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .breadcrumb :global(a) {
          color: inherit;
          text-decoration: none;
        }
        h1 {
          font-family: "Georgia", serif;
          font-size: 28px;
          margin: 0 0 24px;
        }

        /* Designers Directory */
        .designers-directory {
          padding: 8px 0;
        }
        .all-designers {
          margin-top: 32px;
          padding-top: 24px;
          border-top: 1px solid #e5e7eb;
        }
        .all-designers-title {
          font-size: 16px;
          font-weight: 700;
          color: #111827;
          margin: 0 0 12px;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }
        .designer-chips-all {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        .designers-directory :global(.designer-chip) {
          border: 1px solid #d1d5db;
          background: #ffffff;
          color: #111827;
          padding: 8px 16px;
          border-radius: 999px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s ease;
          white-space: nowrap;
          text-decoration: none;
          display: inline-block;
        }
        .designers-directory :global(.designer-chip:hover) {
          background: #111827;
          color: #ffffff;
          border-color: #111827;
        }
        .designers-directory :global(.designer-chip-small) {
          border: 1px solid #e5e7eb;
          background: #fafafa;
          color: #374151;
          padding: 6px 12px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s ease;
          white-space: nowrap;
          text-decoration: none;
          display: inline-block;
        }
        .designers-directory :global(.designer-chip-small:hover) {
          background: #111827;
          color: #ffffff;
          border-color: #111827;
        }

        @media (max-width: 480px) {
          h1 {
            font-size: 24px;
          }
        }
      `}</style>
    </div>
  );
};

export default DesignersPage;

export const getServerSideProps: GetServerSideProps<DesignersPageProps> =
  async () => {
    if (!adminDb) {
      return {
        props: {
          designerOptions: [],
          topDesigners: [],
          trendingDesigners: [],
          emergingBrands: [],
        },
      };
    }

    try {
      let designerOptions: DesignerEntry[] = [];
      let topDesigners: DesignerEntry[] = [];
      let trendingDesigners: DesignerEntry[] = [];
      let emergingBrands: DesignerEntry[] = [];

      const ds = await adminDb.collection("designers").get();
      const allDesigners: DesignerEntry[] = ds.docs
        .map((x) => {
          const data = x.data() as any;
          const name = String(data?.name ?? x.id).trim();
          const active = data?.active !== false;
          if (!active || !name) return null;
          return {
            name,
            slug: data.slug || slugify(name),
            designerCategory: data.designerCategory || "",
          };
        })
        .filter(Boolean) as DesignerEntry[];

      designerOptions = allDesigners.sort((a, b) =>
        a.name.localeCompare(b.name)
      );

      topDesigners = allDesigners
        .filter((d) => d.designerCategory === "top")
        .sort((a, b) => a.name.localeCompare(b.name));
      trendingDesigners = allDesigners
        .filter((d) => d.designerCategory === "trending")
        .sort((a, b) => a.name.localeCompare(b.name));
      emergingBrands = allDesigners
        .filter((d) => d.designerCategory === "emerging")
        .sort((a, b) => a.name.localeCompare(b.name));

      return {
        props: {
          designerOptions,
          topDesigners,
          trendingDesigners,
          emergingBrands,
        },
      };
    } catch (err) {
      console.error("Error loading designers", err);
      return {
        props: {
          designerOptions: [],
          topDesigners: [],
          trendingDesigners: [],
          emergingBrands: [],
        },
      };
    }
  };
