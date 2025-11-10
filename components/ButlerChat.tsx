// FILE: /components/ButlerChat.tsx

import { useState, useRef, useEffect } from "react";

type ButlerChatProps = {
  isOpen: boolean;
  onClose: () => void;
};

type ButlerResult = {
  id: string;
  title: string;
  brand: string;
  price: string;
  href: string;
};

type ChatMessage =
  | { id: number; role: "user"; text: string }
  | { id: number; role: "butler"; text: string; results?: ButlerResult[] };

export default function ButlerChat({ isOpen, onClose }: ButlerChatProps) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [listening, setListening] = useState(false);

  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    if (!input.trim()) return;
    const text = input.trim();
    setInput("");

    const userMessage: ChatMessage = {
      id: Date.now(),
      role: "user",
      text,
    };
    setMessages((m) => [...m, userMessage]);

    const lower = text.toLowerCase();
    if (lower === "open it" || lower === "open" || lower === "buy it") {
      const lastWithResults = [...messages]
        .reverse()
        .find((msg) => msg.role === "butler" && (msg as any).results?.length);
      const target = (lastWithResults as any)?.results?.[0] as
        | ButlerResult
        | undefined;
      if (target && typeof window !== "undefined") {
        window.location.href = target.href;
        return;
      }
    }

    try {
      const res = await fetch("/api/butler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: text }),
      });
      if (!res.ok) throw new Error("API request failed");
      const data = await res.json();

      const butlerMessage: ChatMessage = {
        id: Date.now() + 1,
        role: "butler",
        text: data.answer || "",
        results: data.results || [],
      };
      setMessages((m) => [...m, butlerMessage]);
    } catch (e) {
      console.error(e);
      const errorMessage: ChatMessage = {
        id: Date.now() + 2,
        role: "butler",
        text: "I’m having trouble reaching the catalogue right now.",
      };
      setMessages((m) => [...m, errorMessage]);
    }
  }

  function handleVoice() {
    // tap again to stop
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }

    if (
      typeof window === "undefined" ||
      !(window as any).webkitSpeechRecognition
    ) {
      alert("Voice recognition not supported in this browser.");
      return;
    }

    const rec = new (window as any).webkitSpeechRecognition();
    recognitionRef.current = rec;

    // ✅ single, slower phrase – wait for final result
    rec.lang = "en-US";
    rec.continuous = false;
    rec.interimResults = false;

    rec.onstart = () => {
      setListening(true);
    };

    rec.onend = () => {
      setListening(false);
      recognitionRef.current = null;
    };

    rec.onerror = () => {
      setListening(false);
      recognitionRef.current = null;
    };

    rec.onresult = (event: any) => {
      // take the final text ONCE (no repetition)
      const transcript = Array.from(event.results)
        .map((r: any) => r[0].transcript)
        .join(" ");

      setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
    };

    rec.start();
  }

  if (!isOpen) return null;

  return (
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
            Ask me for something in the catalogue, e.g. “Prada bag” or “Rolex
            watch”.
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className="butlerMessageBlock">
            {msg.role === "user" ? (
              <div>🧑: {msg.text}</div>
            ) : (
              <>
                <div>🤵 Butler: {msg.text}</div>

                {msg.results && msg.results.length > 0 && (
                  <div className="butlerResults">
                    {msg.results.map((item) => (
                      <a
                        key={item.id}
                        href={item.href}
                        className="butlerResultCard"
                      >
                        <div className="butlerResultTitle">
                          {item.brand && <strong>{item.brand} — </strong>}
                          {item.title}
                        </div>
                        {item.price && (
                          <div className="butlerResultPrice">{item.price}</div>
                        )}
                        <div className="butlerResultLink">View listing →</div>
                      </a>
                    ))}
                  </div>
                )}
              </>
            )}
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
          height: 190px;
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
        .butlerMessageBlock {
          padding: 4px 0;
        }
        .butlerResults {
          margin-top: 4px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .butlerResultCard {
          display: block;
          border-radius: 8px;
          background: #111827;
          padding: 8px;
          text-decoration: none;
          color: #e5e7eb;
        }
        .butlerResultTitle {
          font-size: 13px;
        }
        .butlerResultPrice {
          font-size: 12px;
          margin-top: 2px;
        }
        .butlerResultLink {
          font-size: 12px;
          margin-top: 4px;
          opacity: 0.85;
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
    </div>
  );
}
