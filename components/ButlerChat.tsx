// FILE: components/ButlerChat.tsx

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";

type ButlerChatProps = {
  isOpen: boolean;
  onClose: () => void;
};

type ChatMessage = {
  id: string;
  role: "user" | "butler";
  text: string;
};

type ButlerResult = {
  id: string; // Firestore listing id, used in /product/[id]
  title: string;
  brand?: string;
  price?: number;
  currency?: string;
};

type ButlerResponse = {
  answer: string;
  results?: ButlerResult[];
};

export default function ButlerChat({ isOpen, onClose }: ButlerChatProps) {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [results, setResults] = useState<ButlerResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const recognitionRef = useRef<any>(null);

  // Scroll to bottom on new message
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, results]);

  // --- Voice: setup Web Speech API instance on first use ---
  const ensureRecognition = () => {
    if (recognitionRef.current) return recognitionRef.current;
    if (typeof window === "undefined") return null;

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return null;

    const rec = new SpeechRecognition();
    rec.lang = "en-US";
    rec.continuous = false;
    rec.interimResults = false;
    recognitionRef.current = rec;
    return rec;
  };

  const handleStartListening = () => {
    const rec = ensureRecognition();
    if (!rec) {
      alert("Voice recognition is not supported on this device/browser.");
      return;
    }
    setListening(true);

    rec.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
    };
    rec.onerror = () => {
      setListening(false);
    };
    rec.onend = () => {
      setListening(false);
    };

    rec.start();
  };

  const handleVoiceClick = () => {
    if (listening) {
      const rec = recognitionRef.current;
      if (rec) rec.stop();
      setListening(false);
      return;
    }
    handleStartListening();
  };

  // --- Call API ---
  async function callButler(query: string): Promise<ButlerResponse> {
    const res = await fetch("/api/butler", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });
    if (!res.ok) {
      throw new Error(`Butler error: ${res.status}`);
    }
    return (await res.json()) as ButlerResponse;
  }

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const newUserMessage: ChatMessage = {
      id: String(Date.now()),
      role: "user",
      text: trimmed,
    };
    setMessages((prev) => [...prev, newUserMessage]);
    setInput("");
    setLoading(true);

    try {
      const data = await callButler(trimmed);
      const butlerMessage: ChatMessage = {
        id: `${Date.now()}-butler`,
        role: "butler",
        text: data.answer,
      };
      setMessages((prev) => [...prev, butlerMessage]);
      setResults(data.results || []);
    } catch (err: any) {
      const errMsg: ChatMessage = {
        id: `${Date.now()}-error`,
        role: "butler",
        text:
          "My apologies, something went wrong while searching the catalogue. Please try again.",
      };
      setMessages((prev) => [...prev, errMsg]);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleResultClick = (id: string) => {
    // open the product page
    router.push(`/product/${id}`);
  };

  if (!isOpen) return null;

  return (
    <div className="ff-butler-overlay">
      <div className="ff-butler-window">
        {/* Header */}
        <div className="ff-butler-header">
          <div className="ff-butler-title">
            <span role="img" aria-label="Butler">
              🤵
            </span>{" "}
            AI Butler
          </div>
          <button
            className="ff-butler-close"
            onClick={onClose}
            aria-label="Close butler"
          >
            ✕
          </button>
        </div>

        {/* Messages */}
        <div className="ff-butler-messages">
          {messages.map((m) => (
            <div
              key={m.id}
              className={
                m.role === "user"
                  ? "ff-msg ff-msg-user"
                  : "ff-msg ff-msg-butler"
              }
            >
              {m.role === "user" ? "🧑 " : "🤵 Butler: "}
              {m.text}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="ff-butler-results">
            {results.map((r) => (
              <button
                key={r.id}
                className="ff-result-card"
                onClick={() => handleResultClick(r.id)}
              >
                <div className="ff-result-title">
                  {r.brand && <strong>{r.brand} — </strong>}
                  {r.title}
                </div>
                {typeof r.price === "number" && (
                  <div className="ff-result-price">
                    {new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: r.currency || "USD",
                      maximumFractionDigits: 2,
                    }).format(r.price)}
                  </div>
                )}
                <div className="ff-result-link">View listing →</div>
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="ff-butler-inputRow">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            className="ff-butler-input"
            placeholder="Ask the butler..."
          />
          <button
            onClick={handleSend}
            className="ff-butler-send"
            disabled={loading}
          >
            {loading ? "…" : "Send"}
          </button>
          <button
            onClick={handleVoiceClick}
            className={`ff-butler-voice ${
              listening ? "ff-butler-voice-on" : "ff-butler-voice-off"
            }`}
            aria-label={listening ? "Stop listening" : "Start listening"}
          >
            🎙️
          </button>
        </div>
      </div>

      <style jsx>{`
        .ff-butler-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.45);
          display: flex;
          justify-content: center;
          align-items: flex-end;
          z-index: 9999;
        }
        .ff-butler-window {
          width: 100%;
          max-width: 480px;
          margin: 0 8px 16px;
          background: #020617;
          color: #f9fafb;
          border-radius: 16px;
          box-shadow: 0 18px 40px rgba(0, 0, 0, 0.5);
          padding: 12px 12px 10px;
          font-size: 13px;
        }
        .ff-butler-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
        }
        .ff-butler-title {
          font-weight: 600;
        }
        .ff-butler-close {
          border: none;
          background: transparent;
          color: #f9fafb;
          font-size: 16px;
          cursor: pointer;
        }
        .ff-butler-messages {
          max-height: 180px;
          overflow-y: auto;
          padding: 6px 4px;
          border-radius: 8px;
          background: rgba(15, 23, 42, 0.85);
          margin-bottom: 6px;
        }
        .ff-msg {
          margin: 2px 0;
        }
        .ff-msg-user {
          text-align: left;
        }
        .ff-msg-butler {
          text-align: left;
        }
        .ff-butler-results {
          margin-bottom: 6px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .ff-result-card {
          text-align: left;
          border-radius: 10px;
          border: 1px solid #1f2937;
          padding: 6px 8px;
          background: #020617;
          cursor: pointer;
        }
        .ff-result-title {
          font-size: 13px;
        }
        .ff-result-price {
          font-size: 12px;
          color: #e5e7eb;
        }
        .ff-result-link {
          font-size: 11px;
          color: #9ca3af;
        }
        .ff-butler-inputRow {
          display: flex;
          gap: 6px;
          margin-top: 4px;
        }
        .ff-butler-input {
          flex: 1;
          border-radius: 999px;
          border: 1px solid #4b5563;
          padding: 6px 10px;
          font-size: 13px;
          background: #020617;
          color: #f9fafb;
        }
        .ff-butler-send {
          border-radius: 999px;
          padding: 6px 12px;
          border: none;
          background: #f9fafb;
          color: #111827;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
        }
        .ff-butler-voice {
          border-radius: 999px;
          padding: 6px 10px;
          border: none;
          font-size: 16px;
          cursor: pointer;
        }
        .ff-butler-voice-on {
          background: #ef4444;
          color: #ffffff;
        }
        .ff-butler-voice-off {
          background: #e5e7eb;
          color: #000000;
        }
        @media (min-width: 640px) {
          .ff-butler-window {
            margin-bottom: 24px;
          }
        }
      `}</style>
    </div>
  );
}
