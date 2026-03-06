// Removed: debug endpoint that leaked Firebase project info with no auth.
import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  return res.status(410).json({ error: "This debug endpoint has been removed." });
}
