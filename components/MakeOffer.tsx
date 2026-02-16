// FILE: /components/MakeOffer.tsx
import { useState } from "react";
import { auth } from "../utils/firebaseClient";
export default function MakeOffer({ productId }:{ productId:string }){
  const [price,setPrice]=useState(""); const [note,setNote]=useState(""); const [ok,setOk]=useState(false); const [err,setErr]=useState("");
  async function send(){
    setErr("");
    const user = auth?.currentUser;
    if (!user) { setErr("Please sign in to make an offer."); return; }
    const token = await user.getIdToken();
    const r = await fetch("/api/offers/create",{ method:"POST", headers:{ "Content-Type":"application/json", Authorization:`Bearer ${token}` }, body: JSON.stringify({ productId, price:Number(price), message:note })});
    if (r.ok) setOk(true); else { const j = await r.json().catch(()=>({})); setErr(j.error || "Failed to send offer"); }
  }
  return (
    <div className="wrap">
      <input placeholder="Your offer (USD)" value={price} onChange={e=>setPrice(e.target.value)} />
      <input placeholder="Message (optional)" value={note} onChange={e=>setNote(e.target.value)} />
      <button className="btn" onClick={send}>Send Offer</button>
      {ok && <div className="ok">Offer sent!</div>}
      {err && <div className="err">{err}</div>}
      <style jsx>{`
        .wrap{ display:flex; gap:6px; align-items:center; flex-wrap:wrap; }
        input{ background:#0b0b0b; border:1px solid #1a1a1a; border-radius:8px; padding:10px; color:#eaeaea; }
        .btn{ background:#fff; color:#000; border:none; border-radius:8px; padding:10px 14px; font-weight:700; }
        .ok{ color:#4ade80; }
        .err{ color:#f87171; font-size:13px; }
      `}</style>
    </div>
  );
}
