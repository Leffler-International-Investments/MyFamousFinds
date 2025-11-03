// FILE: /components/ProductCard.tsx
export type ProductLike = {
  id?: string;
  title: string;
  brand?: string;
  price?: string;
  image: string;
  badge?: string;
  condition?: string;
  location?: string;
  href?: string;
  className?: string;
};

function ProductCardImpl({ p }: { p: ProductLike }) {
  const Wrapper: any = p.href ? "a" : "div";
  return (
    <div className={`card ${p.className ?? ""}`}>
      <div className="thumb">
        <img src={p.image} alt={p.title} />
        {p.badge && <span className="badge">{p.badge}</span>}
      </div>
      <div className="meta">
        {p.brand && <div className="brand">{p.brand}</div>}
        <div className="title">{p.title}</div>
        <div className="row">
          {p.price && <span className="price">{p.price}</span>}
          {p.condition && <span className="cond">{p.condition}</span>}
        </div>
        {p.location && <div className="loc">{p.location}</div>}
      </div>
    </div>
  );
}

// Named export (so `import { ProductCard } from "../components/ProductCard"` works)
export const ProductCard = ProductCardImpl;

// Default export (so `import ProductCard from "../components/ProductCard"` also works)
export default ProductCardImpl;
