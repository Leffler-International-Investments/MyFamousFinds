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
  itemTypes?: string;
  notes?: string;
};

type DesignersPageProps = {
  designers: Designer[];
};

export default function DesignersIndexPage({ designers }: DesignersPageProps) {
  return (
    <div className="page">
      <Head>
        <title>Designers – Famous Finds</title>
      </Head>

      <Header />

      <main className="wrap">
        <div className="heading">
          <Link href="/" className="back">
            ← Home
          </Link>
          <h1>DESIGNERS</h1>
        </div>

        <p className="hint">
          Browse all designers that are currently active in Famous Finds. Click a
          button to view items for that designer as listings go live.
        </p>

        {designers.length === 0 ? (
          <p className="empty">
            No designers are active yet. Seed them from the management tools.
          </p>
        ) : (
          <section className="grid">
            {designers.map((d) => (
              <Link
                key={d.id}
                href={`/designers/${d.slug || d.id}`}
                className="designer-pill"
              >
                <span className="designer-name">{d.name}</span>
              </Link>
            ))}
          </section>
        )}
      </main>

      <Footer />

      <style jsx>{`
        .page {
          background: #ffffff;
          color: #111827;
        }

        .wrap {
          max-width: 1200px;
          margin: 0 auto;
          padding: 16px 16px 80px;
        }

        .heading {
          display: flex;
          align-items: baseline;
          gap: 12px;
          margin-bottom: 8px;
        }

        .back {
          font-size: 13px;
          color: #6b7280;
          text-decoration: none;
        }

        .back:hover {
          color: #111827;
        }

        h1 {
          font-size: 22px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
        }

        .hint {
          font-size: 13px;
          color: #4b5563;
          margin-bottom: 18px;
        }

        .empty {
          font-size: 14px;
          color: #6b7280;
          margin-top: 12px;
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
          gap: 18px;
        }

        .designer-pill {
          border-radius: 999px;
          padding: 14px 22px;
          border: 1px solid #111827;
          background: #f9fafb;
          text-decoration: none;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(15, 23, 42, 0.06);
          transition: all 0.15s ease-out;
          cursor: pointer;
        }

        .designer-name {
          font-size: 15px;
          font-weight: 600;
          letter-spacing: 0.04em;
        }

        .designer-pill:hover {
          background: #111827;
          color: #ffffff;
          transform: translateY(-1px);
          box-shadow: 0 8px 20px rgba(15, 23, 42, 0.22);
        }

        @media (max-width: 640px) {
          h1 {
            font-size: 20px;
            letter-spacing: 0.14em;
          }

          .grid {
            gap: 14px;
          }
        }
      `}</style>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps<
  DesignersPageProps
> = async () => {
  try {
    const snap = await adminDb.collection("designers").get();

    const designers: Designer[] = snap.docs
      .map((doc) => {
        const data = doc.data() as any;
        return {
          id: doc.id,
          name: data.name || doc.id,
          slug: data.slug || doc.id,
          itemTypes: data.itemTypes || data.item_types || "",
          notes: data.notes || "",
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));

    return { props: { designers } };
  } catch (err) {
    console.error("Error loading designers index", err);
    return { props: { designers: [] } };
  }
};
