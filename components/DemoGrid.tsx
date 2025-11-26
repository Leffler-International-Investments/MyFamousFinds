// FILE: /components/DemoGrid.tsx

import ProductCard, { ProductLike } from "./ProductCard";

type Props = {
  items: ProductLike[];
  title?: string;
  emptyLabel?: string;
};

export default function DemoGrid({ items, title, emptyLabel }: Props) {
  const hasItems = items && items.length > 0;

  return (
    <section>
      {title && (
        <div className="sec">
          <h3>{title}</h3>
        </div>
      )}

      {hasItems ? (
        <div className="grid">
          {items.map((item) => (
            <ProductCard key={item.id} {...item} />
          ))}
        </div>
      ) : (
        <p className="empty">
          {emptyLabel || "More pieces will appear here soon."}
        </p>
      )}

      <style jsx>{`
        .sec {
          margin: 18px 0 8px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .sec h3 {
          color: #111827;
          font-size: 16px;
          font-weight: 700;
        }

        .grid {
          display: grid;
          gap: 10px;
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .empty {
          margin-top: 8px;
          font-size: 13px;
          color: #6b7280;
        }

        @media (min-width: 640px) {
          .grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }

        @media (min-width: 1024px) {
          .grid {
            grid-template-columns: repeat(5, minmax(0, 1fr));
          }
        }
      `}</style>
    </section>
  );
}
