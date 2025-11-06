// FILE: /components/DemoGrid.tsx

import ProductCard, { ProductLike } from "./ProductCard";

type Props = {
  title: string;
  items: ProductLike[];
};

export default function DemoGrid({ title, items }: Props) {
  return (
    <section>
      <div className="sec">
        <h3>{title}</h3>
      </div>
      <div className="grid">
        {items.map((p) => (
          <ProductCard key={p.id || p.title} {...p} />
        ))}
      </div>
      <style jsx>{`
        .sec {
          margin: 18px 0 8px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .sec h3 {
          color: #eaeaea;
          font-size: 16px;
          font-weight: 800;
        }
        .grid {
          display: grid;
          gap: 10px;
          grid-template-columns: repeat(2, minmax(0, 1fr));
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
