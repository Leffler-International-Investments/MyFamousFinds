// FILE: /components/ListingFilters.tsx

import { useEffect, useMemo, useRef, useState } from "react";

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
  onApply?: () => void;
  showApplyButton?: boolean;
};

function useOnClickOutside(ref: React.RefObject<HTMLElement>, handler: () => void) {
  useEffect(() => {
    function onDown(e: MouseEvent | TouchEvent) {
      const el = ref.current;
      if (!el) return;
      if (el.contains(e.target as Node)) return;
      handler();
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown, { passive: true });
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown as any);
    };
  }, [ref, handler]);
}

function MaterialDropdown({
  value,
  options,
  onChange,
}: {
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);

  useOnClickOutside(wrapRef, () => setOpen(false));

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((m) => m.toLowerCase().includes(q));
  }, [options, query]);

  return (
    <div className="matWrap" ref={wrapRef}>
      <button
        type="button"
        className="matButton"
        onClick={() => setOpen((s) => !s)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={value ? "matValue" : "matPlaceholder"}>
          {value ? value : "Select or type material..."}
        </span>
        <span className="matChevron">▾</span>
      </button>

      {open ? (
        <div className="matPanel" role="listbox">
          <div className="matSearchRow">
            <input
              className="matSearch"
              value={query}
              placeholder="Type to search..."
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
          </div>

          <button
            type="button"
            className="matOption"
            onClick={() => {
              onChange("");
              setOpen(false);
            }}
          >
            Any
          </button>

          {filtered.length === 0 ? (
            <div className="matEmpty">No matches</div>
          ) : (
            filtered.map((m) => (
              <button
                type="button"
                key={m}
                className={"matOption" + (m === value ? " active" : "")}
                onClick={() => {
                  onChange(m);
                  setOpen(false);
                }}
              >
                {m}
              </button>
            ))
          )}

          <div className="matCustomRow">
            <div className="matHint">Or type a custom material:</div>
            <input
              className="matCustom"
              value={value}
              placeholder="e.g. Leather"
              onChange={(e) => onChange(e.target.value)}
            />
          </div>
        </div>
      ) : null}

      <style jsx>{`
        .matWrap {
          position: relative;
        }
        .matButton {
          width: 100%;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 10px 12px;
          font-size: 14px;
          outline: none;
          background: #fff;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          cursor: pointer;
        }
        .matPlaceholder {
          color: #6b7280;
        }
        .matValue {
          color: #111827;
        }
        .matChevron {
          color: #111827;
          font-size: 14px;
          line-height: 1;
        }
        .matPanel {
          position: absolute;
          left: 0;
          right: 0;
          top: calc(100% + 8px);
          z-index: 99999;
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.12);
          overflow: hidden;
        }
        .matSearchRow {
          padding: 10px;
          border-bottom: 1px solid #eef2f7;
        }
        .matSearch {
          width: 100%;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          padding: 10px 12px;
          font-size: 14px;
          outline: none;
        }
        .matOption {
          width: 100%;
          text-align: left;
          padding: 10px 12px;
          border: 0;
          background: #fff;
          font-size: 14px;
          cursor: pointer;
        }
        .matOption:hover {
          background: #f3f4f6;
        }
        .matOption.active {
          background: #111827;
          color: #fff;
        }
        .matEmpty {
          padding: 10px 12px;
          color: #6b7280;
          font-size: 13px;
        }
        .matCustomRow {
          border-top: 1px solid #eef2f7;
          padding: 10px;
          background: #fafafa;
        }
        .matHint {
          font-size: 12px;
          color: #6b7280;
          margin-bottom: 8px;
        }
        .matCustom {
          width: 100%;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          padding: 10px 12px;
          font-size: 14px;
          outline: none;
          background: #fff;
        }
      `}</style>
    </div>
  );
}

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

  const hasMaterials = materialOptions && materialOptions.length > 0;

  return (
    <>
      <aside className="filters">
        <div className="filter-header">
          <h2>Filters</h2>
          <button type="button" className="link-btn" onClick={onReset}>
            Clear All
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
              <select className="select" value={category} onChange={(e) => setCategory(e.target.value)}>
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
              <select className="select" value={designer} onChange={(e) => setDesigner(e.target.value)}>
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
              {/* Always use custom dropdown so it works on ALL mobiles */}
              {hasMaterials ? (
                <MaterialDropdown value={material} options={materialOptions} onChange={setMaterial} />
              ) : (
                <input
                  className="text-input"
                  placeholder="Type material..."
                  value={material}
                  onChange={(e) => setMaterial(e.target.value)}
                />
              )}
            </div>
          </details>

          <details className="filter-block" open>
            <summary>Condition</summary>
            <div className="filter-body">
              <select className="select" value={condition} onChange={(e) => setCondition(e.target.value)}>
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
              <input className="text-input" placeholder="Type size..." value={size} onChange={(e) => setSize(e.target.value)} />
            </div>
          </details>

          <details className="filter-block" open>
            <summary>Color</summary>
            <div className="filter-body">
              <input className="text-input" placeholder="Type color..." value={color} onChange={(e) => setColor(e.target.value)} />
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
                    onChange={(e) => setMinPrice(e.target.value === "" ? "" : Number(e.target.value) || 0)}
                  />
                </div>
                <div className="price-input">
                  <span>Max</span>
                  <input
                    type="number"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value === "" ? "" : Number(e.target.value) || 0)}
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
          background: #fff;
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
      `}</style>
    </>
  );
}
