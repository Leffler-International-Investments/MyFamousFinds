// FILE: /lib/statementStore.ts
import { adminDb } from "../utils/firebaseAdmin";

/**
 * A single statement line item.
 * You can adjust fields to match your Firestore schema.
 */
export type StatementRow = {
  date: string; // YYYY-MM-DD
  sku: string;
  title: string;
  action: "Sale" | "Refund";
  qty: number;
  gross: number;
  fee: number;
  net: number;
};

/**
 * Summary totals for the period.
 */
export type StatementSummary = {
  period: { start: string; end: string };
  totals: { listed: number; sold: number; refunded: number };
  money: { gross: number; fees: number; net: number; refunds: number };
};

function toDateString(d: Date | null | undefined): string {
  if (!d || isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Build a statement for a seller between `start` and `end` (inclusive).
 *
 * Assumed collections/fields – change these if your Firestore schema differs:
 *
 * - `orders` collection:
 *    - sellerId: string
 *    - listingId: string
 *    - listingTitle?: string
 *    - sku?: string
 *    - quantity?: number
 *    - totalGross?: number   // paid by buyer, before fees
 *    - fee?: number          // platform/processing fees
 *    - createdAt?: Timestamp
 *
 * - `refunds` collection (optional):
 *    - sellerId: string
 *    - orderId: string
 *    - gross?: number        // refunded amount
 *    - feeRefund?: number    // fee returned to seller, if any
 *    - createdAt?: Timestamp
 *
 * - `listings` collection:
 *    - sellerId: string
 *    - createdAt?: Timestamp
 */
export async function buildSellerStatement(
  sellerId: string,
  start: Date,
  end: Date
): Promise<{ summary: StatementSummary; rows: StatementRow[] }> {
  if (!adminDb) {
    throw new Error("Firebase Admin not configured — cannot build statement");
  }

  // Fetch once per collection; filter by date in JS to avoid extra indexes.
  const [ordersSnap, refundsSnap, listingsSnap] = await Promise.all([
    adminDb
      .collection("orders")
      .where("sellerId", "==", sellerId)
      .get(),
    adminDb
      .collection("refunds")
      .where("sellerId", "==", sellerId)
      .get(),
    adminDb
      .collection("listings")
      .where("sellerId", "==", sellerId)
      .get(),
  ]);

  const rows: StatementRow[] = [];

  let grossTotal = 0;
  let feesTotal = 0;
  let netTotal = 0;
  let refundsTotal = 0;
  let soldCount = 0;
  let refundCount = 0;
  let listedCount = 0;

  // Listings created in the period
  listingsSnap.forEach((doc) => {
    const data: any = doc.data() || {};
    const ts = data.createdAt;
    const createdAt: Date | null =
      ts && typeof ts.toDate === "function" ? ts.toDate() : null;
    if (createdAt && createdAt >= start && createdAt <= end) {
      listedCount += 1;
    }
  });

  // Orders → Sale rows
  ordersSnap.forEach((doc) => {
    const data: any = doc.data() || {};

    const ts = data.createdAt;
    const createdAt: Date | null =
      ts && typeof ts.toDate === "function" ? ts.toDate() : null;
    if (!createdAt || createdAt < start || createdAt > end) return;

    const qty = Number(data.quantity || 1);
    const gross = Number(data.totalGross ?? data.total ?? 0);
    const fee =
      data.fee !== undefined
        ? Number(data.fee)
        : Math.round(gross * 0.15 * 100) / 100; // fallback 15% fee if not stored
    const net = gross - fee;

    const sku = String(data.sku || data.listingId || doc.id);
    const title =
      String(data.listingTitle || data.title || "Sale") || "Sale";

    rows.push({
      date: toDateString(createdAt),
      sku,
      title,
      action: "Sale",
      qty,
      gross,
      fee,
      net,
    });

    grossTotal += gross;
    feesTotal += fee;
    netTotal += net;
    soldCount += 1;
  });

  // Refunds → Refund rows (negative amounts)
  refundsSnap.forEach((doc) => {
    const data: any = doc.data() || {};

    const ts = data.createdAt;
    const createdAt: Date | null =
      ts && typeof ts.toDate === "function" ? ts.toDate() : null;
    if (!createdAt || createdAt < start || createdAt > end) return;

    const gross = Number(data.gross ?? data.amount ?? 0);
    const feeRefund = Number(data.feeRefund ?? 0);

    const sku = String(data.sku || data.orderId || doc.id);
    const title = String(data.title || "Refund") || "Refund";

    // Treat refund as negative gross; feeRefund reduces fee total
    const net = -gross + feeRefund;
    const fee = -feeRefund;

    rows.push({
      date: toDateString(createdAt),
      sku,
      title,
      action: "Refund",
      qty: -1,
      gross: -gross,
      fee,
      net,
    });

    refundsTotal += gross;
    feesTotal += fee;
    netTotal += net;
    refundCount += 1;
  });

  // Sort by date ascending
  rows.sort((a, b) => (a.date > b.date ? 1 : a.date < b.date ? -1 : 0));

  const summary: StatementSummary = {
    period: {
      start: toDateString(start),
      end: toDateString(end),
    },
    totals: {
      listed: listedCount,
      sold: soldCount,
      refunded: refundCount,
    },
    money: {
      gross: grossTotal,
      fees: feesTotal,
      net: netTotal,
      refunds: refundsTotal,
    },
  };

  return { summary, rows };
}
