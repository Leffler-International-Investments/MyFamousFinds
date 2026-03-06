// Removed: debug endpoint that wrote test data to production Firestore.
import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  return res.status(410).json({ error: "This debug endpoint has been removed." });
}
