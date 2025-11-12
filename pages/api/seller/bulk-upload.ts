import type { NextApiRequest, NextApiResponse } from "next";

/**
 * Seller Bulk Upload API
 * ------------------------------------------------
 * This endpoint exists so the app compiles and to
 * handle any future file-upload logic.
 * It must not import React or UI components.
 */

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({
      success: false,
      message: "Method not allowed. Please use POST.",
    });
  }

  // Placeholder success response
  return res.status(200).json({
    success: true,
    message:
      "Bulk-upload API placeholder active. Seller UI at /seller/bulk-upload.tsx remains fully functional.",
  });
}
