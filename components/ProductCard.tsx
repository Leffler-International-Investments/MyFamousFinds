// FILE: /components/ProductCard.tsx
import type { DemoProduct } from "@/data/demoProducts";

export default function ProductCard({ p }: { p: DemoProduct }) {
  return (
    <div className="card">
      <div className="thumb">
        {/* Using <img> avoids Next/Image domain config for quick demo */}
        <img src={p.image} alt={p.title} />
        {p.badge && <span className="badge">{p.badge}</span>}
      </div>
      <div className="meta">
        <div className="brand">{p.brand}</div>
        <div className="title">{p.title}</div>
        <div className="row">
          <span className="price">{p.price}</span>
          {p.condition && <span className="cond">{p.condition}</span>}
        </div>
        {p.location && <div className="loc">{p.location}</div>}
      </div>
    </div>
  );
}


