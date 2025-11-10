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
    } catch (e) {
      console.error(e);
      setMessages((m) => [...m, "🤵 Butler: (connection error)"]);
    }
  }

  function handleVoice() {
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    if (typeof window === "undefined" || !("webkitSpeechRecognition" in window)) {
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
    rec.onerror = () => {
      setListening(false);
    };
    rec.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((r: any) => r[0].transcript)
        .join("");
      setInput(transcript);
    };
    rec.start();
  }

  if (!isOpen) return null;

  return (
    <>
      <div className="butlerChatPanel">
        <div className="butlerChatHeader">
          <span className="butlerChatTitle">🤵 AI Butler</span>
          <button className="butlerCloseBtn" onClick={onClose} aria-label="Close chat">
            ×
          </button>
        </div>

        <div className="butlerMessages">
          {messages.length === 0 && (
            <div className="butlerWelcome">
              Welcome! Ask me to find products, e.g. “Show me red Gucci bags”.
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className="butlerMessage">
              {m}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="butlerInputRow">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask the butler..."
            className="butlerInput"
          />
          <button onClick={handleSend} className="butlerSendBtn">
            Send
          </button>
          <button
            onClick={handleVoice}
            className={`butlerVoiceBtn ${listening ? "listening" : ""}`}
          >
            🎙️
          </button>
        </div>
      </div>

      <style jsx>{`
        .butlerChatPanel {
          position: fixed;
          bottom: 16px;
          right: 16px;
          width: 320px;
          max-width: 90vw;
          background: #ffffff;
          color: #000000;
          border-radius: 16px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
          padding: 12px;
          font-size: 13px;
          z-index: 10000;
        }
        .butlerChatHeader {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
        }
        .butlerChatTitle {
          font-weight: 600;
        }
        .butlerCloseBtn {
          border: none;
          background: transparent;
          font-size: 20px;
          cursor: pointer;
          line-height: 1;
        }
        .butlerMessages {
          height: 180px;
          overflow-y: auto;
          background: #f3f4f6;
          border-radius: 8px;
          padding: 6px;
          margin-bottom: 8px;
        }
        .butlerWelcome {
          color: #4b5563;
          font-size: 12px;
        }
        .butlerMessage {
          padding: 3px 0;
        }
        .butlerInputRow {
          display: flex;
          gap: 4px;
          align-items: center;
        }
        .butlerInput {
          flex: 1;
          border-radius: 6px;
          border: 1px solid #9ca3af;
          padding: 4px 6px;
          font-size: 13px;
        }
        .butlerSendBtn,
        .butlerVoiceBtn {
          border-radius: 6px;
          border: none;
          padding: 4px 8px;
          font-size: 12px;
          cursor: pointer;
        }
        .butlerSendBtn {
          background: #000;
          color: #fff;
        }
        .butlerVoiceBtn {
          background: #e5e7eb;
          color: #111827;
        }
        .butlerVoiceBtn.listening {
          background: #ef4444;
          color: #fff;
        }

        @media (max-width: 480px) {
          .butlerChatPanel {
            right: 8px;
            left: 8px;
            width: auto;
          }
        }
      `}</style>
    </>
  );
}
