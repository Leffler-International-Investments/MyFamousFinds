// FILE: /utils/statement.ts
// Types + mock data + helpers for Seller Statements (MVP).

export type StatementRow = {
  date: string;            // ISO date
  sku: string;
  title: string;
  action: "LISTED" | "SOLD" | "REFUNDED";
  qty: number;
  gross: number;           // sale price * qty
  fee: number;             // platform fee
  net: number;             // gross - fee - refunds
};

export type StatementSummary = {
  period: { start: string; end: string };
  totals: { listed: number; sold: number; refunded: number };
  money: { gross: number; fees: number; net: number; refunds: number };
};

export function mockRows(sellerId: string, start: string, end: string): StatementRow[] {
  // TODO: Replace with real DB query (orders + listings + refunds)
  // Mock illustrates all columns.
  const base: StatementRow[] = [
    { date: "2025-10-01", sku: "GG-1001", title: "Gucci Marmont Mini", action: "SOLD", qty: 1, gross: 2450, fee: 245, net: 2205 },
    { date: "2025-10-03", sku: "DR-2042", title: "Dior Printed Dress", action: "LISTED", qty: 1, gross: 0, fee: 0, net: 0 },
    { date: "2025-10-07", sku: "LV-7782", title: "LV Monogram Scarf", action: "SOLD", qty: 1, gross: 620, fee: 62, net: 558 },
    { date: "2025-10-09", sku: "CH-5510", title: "Chanel Slingbacks", action: "SOLD", qty: 1, gross: 1250, fee: 125, net: 1125 },
    { date: "2025-10-12", sku: "LV-7782", title: "LV Monogram Scarf", action: "REFUNDED", qty: 1, gross: -620, fee: 0, net: -620 },
  ];
  const s = new Date(start), e = new Date(end);
  return base.filter(r => {
    const d = new Date(r.date);
    return d >= s && d <= e;
  });
}

export function summarize(rows: StatementRow[], start: string, end: string): StatementSummary {
  const listed   = rows.filter(r=>r.action==="LISTED").length;
  const sold     = rows.filter(r=>r.action==="SOLD").length;
  const refunded = rows.filter(r=>r.action==="REFUNDED").length;
  const gross    = rows.reduce((a,r)=>a+r.gross,0);
  const fees     = rows.reduce((a,r)=>a+r.fee,0);
  const net      = rows.reduce((a,r)=>a+r.net,0);
  const refunds  = rows.filter(r=>r.action==="REFUNDED").reduce((a,r)=>a+Math.abs(r.gross),0);
  return { period: { start, end }, totals: { listed, sold, refunded }, money: { gross, fees, net, refunds } };
}

export function toCSV(rows: StatementRow[], summary: StatementSummary): string {
  const hdr = "Date,SKU,Title,Action,Qty,Gross,Fee,Net";
  const lines = rows.map(r => [
    r.date, r.sku, `"${r.title.replace(/"/g,'""')}"`, r.action, r.qty, r.gross.toFixed(2), r.fee.toFixed(2), r.net.toFixed(2)
  ].join(","));
  const s = summary.money;
  const footer = [
    "", "", "", "TOTALS", "",
    s.gross.toFixed(2), s.fees.toFixed(2), s.net.toFixed(2)
  ].join(",");
  return [hdr, ...lines, footer].join("\n");
}
