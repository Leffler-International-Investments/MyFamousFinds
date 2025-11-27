// FILE: /components/DemoGrid.tsx

import { FC } from "react";
import ProductCard, { ProductLike } from "./ProductCard";

type Props = {
  title: string;
  products: ProductLike[];
  subtitle?: string;
};

const DemoGrid: FC<Props> = ({ title, subtitle, products }) => {
  return (
    <section className="demo-grid">
      <header className="demo-grid__header">
        <h2>{title}</h2>
        {subtitle && <p className="demo-grid__subtitle">{subtitle}</p>}
      </header>

      <div className="demo-grid__grid">
        {products.map((product) => (
          <ProductCard key={product.id} {...product} />
        ))}
      </div>

      <style jsx>{`
        .demo-grid {
          margin-top: 32px;
        }

        .demo-grid__header {
          display: flex;
          flex-direction: column;
          gap: 4px;
          margin-bottom: 16px;
        }

        .demo-grid__header h2 {
          font-size: 22px;
          font-weight: 600;
        }

        .demo-grid__subtitle {
          font-size: 14px;
          color: #6b7280;
        }

        .demo-grid__grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 16px;
        }
      `}</style>
    </section>
  );
};

export default DemoGrid;
