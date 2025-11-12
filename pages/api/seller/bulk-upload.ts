// FILE: /pages/api/seller/bulk-upload.tsx

import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ ok: boolean }>
) {
  return res.status(200).json({ ok: true });
}
