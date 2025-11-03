// FILE: /pages/api/seller/statement.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { fetchSellerRows, summarizeRows, toCSV } from "../../../lib/statementStore";

// TODO: replace with your real auth (e.g., decode cookie/session)
function getSellerId(req: NextApiRequest) {
  // Example: header "x-seller-id" as a temporary stub for testing
  return (req.headers["x-seller-id"] as string) || "seller-demo-001";
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).end();

  const sellerId = getSellerId(req);
  const { start, end, format } = req.query as { start?: string; end?: string; format?: "csv"|"json" };

  const now = new Date();
  const defStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0,10);
  const defEnd = now.toISOString().slice(0,10);
  const s = start || defStart;
  const e = end || defEnd;

  try {
    const rows = await fetchSellerRows(sellerId, s, e);
    const summary = summarizeRows(rows, s, e);

    if (format === "csv") {
      const csv = toCSV(rows, summary.money);
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="FamousFinds_Statement_${s}_to_${e}.csv"`);
      return res.status(200).send(csv);
    }

    return res.status(200).json({ ok:true, sellerId, start:s, end:e, summary, rows });
  } catch (err:any) {
    return res.status(500).json({ ok:false, error: err?.message || "server_error" });
  }
}
