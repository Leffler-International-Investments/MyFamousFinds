// FILE: /components/Header.tsx
import Link from "next/link";
import Image from "next/image";

export default function Header() {
  return (
    <header className="ff-header">
      <div className="ff-wrap">
        <Link href="/" className="ff-brand" aria-label="Famous Finds">
          {/* Put your logo image at /public/famousfindslogo.png.
             If your file is named differently, either rename it or update src below. */}
          <Image
            src="/famousfindslogo.png"
            alt="Famous Finds"
            width={180}
            height={36}
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
        .ff-header { position: sticky; top: 0; z-index: 40; background:#0b0b0b; border-bottom:1px solid #1f1f1f; }
        .ff-wrap { max-width: 1120px; margin: 0 auto; padding: 10px 16px; display: flex; align-items: center; justify-content: space-between; }
        .ff-brand :global(img) { height: auto; }
        .ff-nav a { color:#eaeaea; font-size:14px; margin-left:16px; text-decoration:none; }
        .ff-nav a:hover { text-decoration: underline; }
      `}</style>
    </header>
  );
}
