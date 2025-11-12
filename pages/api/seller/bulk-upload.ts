// FILE: /pages/api/seller/bulk-upload.tsx

import type { NextApiRequest, NextApiResponse } from "next";

type BulkUploadResponse = {
  success: boolean;
  message: string;
  data?: any;
};

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
