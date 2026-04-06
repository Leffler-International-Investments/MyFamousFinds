// FILE: /utils/authentication/categoryRules.ts
// Infers a category group (bags, watches, jewelry, fashion) from listing data.

export type CategoryGroup = "bags" | "watches" | "jewelry" | "fashion";

const BAG_KEYWORDS = [
  "bag", "handbag", "tote", "clutch", "crossbody", "satchel", "backpack",
  "purse", "pochette", "wallet", "pouch", "duffle", "duffel", "messenger",
  "briefcase", "carry-all", "carryall", "bucket bag", "hobo", "shoulder bag",
  "flap bag", "belt bag", "baguette", "keepall", "neverfull", "speedy",
  "birkin", "kelly", "boy bag", "classic flap", "saddle bag", "book tote",
];

const WATCH_KEYWORDS = [
  "watch", "timepiece", "chronograph", "wristwatch", "horology",
  "submariner", "daytona", "datejust", "speedmaster", "nautilus",
  "royal oak", "aquanaut", "santos", "tank", "ballon bleu",
  "oyster perpetual", "day-date", "seamaster",
];

const JEWELRY_KEYWORDS = [
  "jewelry", "jewellery", "necklace", "bracelet", "ring", "earring",
  "pendant", "brooch", "cuff", "bangle", "choker", "anklet", "tiara",
  "diamond", "gold chain", "tennis bracelet", "love bracelet",
  "juste un clou", "alhambra", "trinity ring", "panthere",
  "18k", "14k", "platinum", "carat", "karat", "hallmark",
];

const BAG_CATEGORIES = [
  "bags", "handbags", "women's bags", "men's bags",
];

const WATCH_CATEGORIES = [
  "watches", "men's watches", "women's watches", "luxury watches",
];

const JEWELRY_CATEGORIES = [
  "jewelry", "jewellery", "fine jewelry", "fashion jewelry",
  "women's jewelry", "men's jewelry",
];

function textContainsAny(text: string, keywords: string[]): boolean {
  const lower = text.toLowerCase();
  return keywords.some((kw) => lower.includes(kw));
}

export function inferCategoryGroup(
  category: string,
  title: string,
  details: string
): CategoryGroup {
  const catLower = (category || "").toLowerCase();

  // Direct category match
  if (BAG_CATEGORIES.some((c) => catLower.includes(c))) return "bags";
  if (WATCH_CATEGORIES.some((c) => catLower.includes(c))) return "watches";
  if (JEWELRY_CATEGORIES.some((c) => catLower.includes(c))) return "jewelry";

  // Keyword analysis from title + details
  const combined = `${title} ${details}`;
  if (textContainsAny(combined, BAG_KEYWORDS)) return "bags";
  if (textContainsAny(combined, WATCH_KEYWORDS)) return "watches";
  if (textContainsAny(combined, JEWELRY_KEYWORDS)) return "jewelry";

  return "fashion";
}
