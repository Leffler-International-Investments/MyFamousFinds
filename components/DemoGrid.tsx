// FILE: /components/DemoGrid.tsx
import ProductCard from "@/components/ProductCard";
import type { DemoProduct } from "@/data/demoProducts";

export default function DemoGrid({
  title,
  items,
}: {
  title: string;
  items: DemoProduct[];
}) {
  return (
    <section className="section">
      <div className="section-header">
        <h2>{title}</h2>
      </div>
      <div className="grid">
        {items.map((p) => (
          <ProductCard key={p.id} p={p} />
        ))}
      </div>
    </section>
  );
}
