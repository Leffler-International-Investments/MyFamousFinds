// FILE: /pages/api/butler.ts
// Butler API: search Firestore `listings` and return structured results.

import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb } from "../../utils/firebaseAdmin";

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
      .json({ error: "Please tell me what you’re looking for." });
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

    type Hit = {
      id: string;
      title: string;
      brand: string;
      price: string;
      href: string;
      score: number;
    };

    const hits: Hit[] = [];

    snap.docs.forEach((doc) => {
      const d: any = doc.data() || {};

      if (d.status && !allowedStatuses.includes(d.status)) return;

      const title = d.title || "Untitled listing";
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
        href: `/product/${doc.id}`,
        score,
      });
    });

    hits.sort((a, b) => b.score - a.score);

    if (!hits.length) {
      return res.json({
        answer:
          `I checked the Famous Finds catalogue but couldn’t find a good match for “${userQuery}”. ` +
          `Try another brand, colour or item type – or tap “Browse the catalogue”.`,
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
