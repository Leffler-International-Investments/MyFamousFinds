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

/** Categorized designer directory used by the seed endpoint and directory page fallback. */
export type DesignerCategory = "high-end" | "contemporary" | "jewelry-watches" | "kids";

export const CATEGORIZED_DESIGNERS: { name: string; designerCategory: DesignerCategory }[] = [
  // --- High-End Luxury ---
  { name: "Chanel", designerCategory: "high-end" },
  { name: "Hermès", designerCategory: "high-end" },
  { name: "Louis Vuitton", designerCategory: "high-end" },
  { name: "Gucci", designerCategory: "high-end" },
  { name: "Prada", designerCategory: "high-end" },
  { name: "Dior", designerCategory: "high-end" },
  { name: "Celine", designerCategory: "high-end" },
  { name: "Saint Laurent", designerCategory: "high-end" },
  { name: "Balenciaga", designerCategory: "high-end" },
  { name: "Bottega Veneta", designerCategory: "high-end" },
  { name: "Givenchy", designerCategory: "high-end" },
  { name: "Fendi", designerCategory: "high-end" },
  { name: "Versace", designerCategory: "high-end" },
  { name: "Valentino", designerCategory: "high-end" },
  { name: "Burberry", designerCategory: "high-end" },
  { name: "Alexander McQueen", designerCategory: "high-end" },
  { name: "Loewe", designerCategory: "high-end" },
  { name: "Miu Miu", designerCategory: "high-end" },
  { name: "Tom Ford", designerCategory: "high-end" },
  { name: "Dries Van Noten", designerCategory: "high-end" },
  { name: "Raf Simons", designerCategory: "high-end" },
  { name: "Maison Margiela", designerCategory: "high-end" },
  { name: "Issey Miyake", designerCategory: "high-end" },
  { name: "Rick Owens", designerCategory: "high-end" },
  { name: "Comme des Garçons", designerCategory: "high-end" },
  { name: "Jil Sander", designerCategory: "high-end" },
  { name: "Stella McCartney", designerCategory: "high-end" },
  { name: "Khaite", designerCategory: "high-end" },
  { name: "The Row", designerCategory: "high-end" },
  { name: "Brunello Cucinelli", designerCategory: "high-end" },
  { name: "Dolce & Gabbana", designerCategory: "high-end" },
  { name: "Christian Louboutin", designerCategory: "high-end" },
  { name: "Manolo Blahnik", designerCategory: "high-end" },
  { name: "Jimmy Choo", designerCategory: "high-end" },
  { name: "Golden Goose", designerCategory: "high-end" },
  { name: "Birkenstock", designerCategory: "high-end" },
  { name: "Berluti", designerCategory: "high-end" },
  { name: "Bulgari", designerCategory: "high-end" },
  // --- Jewelry & Watches ---
  { name: "Tiffany & Co.", designerCategory: "jewelry-watches" },
  { name: "Van Cleef & Arpels", designerCategory: "jewelry-watches" },
  { name: "Boucheron", designerCategory: "jewelry-watches" },
  { name: "David Yurman", designerCategory: "jewelry-watches" },
  { name: "Rolex", designerCategory: "jewelry-watches" },
  { name: "Patek Philippe", designerCategory: "jewelry-watches" },
  { name: "Audemars Piguet", designerCategory: "jewelry-watches" },
  { name: "Cartier", designerCategory: "jewelry-watches" },
  { name: "TAG Heuer", designerCategory: "jewelry-watches" },
  { name: "A. Lange & Söhne", designerCategory: "jewelry-watches" },
  { name: "Baume & Mercier", designerCategory: "jewelry-watches" },
  { name: "Bell & Ross", designerCategory: "jewelry-watches" },
  { name: "Breguet", designerCategory: "jewelry-watches" },
  { name: "Breitling", designerCategory: "jewelry-watches" },
  { name: "Franck Muller", designerCategory: "jewelry-watches" },
  { name: "Girard-Perregaux", designerCategory: "jewelry-watches" },
  { name: "Hublot", designerCategory: "jewelry-watches" },
  { name: "IWC Schaffhausen", designerCategory: "jewelry-watches" },
  { name: "Jaeger-LeCoultre", designerCategory: "jewelry-watches" },
  { name: "Montblanc", designerCategory: "jewelry-watches" },
  { name: "Omega", designerCategory: "jewelry-watches" },
  { name: "Panerai", designerCategory: "jewelry-watches" },
  { name: "Richard Mille", designerCategory: "jewelry-watches" },
  { name: "Roger Dubuis", designerCategory: "jewelry-watches" },
  { name: "Ulysse Nardin", designerCategory: "jewelry-watches" },
  { name: "Vacheron Constantin", designerCategory: "jewelry-watches" },
  { name: "Zenith", designerCategory: "jewelry-watches" },
  // --- Contemporary ---
  { name: "A.L.C.", designerCategory: "contemporary" },
  { name: "Alice + Olivia", designerCategory: "contemporary" },
  { name: "Ganni", designerCategory: "contemporary" },
  { name: "Reformation", designerCategory: "contemporary" },
  { name: "Veronica Beard", designerCategory: "contemporary" },
  { name: "Rag & Bone", designerCategory: "contemporary" },
  { name: "Theory", designerCategory: "contemporary" },
  { name: "Helmut Lang", designerCategory: "contemporary" },
  { name: "Vince", designerCategory: "contemporary" },
  { name: "Nanushka", designerCategory: "contemporary" },
  { name: "Ulla Johnson", designerCategory: "contemporary" },
  { name: "Zimmermann", designerCategory: "contemporary" },
  { name: "Cult Gaia", designerCategory: "contemporary" },
  { name: "Jonathan Simkhai", designerCategory: "contemporary" },
  { name: "Frame", designerCategory: "contemporary" },
  { name: "Off-White", designerCategory: "contemporary" },
  { name: "Fear of God", designerCategory: "contemporary" },
  { name: "1017 Alyx 9SM", designerCategory: "contemporary" },
  { name: "Palm Angels", designerCategory: "contemporary" },
  { name: "Billionaire Boys Club", designerCategory: "contemporary" },
  { name: "Hood By Air", designerCategory: "contemporary" },
  { name: "Heron Preston", designerCategory: "contemporary" },
  { name: "Rhude", designerCategory: "contemporary" },
  { name: "Human Made", designerCategory: "contemporary" },
  { name: "Self-Portrait", designerCategory: "contemporary" },
  { name: "PatBo", designerCategory: "contemporary" },
  { name: "Sandro", designerCategory: "contemporary" },
  { name: "Aje", designerCategory: "contemporary" },
  { name: "Maje", designerCategory: "contemporary" },
  { name: "Staud", designerCategory: "contemporary" },
  { name: "Christopher John Rogers", designerCategory: "contemporary" },
  { name: "Sacai", designerCategory: "contemporary" },
  { name: "Borsalino", designerCategory: "contemporary" },
  { name: "Poupette St.Barths", designerCategory: "contemporary" },
  { name: "SEA", designerCategory: "contemporary" },
  { name: "Lolita Jaca", designerCategory: "contemporary" },
  { name: "Marine Serre", designerCategory: "contemporary" },
  { name: "Mugler", designerCategory: "contemporary" },
  { name: "Area", designerCategory: "contemporary" },
  { name: "LaQuan Smith", designerCategory: "contemporary" },
  { name: "Wales Bonner", designerCategory: "contemporary" },
  { name: "Simone Rocha", designerCategory: "contemporary" },
  { name: "Jacquemus", designerCategory: "contemporary" },
  // --- Kids ---
  { name: "La Coqueta", designerCategory: "kids" },
  { name: "Pepa & Co", designerCategory: "kids" },
  { name: "Tartine et Chocolat", designerCategory: "kids" },
  { name: "Marie-Chantal", designerCategory: "kids" },
  { name: "Caramel London", designerCategory: "kids" },
  { name: "Petit Bateau", designerCategory: "kids" },
  { name: "Jacadi", designerCategory: "kids" },
];

/** Flat list of designer names for filter dropdowns. */
export const DEFAULT_DESIGNERS = CATEGORIZED_DESIGNERS.map((d) => d.name);

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
