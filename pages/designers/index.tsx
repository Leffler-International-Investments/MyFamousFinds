// FILE: /pages/designers/index.tsx

import Head from "next/head";
import Link from "next/link";
import React from "react";
import type { GetServerSideProps, NextPage } from "next";

import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { adminDb } from "../../utils/firebaseAdmin";
import { CATEGORIZED_DESIGNERS } from "../../lib/filterConstants";

// --------------------------------------------------
// Types
// --------------------------------------------------

type DesignerEntry = {
  name: string;
  slug: string;
  designerCategory?: "high-end" | "contemporary" | "jewelry-watches" | "kids" | "top" | "trending" | "emerging" | "";
};

type DesignersPageProps = {
  designerOptions: DesignerEntry[];
  highEndDesigners: DesignerEntry[];
  contemporaryDesigners: DesignerEntry[];
  jewelryWatchesDesigners: DesignerEntry[];
  kidsDesigners: DesignerEntry[];
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
          gap: 4px 16px;
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
  highEndDesigners,
  contemporaryDesigners,
  jewelryWatchesDesigners,
  kidsDesigners,
}) => {
  return (
    <div className="designers-page">
      <Head>
        <title>Designer Directory | Famous Finds</title>
        <meta name="description" content="Browse our curated designer directory — from high-end luxury to contemporary and kids brands. Shop authenticated pre-owned designer fashion at Famous Finds." />
      </Head>

      <Header />

      <main className="page-main">
        <div className="page-inner">
          <div className="breadcrumb">
            <Link href="/">Home</Link>
            <span>/</span>
            <span>Designers</span>
          </div>

          <h1>Designer Directory</h1>
          <p className="directory-subtitle">
            Explore the brands we accept — from high-end luxury houses to contemporary favorites and kids&apos; labels.
          </p>

          <section className="designers-directory">
            <DesignerSection
              title="High-End Luxury"
              designers={highEndDesigners}
            />
            <DesignerSection
              title="Jewelry & Watches"
              designers={jewelryWatchesDesigners}
            />
            <DesignerSection
              title="Contemporary"
              designers={contemporaryDesigners}
            />
            <DesignerSection
              title="Kids"
              designers={kidsDesigners}
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
          background: #ede8e0;
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
          margin: 0 0 8px;
        }
        .directory-subtitle {
          font-size: 14px;
          color: #6b7280;
          margin: 0 0 24px;
          line-height: 1.5;
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
          gap: 4px 16px;
        }
        .designers-directory :global(.designer-chip) {
          border: none;
          background: transparent;
          color: #111827;
          padding: 4px 0;
          border-radius: 0;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: color 0.15s ease;
          white-space: nowrap;
          text-decoration: none;
          display: inline-block;
        }
        .designers-directory :global(.designer-chip:hover) {
          background: transparent;
          color: #6b7280;
          border-color: transparent;
        }
        .designers-directory :global(.designer-chip-small) {
          border: none;
          background: transparent;
          color: #374151;
          padding: 4px 0;
          border-radius: 0;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: color 0.15s ease;
          white-space: nowrap;
          text-decoration: none;
          display: inline-block;
        }
        .designers-directory :global(.designer-chip-small:hover) {
          background: transparent;
          color: #6b7280;
          border-color: transparent;
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
    const emptyProps = {
      designerOptions: [] as DesignerEntry[],
      highEndDesigners: [] as DesignerEntry[],
      contemporaryDesigners: [] as DesignerEntry[],
      jewelryWatchesDesigners: [] as DesignerEntry[],
      kidsDesigners: [] as DesignerEntry[],
    };

    // Build fallback entries from the static categorized list
    const staticEntries: DesignerEntry[] = CATEGORIZED_DESIGNERS.map((d) => ({
      name: d.name,
      slug: slugify(d.name),
      designerCategory: d.designerCategory as DesignerEntry["designerCategory"],
    }));

    let firestoreDesigners: DesignerEntry[] = [];

    if (adminDb) {
      try {
        const ds = await adminDb.collection("designers").get();
        firestoreDesigners = ds.docs
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
      } catch (err) {
        console.error("Error loading designers from Firestore", err);
      }
    }

    // Merge: Firestore entries win (they may have updated categories),
    // then fill in any missing designers from the static list.
    const bySlug = new Map<string, DesignerEntry>();
    for (const d of staticEntries) {
      bySlug.set(d.slug, d);
    }
    for (const d of firestoreDesigners) {
      const existing = bySlug.get(d.slug);
      // Firestore entry wins; but prefer static category if Firestore has none
      bySlug.set(d.slug, {
        ...d,
        designerCategory: d.designerCategory || existing?.designerCategory || "",
      });
    }
    const allDesigners = Array.from(bySlug.values());

    const sortAlpha = (a: DesignerEntry, b: DesignerEntry) =>
      a.name.localeCompare(b.name);

    const designerOptions = [...allDesigners].sort(sortAlpha);

    // Map legacy categories to new ones for backwards compatibility
    const catMap: Record<string, string> = {
      top: "high-end",
      trending: "contemporary",
      emerging: "contemporary",
    };
    const getCat = (d: DesignerEntry) => catMap[d.designerCategory || ""] || d.designerCategory || "";

    const highEndDesigners = allDesigners
      .filter((d) => getCat(d) === "high-end")
      .sort(sortAlpha);
    const contemporaryDesigners = allDesigners
      .filter((d) => getCat(d) === "contemporary")
      .sort(sortAlpha);
    const jewelryWatchesDesigners = allDesigners
      .filter((d) => getCat(d) === "jewelry-watches")
      .sort(sortAlpha);
    const kidsDesigners = allDesigners
      .filter((d) => getCat(d) === "kids")
      .sort(sortAlpha);

    return {
      props: {
        designerOptions,
        highEndDesigners,
        contemporaryDesigners,
        jewelryWatchesDesigners,
        kidsDesigners,
      },
    };
  };
