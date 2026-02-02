// FILE: /components/ProductGrid.tsx
import ProductCard, { ProductLike } from "./ProductCard";

export default function ProductGrid({
  items,
  emptyTitle = "No Results",
}: {
  items: ProductLike[];
  emptyTitle?: string;
}) {
  if (!items || items.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
        <div className="text-lg font-semibold text-gray-900">{emptyTitle}</div>
        <div className="mt-1 text-sm text-gray-500">
          Try adjusting filters or check another category.
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((p) => (
        <ProductCard key={p.id} {...p} />
      ))}
    </div>
  );
}
