// FILE: /pages/api/public/designers.ts
// Returns a list of designers that have "Live" listings
// Used to populate filters in category pages so buyers don't see empty brands.

import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb } from "../../../utils/firebaseAdmin";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // 1. Fetch all Live listings
    // We scan the actual inventory to see who is "in stock"
    const snapshot = await adminDb
      .collection("listings")
      .where("status", "==", "Live")
      .select("brand") // Optimization: Only fetch the brand field
      .get();

    // 2. Extract unique brands
    const brandSet = new Set<string>();
    snapshot.forEach((doc) => {
      const b = doc.data().brand;
      if (b && typeof b === "string") {
        brandSet.add(b);
      }
    });

    // 3. Convert to array of objects
    const designers = Array.from(brandSet).map((name) => ({
      id: name,
      name: name,
      slug: name.toLowerCase().replace(/\s+/g, "-"),
      active: true,
    }));

    // 4. Sort A-Z
    designers.sort((a, b) => a.name.localeCompare(b.name));

    res.status(200).json({ ok: true, designers });
  } catch (error) {
    console.error("Error fetching public designers:", error);
    res.status(500).json({ ok: false, error: "Internal server error" });
  }
}
