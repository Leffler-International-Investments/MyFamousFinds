// /pages/api/seller/bulk-upload.ts
import type { NextApiRequest, NextApiResponse } from "next";

/**
 * Seller Bulk Upload API
 * NOTE:
 * - No React, no Header/Footer imports here.
 * - Keep UI in `/pages/seller/bulk-upload.tsx`.
 */

// Optional: if later you accept multipart/form-data, keep body parser off
export const config = {
  api: { bodyParser: true }, // set to false when switching to multipart
};

type ApiResp = {
  success: boolean;
  message: string;
};

export default function handler(req: NextApiRequest, res: NextApiResponse<ApiResp>) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({
      success: false,
      message: "Method not allowed. Use POST.",
    });
  }

  // Placeholder success (wire real logic later)
  return res.status(200).json({
    success: true,
    message: "Bulk-upload API OK (placeholder). Frontend page compiles.",
  });
}
