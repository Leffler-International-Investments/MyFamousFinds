// FILE: /pages/admin/index.tsx
import Head from "next/head";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useState } from "react";

export default function Admin() {
  const [preview, setPreview] = useState<string | null>(null);

  return (
    <>
      <Head><title>Sell | Admin – Famous Finds</title></Head>
      <Header />
      <main className="wrap">
        <h1>Sell an Item</h1>
        <p className="hint">Demo form (client-side). Upload preview only.</p>

        <form className="form" onSubmit={(e)=>{e.preventDefault(); alert("Demo submit. Data captured in console.");}}>
          <div className="grid">
            <label>Title<input name="title" placeholder="e.g. Gucci Marmont Mini" required /></label>
            <label>Brand<input name="brand" placeholder="e.g. GUCCI" /></label>
            <label>Price (USD)<input name="price" type="number" min="1" step="1" placeholder="2450" required /></label>
            <label>Category
              <select name="category" defaultValue="bags">
                <option value="bags">Bags</option><option value="watches">Watches</option>
                <option value="jewelry">Jewelry</option><option value="shoes">Shoes</option>
                <option value="men">Men</option><option value="women">Women</option>
              </select>
            </label>
            <label className="col2">Description
              <textarea name="description" rows={5} placeholder="Condition, size, inclusions, receipts…" />
            </label>
            <label className="col2">Upload Image
              <input type="file" accept="image/*" onChange={(e)=>{
                const f = e.target.files?.[0];
                if(!f) return;
                const url = URL.createObjectURL(f);
                setPreview(url);
              }} />
            </label>
          </div>

          {preview && (
            <div className="preview">
              <img src={preview} alt="preview" />
            </div>
          )}

          <button className="btn" type="submit">Submit</button>
        </form>
      </main>
      <Footer />

      <style jsx>{`
        .wrap{ max-width:900px; margin:0 auto; padding:24px 16px; }
        .hint{ color:#aaa; margin:6px 0 18px; }
        .form{ border:1px solid #1a1a1a; border-radius:12px; padding:18px; background:#0f0f0f; }
        .grid{ display:grid; grid-template-columns:1fr 1fr; gap:14px; }
        label{ display:flex; flex-direction:column; gap:6px; color:#ddd; font-size:14px; }
        input,select,textarea{ background:#0b0b0b; border:1px solid #1a1a1a; border-radius:8px; color:#eaeaea; padding:10px; }
        .col2{ grid-column:1 / -1; }
        .preview{ margin:12px 0; }
        .preview img{ width:100%; max-height:360px; object-fit:cover; border-radius:10px; }
        .btn{ background:#fff; color:#000; border:none; border-radius:8px; padding:10px 18px; font-weight:700; }
        @media (max-width:720px){ .grid{ grid-template-columns:1fr; } }
      `}</style>
    </>
  );
}
