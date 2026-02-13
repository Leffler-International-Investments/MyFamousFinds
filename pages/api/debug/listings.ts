// FILE: /pages/api/debug/listings.ts
// Diagnostic: compares Admin SDK vs Client SDK data

import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb } from "../../../utils/firebaseAdmin";
import { getPublicListings } from "../../../lib/publicListings";

export default async function handler(
  _req: NextApiRequest,
  res: NextApiResponse
) {
  const result: any = {};

  // 1. Check Admin SDK (what homepage WAS using)
  try {
    if (!adminDb) {
      result.adminSdk = { error: "adminDb not initialized" };
    } else {
      const snap = await adminDb.collection("listings").get();
      result.adminSdk = {
        totalDocuments: snap.size,
        sampleIds: snap.docs.slice(0, 5).map((d) => d.id),
      };
    }
  } catch (err: any) {
    result.adminSdk = { error: err.message };
  }

  // 2. Check Client SDK via getPublicListings (what category pages use)
  try {
    const listings = await getPublicListings({ take: 500 });
    result.clientSdk = {
      totalDocuments: listings.length,
      sampleItems: listings.slice(0, 5).map((l: any) => ({
        id: l.id,
        title: l.title,
        category: l.category,
        brand: l.brand,
      })),
    };
  } catch (err: any) {
    result.clientSdk = { error: err.message };
  }

  result.diagnosis =
    (result.adminSdk?.totalDocuments || 0) !== (result.clientSdk?.totalDocuments || 0)
      ? "MISMATCH: Admin SDK and Client SDK see different data. Homepage now uses Client SDK to match category pages."
      : "Both SDKs return the same number of documents.";

  return res.status(200).json(result);
}
