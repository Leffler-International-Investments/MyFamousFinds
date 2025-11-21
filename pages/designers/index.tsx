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
    <div className="designers-page">
      <Head>
        <title>Designers – Famous Finds</title>
      </Head>

      <Header />

      <main className="wrap">
        <header className="heading">
          <Link href="/" className="back">
            ← Home
          </Link>
          <h1>DESIGNERS</h1>
        </header>

        <p className="hint">
          Browse all designers that are currently active in Famous Finds. Click
          a card to view items for that designer as listings go live.
        </p>

        <section className="grid">
          {designers.length === 0 ? (
            <div className="empty">
              <p>
                No designers are active yet. Once you add them in the Management
                Designers directory they will be listed here.
              </p>
            </div>
          ) : (
            designers.map((d) => (
              <Link
                key={d.id}
                href={`/designers/${d.slug || d.id}`}
                className="designer-card"
              >
                <h2>{d.name}</h2>
                {d.itemTypes && <p className="types">{d.itemTypes}</p>}
                {d.notes && <p className="note">{d.notes}</p>}
              </Link>
            ))
          )}
        </section>
      </main>

      <Footer />

      <style jsx>{`
        .designers-page {
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
          margin-bottom: 16px;
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 20px;
        }

        .designer-card {
          border-radius: 999px;
          border: 1px solid #e5e7eb;
          padding: 14px 20px;
          text-decoration: none;
          background: #f9fafb;
          box-shadow: 0 4px 10px rgba(15, 23, 42, 0.03);
          display: flex;
          flex-direction: column;
          justify-content: center;
          min-height: 70px;
          transition: all 0.15s ease-out;
          cursor: pointer;
        }

        .designer-card h2 {
          font-size: 15px;
          font-weight: 600;
          margin: 0 0 2px;
        }

        .types {
          font-size: 12px;
          color: #6b7280;
        }

        .note {
          font-size: 12px;
          color: #111827;
          margin-top: 4px;
        }

        .designer-card:hover {
          border-color: #111827;
          background: #111827;
          color: #ffffff;
          box-shadow: 0 6px 16px rgba(15, 23, 42, 0.12);
          transform: translateY(-1px);
        }

        .designer-card:hover .types,
        .designer-card:hover .note {
          color: #e5e7eb;
        }

        .empty {
          border-radius: 8px;
          border: 1px dashed #d1d5db;
          padding: 24px 18px;
          font-size: 14px;
          color: #4b5563;
        }

        @media (max-width: 640px) {
          h1 {
            font-size: 20px;
            letter-spacing: 0.14em;
          }

          .designer-card {
            border-radius: 16px;
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

    return {
      props: {
        designers,
      },
    };
  } catch (err) {
    console.error("Error loading designers index", err);
    return {
      props: {
        designers: [],
      },
    };
  }
};
