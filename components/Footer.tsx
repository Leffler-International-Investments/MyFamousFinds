// FILE: /components/Footer.tsx
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="f">
      <div className="wrap">
        <div className="cols">
          <div className="col">
            <h5>Help</h5>
            <Link href="/help">Help Center</Link>
            <Link href="/shipping">Shipping</Link>
            <Link href="/returns">Returns</Link>
            <Link href="/buying">Buying</Link>
            <Link href="/selling">Selling</Link>
          </div>
          <div className="col">
            <h5>Company</h5>
            <Link href="/about">About</Link>
            <Link href="/contact">Contact</Link>
            <Link href="/privacy">Privacy</Link>
            <Link href="/authenticity-policy">Authenticity</Link>
          </div>
        </div>
        <div className="copy">© {new Date().getFullYear()} Famous Finds</div>
        <style jsx>{`
          .f {
            margin-top: 48px;
            border-top: 1px solid #1a1a1a;
            background: #0b0b0b;
            color: #bbb;
          }
          .wrap {
            max-width: 1200px;
            margin: 0 auto;
            padding: 28px 16px;
          }
          .cols {
            display: flex;
            gap: 32px;
            margin-bottom: 16px;
          }
          .col {
            min-width: 120px;
            display: flex;
            flex-direction: column;
            gap: 6px;
            font-size: 13px;
          }
          .col h5 {
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.16em;
            color: #888;
            margin-bottom: 4px;
          }
          a {
            color: #e5e7eb;
            text-decoration: none;
          }
          a:hover {
            text-decoration: underline;
          }
          .copy {
            font-size: 12px;
            color: #666;
          }
          @media (max-width: 700px) {
            .cols {
              flex-direction: column;
            }
          }
        `}</style>
      </div>
    </footer>
  );
}
