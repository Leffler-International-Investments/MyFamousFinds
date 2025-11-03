// FILE: /pages/seller/wallet.tsx
import Head from "next/head";
import Header from "../../components/Header";
import Footer from "../../components/Footer";

export default function SellerWallet(){
  const stats = [
    { k:"Available Balance", v:"$1,840" },
    { k:"Pending (7d hold)", v:"$2,510" },
    { k:"Total Earned (30d)", v:"$6,220" },
  ];
  return (
    <>
      <Head><title>Seller Wallet — Famous Finds</title></Head>
      <Header />
      <main className="wrap">
        <h1>Wallet & Earnings</h1>
        <p className="hint">Overview of earnings and withdrawals.</p>

        <section className="grid">
          {stats.map(s=>(
            <div key={s.k} className="card">
              <div className="k">{s.k}</div>
              <div className="v">{s.v}</div>
            </div>
          ))}
        </section>

        <section className="panel">
          <h3>Withdraw Funds</h3>
          <p className="sub">MVP: Simulated — wire to Stripe Connect later.</p>
          <button className="btn">Withdraw to Bank</button>
        </section>
      </main>
      <Footer />

      <style jsx>{`
        .wrap{ max-width:900px; margin:0 auto; padding:24px 16px; }
        .hint{ color:#aaa; margin:6px 0 18px; }
        .grid{ display:grid; grid-template-columns:repeat(3,1fr); gap:12px; }
        .card{ border:1px solid #1a1a1a; border-radius:12px; padding:16px; background:#0f0f0f; }
        .k{ color:#bbb; margin-bottom:6px; }
        .v{ font-size:22px; font-weight:700; }
        .panel{ margin-top:18px; border:1px solid #1a1a1a; border-radius:12px; padding:16px; background:#0f0f0f; }
        .sub{ color:#bbb; margin:6px 0 12px; }
        .btn{ background:#fff; color:#000; border:none; border-radius:8px; padding:10px 18px; font-weight:700; }
        @media (max-width:900px){ .grid{ grid-template-columns:1fr; } }
      `}</style>
    </>
  );
}
