// FILE: /pages/api/seller/statement.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { mockRows, summarize, toCSV } from "../../../utils/statement";

// NOTE: Replace "getSellerId(req)" with your real auth lookup.
function getSellerId(_req: NextApiRequest) { return "seller-demo-001"; }

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const sellerId = getSellerId(req);
  const { start, end, format } = req.query as { start?: string; end?: string; format?: string };

  // Defaults: current month to today
  const now = new Date();
  const defStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0,10);
  const defEnd = now.toISOString().slice(0,10);
  const s = start || defStart;
  const e = end   || defEnd;

  const rows = mockRows(sellerId, s, e);
  const summary = summarize(rows, s, e);

  if (format === "csv") {
    const csv = toCSV(rows, summary);
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="FamousFinds_Statement_${s}_to_${e}.csv"`);
    return res.status(200).send(csv);
  }

  // JSON (default)
  return res.status(200).json({ ok: true, sellerId, start: s, end: e, summary, rows });
}
