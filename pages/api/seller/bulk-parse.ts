// FILE: /pages/api/seller/bulk-parse.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { parse } from "csv-parse/sync";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const csv = req.body;
    const records = parse(csv, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    const valid = records.filter((r: any) => r.title && r.price && r.brand);
    return res.status(200).json({ parsed: valid, total: valid.length });
  } catch (err: any) {
    console.error("CSV parse error:", err);
    return res.status(400).json({ error: "Invalid CSV format" });
  }
}
