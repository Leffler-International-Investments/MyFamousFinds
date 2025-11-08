// FILE: /pages/api/seller/orders.ts
import type { NextApiRequest, NextApiResponse } from "next";

/**
 * Temporary stub API for seller orders.
 *
 * This is intentionally simple so your Vercel build compiles without
 * depending on getSellerId(...) or any unfinished Firestore indexes.
 *
 * The Seller Orders page (/pages/seller/orders.tsx) calls this endpoint
 * and expects:
 *   { ok: boolean; orders: Array<{ id: string; item: string; buyer: string; total: string; status: string }> }
 *
 * Right now we just return an empty list (no orders yet).
 * When you are ready to wire real data, you can replace the contents of
 * handler() with Firestore / Stripe logic.
 */

type OrderRow = {
  id: string;
  item: string;
  buyer: string;
  total: string; // formatted like "$1,200"
  status: string;
};

type OrdersResponse =
  | { ok: true; orders: OrderRow[] }
  | { ok: false; error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<OrdersResponse>
) {
  if (req.method !== "GET") {
    return res
      .status(405)
      .json({ ok: false, error: "Method not allowed. Use GET." });
  }

  // TODO: when you add real data, look up the current seller here
  // and fetch their orders from Firestore / Stripe.
  // For now, we return an empty array so the UI loads without errors.
  const orders: OrderRow[] = [];

  return res.status(200).json({ ok: true, orders });
}
