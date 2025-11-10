// FILE: /components/HomepageButler.tsx

import { useState } from "react";
import Link from "next/link";
import ButlerChat from "./ButlerChat";

export default function HomepageButler() {
  // Keep the chat OPEN by default so you can see it immediately
  const [isChatOpen, setIsChatOpen] = useState(true);

  const openChat = () => setIsChatOpen(true);
  const closeChat = () => setIsChatOpen(false);

  return (
    <>
      <div>
        <p className="heroIntro">
          Meet your Famous Finds AI Butler – a friendly concierge to help
          you discover the perfect piece, by voice or chat, from our curated
          catalogue.
        </p>
        <div className="heroButlerRow">
          <div className="butlerAvatar">
            <span className="butlerEmoji">🤵</span>
          </div>
          <div className="butlerCopy">
            <div className="butlerTitle">Your personal style butler</div>
            <div className="butlerText">
              Tell me what you&apos;re looking for – a Chanel bag, a Rolex,
              or a special dress – and the Butler will search only within
              Famous Finds.
            </div>
          </div>
        </div>
        <div className="heroActions">
          <button type="button" onClick={openChat} className="butlerBtn">
            AI Butler
          </button>

          <Link href="/catalogue" className="browseBtn">
            Browse the catalogue
          </Link>
        </div>
      </div>

      {/* floating round button (only if chat closed) */}
      {!isChatOpen && (
        <button
          onClick={openChat}
          className="butlerFloatingBtn"
          aria-label="Open AI Butler"
        >
          🤵
        </button>
      )}

      <ButlerChat isOpen={isChatOpen} onClose={closeChat} />

      <style jsx>{`
        .heroIntro {
          font-size: 13px;
          color: #e5e7eb;
          margin-bottom: 14px;
        }
        .heroButlerRow {
          display: flex;
          gap: 12px;
        }
        .butlerAvatar {
          width: 40px;
          height: 40px;
          border-radius: 999px;
          background: #020617;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .butlerEmoji {
          font-size: 24px;
        }
        .butlerTitle {
          font-size: 14px;
          font-weight: 600;
        }
        .butlerText {
          font-size: 13px;
          color: #e5e7eb;
        }
        .heroActions {
          margin-top: 16px;
          display: flex;
          gap: 8px;
        }
        .butlerBtn,
        .browseBtn {
          border-radius: 999px;
          font-size: 13px;
          padding: 8px 16px;
          border: 1px solid #e5e7eb;
          background: transparent;
          color: #e5e7eb;
          cursor: pointer;
          text-decoration: none;
        }
        .butlerBtn {
          background: #e5e7eb;
          color: #020617;
        }
        .butlerFloatingBtn {
          position: fixed;
          bottom: 16px;
          right: 16px;
          width: 64px;
          height: 64px;
          border-radius: 999px;
          background: #000;
          color: #fff;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 30px;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.35);
          z-index: 9999;
        }
      `}</style>
    </>
  );
}
