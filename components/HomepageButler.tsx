// FILE: /components/HomepageButler.tsx

import { useState } from "react";
import ButlerChat from "./ButlerChat";

export default function HomepageButler() {
  // Chat closed by default – only the round corner butler is visible
  const [isChatOpen, setIsChatOpen] = useState(false);

  const openChat = () => setIsChatOpen(true);
  const closeChat = () => setIsChatOpen(false);

  return (
    <>
      {/* Floating round button (bottom-right) */}
      {!isChatOpen && (
        <button
          onClick={openChat}
          className="butlerFloatingBtn"
          aria-label="Open AI Butler"
        >
          🤵
        </button>
      )}

      {/* Corner chat widget with full functionality */}
      <ButlerChat isOpen={isChatOpen} onClose={closeChat} />

      <style jsx>{`
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
          cursor: pointer;
        }
        @media (max-width: 768px) {
          .butlerFloatingBtn {
            width: 44px;
            height: 44px;
            font-size: 20px;
            bottom: 12px;
            right: 12px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
          }
        }
      `}</style>
    </>
  );
}
