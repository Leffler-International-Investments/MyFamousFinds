// FILE: /pages/seller/statement-print.tsx
// Print-friendly page so sellers can "Save as PDF" from the browser.
import Head from "next/head";
import { useEffect, useState } from "react";

type Row = { date:string; sku:string; title:string; action:string; qty:number; gross:number; fee:number; net:number; };
type Summary = { money: { gross:number; fees:number; net:number }; };

export default function StatementPrint(){
  const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  const start = params.get("start") || "";
  const end = params.get("end") || "";
  const [rows, setRows] = useState<Row[]>([]);
  const [sum, setSum] = useState<Summary | null>(null);

  useEffect(()=>{
    (async()=>{
      const r = await fetch(`/api/seller/statement?start=${start}&end=${end}`, { cache:"no-store" });
      const j = await r.json();
      setRows(j.rows); setSum(j.summary);
      setTimeout(()=>window.print(), 400); // auto open print
    })();
  }, []);

  return (
    <>
      <Head><title>Statement {start} – {end}</title></Head>
      <main>
        <h1>Famous Finds — Seller Statement</h1>
        <p className="period">Period: {start} to {end}</p>

        <table className="list">
          <thead>
            <tr><th>Date</th><th>SKU</th><th>Title</th><th>Action</th><th>Qty</th><th>Gross</th><th>Fee</th><th>Net</th></tr>
          </thead>
          <tbody>
            {rows.map((r,i)=>(
              <tr key={i}>
                <td>{r.date}</td><td>{r.sku}</td><td>{r.title}</td><td>{r.action}</td><td>{r.qty}</td>
                <td>${r.gross.toFixed(2)}</td><td>${r.fee.toFixed(2)}</td><td>${r.net.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {sum && (
          <div className="totals">
            <div><strong>Gross:</strong> ${sum.money.gross.toFixed(2)}</div>
            <div><strong>Fees:</strong> -${sum.money.fees.toFixed(2)}</div>
            <div><strong>Net:</strong> ${sum.money.net.toFixed(2)}</div>
          </div>
        )}
      </main>

      <style jsx>{`
        main{ padding:24px; font-family:system-ui, -apple-system, Segoe UI, Roboto, sans-serif; color:#111; }
        h1{ margin:0 0 4px; }
        .period{ margin:0 0 16px; }
        .list{ width:100%; border-collapse:collapse; }
        th,td{ border:1px solid #ccc; padding:6px 8px; font-size:12px; }
        .totals{ margin-top:12px; display:flex; gap:24px; }
        @media print {
          body{ background:white; }
        }
      `}</style>
    </>
  );
}
