// FILE: /components/HomepageButler.tsx
// This component links to the new, safe /catalogue page.

import { useState } from "react";
import Link from "next/link";
import ButlerChat from "./ButlerChat";

export default function HomepageButler() {
  const [isChatOpen, setIsChatOpen] = useState(false);
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
          {/* Button 1: AI Butler (Linked) */}
          <button
            type="button"
            onClick={openChat}
            className="butlerBtn"
          >
            AI Butler
          </button>

          {/* Button 2: Browse Catalogue (Linked) */}
          <Link
            href="/catalogue" // <-- Links to the new public page
            className="browseBtn"
          >
            Browse the catalogue
          </Link>
        </div>
      </div>

      {!isChatOpen && (
        <button
          onClick={openChat}
          className="fixed bottom-4 right-4 z-50 bg-black text-white w-16 h-16 rounded-full shadow-lg flex items-center justify-center text-3xl hover:bg-gray-800 transition-all"
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
      `}</style>
    </>
  );
}
