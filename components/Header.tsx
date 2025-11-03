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
          width={80}
          height={80}
          priority
        />
      </Link>

      <nav className="nav">
        {/* Core */}
        <Link href="/sell">Sell</Link>
        <Link href="/seller/orders">My Orders</Link>
        <Link href="/seller/wallet">Wallet</Link>
        <Link href="/admin/dashboard">Admin</Link>
        <Link href="/support">Support</Link>

        {/* Sellers */}
        <Link href="/seller/catalogue">Catalogue</Link>
        <Link href="/seller/insights">Insights</Link>
        <Link href="/seller/bulk-upload">Bulk Upload</Link>
        <Link href="/seller/statements">Statements</Link>
        <Link href="/seller/orders">Orders</Link>
        <Link href="/seller/wallet">Wallet</Link>

        {/* Buyers / Support */}
        <Link href="/store/seller-demo-001">Storefront</Link>
        <Link href="/concierge">Concierge</Link>
        <Link href="/support/disputes">Disputes</Link>
      </nav>

      <style jsx>{`
        .hdr {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          border-bottom: 1px solid #1a1a1a;
          position: sticky;
          top: 0;
          backdrop-filter: blur(4px);
        }
        .brand :global(img) {
          height: auto;
        }
        .nav {
          display: flex;
          gap: 16px;
          font-size: 14px;
          flex-wrap: wrap;
        }
        @media (max-width: 640px) {
          .hdr {
            padding: 10px 12px;
          }
          .nav {
            gap: 10px;
            font-size: 13px;
          }
          .brand :global(img) {
            width: 160px;
          }
        }
      `}</style>
    </header>
  );
}
