// FILE: /components/ProductCard.tsx
import Link from "next/link";

export type ProductLike = {
  id: string;
  title: string;
  brand?: string;
  price?: string;
  image: string;   // now always whatever we pass from index/product
  href: string;
  badge?: string;
  details?: string;
};

export default function ProductCard(p: ProductLike) {
  return (
    <Link href={p.href} className="card">
      <div className="thumb">
        {/* Plain <img> so all URLs (including data: URLs) work */}
        {p.image ? (
          <img src={p.image} alt={p.title} />
        ) : (
          <div className="no-image">No image</div>
        )}
        {p.badge && <span className="badge">{p.badge}</span>}
      </div>

      <div className="meta">
        {p.brand && <div className="brand">{p.brand}</div>}
        <div className="title">{p.title}</div>
        {p.price && <div className="price">{p.price}</div>}
      </div>

      <style jsx>{`
        .card {
          display: flex;
          flex-direction: column;
          gap: 8px;
          border: 1px solid #e5e7eb;
          border-radius: 14px;
          overflow: hidden;
          background: #ffffff;
          min-height: 260px;
        }
        .thumb {
          position: relative;
          aspect-ratio: 1 / 1;
          background: #f3f4f6;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .thumb img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .no-image {
          font-size: 12px;
          color: #6b7280;
        }
        .badge {
          position: absolute;
          left: 8px;
          top: 8px;
          background: #e11d48;
          color: white;
          font-size: 12px;
          padding: 4px 8px;
          border-radius: 10px;
        }
        .meta {
          padding: 10px 12px;
        }
        .brand {
          color: #6b7280;
          font-size: 12px;
          letter-spacing: 0.08em;
        }
        .title {
          font-size: 14px;
          line-height: 1.25;
          margin-top: 2px;
          min-height: 34px;
        }
        .price {
          margin-top: 6px;
          font-weight: 600;
        }
      `}</style>
    </Link>
  );
}

