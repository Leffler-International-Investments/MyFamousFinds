// FILE: /components/Header.tsx
import Image from "next/image";
import Link from "next/link";

export default function Header() {
  return (
    <header className="hdr">
      <Link href="/" className="brand">
        <Image
          src="/FamousfindsLogo.png"
          alt="Famous Finds"
          width={220}
          height={80}
          priority
        />
      </Link>

      <nav className="nav">
        <Link href="/sell">Sell</Link>
        <Link href="/admin">Admin</Link>
        <Link href="/help">Help</Link>
      </nav>

      <style jsx>{`
        .hdr{
          display:flex; align-items:center; justify-content:space-between;
          padding:12px 12px; border-bottom:1px solid #1a1a1a; position:sticky; top:0; backdrop-filter:blur(4px);
        }
        .brand :global(img){ height:auto; }
        .nav{ display:flex; gap:16px; font-size:14px; }
        @media (max-width:640px){
          .hdr{ padding:10px 12px; }
          .nav{ gap:12px; font-size:13px; }
          .brand :global(img){ width:160px; } /* smaller logo on mobile */
        }
      `}</style>
    </header>
  );
}

