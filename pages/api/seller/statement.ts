// FILE: /pages/api/seller/statement.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getSellerId } from "../../../utils/authServer";
import {
  buildSellerStatement,
  StatementSummary,
  StatementRow,
} from "../../../lib/statementStore";

type StatementJsonResponse =
  | {
      ok: true;
      start: string;
      end: string;
      summary: StatementSummary;
      rows: StatementRow[];
    }
  | { ok: false; error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<StatementJsonResponse | string>
) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "method_not_allowed" });
  }

  try {
    const sellerId = await getSellerId(req);
    if (!sellerId) {
      return res.status(401).json({ ok: false, error: "unauthorized" });
    }

    const { start: startStr, end: endStr, format } = req.query;

    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const pad = (n: number) => String(n).padStart(2, "0");

    const startDateString =
      typeof startStr === "string"
        ? startStr
        : `${monthStart.getFullYear()}-${pad(monthStart.getMonth() + 1)}-01`;

    const endDateString =
      typeof endStr === "string"
        ? endStr
        : `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(
            today.getDate()
          )}`;

    const startDate = new Date(startDateString + "T00:00:00.000Z");
    const endDate = new Date(endDateString + "T23:59:59.999Z");

    const { summary, rows } = await buildSellerStatement(
      sellerId,
      startDate,
      endDate
    );

    if (format === "csv") {
      const header = [
        "date",
        "sku",
        "title",
        "action",
        "qty",
        "gross",
        "fee",
        "net",
      ];
      const lines = [
        header.join(","),
        ...rows.map((r) =>
          [
            r.date,
            r.sku,
            (r.title || "").replace(/,/g, " "),
            r.action,
            r.qty,
            r.gross.toFixed(2),
            r.fee.toFixed(2),
            r.net.toFixed(2),
          ].join(",")
        ),
      ];
      const csv = lines.join("\n");

      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="statement-${startDateString}-to-${endDateString}.csv"`
      );
      return res.status(200).send(csv);
    }

    return res.status(200).json({
      ok: true,
      start: startDateString,
      end: endDateString,
      summary,
      rows,
    });
  } catch (err: any) {
    console.error("seller_statement_error", err);
    return res
      .status(500)
      .json({ ok: false, error: err?.message || "server_error" });
  }
}
