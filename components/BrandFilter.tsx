// FILE: /components/BrandFilter.tsx
import { useRouter } from "next/router";
export default function BrandFilter({ brands = ["Gucci","Dior","Louis Vuitton","Chanel","Prada"] }){
  const r = useRouter();
  function set(q:string,v:string){ const u = { ...r.query, [q]: v || undefined }; r.push({ pathname:r.pathname, query:u }, undefined, { shallow:true }); }
  return (
    <div className="bar">
      <select defaultValue={String(r.query.brand||"")} onChange={e=>set("brand", e.target.value)}>
        <option value="">All brands</option>
        {brands.map(b=><option key={b} value={b}>{b}</option>)}
      </select>
      <select defaultValue={String(r.query.condition||"")} onChange={e=>set("condition", e.target.value)}>
        <option value="">Any condition</option>
        <option>New</option><option>Excellent</option><option>Good</option><option>Fair</option>
      </select>
      <style jsx>{`
        .bar{ display:flex; gap:8px; }
        select{ background:#0b0b0b; border:1px solid #1a1a1a; border-radius:8px; padding:10px; color:#eaeaea; }
      `}</style>
    </div>
  );
}
