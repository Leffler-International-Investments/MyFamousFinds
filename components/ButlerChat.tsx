// /components/ButlerChat.tsx
import { useState } from "react";

export default function ButlerChat() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<string[]>([]);
  const [listening, setListening] = useState(false);

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
      const data = await res.json();
      setMessages((m) => [...m, `🤵 Butler: ${data.answer}`]);
    } catch {
      setMessages((m) => [...m, "🤵 Butler: (connection error)"]);
    }
  }

  function handleVoice() {
    if (!("webkitSpeechRecognition" in window)) {
      alert("Voice recognition not supported in this browser.");
      return;
    }
    const rec = new (window as any).webkitSpeechRecognition();
    rec.lang = "en-US";
    rec.start();
    setListening(true);
    rec.onresult = (e: any) => {
      const text = e.results[0][0].transcript;
      setInput(text);
      setListening(false);
    };
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white rounded-2xl shadow-lg p-4 w-80 text-sm">
      <div className="font-semibold mb-2">🤵 AI Butler</div>
      <div className="h-48 overflow-y-auto bg-gray-100 rounded-md p-2 mb-2 text-black">
        {messages.map((m, i) => (
          <div key={i}>{m}</div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          className="flex-1 border border-gray-400 rounded px-2 py-1"
          placeholder="Ask the butler..."
        />
        <button
          onClick={handleSend}
          className="bg-black text-white px-3 py-1 rounded"
        >
          Send
        </button>
        <button
          onClick={handleVoice}
          className={`px-3 py-1 rounded ${
            listening ? "bg-red-500" : "bg-gray-300"
          }`}
        >
          🎙️
        </button>
      </div>
    </div>
  );
}
