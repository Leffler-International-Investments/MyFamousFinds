// FILE: /components/HomepageButler.tsx
// This is a NEW component.
// Add this component to your homepage (pages/index.tsx)

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
        I've assumed the styling, update it to match your site.
      */}
      <div className="butler-prompt-container p-4 rounded-lg" style={{ background: '#222' }}>
        <h3 className="text-white font-semibold">Your personal style butler</h3>
        <p className="text-gray-400 text-sm mt-1">
          Tell me what you're looking for...
        </p>
        <div className="flex gap-4 mt-4">
          {/* Button 1: AI Butler (NOW LINKED) */}
          <button
            type="button"
            onClick={openChat} // Opens the chat
            className="bg-white text-black px-4 py-2 rounded-full text-sm font-medium"
          >
            AI Butler
          </button>

          {/* Button 2: Browse Catalogue (NOW LINKED) */}
          <Link
            href="/seller/catalogue" // Links to the catalogue
            className="bg-gray-700 text-white px-4 py-2 rounded-full text-sm font-medium"
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
    </>
  );
}
