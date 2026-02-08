// FILE: /components/ListingFilters.tsx

import { useEffect, useMemo, useState } from "react";

type SortValue = "newest" | "price-asc" | "price-desc";

type Props = {
  // values
  titleQuery: string;
  category: string;
  designer: string;
  material: string;
  condition: string;
  size: string;
  color: string;
  minPrice: number | "";
  maxPrice: number | "";
  sortBy: SortValue;

  // setters
  setTitleQuery: (v: string) => void;
  setCategory: (v: string) => void;
  setDesigner: (v: string) => void;
  setMaterial: (v: string) => void;
  setCondition: (v: string) => void;
  setSize: (v: string) => void;
  setColor: (v: string) => void;
  setMinPrice: (v: number | "") => void;
  setMaxPrice: (v: number | "") => void;
  setSortBy: (v: SortValue) => void;

  // options
  categoryOptions: string[];
  designerOptions: string[];
  conditionOptions: string[];
  materialOptions?: string[];

  // actions
  onReset: () => void;
  onApply?: () => void; // designers page uses URL; others can omit
  showApplyButton?: boolean; // default false
};

export default function ListingFilters(props: Props) {
  const {
    titleQuery,
    category,
    designer,
    material,
    condition,
    size,
    color,
    minPrice,
    maxPrice,
    sortBy,
    setTitleQuery,
    setCategory,
    setDesigner,
    setMaterial,
    setCondition,
    setSize,
    setColor,
    setMinPrice,
    setMaxPrice,
    setSortBy,
    categoryOptions,
    designerOptions,
    conditionOptions,
    materialOptions = [],
    onReset,
    onApply,
    showApplyButton = false,
  } = props;

  const hasMaterials = useMemo(() => materialOptions.length > 0, [materialOptions]);

  // Mobile <datalist> is unreliable (often shows nothing). We render a mobile <select> instead.
  const [mobileCustomMaterial, setMobileCustomMaterial] = useState(false);

  const isMaterialInOptions = useMemo(() => {
    if (!material) return true;
    return materialOptions.some((m) => m === material);
  }, [material, materialOptions]);

  useEffect(() => {
    // If material is already set but not in options, show the custom input on mobile.
    if (material && !isMaterialInOptions) setMobileCustomMaterial(true);
  }, [material, isMaterialInOptions]);

  return (
    <>
      <aside className="filters">
        <div className="filter-header">
          <h2>Filters</h2>
          <button type="button" className="link-btn" onClick={onReset}>
            {showApplyButton ? "Clear All" : "Reset"}
          </button>
        </div>

        <div className="filter-body-stack">
          <div className="sort-row">
            <label className="sort-label">
              Sort
              <select
                className="select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortValue)}
              >
                <option value="newest">Newest</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
              </select>
            </label>
          </div>

          <details className="filter-block" open>
            <summary>Title</summary>
            <div className="filter-body">
              <input
                className="text-input"
                placeholder="Search title..."
                value={titleQuery}
                onChange={(e) => setTitleQuery(e.target.value)}
              />
            </div>
          </details>

          <details className="filter-block" open>
            <summary>Category</summary>
            <div className="filter-body">
              <select
                className="select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">Any</option>
                {categoryOptions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </details>

          <details className="filter-block" open>
            <summary>Designer</summary>
            <div className="filter-body">
              <select
                className="select"
                value={designer}
                onChange={(e) => setDesigner(e.target.value)}
              >
                <option value="">Any</option>
                {designerOptions.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </details>

          <details className="filter-block" open>
            <summary>Material</summary>
            <div className="filter-body">
              {/* Desktop/tablet: keep type-ahead input (works well on PC) */}
              <div className="material-desktop">
                <input
                  className="text-input"
                  list={hasMaterials ? "materials-list" : undefined}
                  placeholder="Select or type material..."
                  value={material}
                  onChange={(e) => setMaterial(e.target.value)}
                />
                {hasMaterials ? (
                  <datalist id="materials-list">
                    {materialOptions.map((m) => (
                      <option key={m} value={m} />
                    ))}
                  </datalist>
                ) : null}
              </div>

              {/* Mobile: datalist commonly fails to show options, so use a real select */}
              <div className="material-mobile">
                <select
                  className="select"
                  value={mobileCustomMaterial ? "__custom" : material}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === "__custom") {
                      setMobileCustomMaterial(true);
                      setMaterial("");
                    } else {
                      setMobileCustomMaterial(false);
                      setMaterial(v);
                    }
                  }}
                >
                  <option value="">Any</option>
                  {materialOptions.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                  <option value="__custom">Other (type)</option>
                </select>

                {mobileCustomMaterial ? (
                  <input
                    className="text-input mobile-custom"
                    placeholder="Type material..."
                    value={material}
                    onChange={(e) => setMaterial(e.target.value)}
                  />
                ) : null}
              </div>
            </div>
          </details>

          <details className="filter-block" open>
            <summary>Condition</summary>
            <div className="filter-body">
              <select
                className="select"
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
              >
                <option value="">Any</option>
                {conditionOptions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </details>

          <details className="filter-block" open>
            <summary>Size</summary>
            <div className="filter-body">
              <input
                className="text-input"
                placeholder="Type size..."
                value={size}
                onChange={(e) => setSize(e.target.value)}
              />
            </div>
          </details>

          <details className="filter-block" open>
            <summary>Color</summary>
            <div className="filter-body">
              <input
                className="text-input"
                placeholder="Type color..."
                value={color}
                onChange={(e) => setColor(e.target.value)}
              />
            </div>
          </details>

          <details className="filter-block" open>
            <summary>Price</summary>
            <div className="filter-body">
              <div className="price-row">
                <div className="price-input">
                  <span>Min</span>
                  <input
                    type="number"
                    value={minPrice}
                    onChange={(e) =>
                      setMinPrice(e.target.value === "" ? "" : Number(e.target.value) || 0)
                    }
                  />
                </div>

                <div className="price-input">
                  <span>Max</span>
                  <input
                    type="number"
                    value={maxPrice}
                    onChange={(e) =>
                      setMaxPrice(e.target.value === "" ? "" : Number(e.target.value) || 0)
                    }
                  />
                </div>
              </div>

              {showApplyButton && onApply ? (
                <button type="button" className="apply-btn" onClick={onApply}>
                  Apply Filters
                </button>
              ) : null}
            </div>
          </details>
        </div>
      </aside>

      <style jsx>{`
        .filters {
          position: sticky;
          top: 16px;
          height: fit-content;
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          padding: 16px;
          background: #fff;
        }

        .filter-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: 10px;
          border-bottom: 1px solid #eef2f7;
          margin-bottom: 10px;
        }

        .filter-header h2 {
          font-size: 16px;
          margin: 0;
        }

        .link-btn {
          border: 0;
          background: transparent;
          color: #111827;
          font-size: 12px;
          text-decoration: underline;
          cursor: pointer;
        }

        .filter-body-stack {
          display: grid;
          gap: 10px;
        }

        .sort-row {
          display: grid;
          gap: 6px;
        }

        .sort-label {
          display: grid;
          gap: 6px;
          font-size: 12px;
          color: #111827;
        }

        .filter-block {
          border: 1px solid #eef2f7;
          border-radius: 12px;
          padding: 10px 12px;
        }

        summary {
          cursor: pointer;
          font-weight: 600;
          font-size: 13px;
          color: #111827;
          list-style: none;
        }

        summary::-webkit-details-marker {
          display: none;
        }

        .filter-body {
          margin-top: 10px;
        }

        .text-input,
        .select {
          width: 100%;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 10px 12px;
          font-size: 14px;
          outline: none;
        }

        .price-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        .price-input span {
          display: block;
          font-size: 12px;
          color: #6b7280;
          margin-bottom: 6px;
        }

        .price-input input {
          width: 100%;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 10px 12px;
          font-size: 14px;
          outline: none;
        }

        .apply-btn {
          margin-top: 10px;
          width: 100%;
          border: 1px solid #111827;
          background: #111827;
          color: #fff;
          border-radius: 999px;
          padding: 10px 12px;
          font-weight: 600;
          cursor: pointer;
        }

        /* Mobile material fix: use a real <select> instead of <datalist> */
        .material-mobile {
          display: none;
          gap: 10px;
        }

        .mobile-custom {
          margin-top: 10px;
        }

        @media (max-width: 768px) {
          .material-desktop {
            display: none;
          }
          .material-mobile {
            display: grid;
          }
        }
      `}</style>
    </>
  );
}
