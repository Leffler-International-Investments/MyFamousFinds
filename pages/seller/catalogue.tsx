// FILE: /pages/seller/catalogue.tsx
import Head from "next/head";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import Link from "next/link";

export default function Catalogue(){
  // TODO: fetch seller listings from Firestore
  const items = [
    { id:"g1", title:"Gucci Marmont Mini", price:2450, status:"Active" },
    { id:"d1", title:"Dior Printed Dress", price:1950, status:"Active" },
  ];
  return (
    <>
      <Head><title>My Catalogue — Famous Finds</title></Head>
      <Header />
      <main className="wrap">
        <h1>My Catalogue</h1>
        <div className="actions">
          <Link className="btn" href="/seller/bulk-upload">Bulk Upload CSV</Link>
          <Link className="btn ghost" href="/sell">Add Single Item</Link>
        </div>
        <table className="tbl">
          <thead><tr><th>Title</th><th>Price</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {items.map(x=>(
              <tr key={x.id}><td>{x.title}</td><td>${x.price}</td><td>{x.status}</td>
                <td><Link className="link" href={`/product/${x.id}`}>View</Link></td></tr>
            ))}
          </tbody>
        </table>
      </main>
      <Footer />
      <style jsx>{`
        .wrap{ max-width:1000px; margin:0 auto; padding:24px 16px; }
        .actions{ display:flex; gap:8px; margin:10px 0 12px; }
        .btn{ background:#fff; color:#000; border:none; border-radius:8px; padding:10px 14px; font-weight:700; }
        .btn.ghost{ background:#0f0f0f; color:#fff; border:1px solid #1a1a1a; }
        .tbl{ width:100%; border-collapse:separate; border-spacing:0 8px; }
        th,td{ padding:8px 10px; text-align:left; }
        tbody tr{ background:#0b0b0b; }
        .link{ text-decoration:underline; }
      `}</style>
    </>
  );
}
