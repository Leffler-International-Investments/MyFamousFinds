// FILE: /components/AiButler.tsx
import { useState } from "react";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

function getReply(message: string): string {
  const m = message.toLowerCase();

  if (m.includes("sell") || m.includes("list")) {
    return (
      "To sell an item, click ‘Sell’ in the top menu. " +
      "Upload clear photos, pick the right category and set a fair price. " +
      "You can also read the ‘Selling’ guide in the footer for step-by-step tips."
    );
  }

  if (m.includes("shipping")) {
    return (
      "Most US shipments are delivered within 3–5 business days. " +
      "For details about carriers, costs and tracking, open the ‘Shipping’ page in the Help section."
    );
  }

  if (m.includes("return")) {
    return (
      "Returns are handled through our support team to protect both buyer and seller. " +
      "Check the ‘Returns’ page, then open a support ticket if your item is not as described."
    );
  }

  if (m.includes("statement") || m.includes("payout") || m.includes("wallet")) {
    return (
      "Sellers can see balances and payouts under Wallet → Statements in the top navigation. " +
      "From there you can download statements for your records."
    );
  }

  if (m.includes("find") || m.includes("search") || m.includes("buy")) {
    return (
      "Tell me the brand, category and size you like and I’ll point you to where to start browsing. " +
      "For example: ‘Gucci bags’, ‘size 38 heels’, or ‘men’s Rolex watches’."
    );
  }

  return (
    "I’m your Famous Finds AI Butler. Ask me about selling, buying, shipping, returns, " +
    "or where to find your wallet and statements."
  );
}

export default function AiButler() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Welcome to Famous Finds. I can help you list products, describe items, find your statements, or discover something to buy.",
    },
  ]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || busy) return;

    setBusy(true);
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: trimmed }]);

    // Simple fake “thinking” delay, then rules-based reply
    setTimeout(() => {
      const reply = getReply(trimmed);
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
      setBusy(false);
    }, 250);
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-30 rounded-full bg-white px-4 py-2 text-xs font-semibold text-black shadow-lg shadow-black/40"
      >
        AI Butler
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-30 w-80 rounded-2xl border border-neutral-700 bg-black/95 text-xs text-gray-100 shadow-2xl shadow-black/60 backdrop-blur">
      <div className="flex items-center justify-between border-b border-neutral-800 px-3 py-2">
        <span className="font-semibold">Famous Finds AI Butler</span>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-gray-400 hover:text-gray-200"
        >
          ✕
        </button>
      </div>

      <div className="max-h-64 space-y-2 overflow-y-auto px-3 py-3">
        {messages.map((m, i
