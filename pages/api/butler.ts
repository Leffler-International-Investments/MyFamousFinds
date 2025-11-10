// FILE: /pages/api/butler.ts
// Butler API: searches the Famous Finds catalogue (Firestore `listings`).

import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb } from "../../utils/firebaseAdmin";

type Ok = { answer: string };
type Err = { error: string };

function norm(v: any): string {
  return (v || "").toString().toLowerCase();
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
      .json({ error: "Please tell me what you are looking for." });
  }

  try {
    // Load latest listings (same source as homepage/catalogue)
    const snap = await adminDb
      .collection("listings")
      .orderBy("createdAt", "desc")
      .limit(100)
      .get();

    const q = norm(userQuery);
    const words = q.split(/\s+/).filter(Boolean);

    type Hit = {
      id: string;
      title: string;
      brand: string;
      price: string;
      score: number;
    };

    const allowedStatuses = ["Live", "Active", "Approved"];
    const hits: Hit[] = [];

    snap.docs.forEach((doc) => {
      const d: any = doc.data() || {};

      if (d.status && !allowedStatuses.includes(d.status)) return;

      const title = d.title || "";
      const brand = d.brand || "";
      const category = d.category || d.categorySlug || "";
      const description = d.description || "";

      const haystack = norm(`${title} ${brand} ${category} ${description}`);
      if (!haystack) return;

      let score = 0;
      if (haystack.includes(q)) score += 5;
      for (const w of words) {
        if (w && haystack.includes(w)) score += 1;
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
        score,
      });
    });

    hits.sort((a, b) => b.score - a.score);

    if (!hits.length) {
      return res.json({
        answer:
          `I checked the Famous Finds catalogue but couldn’t find a good match for “${userQuery}”. ` +
          `Try another brand, colour, or item type – or tap “Browse the catalogue”.`,
      });
    }

    const top = hits.slice(0, 5);

    const lines = top.map((item, i) => {
      const label =
        (item.brand ? item.brand + " — " : "") +
        item.title +
        (item.price ? ` (${item.price})` : "");
      // Note: /product/[id] is the product page route.
      return `${i + 1}. ${label} – open /product/${item.id}`;
    });

    const answer =
      `Here’s what I found in the Famous Finds catalogue for “${userQuery}”:\n\n` +
      lines.join("\n");

    return res.status(200).json({ answer });
  } catch (err) {
    console.error("Butler search error:", err);
    return res.status(500).json({
      error: "There was a problem searching the catalogue.",
    });
  }
}
