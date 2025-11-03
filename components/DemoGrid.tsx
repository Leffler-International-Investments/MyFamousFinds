// FILE: /components/DemoGrid.tsx

import React from "react";
import { ProductCard, ProductLike } from "./ProductCard";

export type DemoProduct = ProductLike;

export default function DemoGrid({
  title,
  subtitle,
  items,
}: {
  title: string;
  subtitle?: string;
  items: DemoProduct[];
}) {
  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-zinc-100">{title}</h2>
        {subtitle && (
          <p className="mt-1 text-sm text-zinc-400">{subtitle}</p>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {items.map((p) => (
          // NOTE: pass props directly; ProductCard expects ProductLike
          <ProductCard key={p.id || p.title} {...p} />
        ))}
      </div>
    </section>
  );
}
