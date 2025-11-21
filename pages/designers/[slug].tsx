// FILE: /pages/designers/[slug].tsx

import { useRouter } from "next/router";
import Link from "next/link";

export default function DesignerDetailPage() {
  const router = useRouter();
  const { slug } = router.query;

  const title =
    typeof slug === "string"
      ? slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
      : "Designer";

  return (
    <main className="ff-page">
      <section className="ff-designer-detail">
        <Link href="/designers" className="ff-back-link">
          ← All Designers
        </Link>

        <h1 className="ff-designer-title">{title}</h1>
        <p className="ff-designer-sub">
          Products from {title} will appear here. Connect this page to your
          product listing for the selected designer.
        </p>
      </section>

      <style jsx>{`
        .ff-page {
          max-width: 1280px;
          margin: 24px auto 60px;
          padding: 0 18px;
        }

        .ff-back-link {
          display: inline-block;
          margin-bottom: 12px;
          font-size: 13px;
          text-decoration: none;
          color: #4b5563;
        }

        .ff-back-link:hover {
          color: #111827;
        }

        .ff-designer-title {
          font-size: 24px;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          margin-bottom: 10px;
        }

        .ff-designer-sub {
          font-size: 14px;
          color: #6b7280;
        }
      `}</style>
    </main>
  );
}
