// FILE: /components/Header.tsx
import Link from "next/link";

export default function Header() {
  return (
    <header className="hdr">
      <div className="wrap">
        <div className="left">
          <Link href="/" className="brand">
            <img src="/FamousfindsLogo.png" alt="Famous Finds" />
          </Link>
        </div>

        <nav className="nav">
          <Link href="/category/bags">Bags</Link>
          <Link href="/category/watches">Watches</Link>
          <Link href="/category/jewelry">Jewelry</Link>
          <Link href="/category/shoes">Shoes</Link>
          <Link href="/category/men">Men</Link>
          <Link href="/category/women">Women</Link>
        </nav>

        <div className="right">
          <Link href="/admin" className="sell">Sell</Link>
          <Link href="/admin">Admin</Link>
          <Link href="#">Help</Link>
          <Link href="#">Account</Link>
        </div>
      </div>

      <style jsx>{`
        .hdr { background:#0b0b0b; border-bottom:1px solid #1a1a1a; position:sticky; top:0; z-index:50; }
        .wrap { max-width:1200px; margin:0 auto; padding:10px 16px; display:flex; align-items:center; justify-content:space-between; gap:16px; }
        .brand img { height:28px; width:auto; display:block; }
        .nav { display:none; gap:14px; }
        .nav a, .right a { color:#eaeaea; opacity:0.9; font-size:14px; }
        .nav a:hover, .right a:hover { opacity:1; }
        .right { display:flex; gap:14px; align-items:center; }
        .sell { background:#fff; color:#000; padding:6px 10px; border-radius:8px; font-weight:700; }
        @media (min-width:900px){ .nav{display:flex;} }
      `}</style>
    </header>
  );
}
