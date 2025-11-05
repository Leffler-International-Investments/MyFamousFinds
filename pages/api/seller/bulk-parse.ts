// FILE: /pages/api/seller/bulk-parse.ts
import type { NextApiRequest, NextApiResponse } from "next";

// Very minimal CSV parser: split on newlines + commas.
// Assumes no commas inside quoted fields.
function parseCsv(text: string): any[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (!lines.length) return [];

  const header = lines[0].split(",").map((h) => h.trim());
  const rows: any[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",");
    const row: any = {};
    header.forEach((key, idx) => {
      row[key] = (cols[idx] ?? "").trim();
    });
    rows.push(row);
  }

  return rows;
}

type ParsedRow = {
  id?: string;
  title?: string;
  brand?: string;
  category?: string;
  price?: string;
  [key: string]: any;
};

type BulkParseResponse =
  | { ok: true; rows: ParsedRow[] }
  | { ok: false; error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<BulkParseResponse>
) {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ ok: false, error: "method_not_allowed" });
  }

  try {
    const contentType = req.headers["content-type"] || "";
    if (!contentType.includes("text/csv")) {
      return res
        .status(400)
        .json({ ok: false, error: "expected text/csv body" });
    }

    // Next.js already parses body for JSON/etc., but for CSV we want raw text.
    // If body is already string, use it; otherwise, reconstruct.
    const text =
      typeof req.body === "string"
        ? req.body
        : Buffer.isBuffer(req.body)
        ? req.body.toString("utf8")
        : "";

    if (!text) {
      return res
        .status(400)
        .json({ ok: false, error: "empty_body" });
    }

    const rows = parseCsv(text) as ParsedRow[];

    return res.status(200).json({ ok: true, rows });
  } catch (err: any) {
    console.error("bulk_parse_error", err);
    return res
      .status(500)
      .json({ ok: false, error: err?.message || "server_error" });
  }
}
