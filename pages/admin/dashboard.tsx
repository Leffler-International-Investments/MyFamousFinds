// FILE: /pages/admin/dashboard.tsx
import Head from "next/head";
import Header from "../../components/Header";
import Footer from "../../components/Footer";

export default function AdminDashboard(){
  // MVP: static demo metrics
  const kpis = [
    { label: "Active Listings", value: 128 },
    { label: "Orders (24h)", value: 23 },
    { label: "Pending Review", value: 7 },
    { label: "Open Tickets", value: 4 },
    { label: "Refunds In-Review", value: 2 },
    { label: "GMV (7d)", value: "$42,560" },
  ];
  return (
    <>
      <Head><title>Admin Dashboard — Famous Finds</title></Head>
      <Header />
      <main className="wrap">
        <h1>Admin Dashboard</h1>
        <p className="hint">Key metrics for monitoring listings, orders, and support.</p>

        <section className="grid">
          {kpis.map(k=>(
            <div key={k.label} className="card">
              <div className="val">{k.value}</div>
              <div className="lab">{k.label}</div>
            </div>
          ))}
        </section>

        <section className="panel">
          <h3>Recent Orders</h3>
          <table>
            <thead><tr><th>#</th><th>Buyer</th><th>Item</th><th>Total</th><th>Status</th></tr></thead>
            <tbody>
              <tr><td>FF-9201</td><td>A. Smith</td><td>Gucci Marmont Mini</td><td>$2,450</td><td>Shipped</td></tr>
              <tr><td>FF-9198</td><td>L. Jung</td><td>Dior Printed Dress</td><td>$1,950</td><td>Paid</td></tr>
              <tr><td>FF-9194</td><td>R. Cohen</td><td>LV Monogram Scarf</td><td>$620</td><td>Pending</td></tr>
            </tbody>
          </table>
        </section>
      </main>
      <Footer />

      <style jsx>{`
        .wrap{ max-width:1100px; margin:0 auto; padding:24px 16px; }
        .hint{ color:#aaa; margin:6px 0 18px; }
        .grid{ display:grid; grid-template-columns:repeat(3,1fr); gap:12px; }
        .card{ border:1px solid #1a1a1a; border-radius:12px; padding:16px; background:#0f0f0f; }
        .val{ font-size:24px; font-weight:700; }
        .lab{ color:#bbb; margin-top:4px; }
        .panel{ margin-top:20px; border:1px solid #1a1a1a; border-radius:12px; padding:16px; background:#0f0f0f; }
        table{ width:100%; border-collapse:separate; border-spacing:0 8px; }
        th,td{ text-align:left; padding:8px 10px; }
        tbody tr{ background:#0b0b0b; }
        @media (max-width:900px){ .grid{ grid-template-columns:1fr; } }
      `}</style>
    </>
  );
}
