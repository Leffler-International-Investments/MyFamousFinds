import Link from "next/link";

export type ProductLike = {
  id?: string;
  slug?: string;
  title: string;
  brand?: string;
  price?: string;
  image: string;
  badge?: string;
  condition?: string;
  location?: string;
  className?: string;
};

export default function ProductCard({ p }: { p: ProductLike }) {
  const href = p.slug ? `/product/${p.slug}` : "#";
  return (
    <Link href={href} className={`p-card ${p.className ?? ""}`}>
      <div className="p-thumb">
        <img src={p.image} alt={p.title} />
        {p.badge && <span className="p-badge">{p.badge}</span>}
      </div>
      <div className="p-meta">
        {p.brand && <div className="p-brand">{p.brand}</div>}
        <div className="p-title">{p.title}</div>
        {p.price && <div className="p-price">{p.price}</div>}
      </div>
      <style jsx>{`
        .p-card { display:block; border:1px solid #1e1e1e; border-radius:12px; background:#0f0f0f; overflow:hidden; }
        .p-thumb { position:relative; width:100%; aspect-ratio:1/1; background:#111; }
        .p-thumb img { width:100%; height:100%; object-fit:cover; display:block; }
        .p-badge { position:absolute; top:8px; left:8px; font-size:11px; background:#fff; color:#000; border-radius:999px; padding:3px 7px; }
        .p-meta { padding:10px; color:#eaeaea; }
        .p-brand { font-size:12px; opacity:.75; }
        .p-title { font-size:13px; margin-top:4px; }
        .p-price { font-weight:800; font-size:14px; margin-top:6px; }
      `}</style>
    </Link>
  );
}
