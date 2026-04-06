// FILE: /utils/authentication/identifierParser.ts
// Extracts and normalizes identifiers and signals from listing data.

export type ExtractedSignals = {
  brand: string;
  itemType: string;
  color: string;
  material: string;
  serialNumber: string;
  catalogueNumber: string;
  styleNumber: string;
  referenceNumber: string;
  hallmarkPurity: string;
  hardwareNotes: string;
  liningNotes: string;
  packagingMentions: string;
  dateCode: string;
};

const COLOR_WORDS = [
  "black", "white", "beige", "brown", "tan", "blue", "navy", "red",
  "burgundy", "green", "olive", "pink", "purple", "grey", "gray",
  "yellow", "orange", "gold", "silver", "ivory", "cream", "camel",
  "rose", "coral", "teal", "maroon", "charcoal", "nude", "blush",
  "etoupe", "noir", "blanc", "rouge",
];

const MATERIAL_WORDS = [
  "leather", "canvas", "suede", "silk", "denim", "nylon", "cotton",
  "cashmere", "wool", "polyester", "satin", "tweed", "velvet",
  "patent leather", "lambskin", "calfskin", "caviar leather",
  "epsom", "togo", "clemence", "swift", "box calf", "ostrich",
  "crocodile", "alligator", "python", "stingray", "monogram canvas",
  "damier", "epi leather", "vachetta", "vernis",
  "stainless steel", "titanium", "ceramic", "rose gold", "white gold",
  "yellow gold", "platinum", "sterling silver",
];

const ITEM_TYPE_WORDS = [
  "bag", "handbag", "tote", "clutch", "wallet", "watch", "bracelet",
  "necklace", "ring", "earrings", "sneakers", "shoes", "boots",
  "jacket", "coat", "dress", "shirt", "scarf", "belt", "sunglasses",
  "backpack", "crossbody", "satchel",
];

function findInText(text: string, keywords: string[]): string {
  const lower = text.toLowerCase();
  for (const kw of keywords) {
    if (lower.includes(kw)) return kw;
  }
  return "";
}

function extractPattern(text: string, patterns: RegExp[]): string {
  for (const pat of patterns) {
    const match = text.match(pat);
    if (match) return match[1] || match[0];
  }
  return "";
}

export function extractSignals(listing: {
  title?: string;
  brand?: string;
  designer?: string;
  color?: string;
  material?: string;
  serial_number?: string;
  catalogue_number?: string;
  date_code?: string;
  details?: string;
  category?: string;
}): ExtractedSignals {
  const title = listing.title || "";
  const details = listing.details || "";
  const combined = `${title} ${details}`;

  // Brand: prefer explicit field, then try to detect from text
  const brand = (listing.brand || listing.designer || "").trim();

  // Color: prefer explicit field, then detect
  const color =
    (listing.color || "").trim() ||
    findInText(combined, COLOR_WORDS);

  // Material: prefer explicit field, then detect
  const material =
    (listing.material || "").trim() ||
    findInText(combined, MATERIAL_WORDS);

  // Item type from text
  const itemType = findInText(combined, ITEM_TYPE_WORDS);

  // Serial number
  const serialNumber = (listing.serial_number || "").trim() ||
    extractPattern(combined, [
      /serial\s*(?:#|number|no\.?)\s*[:.]?\s*([A-Za-z0-9\-]{4,24})/i,
    ]);

  // Catalogue / style number
  const catalogueNumber = (listing.catalogue_number || "").trim() ||
    extractPattern(combined, [
      /catalog(?:ue)?\s*(?:#|number|no\.?)\s*[:.]?\s*([A-Za-z0-9\-]{3,20})/i,
      /style\s*(?:#|number|code|no\.?)\s*[:.]?\s*([A-Za-z0-9\-]{3,20})/i,
      /item\s*(?:#|number|no\.?)\s*[:.]?\s*([A-Za-z0-9\-]{3,20})/i,
    ]);

  // Style number (separate from catalogue)
  const styleNumber = extractPattern(combined, [
    /style\s*(?:#|number|code|no\.?)\s*[:.]?\s*([A-Za-z0-9\-]{3,20})/i,
  ]);

  // Reference number (watches)
  const referenceNumber = extractPattern(combined, [
    /ref(?:erence)?\s*(?:#|number|no\.?)\s*[:.]?\s*([A-Za-z0-9\-\.]{3,20})/i,
  ]);

  // Hallmark / purity marks (jewelry)
  const hallmarkPurity = extractPattern(combined, [
    /(18k|14k|10k|24k|750|585|925|950|375)\b/i,
    /hallmark[:\s]+([^\.,;]+)/i,
    /purity[:\s]+([^\.,;]+)/i,
  ]);

  // Hardware notes
  const hardwareNotes = extractPattern(combined, [
    /hardware[:\s]+([^\.,;]{3,60})/i,
    /(gold[- ]?tone|silver[- ]?tone|palladium|ruthenium)\s*hardware/i,
  ]);

  // Lining notes
  const liningNotes = extractPattern(combined, [
    /lining[:\s]+([^\.,;]{3,60})/i,
    /lined\s+(?:in|with)\s+([^\.,;]{3,40})/i,
  ]);

  // Packaging / receipt mentions
  const packagingMentions = extractPattern(combined, [
    /(dust\s*bag|box|receipt|authenticity\s*card|care\s*booklet|certificate)/i,
  ]);

  // Date code
  const dateCode = (listing.date_code || "").trim() ||
    extractPattern(combined, [
      /date\s*code[:\s]+([A-Za-z0-9\-]{2,12})/i,
      /heat\s*stamp[:\s]+([A-Za-z0-9\-]{2,12})/i,
    ]);

  return {
    brand,
    itemType,
    color,
    material,
    serialNumber,
    catalogueNumber,
    styleNumber,
    referenceNumber,
    hallmarkPurity,
    hardwareNotes,
    liningNotes,
    packagingMentions,
    dateCode,
  };
}
