// FILE: /pages/api/butler.ts
// Butler API: search Firestore `listings` with category awareness.

import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb } from "../../utils/firebaseAdmin";
import { getDeletedListingIds } from "../../lib/deletedListings";

type ButlerResult = {
  id: string;
  title: string;
  brand: string;
  price: string;
  href: string;
};

type Ok = {
  answer: string;
  results: ButlerResult[];
};

type Err = {
  error: string;
};

function norm(v: any): string {
  return (v || "").toString().toLowerCase();
}

// Map query words -> catalogue category slugs
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  bags: [
    "bag",
    "bags",
    "handbag",
    "hand bag",
    "tote",
    "clutch",
    "crossbody",
  ],
  shoes: [
    "shoe",
    "shoes",
    "sneaker",
    "sneakers",
    "trainer",
    "trainers",
    "boots",
    "heels",
  ],
  watches: ["watch", "watches", "timepiece"],
  jewelry: [
    "jewelry",
    "jewelery",
    "ring",
    "rings",
    "necklace",
    "necklaces",
    "bracelet",
    "bracelets",
    "earring",
    "earrings",
  ],
  clothing: [
    "clothing",
    "dress",
    "dresses",
    "coat",
    "coats",
    "jacket",
    "jackets",
    "shirt",
    "shirts",
    "top",
    "tops",
    "skirt",
    "skirts",
    "trousers",
    "pants",
  ],
  beauty: ["beauty", "perfume", "fragrance", "makeup", "lipstick"],
  accessories: [
    "accessory",
    "accessories",
    "belt",
    "belts",
    "wallet",
    "wallets",
    "scarf",
    "scarves",
    "hat",
    "hats",
  ],
  kids: ["kids", "child", "children", "boy", "girl"],
  men: ["men", "mens", "menswear"],
  women: ["women", "womens", "womenswear"],
  home: ["home", "homeware", "decor"],
};

function detectCategoryFromQuery(q: string): string | null {
  for (const [slug, words] of Object.entries(CATEGORY_KEYWORDS)) {
    if (words.some((w) => q.includes(w))) {
      return slug;
    }
  }
  return null;
}

function itemMatchesCategory(
  requiredSlug: string | null,
  itemCategoryRaw: string,
  titleRaw: string,
  descriptionRaw: string
): boolean {
  if (!requiredSlug) return true; // no category constraint

  const itemCategory = itemCategoryRaw.toLowerCase();
  const title = titleRaw.toLowerCase();
  const desc = descriptionRaw.toLowerCase();
  const synonyms = CATEGORY_KEYWORDS[requiredSlug] || [requiredSlug];

  // 1) Direct match on category field
  if (
    itemCategory &&
    synonyms.some(
      (w) => itemCategory.includes(w) || itemCategory === requiredSlug
    )
  ) {
    return true;
  }

  // 2) Fallback: title/description contains category words
  const haystack = `${title} ${desc}`;
  if (synonyms.some((w) => haystack.includes(w))) {
    return true;
  }

  // Otherwise, treat as not matching this category
  return false;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Ok | Err>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { query } = (req.body || {}) as { query?: string };
  const userQuery = (query || "").trim();

  if (!userQuery) {
    return res
      .status(400)
      .json({ error: "Please tell me what you're looking for." });
  }

  // AI Customer Service: handle common inquiries with refined responses
  const qLower = userQuery.toLowerCase();

  const FAQ_RESPONSES: Record<string, string> = {
    shipping:
      "Shipping is handled by the seller. Once your order is placed, the seller will ship within 3-5 business days. " +
      "You'll receive tracking information via email. Standard shipping within the US is included; international rates vary.",
    return:
      "Returns are accepted within 14 days of delivery for items not as described. " +
      "Please contact us through your order page to initiate a return. Items must be in their original condition.",
    returns:
      "Returns are accepted within 14 days of delivery for items not as described. " +
      "Please contact us through your order page to initiate a return. Items must be in their original condition.",
    authentication:
      "All items on Famous Finds go through our verification process. Sellers must provide proof of purchase for items over $499. " +
      "Our team reviews every listing before it goes live.",
    authenticity:
      "All items on Famous Finds go through our verification process. Sellers must provide proof of purchase for items over $499. " +
      "Our team reviews every listing before it goes live.",
    payment:
      "We accept payments through PayPal for secure transactions. Your payment is held until the item is delivered and confirmed.",
    sell:
      "Want to sell on Famous Finds? Go to your account dashboard and click 'Become a Seller'. " +
      "Our team reviews every application to ensure quality. Once approved, you can start listing immediately.",
    consign:
      "Consigning is easy! Apply to become a seller from your account page. " +
      "Once approved, list your pre-loved luxury items with photos. We handle verification and help you reach thousands of buyers.",
    pricing:
      "Sellers set their own prices. We provide market-based pricing recommendations to help items sell faster. " +
      "There are no fees to list — our commission is taken only when an item sells.",
    "how does it work":
      "Famous Finds is a curated marketplace for pre-loved luxury. " +
      "Browse and buy authenticated designer pieces, or apply to sell your own. " +
      "Every item is reviewed by our team before going live.",
    help:
      "I can help you find specific items, answer questions about shipping, returns, authentication, or selling. " +
      "Just ask me anything! For urgent issues, email support@myfamousfinds.com.",
    contact:
      "You can reach our team at support@myfamousfinds.com or through the contact form on our website. " +
      "We aim to respond within 24 hours.",
  };

  for (const [keyword, response] of Object.entries(FAQ_RESPONSES)) {
    if (qLower.includes(keyword)) {
      return res.status(200).json({
        answer: response,
        results: [],
      });
    }
  }

  try {
    const snap = await adminDb
      .collection("listings")
      .orderBy("createdAt", "desc")
      .limit(100)
      .get();

    const q = norm(userQuery);
    const words = q.split(/\s+/).filter(Boolean);

    const allowedStatuses = ["Live", "Active", "Approved"];

    // 🔹 detect “bags / shoes / watches / …” from what the user said
    const requiredCategory = detectCategoryFromQuery(q);

    type Hit = {
      id: string;
      title: string;
      brand: string;
      price: string;
      href: string;
      score: number;
    };

    const hits: Hit[] = [];

    const deletedIds = await getDeletedListingIds();

    snap.docs.forEach((doc) => {
      const d: any = doc.data() || {};

      if (deletedIds.has(doc.id)) return;
      if (d.status && !allowedStatuses.includes(d.status)) return;

      const title = d.title || "Untitled listing";
      const brand = d.brand || "";
      const categoryField = d.category || d.categorySlug || "";
      const description = d.description || "";

      // ❗ category filter – e.g. “bag” will **exclude sneakers**
      if (
        !itemMatchesCategory(
          requiredCategory,
          categoryField,
          title,
          description
        )
      ) {
        return;
      }

      const haystack = norm(
        `${title} ${brand} ${categoryField} ${description}`
      );
      if (!haystack) return;

      let score = 0;

      // Exact phrase match gets a nice boost
      if (haystack.includes(q)) score += 5;

      // Word-by-word scoring with simple plural/singular handling
      for (const w of words) {
        if (!w) continue;

        // e.g. "sneakers" -> "sneaker", "bags" -> "bag"
        const base = w.endsWith("s") ? w.slice(0, -1) : w;

        if (haystack.includes(w)) {
          score += 1;
        } else if (base && haystack.includes(base)) {
          score += 1;
        }
      }

      if (!score) return;

      const priceNumber = Number(d.price) || 0;
      const price = priceNumber
        ? `US$${priceNumber.toLocaleString("en-US")}`
        : "";

      hits.push({
        id: doc.id,
        title,
        brand,
        price,
        href: `/product/${doc.id}`,
        score,
      });
    });

    hits.sort((a, b) => b.score - a.score);

    if (!hits.length) {
      return res.json({
        answer:
          `I checked the Famous Finds catalogue but couldn’t find a good match for “${userQuery}”. ` +
          `Try another brand, category or colour, and I’ll happily help again.`,
        results: [],
      });
    }

    const top = hits.slice(0, 5);

    const lines = top.map((item, i) => {
      const label =
        (item.brand ? item.brand + " — " : "") +
        item.title +
        (item.price ? ` (${item.price})` : "");
      return `${i + 1}. ${label}`;
    });

    const answer =
      `Here’s what I found in the Famous Finds catalogue for “${userQuery}”:\n\n` +
      lines.join("\n") +
      `\n\nTap a result below to open the product.`;

    const results: ButlerResult[] = top.map((item) => ({
      id: item.id,
      title: item.title,
      brand: item.brand,
      price: item.price,
      href: item.href,
    }));

    return res.status(200).json({ answer, results });
  } catch (err) {
    console.error("Butler search error:", err);
    return res
      .status(500)
      .json({ error: "There was a problem searching the catalogue." });
  }
}
