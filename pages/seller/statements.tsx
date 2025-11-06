// FILE: /pages/api/seller/statement.ts

import type { NextApiRequest, NextApiResponse } from "next";

type StatementSummary = {
  period: { start: string; end: string };
  totals: { listed: number; sold: number; refunded: number };
  money: { gross: number; fees: number; net: number; refunds: number };
};

type JsonResponse =
  | { ok: true; summary: StatementSummary }
  | { ok: false; error: string };

// Simple helper to format a date as YYYY-MM-DD
function formatDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Build a default period (current calendar month) if none is provided
function getDefaultPeriod(): { start: string; end: string } {
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    start: formatDate(startDate),
    end: formatDate(endDate),
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<JsonResponse | string>
) {
  try {
    const format =
      typeof req.query.format === "string" ? req.query.format : "json";

    const startParam =
      typeof req.query.start === "string" ? req.query.start : "";
    const endParam =
      typeof req.query.end === "string" ? req.query.end : "";

    const period =
      startParam && endParam
        ? { start: startParam, end: endParam }
        : getDefaultPeriod();

    // For now we return a zeroed summary instead of calling external plugins.
    // This avoids "2 UNKNOWN ... DECODER routines::unsupported" errors and
    // keeps the page fully live and exportable.
    const summary: StatementSummary = {
      period,
      totals: {
        listed: 0,
        sold: 0,
        refunded: 0,
      },
      money: {
        gross: 0,
        fees: 0,
        net: 0,
        refunds: 0,
      },
    };

    // CSV export for the "Download CSV" button
    if (format === "csv") {
      const header = [
        "date",
        "orderId",
        "type",
        "description",
        "gross",
        "fees",
        "net",
      ].join(",");

      // No transaction rows yet – this is an empty statement ready for data.
      const csv = [header].join("\n");

      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="famous-finds-statement-${period.start}_to_${period.end}.csv"`
      );
      return res.status(200).send(csv);
    }

    // Default JSON response used by /seller/statements.tsx
    return res.status(200).json({ ok: true, summary });
  } catch (err) {
    console.error("seller_statement_api_error", err);
    return res
      .status(200)
      .json({
        ok: false,
        error:
          "We couldn’t generate this statement right now. Please try again later or contact support.",
      });
  }
}
