// FILE: /pages/seller/orders.tsx
import Head from "next/head";
import Header from "../../components/Header";
import Footer from "../../components/Footer";

export default function SellerOrders(){
  const rows = [
    { id:"FF-9201", item:"Gucci Marmont Mini", buyer:"A. Smith", total:"$2,450", status:"Awaiting Shipment" },
    { id:"FF-9191", item:"Chanel Slingbacks", buyer:"M. Rossi", total:"$1,250", status:"Shipped" },
  ];
  return (
    <>
      <Head><title>Seller Orders — Famous Finds</title></Head>
      <Header />
      <main className="wrap">
        <h1>My Orders</h1>
        <p className="hint">View new orders and mark items as shipped.</p>
        <div className="tbl">
          <table>
            <thead><tr><th>Order</th><th>Item</th><th>Buyer</th><th>Total</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {rows.map(r=>(
                <tr key={r.id}>
                  <td>{r.id}</td><td>{r.item}</td><td>{r.buyer}</td><td>{r.total}</td><td>{r.status}</td>
                  <td><button className="btn">Mark as Shipped</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
      <Footer />
      <style jsx>{`
        .wrap{ max-width:1000px; margin:0 auto; padding:24px 16px; }
        .hint{ color:#aaa; margin:6px 0 18px; }
        .tbl{ border:1px solid #1a1a1a; border-radius:12px; padding:12px; background:#0f0f0f; }
        table{ width:100%; border-collapse:separate; border-spacing:0 8px; }
        th,td{ text-align:left; padding:8px 10px; }
        tbody tr{ background:#0b0b0b; }
        .btn{ background:#fff; color:#000; border:none; border-radius:8px; padding:8px 12px; font-weight:700; }
      `}</style>
    </>
  );
}
