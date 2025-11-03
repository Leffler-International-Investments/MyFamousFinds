// FILE: /pages/seller/statements.tsx
import Head from "next/head";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import Link from "next/link";
import { useEffect, useState } from "react";

type Row = {
  date: string; sku: string; title: string; action: "LISTED"|"SOLD"|"REFUNDED";
  qty: number; gross: number; fee: number; net: number;
};
type Summary = {
  period: { start: string; end: string };
  totals: { listed: number; sold: number; refunded: number };
  money: { gross: number; fees: number; net: number; refunds: number };
};

export default function SellerStatements(){
  const today = new Date().toISOString().slice(0,10);
  const first = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0,10);
  const [start, setStart] = useState(first);
  const [end, setEnd] = useState(today);
  const [rows, setRows] = useState<Row[]>([]);
  const [sum, setSum] = useState<Summary | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function load(){
    setBusy(true); setErr("");
    try{
      const r = await fetch(`/api/seller/statement?start=${start}&end=${end}`, { cache:"no-store" });
      if(!r.ok) throw new Error("Failed to load statement");
      const j = await r.json();
      setRows(j.rows); setSum(j.summary);
    }catch(e:any){ setErr(e.message || "Error"); }
    finally{ setBusy(false); }
  }

  useEffect(()=>{ load(); }, []);

  const csvHref = `/api/seller/statement?start=${start}&end=${end}&format=csv`;
  const printHref = `/seller/statement-print?start=${start}&end=${end}`;

  return (
    <>
      <Head><title>Seller Statements — Famous Finds</title></Head>
      <Header />
      <main className="wrap">
        <h1>Statements</h1>
        <p className="hint">Download your activity (products uploaded, sold, refunds) and income (gross, fees, net).</p>

        <form className="bar" onSubmit={(e)=>{e.preventDefault(); load();}}>
          <label>From<input type="date" value={start} onChange={(e)=>setStart(e.target.value)} /></label>
          <label>To<input type="date" value={end} onChange={(e)=>setEnd(e.target.value)} /></label>
          <button className="btn" disabled={busy}>{busy ? "Loading…" : "Refresh"}</button>
          <a className="btn ghost" href={csvHref}>Download CSV</a>
          <Link className="btn ghost" href={printHref} target="_blank">Export PDF (Print)</Link>
        </form>

        {err && <div className="err">{err}</div>}

        {sum && (
          <section className="summary">
            <div className="card"><div className="lab">Listed</div><div className="val">{sum.totals.listed}</div></div>
            <div className="card"><div className="lab">Sold</div><div className="val">{sum.totals.sold}</div></div>
            <div className="card"><div className="lab">Refunded</div><div className="val">{sum.totals.refunded}</div></div>
            <div className="card"><div className="lab">Gross</div><div className="val">${sum.money.gross.toFixed(2)}</div></div>
            <div className="card"><div className="lab">Fees</div><div className="val">-${sum.money.fees.toFixed(2)}</div></div>
            <div className="card"><div className="lab">Net</div><div className="val">${sum.money.net.toFixed(2)}</div></div>
          </section>
        )}

        <section className="tbl">
          <table>
            <thead>
              <tr>
                <th>Date</th><th>SKU</th><th>Title</th><th>Action</th><th>Qty</th>
                <th>Gross</th><th>Fee</th><th>Net</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r,i)=>(
                <tr key={i}>
                  <td>{r.date}</td><td>{r.sku}</td><td>{r.title}</td><td>{r.action}</td>
                  <td>{r.qty}</td>
                  <td>${r.gross.toFixed(2)}</td>
                  <td>${r.fee.toFixed(2)}</td>
                  <td>${r.net.toFixed(2)}</td>
                </tr>
              ))}
              {!rows.length && !busy && <tr><td colSpan={8} style={{textAlign:"center",opacity:.7}}>No activity in this period.</td></tr>}
            </tbody>
          </table>
        </section>
      </main>
      <Footer />

      <style jsx>{`
        .wrap{ max-width:1100px; margin:0 auto; padding:24px 16px; }
        .hint{ color:#aaa; margin:6px 0 18px; }
        .bar{ display:flex; flex-wrap:wrap; gap:10px; align-items:end; margin-bottom:14px; }
        label{ display:flex; flex-direction:column; gap:6px; color:#ddd; font-size:14px; }
        input{ background:#0b0b0b; border:1px solid #1a1a1a; border-radius:8px; color:#eaeaea; padding:10px; }
        .btn{ background:#fff; color:#000; border:none; border-radius:8px; padding:10px 14px; font-weight:700; }
        .btn.ghost{ background:#0f0f0f; color:#fff; border:1px solid #1a1a1a; }
        .err{ color:#f87171; margin-bottom:10px; }
        .summary{ display:grid; grid-template-columns:repeat(3,1fr); gap:12px; margin:10px 0 18px; }
        .card{ border:1px solid #1a1a1a; border-radius:12px; padding:14px; background:#0f0f0f; }
        .lab{ color:#bbb; margin-bottom:4px; }
        .val{ font-size:20px; font-weight:700; }
        .tbl{ border:1px solid #1a1a1a; border-radius:12px; padding:12px; background:#0f0f0f; }
        table{ width:100%; border-collapse:separate; border-spacing:0 8px; }
        th,td{ text-align:left; padding:8px 10px; }
        tbody tr{ background:#0b0b0b; }
        @media (max-width:900px){ .summary{ grid-template-columns:1fr; } }
      `}</style>
    </>
  );
}
