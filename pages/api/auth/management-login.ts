// FILE: /pages/api/auth/management-login.ts
// DEPRECATED: This endpoint is superseded by /api/management/login.
// Kept as a redirect so any old clients still work.

import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Forward to the canonical management login endpoint
  return res.status(410).json({
    error: "This endpoint is deprecated. Use /api/management/login instead.",
  });
}
