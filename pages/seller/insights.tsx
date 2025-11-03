// FILE: /pages/seller/insights.tsx
import Head from "next/head";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useEffect, useState } from "react";

type Insight = { brand:string; avgPrice:number; sellThrough:number; timeToSellDays:number; volume:number; };
type Suggest = { suggested:number; low:number; high:number; confidence:number; comps:number; };

export default function SellerInsights(){
  const [brand, setBrand] = useState("Gucci");
  const [category, setCategory] = useState("Bags");
  const [insights, setInsights] = useState<Insight[]>([]);
  const [est, setEst] = useState<Suggest|null>(null);
  const [busy, setBusy] = useState(false);

  async function load(){
    const r = await fetch(`/api/seller/insights`, { cache:"no-store" });
    const j = await r.json(); setInsights(j.items||[]);
  }

  async function estimate(e:React.FormEvent<HTMLFormElement>){
    e.preventDefault(); setBusy(true);
    const fd = new FormData(e.currentTarget); 
    const body = Object.fromEntries(fd.entries());
    const r = await fetch(`/api/price-estimator`, { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify(body) });
    const j = await r.json(); setEst(j);
    setBusy(false);
  }

  useEffect(()=>{ load(); }, []);

  return (
    <>
      <Head><title>Seller Insights — Famous Finds</title></Head>
      <Header />
      <main className="wrap">
        <h1>Seller Insights</h1>
        <p className="hint">Brand performance, sell-through and a price estimator to help you set the right price.</p>

        <section className="grid">
          {insights.map(x=>(
            <div className="card" key={x.brand}>
              <div className="title">{x.brand}</div>
              <div className="k">Avg Sold: ${x.avgPrice.toFixed(0)}</div>
              <div className="k">Sell-through: {(x.sellThrough*100).toFixed(0)}%</div>
              <div className="k">Time to sell: {x.timeToSellDays}d</div>
              <div className="k">Volume (30d): {x.volume}</div>
            </div>
          ))}
        </section>

        <section className="panel">
          <h3>Pricing Estimator</h3>
          <form className="row" onSubmit={estimate}>
            <label>Brand<input name="brand" value={brand} onChange={e=>setBrand(e.target.value)} /></label>
            <label>Category<input name="category" value={category} onChange={e=>setCategory(e.target.value)} /></label>
            <label>Condition
              <select name="condition" defaultValue="Excellent">
                <option>New</option><option>Excellent</option><option>Good</option><option>Fair</option>
              </select>
            </label>
            <label>Original Price (USD)<input name="msrp" type="number" step="1" placeholder="3000" /></label>
            <button className="btn" disabled={busy}>{busy ? "Estimating…" : "Estimate Price"}</button>
          </form>
          {est && (
            <div className="est">
              <div><b>Suggested:</b> ${est.suggested.toFixed(0)} (range ${est.low.toFixed(0)} – ${est.high.toFixed(0)})</div>
              <div><b>Confidence:</b> {(est.confidence*100).toFixed(0)}% • <b>Comparables:</b> {est.comps}</div>
            </div>
          )}
        </section>
      </main>
      <Footer />
      <style jsx>{`
        .wrap{ max-width:1100px; margin:0 auto; padding:24px 16px; }
        .hint{ color:#aaa; margin:6px 0 18px; }
        .grid{ display:grid; grid-template-columns:repeat(3,1fr); gap:12px; }
        .card{ border:1px solid #1a1a1a; border-radius:12px; padding:14px; background:#0f0f0f; }
        .title{ font-weight:700; margin-bottom:6px; }
        .k{ color:#ddd; }
        .panel{ margin-top:18px; border:1px solid #1a1a1a; border-radius:12px; padding:14px; background:#0f0f0f; }
        .row{ display:grid; grid-template-columns: repeat(5,1fr); gap:10px; }
        label{ display:flex; flex-direction:column; gap:6px; font-size:14px; color:#ddd; }
        input,select{ background:#0b0b0b; border:1px solid #1a1a1a; border-radius:8px; padding:10px; color:#eaeaea; }
        .btn{ background:#fff; color:#000; border:none; border-radius:8px; padding:10px 14px; font-weight:700; align-self:end; }
        .est{ margin-top:12px; background:#0b0b0b; border:1px solid #1a1a1a; border-radius:10px; padding:12px; }
        @media (max-width:900px){ .grid{ grid-template-columns:1fr; } .row{ grid-template-columns:1fr; } }
      `}</style>
    </>
  );
}
