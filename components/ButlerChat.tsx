// FILE: /components/ButlerChat.tsx
import { useState, useRef, useEffect } from "react";

type ButlerChatProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function ButlerChat({ isOpen, onClose }: ButlerChatProps) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<string[]>([]);
  const [listening, setListening] = useState(false);

  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setMessages((m) => [...m, `🧑: ${userMsg}`]);
    setInput("");
    try {
      const res = await fetch("/api/butler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: userMsg }),
      });
      if (!res.ok) throw new Error("API request failed");
      const data = await res.json();
      setMessages((m) => [...m, `🤵 Butler: ${data.answer}`]);
    } catch {
      setMessages((m) => [...m, "🤵 Butler: (connection error)"]);
    }
  }

  function handleVoice() {
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    if (!("webkitSpeechRecognition" in window)) {
      alert("Voice recognition not supported in this browser.");
      return;
    }

    const rec = new (window as any).webkitSpeechRecognition();
    recognitionRef.current = rec;
    rec.lang = "en-US";
    rec.continuous = true;
    rec.interimResults = true;

    rec.onstart = () => setListening(true);
    rec.onend = () => {
      setListening(false);
      recognitionRef.current = null;
    };
    rec.onerror = (e: any) => {
      console.error("Speech recognition error:", e.error);
      setListening(false);
    };
    rec.onresult = (e: any) => {
      const transcript = Array.from(e.results)
        .map((r: any) => r[0].transcript)
        .join("");
      setInput(transcript);
    };
    rec.start();
  }

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-white rounded-2xl shadow-lg p-4 w-80 text-sm z-50 border border-gray-200">
      <div className="flex justify-between items-center mb-2">
        <div className="font-semibold text-gray-900">🤵 AI Butler</div>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-900 text-2xl font-light"
        >
          &times;
        </button>
      </div>

      <div className="h-48 overflow-y-auto bg-gray-100 rounded-md p-2 mb-2 text-black">
        {messages.length === 0 && (
          <div className="text-gray-600 p-1">
            Welcome! Ask me to find products, e.g., “Show me red Gucci bags.”
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className="py-1 px-1">
            {m}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          className="flex-1 border border-gray-400 rounded px-2 py-1 text-black"
          placeholder="Ask the butler..."
        />
        <button
          onClick={handleSend}
          className="bg-black text-white px-3 py-1 rounded hover:bg-gray-800"
        >
          Send
        </button>
        <button
          onClick={handleVoice}
          className={`px-3 py-1 rounded ${
            listening ? "bg-red-500 text-white" : "bg-gray-300 text-black"
          }`}
        >
          🎙️
        </button>
      </div>
    </div>
  );
}
