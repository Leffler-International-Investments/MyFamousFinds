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

function ProductCardImpl(props: ProductLike) {
  const p = props;
  const Wrapper: any = p.href ? "a" : "div";

  return (
    <Wrapper className={`card ${p.className ?? ""}`} href={p.href ?? undefined}>
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
    </Wrapper>
  );
}

// Support BOTH import styles
export const ProductCard = ProductCardImpl;
export default ProductCardImpl;
