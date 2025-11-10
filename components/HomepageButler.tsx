// FILE: /components/HomepageButler.tsx
// This is a NEW component.
// It is now imported by pages/index.tsx

import { useState } from "react";
import Link from "next/link";
import ButlerChat from "./ButlerChat"; // Imports the component we just modified

export default function HomepageButler() {
  // This component now manages the state
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Function to open the chat
  const openChat = () => setIsChatOpen(true);
  
  // Function to close the chat
  const closeChat = () => setIsChatOpen(false);

  return (
    <>
      {/* This is the section from your screenshot.
        I've used the styles from your screenshot and index.tsx.
      */}
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
          {/* Button 1: AI Butler (NOW LINKED) */}
          <button
            type="button"
            onClick={openChat} // Opens the chat
            className="butlerBtn"
          >
            AI Butler
          </button>

          {/* Button 2: Browse Catalogue (NOW LINKED) */}
          <Link
            href="/seller/catalogue" // Links to the catalogue
            className="browseBtn"
          >
            Browse the catalogue
          </Link>
        </div>
      </div>

      {/* This is the floating icon button that appears
        when the chat is CLOSED.
      */}
      {!isChatOpen && (
        <button
          onClick={openChat} // Opens the chat
          className="fixed bottom-4 right-4 z-50 bg-black text-white w-16 h-16 rounded-full shadow-lg flex items-center justify-center text-3xl hover:bg-gray-800 transition-all"
          aria-label="Open AI Butler"
        >
          🤵
        </button>
      )}

      {/* This renders the actual chat window component
        and passes the state and close function to it.
      */}
      <ButlerChat isOpen={isChatOpen} onClose={closeChat} />

      {/* These styles are copied from your index.tsx to match perfectly */}
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
          text-decoration: none; /* Added for Link */
        }
        .butlerBtn {
          background: #e5e7eb;
          color: #020617;
        }
      `}</style>
    </>
  );
}
