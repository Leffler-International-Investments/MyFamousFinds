// FILE: /pages/api/seller/bulk-upload.tsx

import type { NextApiRequest, NextApiResponse } from "next";

type BulkUploadResponse = {
  success: boolean;
  message: string;
  data?: any;
};

/**
 * Seller bulk-upload placeholder API.
 *
 * This endpoint is only here so the project compiles.
 * It does NOT change your existing UI logic on
 * /pages/seller/bulk-upload.tsx.
 *
 * If you later want real logic (saving the file, etc.),
 * we can extend this handler without touching the page.
 */
export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<BulkUploadResponse>
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({
      success: false,
      message: "Method not allowed. Use POST.",
    });
  }

  return res.status(200).json({
    success: true,
    message:
      "Bulk-upload placeholder endpoint. Your UI page /seller/bulk-upload.tsx remains unchanged.",
  });
}
