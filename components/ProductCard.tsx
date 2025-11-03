// FILE: /components/ProductCard.tsx
import Image from "next/image";
import Link from "next/link";

export type ProductLike = {
  id: string;
  title: string;
  brand?: string;
  price?: string;
  image: string;   // e.g. "/demo/gucci-bag-1.jpg"
  href: string;    // e.g. "/product/g1"
  badge?: string;
  details?: string;
};

export default function ProductCard(p: ProductLike) {
  return (
    <Link href={p.href} className="card">
      <div className="thumb">
        {/* Ensures image shows and fills the card neatly */}
        <Image src={p.image} alt={p.title} fill sizes="(max-width: 640px) 50vw, 20vw" />
        {p.badge && <span className="badge">{p.badge}</span>}
      </div>

      <div className="meta">
        {p.brand && <div className="brand">{p.brand}</div>}
        <div className="title">{p.title}</div>
        {p.price && <div className="price">{p.price}</div>}
      </div>

      <style jsx>{`
        .card{
          display:flex; flex-direction:column; gap:8px; border:1px solid #1a1a1a;
          border-radius:14px; overflow:hidden; background:#0f0f0f; min-height:260px;
        }
        .thumb{ position:relative; aspect-ratio: 1 / 1; background:#111; }
        .badge{
          position:absolute; left:8px; top:8px; background:#e11d48; color:white;
          font-size:12px; padding:4px 8px; border-radius:10px;
        }
        .meta{ padding:10px 12px; }
        .brand{ color:#9ca3af; font-size:12px; letter-spacing:.08em; }
        .title{ font-size:14px; line-height:1.25; margin-top:2px; min-height:34px; }
        .price{ margin-top:6px; font-weight:600; }
      `}</style>
    </Link>
  );
}
