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
    return res.status(405).json({
      answer: "I can only accept POST requests at the moment.",
    });
  }

  const { query } = req.body as { query?: string };
  if (!query || !query.trim()) {
    return res.status(400).json({
      answer:
        "Pardon me, I didn’t quite catch that. Tell me what you’re looking for in the catalogue.",
      results: [],
    });
  }

  const q = query.trim().toLowerCase();

  try {
    const snap = await adminDb
      .collection("listings")
      .orderBy("createdAt", "desc")
      .limit(200)
      .get();

    const listings = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    const matched: ButlerResult[] = listings
      .filter((item: any) => {
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
      .slice(0, 8)
      .map((item: any) => ({
        id: item.slug || item.id,
        title: item.title || "Listing",
        brand: item.brand || "",
        price: item.price || undefined,
        currency: (item.currency || "USD").toUpperCase(),
      }));

    if (!matched.length) {
      return res.status(200).json({
        answer:
          `I checked the Famous Finds catalogue but couldn’t find a good match for “${query}”. ` +
          "Try another brand, category or colour, and I’ll happily help again.",
        results: [],
      });
    }

    const intro =
      matched.length === 1
        ? `Here’s what I found for “${query}”:`
        : `Here are some options I found for “${query}”:`;

    const answer =
      `Wonderful taste. ${intro} Tap one of the listings below to open it.`;

    return res.status(200).json({
      answer,
      results: matched,
    });
  } catch (err: any) {
    console.error("Butler API error:", err?.message || err);
    return res.status(500).json({
      answer:
        "My apologies, I ran into a problem while searching the catalogue. Please try again shortly.",
      results: [],
    });
  }
}
