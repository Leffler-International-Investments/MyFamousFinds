// FILE: /pages/concierge.tsx
import Head from "next/head";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useState } from "react";

export default function Concierge(){
  const [sent,setSent]=useState(false);
  async function submit(e:React.FormEvent<HTMLFormElement>){
    e.preventDefault();
    const fd = Object.fromEntries(new FormData(e.currentTarget).entries());
    await fetch("/api/concierge",{ method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify(fd) });
    setSent(true);
  }
  return (
    <>
      <Head><title>Concierge — Famous Finds</title></Head>
      <Header />
      <main className="wrap">
        <h1>Concierge Service</h1>
        <p className="hint">White-glove pick-up, authentication and pricing support for high-value items.</p>
        {sent ? <div className="ok">Thanks — we’ll contact you shortly.</div> : (
          <form className="form" onSubmit={submit}>
            <label>Name<input name="name" required /></label>
            <label>Email<input name="email" type="email" required /></label>
            <label>City<input name="city" required /></label>
            <label>Item details<textarea name="details" rows={4} /></label>
            <button className="btn">Request Concierge</button>
          </form>
        )}
      </main>
      <Footer />
      <style jsx>{`
        .wrap{ max-width:800px; margin:0 auto; padding:24px 16px; }
        .hint{ color:#aaa; margin:6px 0 12px; }
        .form{ display:grid; gap:10px; }
        label{ display:flex; flex-direction:column; gap:6px; color:#ddd; font-size:14px; }
        input,textarea{ background:#0b0b0b; border:1px solid #1a1a1a; border-radius:8px; color:#eaeaea; padding:10px; }
        .btn{ background:#fff; color:#000; border:none; border-radius:8px; padding:10px 14px; font-weight:700; width:max-content; }
        .ok{ border:1px solid #1a1a1a; background:#0f0f0f; padding:16px; border-radius:10px; }
      `}</style>
    </>
  );
}
