// FILE: pages/api/butler.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb } from "../../utils/firebaseAdmin";

type ButlerResult = {
  id: string;
  title: string;
  brand?: string;
  price?: number;
  currency?: string;
};

type ButlerResponse = {
  answer: string;
  results?: ButlerResult[];
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ButlerResponse>
) {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ answer: "I can only accept POST requests, my friend." });
  }

  const { query } = req.body as { query?: string };

  if (!query || !query.trim()) {
    return res.status(400).json({
      answer:
        "Pardon me, I didn’t quite catch that. Please tell me what you’re looking for.",
    });
  }

  const q = query.trim().toLowerCase();

  try {
    // 1. Fetch listings (you can adjust filters as needed)
    const snap = await adminDb
      .collection("listings")
      .orderBy("createdAt", "desc")
      .get();

    const allListings: any[] = snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as any),
    }));

    // 2. Very simple text match on title / brand / category
    const matched: ButlerResult[] = allListings
      .filter((item) => {
        const title = (item.title || "").toLowerCase();
        const brand = (item.brand || "").toLowerCase();
        const category = (item.category || "").toLowerCase();
        return (
          title.includes(q) ||
          brand.includes(q) ||
          category.includes(q) ||
          q.includes(brand) ||
          q.includes(category)
        );
      })
      .slice(0, 8) // show up to 8 matches
      .map((item) => ({
        id: item.slug || item.id,
        title: item.title || "Listing",
        brand: item.brand || "",
        price: item.price || undefined,
        currency: (item.currency || "USD").toUpperCase(),
      }));

    if (matched.length === 0) {
      return res.status(200).json({
        answer:
          `I’ve searched the Famous Finds catalogue but couldn’t find a good match for “${query}”. ` +
          "You can also browse by category or try a different description, and I’ll gladly help again.",
        results: [],
      });
    }

    // Build a nice conversational answer
    const intro =
      matched.length === 1
        ? `Here’s what I found in the Famous Finds catalogue for “${query}”:`
        : `Here’s what I found in the Famous Finds catalogue for “${query}”. Tap a result below to open the product:`;

    const listText = matched
      .map((m, idx) => {
        const pricePart =
          typeof m.price === "number"
            ? ` (${m.currency} ${m.price.toLocaleString("en-US")})`
            : "";
        return `${idx + 1}. ${m.brand ? m.brand + " — " : ""}${m.title}${pricePart}`;
      })
      .join(" ");

    const answer = `Ah, an excellent choice. ${intro} ${listText}`;

    return res.status(200).json({
      answer,
      results: matched,
    });
  } catch (err: any) {
    console.error("Butler search error:", err?.message || err);
    return res.status(500).json({
      answer:
        "My apologies, something went wrong while searching the catalogue. Please try again in a moment.",
    });
  }
}
