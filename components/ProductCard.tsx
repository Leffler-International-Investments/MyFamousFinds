// FILE: /components/ProductCard.tsx

import React from "react";

export type ProductLike = {
  id?: string;
  title: string;          // e.g., “Boyfriend Jeans”
  brand?: string;         // e.g., “DIESEL”
  price?: string;         // e.g., “A$295”
  image: string;          // absolute URL or /public path
  badge?: string;         // e.g., “New”, “Trending”
  condition?: string;     // e.g., “Very Good”
  location?: string;      // e.g., “Sydney, AU”
  href?: string;          // product details link
  className?: string;
};

function Wrapper({
  href,
  className,
  children,
}: {
  href?: string;
  className?: string;
  children: React.ReactNode;
}) {
  if (href) {
    return (
      <a href={href} className={className}>
        {children}
      </a>
    );
  }
  return <div className={className}>{children}</div>;
}

function ProductCardImpl(props: ProductLike) {
  const p = props;
  return (
    <Wrapper
      href={p.href}
      className={`block rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition ${p.className ?? ""}`}
    >
      <div className="aspect-[4/5] w-full bg-zinc-800">
        <img
          src={p.image}
          alt={p.title}
          className="h-full w-full object-cover"
          loading="lazy"
        />
        {p.badge && (
          <span className="absolute m-2 px-2 py-1 text-xs rounded bg-white/90 text-black">
            {p.badge}
          </span>
        )}
      </div>

      <div className="p-3">
        {p.brand && (
          <div className="text-xs uppercase tracking-wider text-zinc-400">
            {p.brand}
          </div>
        )}
        <div className="mt-0.5 text-sm text-zinc-100 line-clamp-2">
          {p.title}
        </div>

        <div className="mt-2 flex items-center gap-2 text-sm">
          {p.price && <span className="text-zinc-100 font-medium">{p.price}</span>}
          {p.condition && (
            <span className="text-xs text-zinc-400">{p.condition}</span>
          )}
        </div>

        {p.location && (
          <div className="mt-1 text-xs text-zinc-500">{p.location}</div>
        )}
      </div>
    </Wrapper>
  );
}

// Support BOTH import styles
export const ProductCard = ProductCardImpl;
export default ProductCardImpl;
