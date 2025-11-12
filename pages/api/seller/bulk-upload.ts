// FILE: /pages/api/seller/bulk-upload.tsx

import type { NextApiRequest, NextApiResponse } from "next";

type ApiResult = {
  ok: boolean;
  created?: number;
  skipped?: number;
  error?: string;
};

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResult>
) {
  if (req.method !== "POST") {
    return res.status(405).json({
      ok: false,
      error: "Method not allowed. Use POST.",
    });
  }

  // Legacy endpoint kept only so the build passes.
  // Bulk uploads are handled by /api/seller/bulk-commit.
  return res.status(200).json({
    ok: true,
    created: 0,
    skipped: 0,
  });
}
