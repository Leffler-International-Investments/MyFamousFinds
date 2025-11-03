// FILE: /components/DemoGrid.tsx
import ProductCard, { ProductLike } from "./ProductCard";

export type DemoProduct = ProductLike & {
  id: string;
};

export default function DemoGrid({ items }: { items: DemoProduct[] }) {
  return (
    <section className="section">
      <div className="grid">
        {items.map((p) => (
          <ProductCard key={p.id} {...p} />
        ))}
      </div>
    </section>
  );
}
