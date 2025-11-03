// FILE: /pages/seller/bulk-upload.tsx
import Head from "next/head";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useState } from "react";

export default function BulkUpload(){
  const [rows,setRows]=useState<any[]>([]);
  async function onFile(e:React.ChangeEvent<HTMLInputElement>){
    const f = e.target.files?.[0]; if(!f) return;
    const text = await f.text();
    const r = await fetch("/api/seller/bulk-parse",{method:"POST",headers:{ "Content-Type":"text/csv" }, body:text});
    const j = await r.json(); setRows(j.rows||[]);
  }
  async function commit(){
    await fetch("/api/seller/bulk-commit",{method:"POST",headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ rows })});
    alert("Uploaded!");
  }
  return (
    <>
      <Head><title>Bulk Upload — Famous Finds</title></Head>
      <Header />
      <main className="wrap">
        <h1>Bulk Upload</h1>
        <p className="hint">Upload CSV with: <code>brand,title,category,sku,price,condition,imageUrl</code></p>
        <input type="file" accept=".csv,text/csv" onChange={onFile} />
        {!!rows.length && (
          <>
            <div className="count">{rows.length} items parsed.</div>
            <button className="btn" onClick={commit}>Create Listings</button>
          </>
        )}
      </main>
      <Footer />
      <style jsx>{`
        .wrap{ max-width:900px; margin:0 auto; padding:24px 16px; }
        .hint{ color:#aaa; margin:6px 0 12px; }
        .btn{ margin-top:10px; background:#fff; color:#000; border:none; border-radius:8px; padding:10px 14px; font-weight:700; }
        .count{ margin-top:10px; }
      `}</style>
    </>
  );
}
