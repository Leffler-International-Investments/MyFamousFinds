import Link from "next/link";
import Image from "next/image";

export default function Header() {
  return (
    <header className="ff-header">
      <div className="ff-wrap">
        <Link href="/" className="ff-brand" aria-label="Famous Finds">
          <Image
            src="/famousfindslogo.png"
            alt="Famous Finds Logo"
            width={160}
            height={40}
            priority
          />
        </Link>
        <nav className="ff-nav">
          <Link href="/sell">Sell</Link>
          <Link href="/help">Help</Link>
          <Link href="/account">Account</Link>
        </nav>
      </div>
      <style jsx>{`
        .ff-header {
          background: #0b0b0b;
          border-bottom: 1px solid #1e1e1e;
          position: sticky;
          top: 0;
          z-index: 100;
        }
        .ff-wrap {
          max-width: 1120px;
          margin: 0 auto;
          padding: 10px 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .ff-nav a {
          color: #eaeaea;
          margin-left: 16px;
          text-decoration: none;
          font-size: 14px;
        }
        .ff-nav a:hover {
          text-decoration: underline;
        }
      `}</style>
    </header>
  );
}
