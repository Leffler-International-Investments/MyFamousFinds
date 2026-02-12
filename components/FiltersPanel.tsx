// FILE: /components/FiltersPanel.tsx
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";

type ProductLike = any;

const CATEGORIES: { label: string; slug: string }[] = [
  { label: "Women", slug: "women" },
  { label: "Bags", slug: "bags" },
  { label: "Men", slug: "men" },
  { label: "Kids", slug: "kids" },
  { label: "Jewelry", slug: "jewelry" },
  { label: "Watches", slug: "watches" },
];

const CONDITIONS = ["New", "Excellent", "Very good", "Good"];

function n(v: any) {
  const x = Number(String(v ?? "").replace(/[^\d.]/g, ""));
  return Number.isFinite(x) ? x : NaN;
}

export default function FiltersPanel({
  pageSlug,
  allItems,
  onFiltered,
}: {
  pageSlug: string;
  allItems: ProductLike[];
  onFiltered: (items: ProductLike[]) => void;
}) {
  const router = useRouter();

  const [sort, setSort] = useState<"newest" | "price_low" | "price_high">("newest");
  const [selectedDesigners, setSelectedDesigners] = useState<string[]>([]);
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");

  const designers = useMemo(() => {
    const set = new Set<string>();
    (allItems || []).forEach((x) => {
      const d = String(x?.designer || x?.brand || x?.maker || "").trim();
      if (d) set.add(d);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [allItems]);

  function apply() {
    let items = [...(allItems || [])];

    // designer filter
    if (selectedDesigners.length) {
      const wanted = new Set(selectedDesigners);
      items = items.filter((x) => {
        const d = String(x?.designer || x?.brand || x?.maker || "").trim();
        return wanted.has(d);
      });
    }

    // condition filter
    if (selectedConditions.length) {
      const wanted = new Set(selectedConditions.map((x) => x.toLowerCase()));
      items = items.filter((x) => {
        const c = String(x?.condition || "").trim().toLowerCase();
        return c ? wanted.has(c) : false;
      });
    }

    // price filter
    const min = minPrice ? n(minPrice) : NaN;
    const max = maxPrice ? n(maxPrice) : NaN;
    if (!Number.isNaN(min)) items = items.filter((x) => !Number.isNaN(n(x?.price)) && n(x?.price) >= min);
    if (!Number.isNaN(max)) items = items.filter((x) => !Number.isNaN(n(x?.price)) && n(x?.price) <= max);

    // sort
    if (sort === "price_low") {
      items.sort((a, b) => (n(a?.price) || 0) - (n(b?.price) || 0));
    } else if (sort === "price_high") {
      items.sort((a, b) => (n(b?.price) || 0) - (n(a?.price) || 0));
    } else {
      // newest: keep as-is (already ordered by loader: createdAt desc)
    }

    onFiltered(items);
  }

  function reset() {
    setSort("newest");
    setSelectedDesigners([]);
    setSelectedConditions([]);
    setMinPrice("");
    setMaxPrice("");
    onFiltered(allItems || []);
  }

  function toggle(list: string[], value: string) {
    return list.includes(value) ? list.filter((x) => x !== value) : [...list, value];
  }

  useEffect(() => {
    apply();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sort, selectedDesigners, selectedConditions, minPrice, maxPrice, allItems]);

  return (
    <aside className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm font-semibold text-gray-900">Filters</div>
        <button onClick={reset} className="text-xs font-medium text-gray-700 hover:underline">
          Reset
        </button>
      </div>

      {/* Sort */}
      <div className="mb-5">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-600">Sort</div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as any)}
          className="w-full rounded-lg border border-gray-300 bg-white p-2 text-sm"
        >
          <option value="newest">Newest</option>
          <option value="price_low">Price: Low to High</option>
          <option value="price_high">Price: High to Low</option>
        </select>
      </div>

      {/* Category navigation (NOT filtering dataset — avoids the “everything becomes No Results” bug) */}
      <div className="mb-5">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-600">Category</div>
        <div className="space-y-2">
          {CATEGORIES.map((c) => {
            const checked = String(pageSlug || "").toLowerCase() === c.slug;
            return (
              <label key={c.slug} className="flex cursor-pointer items-center gap-2 text-sm text-gray-800">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => router.push(`/category/${c.slug}`)}
                  className="h-4 w-4"
                />
                <span>{c.label}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Designer */}
      <div className="mb-5">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-600">Designer</div>
        <div className="max-h-56 space-y-2 overflow-auto pr-1">
          {designers.length === 0 ? (
            <div className="text-sm text-gray-500">No designers found.</div>
          ) : (
            designers.map((d) => (
              <label key={d} className="flex items-center gap-2 text-sm text-gray-800">
                <input
                  type="checkbox"
                  checked={selectedDesigners.includes(d)}
                  onChange={() => setSelectedDesigners((x) => toggle(x, d))}
                  className="h-4 w-4"
                />
                <span>{d}</span>
              </label>
            ))
          )}
        </div>
      </div>

      {/* Condition */}
      <div className="mb-5">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-600">Condition</div>
        <div className="space-y-2">
          {CONDITIONS.map((c) => (
            <label key={c} className="flex items-center gap-2 text-sm text-gray-800">
              <input
                type="checkbox"
                checked={selectedConditions.map((x) => x.toLowerCase()).includes(c.toLowerCase())}
                onChange={() => setSelectedConditions((x) => toggle(x, c))}
                className="h-4 w-4"
              />
              <span>{c}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Price */}
      <div>
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-600">Price (USD)</div>
        <div className="grid grid-cols-2 gap-2">
          <input
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            placeholder="Min"
            className="w-full rounded-lg border border-gray-300 p-2 text-sm"
            inputMode="decimal"
          />
          <input
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            placeholder="Max"
            className="w-full rounded-lg border border-gray-300 p-2 text-sm"
            inputMode="decimal"
          />
        </div>
      </div>
    </aside>
  );
}
