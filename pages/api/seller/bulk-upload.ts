// FILE: /pages/api/seller/bulk-upload.ts

import type { NextApiRequest, NextApiResponse } from "next";

/**
 * Seller Bulk Upload API
 * ------------------------------------------------
 * This endpoint safely exists so the project compiles
 * and future upload logic can be added later.
 *
 * It does NOT import React or any UI components.
 * It simply responds to POST requests with a success message.
 */

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({
      success: false,
      message: "Method not allowed. Please use POST.",
    });
  }

  // Placeholder response
  return res.status(200).json({
    success: true,
    message:
      "Bulk-upload API placeholder is active. Your Seller page (/pages/seller/bulk-upload.tsx) remains fully functional.",
  });
}
