// FILE: /lib/statementStore.ts
import { adminDb } from "../utils/firebaseAdmin";

export type Row = {
  date: string;        // yyyy-mm-dd
  sku: string;
  title: string;
  action: "LISTED" | "SOLD" | "REFUNDED";
  qty: number;
  gross: number;
  fee: number;
  net: number;
};

function iso(d: any) {
  const dt = d?.toDate ? d.toDate() : new Date(d);
  return new Date(dt.getTime() - dt.getTimezoneOffset()*60000).toISOString().slice(0,10);
}

/** Pulls and normalizes rows for a seller between start..end */
export async function fetchSellerRows(sellerId: string, start: string, end: string): Promise<Row[]> {
  const startDT = new Date(start + "T00:00:00");
  const endDT = new Date(end + "T23:59:59");

  // LISTED rows (from listings)
  const listingsSnap = await adminDb
    .collection("listings")
    .where("sellerId", "==", sellerId)
    .where("createdAt", ">=", startDT)
    .where("createdAt", "<=", endDT)
    .get();

  const listed: Row[] = listingsSnap.docs.map(doc => {
    const d = doc.data();
    return {
      date: iso(d.createdAt),
      sku: d.sku || doc.id,
      title: d.title || "Listing",
      action: "LISTED",
      qty: 1,
      gross: 0,
      fee: 0,
      net: 0,
    };
  });

  // SOLD rows (from orders)
  const ordersSnap = await adminDb
    .collection("orders")
    .where("sellerId", "==", sellerId)
    .where("createdAt", ">=", startDT)
    .where("createdAt", "<=", endDT)
    .get();

  const sold: Row[] = ordersSnap.docs.map(doc => {
    const d = doc.data();
    const qty = Number(d.qty || 1);
    const price = Number(d.price || 0);
    const gross = price * qty;
    const feePct = Number(d.feePct || 0);      // e.g. 0.10 for 10%
    const feeFixed = Number(d.feeFixed || 0);  // e.g. $1.50
    const fee = +(gross * feePct + feeFixed).toFixed(2);
    const net = +(gross - fee).toFixed(2);
    return {
      date: iso(d.createdAt),
      sku: d.sku || doc.id,
      title: d.title || "Order",
      action: d.status === "REFUNDED" ? "REFUNDED" : "SOLD",
      qty,
      gross: d.status === "REFUNDED" ? 0 : gross,
      fee: d.status === "REFUNDED" ? 0 : fee,
      net: d.status === "REFUNDED" ? 0 : net,
    };
  });

  // REFUNDED rows (from refunds)
  const refundsSnap = await adminDb
    .collection("refunds")
    .where("sellerId", "==", sellerId)
    .where("createdAt", ">=", startDT)
    .where("createdAt", "<=", endDT)
    .get();

  const refunded: Row[] = refundsSnap.docs.map(doc => {
    const d = doc.data();
    const amt = Number(d.amount || 0);
    return {
      date: iso(d.createdAt),
      sku: d.sku || d.orderId || doc.id,
      title: d.title || "Refund",
      action: "REFUNDED",
      qty: 1,
      gross: -Math.abs(amt), // negative gross to show deduction
      fee: 0,
      net: -Math.abs(amt),
    };
  });

  // Merge + sort by date
  const all = [...listed, ...sold, ...refunded].sort((a,b)=> a.date.localeCompare(b.date));
  return all;
}

export function summarizeRows(rows: Row[], start: string, end: string) {
  const listed   = rows.filter(r=>r.action==="LISTED").length;
  const sold     = rows.filter(r=>r.action==="SOLD").length;
  const refunded = rows.filter(r=>r.action==="REFUNDED").length;
  const gross    = rows.reduce((a,r)=>a+r.gross,0);
  const fees     = rows.reduce((a,r)=>a+r.fee,0);
  const net      = rows.reduce((a,r)=>a+r.net,0);
  const refunds  = rows.filter(r=>r.action==="REFUNDED").reduce((a,r)=>a+Math.abs(r.gross),0);
  return { period:{start,end}, totals:{listed,sold,refunded}, money:{gross,fees,net,refunds} };
}

export function toCSV(rows: Row[], money: {gross:number; fees:number; net:number;}) {
  const hdr = "Date,SKU,Title,Action,Qty,Gross,Fee,Net";
  const body = rows.map(r=>[
    r.date, r.sku, `"${String(r.title).replace(/"/g,'""')}"`, r.action, r.qty,
    r.gross.toFixed(2), r.fee.toFixed(2), r.net.toFixed(2)
  ].join(","));
  const footer = ["","","","TOTALS","", money.gross.toFixed(2), money.fees.toFixed(2), money.net.toFixed(2)].join(",");
  return [hdr, ...body, footer].join("\n");
}
