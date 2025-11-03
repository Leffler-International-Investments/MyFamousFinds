// FILE: /components/Footer.tsx
export default function Footer() {
  return (
    <footer className="f">
      <div className="wrap">
        <div className="col">
          <h4>FAMOUS FINDS</h4>
          <p>Curated luxury & premium resale — <b>US</b>.</p>
        </div>
        <div className="col">
          <h5>Help</h5>
          <a>Shipping</a><a>Returns</a><a>Buying</a><a>Selling</a>
        </div>
        <div className="col">
          <h5>Company</h5>
          <a>About</a><a>Contact</a><a>Privacy</a>
        </div>
      </div>
      <div className="copy">© {new Date().getFullYear()} Famous Finds</div>
      <style jsx>{`
        .f{ margin-top:48px; border-top:1px solid #1a1a1a; background:#0b0b0b; color:#bbb; }
        .wrap{ max-width:1200px; margin:0 auto; padding:28px 16px; display:grid; gap:24px; grid-template-columns:1.2fr .8fr .8fr; }
        h4{ margin:0 0 8px; color:#eaeaea; }
        h5{ margin:0 0 8px; color:#eaeaea; }
        a{ display:block; margin:4px 0; }
        .copy{ padding:12px 16px; text-align:center; border-top:1px solid #151515; }
        @media (max-width:900px){ .wrap{ grid-template-columns:1fr; } }
      `}</style>
    </footer>
  );
}

