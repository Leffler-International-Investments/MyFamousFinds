// FILE: /lib/filterConstants.ts
// Shared filter option constants used across catalogue, category, and designers pages.

export const CATEGORY_OPTIONS = [
  "Women",
  "Men",
  "Kids",
  "Bags",
  "Shoes",
  "Accessories",
  "Jewelry",
  "Watches",
];

export const CONDITION_OPTIONS = [
  "New with tags",
  "New (never used)",
  "Excellent",
  "Very good",
  "Good",
  "Fair",
];

export const MATERIAL_OPTIONS = [
  "Leather",
  "Exotic Leather",
  "Silk",
  "Cashmere",
  "Wool",
  "Linen",
  "Cotton",
  "Cotton Blend",
  "Denim",
  "Velvet",
  "Suede",
  "Canvas",
  "Metal",
  "Gold",
  "Silver",
  "Plated Metal",
  "Ceramic",
  "Crystal",
  "Resin",
  "Synthetic",
  "Other",
];

export const COLOR_OPTIONS = [
  "Black", "White", "Cream", "Beige", "Brown", "Tan", "Burgundy", "Red",
  "Pink", "Orange", "Yellow", "Green", "Blue", "Navy", "Purple", "Grey",
  "Silver", "Gold", "Multi",
];

export const DEFAULT_DESIGNERS = [
  // --- High-End Luxury ---
  "Chanel",
  "Hermès",
  "Louis Vuitton",
  "Gucci",
  "Prada",
  "Dior",
  "Celine",
  "Saint Laurent",
  "Balenciaga",
  "Bottega Veneta",
  "Givenchy",
  "Fendi",
  "Versace",
  "Valentino",
  "Burberry",
  "Alexander McQueen",
  "Loewe",
  "Miu Miu",
  "Tom Ford",
  "Cartier",
  "TAG Heuer",
  "Dries Van Noten",
  "Raf Simons",
  "Maison Margiela",
  "Issey Miyake",
  "Rick Owens",
  "Comme des Garçons",
  "Jil Sander",
  "Stella McCartney",
  "Khaite",
  "The Row",
  "Brunello Cucinelli",
  "Christian Louboutin",
  "Manolo Blahnik",
  "Jimmy Choo",
  "Golden Goose",
  "Birkenstock",
  "Berluti",
  // --- Jewelry & Watches ---
  "Tiffany & Co.",
  "Van Cleef & Arpels",
  "Boucheron",
  "David Yurman",
  "Rolex",
  "Patek Philippe",
  "Audemars Piguet",
  // --- Contemporary ---
  "A.L.C.",
  "Alice + Olivia",
  "Ganni",
  "Reformation",
  "Veronica Beard",
  "Rag & Bone",
  "Theory",
  "Helmut Lang",
  "Vince",
  "Nanushka",
  "Ulla Johnson",
  "Zimmermann",
  "Cult Gaia",
  "Jonathan Simkhai",
  "Frame",
  "Off-White",
  "Fear of God",
  "1017 Alyx 9SM",
  "Palm Angels",
  "Billionaire Boys Club",
  "Hood By Air",
  "Heron Preston",
  "Rhude",
  "Human Made",
  "Self-Portrait",
  "PatBo",
  "Sandro",
  "Aje",
  "Maje",
  "Staud",
  "Christopher John Rogers",
  "Sacai",
  "Borsalino",
  "Poupette St.Barths",
  "SEA",
  "Lolita Jaca",
  "Marine Serre",
  "Mugler",
  "Area",
  "LaQuan Smith",
  "Wales Bonner",
  "Simone Rocha",
  "Jacquemus",
  // --- Kids ---
  "La Coqueta",
  "Pepa & Co",
  "Tartine et Chocolat",
  "Marie-Chantal",
  "Caramel London",
  "Petit Bateau",
  "Jacadi",
];

export type SortValue = "newest" | "price-asc" | "price-desc";

export type FilterState = {
  titleQuery: string;
  category: string;
  designer: string;
  condition: string;
  material: string;
  size: string;
  color: string;
  minPrice: number | "";
  maxPrice: number | "";
  sortBy: SortValue;
};

export const DEFAULT_FILTER_STATE: FilterState = {
  titleQuery: "",
  category: "",
  designer: "",
  condition: "",
  material: "",
  size: "",
  color: "",
  minPrice: 0,
  maxPrice: 1000000,
  sortBy: "newest",
};

/** Build a query string from active filters (omits defaults). */
export function filtersToQuery(f: FilterState): Record<string, string> {
  const q: Record<string, string> = {};
  if (f.titleQuery.trim()) q.title = f.titleQuery.trim();
  if (f.category) q.category = f.category;
  if (f.designer) q.designer = f.designer;
  if (f.condition) q.condition = f.condition;
  if (f.material.trim()) q.material = f.material.trim();
  if (f.size.trim()) q.size = f.size.trim();
  if (f.color.trim()) q.color = f.color.trim();
  if (typeof f.minPrice === "number" && f.minPrice > 0) q.minPrice = String(f.minPrice);
  if (typeof f.maxPrice === "number" && f.maxPrice < 1000000) q.maxPrice = String(f.maxPrice);
  if (f.sortBy !== "newest") q.sort = f.sortBy;
  return q;
}

/** Parse filter state from URL query params. */
export function queryToFilters(query: Record<string, string | string[] | undefined>): Partial<FilterState> {
  const get = (key: string): string => {
    const v = query[key];
    return typeof v === "string" ? v : "";
  };
  const f: Partial<FilterState> = {};
  if (get("title")) f.titleQuery = get("title");
  if (get("category")) f.category = get("category");
  if (get("designer")) f.designer = get("designer");
  if (get("condition")) f.condition = get("condition");
  if (get("material")) f.material = get("material");
  if (get("size")) f.size = get("size");
  if (get("color")) f.color = get("color");
  const min = Number(get("minPrice"));
  if (Number.isFinite(min) && min > 0) f.minPrice = min;
  const max = Number(get("maxPrice"));
  if (Number.isFinite(max) && max > 0) f.maxPrice = max;
  const sort = get("sort");
  if (sort === "price-asc" || sort === "price-desc") f.sortBy = sort;
  return f;
}

/** Normalize text for accent-insensitive comparison. */
export function normalize(raw: string | undefined | null): string {
  if (!raw) return "";
  return raw
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function parsePrice(price?: string | null): number {
  if (!price) return 0;
  const cleaned = price.replace(/[^0-9.,]/g, "").replace(/,/g, "");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}
