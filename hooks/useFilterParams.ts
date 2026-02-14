// FILE: /hooks/useFilterParams.ts
// Hook that manages filter state and synchronizes it with URL query parameters.
// Used across catalogue, category, and designers pages for cross-page filter persistence.

import { useRouter } from "next/router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  DEFAULT_FILTER_STATE,
  FilterState,
  SortValue,
  filtersToQuery,
  queryToFilters,
} from "../lib/filterConstants";

type UseFilterParamsOptions = {
  /** Additional path-specific query params to preserve (e.g. slug). */
  extraParams?: Record<string, string>;
  /** Override the pathname used when pushing query params. Defaults to router.pathname. */
  pathname?: string;
};

export default function useFilterParams(opts: UseFilterParamsOptions = {}) {
  const router = useRouter();
  const initialized = useRef(false);

  const [titleQuery, setTitleQuery] = useState(DEFAULT_FILTER_STATE.titleQuery);
  const [category, setCategory] = useState(DEFAULT_FILTER_STATE.category);
  const [designer, setDesigner] = useState(DEFAULT_FILTER_STATE.designer);
  const [condition, setCondition] = useState(DEFAULT_FILTER_STATE.condition);
  const [material, setMaterial] = useState(DEFAULT_FILTER_STATE.material);
  const [size, setSize] = useState(DEFAULT_FILTER_STATE.size);
  const [color, setColor] = useState(DEFAULT_FILTER_STATE.color);
  const [minPrice, setMinPrice] = useState<number | "">(DEFAULT_FILTER_STATE.minPrice);
  const [maxPrice, setMaxPrice] = useState<number | "">(DEFAULT_FILTER_STATE.maxPrice);
  const [sortBy, setSortBy] = useState<SortValue>(DEFAULT_FILTER_STATE.sortBy);
  const [showFilters, setShowFilters] = useState(false);

  // Read filter state from URL query params on mount
  useEffect(() => {
    if (initialized.current) return;
    if (!router.isReady) return;
    initialized.current = true;

    const parsed = queryToFilters(router.query);
    if (parsed.titleQuery) setTitleQuery(parsed.titleQuery);
    if (parsed.category) setCategory(parsed.category);
    if (parsed.designer) setDesigner(parsed.designer);
    if (parsed.condition) setCondition(parsed.condition);
    if (parsed.material) setMaterial(parsed.material);
    if (parsed.size) setSize(parsed.size);
    if (parsed.color) setColor(parsed.color);
    if (typeof parsed.minPrice === "number") setMinPrice(parsed.minPrice);
    if (typeof parsed.maxPrice === "number") setMaxPrice(parsed.maxPrice);
    if (parsed.sortBy) setSortBy(parsed.sortBy);

    // Auto-open filter panel if any filter params are active
    const hasActiveFilters = Object.keys(parsed).length > 0;
    if (hasActiveFilters) setShowFilters(true);
  }, [router.isReady, router.query]);

  const currentFilters: FilterState = {
    titleQuery,
    category,
    designer,
    condition,
    material,
    size,
    color,
    minPrice,
    maxPrice,
    sortBy,
  };

  // Write filter state to URL query params (shallow update)
  const syncToUrl = useCallback(() => {
    const filterQuery = filtersToQuery(currentFilters);
    const query = { ...(opts.extraParams || {}), ...filterQuery };
    const pathname = opts.pathname || router.pathname;
    router.replace({ pathname, query }, undefined, { shallow: true });
  }, [currentFilters, opts.extraParams, opts.pathname, router]);

  const resetFilters = useCallback(() => {
    setTitleQuery(DEFAULT_FILTER_STATE.titleQuery);
    setCategory(DEFAULT_FILTER_STATE.category);
    setDesigner(DEFAULT_FILTER_STATE.designer);
    setCondition(DEFAULT_FILTER_STATE.condition);
    setMaterial(DEFAULT_FILTER_STATE.material);
    setSize(DEFAULT_FILTER_STATE.size);
    setColor(DEFAULT_FILTER_STATE.color);
    setMinPrice(DEFAULT_FILTER_STATE.minPrice);
    setMaxPrice(DEFAULT_FILTER_STATE.maxPrice);
    setSortBy(DEFAULT_FILTER_STATE.sortBy);
  }, []);

  return {
    // State
    titleQuery, setTitleQuery,
    category, setCategory,
    designer, setDesigner,
    condition, setCondition,
    material, setMaterial,
    size, setSize,
    color, setColor,
    minPrice, setMinPrice,
    maxPrice, setMaxPrice,
    sortBy, setSortBy,
    showFilters, setShowFilters,
    // Actions
    resetFilters,
    syncToUrl,
    currentFilters,
  };
}
