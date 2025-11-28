// FILE: /components/DemoGrid.tsx

import type { FC } from "react";
import type { ProductLike } from "./ProductCard";

// Extend ProductLike so TS is happy with these optional fields
type DemoItem = ProductLike & {
  designer?: string;
  currency?: string;
  price?: number | string | null;
};

type Props = {
  trending: DemoItem[];
  newArrivals: DemoItem[];
};

const DemoGrid: FC<Props> = ({ trending, newArrivals }) => {
  const renderPrice = (item: DemoItem) => {
    const currency = item.currency || "USD";
    const raw = item.price ?? "";
    return `${currency} ${raw}`;
  };

  const renderItem = (item: DemoItem) => (
    <article key={item.id} className="demo-grid-item">
      <div className="demo-grid-title">{item.title}</div>
      <div className="demo-grid-meta">
        <span className="demo-grid-designer">
          {item.designer || "Designer"}
        </span>
        <span className="demo-grid-price">{renderPrice(item)}</span>
      </div>
    </article>
  );

  return (
    <div className="demo-grid">
      <div className="demo-grid-column">
        <h3>Trending now</h3>
        <div className="demo-grid-list">
          {trending.map((item) => renderItem(item))}
        </div>
      </div>

      <div className="demo-grid-column">
        <h3>New arrivals</h3>
        <div className="demo-grid-list">
          {newArrivals.map((item) => renderItem(item))}
        </div>
      </div>
    </div>
  );
};

export default DemoGrid;
