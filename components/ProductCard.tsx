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

type MaybeWrapped = ProductLike | { p: ProductLike };

function unwrap(props: MaybeWrapped): ProductLike {
  return (props as any)?.p ? (props as any).p : (props as any);
}

function ProductCard(props: MaybeWrapped) {
  const p = unwrap(props);
  const Wrapper: any = p.href ? "a" : "div";

  return (
    <Wrapper className={`p-card ${p.className ?? ""}`} href={p.href}>
      <div className="p-thumb">
        <img src={p.image} alt={p.title} loading="lazy" />
        {p.badge && <span className="p-badge">{p.badge}</span>}
      </div>
      <div className="p-meta">
        {p.brand && <div className="p-brand">{p.brand}</div>}
        <div className="p-title" title={p.title}>{p.title}</div>
        <div className="p-row">
          {p.price && <span className="p-price">{p.price}</span>}
          {p.condition && <span className="p-cond">{p.condition}</span>}
        </div>
        {p.location && <div className="p-loc">{p.location}</div>}
      </div>
      <style jsx>{`
        .p-card {
          display:block; border:1px solid #1f1f1f; border-radius:12px;
          background:#0f0f0f; overflow:hidden;
          transition:transform .12s ease, border-color .12s ease;
        }
        .p-card:hover { transform: translateY(-1px); border-color:#2a2a2a; }
        .p-thumb { position:relative; width:100%; aspect-ratio:1/1; background:#111; }
        .p-thumb img { width:100%; height:100%; object-fit:cover; display:block; }
        .p-badge {
          position:absolute; left:8px; top:8px; font-size:11px; font-weight:700;
          background:#ffffff; color:#000; border-radius:999px; padding:4px 8px;
        }
        .p-meta { padding:8px 10px 10px; color:#eaeaea; }
        .p-brand { font-size:12px; opacity:.75; }
        .p-title { font-size:13px; line-height:1.2; margin-top:2px; min-height:32px; }
        .p-row { display:flex; gap:8px; align-items:center; margin-top:6px; }
        .p-price { font-weight:800; font-size:14px; }
        .p-cond { font-size:11px; opacity:.7; border:1px solid #242424; padding:2px 6px; border-radius:6px; }
        .p-loc { margin-top:6px; font-size:11px; opacity:.7; }
      `}</style>
    </Wrapper>
  );
}

export { ProductCard };
export default ProductCard;
