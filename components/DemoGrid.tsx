// FILE: /components/DemoGrid.tsx

import type { FC } from "react";
import type { ProductLike } from "./ProductCard";

type Props = {
  trending: ProductLike[];
  newArrivals: ProductLike[];
};

const DemoGrid: FC<Props> = ({ trending, newArrivals }) => {
  return (
    <div className="demo-grid">
      <div className="demo-grid-column">
        <h3>Trending now</h3>
        <div className="demo-grid-list">
          {trending.map((item) => (
            <article key={item.id} className="demo-grid-item">
              <div className="demo-grid-title">{item.title}</div>
              <div className="demo-grid-meta">
                <span className="demo-grid-designer">{item.designer}</span>
                <span className="demo-grid-price">
                  {item.currency || "USD"}{" "}
                  {typeof item.price === "number"
                    ? item.price.toLocaleString()
                    : item.price}
                </span>
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="demo-grid-column">
        <h3>New arrivals</h3>
        <div className="demo-grid-list">
          {newArrivals.map((item) => (
            <article key={item.id} className="demo-grid-item">
              <div className="demo-grid-title">{item.title}</div>
              <div className="demo-grid-meta">
                <span className="demo-grid-designer">{item.designer}</span>
                <span className="demo-grid-price">
                  {item.currency || "USD"}{" "}
                  {typeof item.price === "number"
                    ? item.price.toLocaleString()
                    : item.price}
                </span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DemoGrid;
