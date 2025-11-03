export default function Footer() {
  return (
    <footer className="ff-footer">
      <div className="ff-wrap">
        <div>© {new Date().getFullYear()} Famous Finds — All rights reserved.</div>
        <div className="links">
          <a href="/privacy">Privacy</a>
          <a href="/terms">Terms</a>
          <a href="/contact">Contact</a>
        </div>
      </div>
      <style jsx>{`
        .ff-footer {
          border-top: 1px solid #1e1e1e;
          background: #0b0b0b;
          color: #bdbdbd;
          padding: 20px 0;
          margin-top: 60px;
        }
        .ff-wrap {
          max-width: 1120px;
          margin: 0 auto;
          padding: 0 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 10px;
        }
        .links a {
          color: #bdbdbd;
          margin-left: 12px;
          font-size: 13px;
          text-decoration: none;
        }
        .links a:hover {
          text-decoration: underline;
        }
      `}</style>
    </footer>
  );
}
