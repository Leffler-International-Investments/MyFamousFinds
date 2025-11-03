// FILE: /components/ProductCard.tsx
import Link from "next/link";
import { useState } from "react";

export type ProductLike = {
  id: string;
  title: string;
  brand?: string;
  price: string;   // USD text like "$2,450"
  image: string;
  href: string;    // link to /product/[id]
  badge?: string;
  details?: string;
};

export default function ProductCard(p: ProductLike) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div
      className={`card ${flipped ? "flipped" : ""}`}
      onClick={() => setFlipped((v) => !v)}
      onMouseEnter={() => setFlipped(true)}
      onMouseLeave={() => setFlipped(false)}
      role="button"
      aria-label={`${p.title} ${p.price}`}
    >
      {/* FRONT */}
      <div className="face front">
        {p.badge && <span className="badge">{p.badge}</span>}
        <img src={p.image} alt={p.title} />
        <div className="meta">
          <small className="brand">{p.brand}</small>
          <div className="title">{p.title}</div>
          <div className="price">{p.price}</div>
        </div>
      </div>

      {/* BACK */}
      <div className="face back">
        <div className="backWrap">
          <div className="title">{p.title}</div>
          <p className="det">{p.details || "Tap to view details"}</p>
          <div className="price">{p.price}</div>
          <Link href={p.href} className="btn">View details</Link>
        </div>
      </div>

      <style jsx>{`
        .card{
          width:100%;
          aspect-ratio: 3/4;
          perspective:1000px;
          position:relative;
        }
        .face{
          position:absolute; inset:0;
          border:1px solid #1a1a1a; border-radius:12px; overflow:hidden;
          backface-visibility:hidden; transition:transform .5s ease;
          background:#0f0f0f;
        }
        .front{ transform:rotateY(0deg); }
        .back{ transform:rotateY(180deg); display:flex; align-items:center; justify-content:center; }
        .flipped .front{ transform:rotateY(180deg); }
        .flipped .back{ transform:rotateY(360deg); }
        img{ width:100%; height:70%; object-fit:cover; display:block; }
        .badge{ position:absolute; top:8px; left:8px; background:#fff; color:#000; font-size:11px; font-weight:700; padding:2px 6px; border-radius:6px; }
        .meta{ padding:10px; color:#ddd; }
        .brand{ opacity:.7; }
        .title{ font-size:14px; margin-top:2px; }
        .price{ margin-top:6px; font-weight:700; color:#fff; }
        .backWrap{ padding:16px; text-align:center; }
        .btn{ display:inline-block; margin-top:12px; background:#fff; color:#000; padding:8px 12px; border-radius:8px; font-weight:700; }
      `}</style>
    </div>
  );
}
