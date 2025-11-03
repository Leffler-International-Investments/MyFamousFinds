// FILE: /components/CategoryTile.tsx
import Link from "next/link";

export type Category = {
  slug: string;
  label: string;
  image?: string; // optional small icon
};

export function CategoryTile({ c }: { c: Category }) {
  return (
    <Link href={`/?cat=${encodeURIComponent(c.slug)}`} className="cat-tile" aria-label={c.label}>
      {c.image ? <img src={c.image} alt="" /> : null}
      <span>{c.label}</span>
      <style jsx>{`
        .cat-tile {
          display:flex; align-items:center; justify-content:center;
          height:64px; border:1px solid #1e1e1e; border-radius:10px;
          background:#121212; color:#f1f1f1; text-decoration:none;
          font-size:14px; font-weight:600;
        }
        .cat-tile:hover { border-color:#2a2a2a; background:#151515; }
        img { width:20px; height:20px; margin-right:8px; object-fit:contain; }
      `}</style>
    </Link>
  );
}
