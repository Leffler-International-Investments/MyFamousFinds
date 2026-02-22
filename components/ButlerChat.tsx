// FILE: /components/ButlerChat.tsx

import { useState, useRef, useEffect, useCallback } from "react";

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

/* ── Resolve the SpeechRecognition constructor (standard + webkit) ── */
function getSpeechRecognition(): (new () => any) | null {
  if (typeof window === "undefined") return null;
  return (
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition ||
    null
  );
}

export default function ButlerChat({ isOpen, onClose }: ButlerChatProps) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [listening, setListening] = useState(false);

  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const voiceTranscriptRef = useRef<string>("");

  /* ── Draggable state ── */
  const panelRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const dragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const hasMoved = useRef(false);

  /* Set initial position on mount (bottom-right, using top-left coords) */
  useEffect(() => {
    if (isOpen && !pos) {
      // Panel is ~340px wide, ~320px tall; place it bottom-right with 16px margin
      const panelW = Math.min(340, window.innerWidth * 0.9);
      const panelH = 320;
      setPos({
        x: window.innerWidth - panelW - 16,
        y: window.innerHeight - panelH - 16,
      });
    }
  }, [isOpen, pos]);

  /* Scroll chat to bottom on new messages */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ── Clamp helper to keep panel on screen (using top-left coords) ── */
  const clamp = useCallback((x: number, y: number) => {
    const el = panelRef.current;
    if (!el) return { x, y };
    const r = el.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(window.innerWidth - r.width, x)),
      y: Math.max(0, Math.min(window.innerHeight - r.height, y)),
    };
  }, []);

  /* ── Pointer event handlers for drag ── */
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (!pos) return;
    dragging.current = true;
    hasMoved.current = false;
    // Offset from pointer to the panel's current top-left position
    dragOffset.current = {
      x: e.clientX - pos.x,
      y: e.clientY - pos.y,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [pos]);

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging.current) return;
      hasMoved.current = true;
      const nx = e.clientX - dragOffset.current.x;
      const ny = e.clientY - dragOffset.current.y;
      setPos(clamp(nx, ny));
    },
    [clamp]
  );

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    dragging.current = false;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  }, []);

  /* ── Send a message (can be called with explicit text or reads from input) ── */
  const sendMessage = useCallback(
    async (explicitText?: string) => {
      const text = (explicitText ?? input).trim();
      if (!text) return;

      if (!explicitText) setInput("");

      const userMessage: ChatMessage = { id: Date.now(), role: "user", text };
      setMessages((m) => [...m, userMessage]);

      const lower = text.toLowerCase();

      // "open it" / "open" / "buy it" → open first result
      if (lower === "open it" || lower === "open" || lower === "buy it") {
        setMessages((prev) => {
          const lastWithResults = [...prev]
            .reverse()
            .find(
              (msg) => msg.role === "butler" && (msg as any).results?.length
            );
          const target = (lastWithResults as any)?.results?.[0] as
            | ButlerResult
            | undefined;
          if (target && typeof window !== "undefined") {
            window.location.href = target.href;
          }
          return prev;
        });
        return;
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
          text: "I'm having trouble reaching the catalogue right now.",
        };
        setMessages((m) => [...m, errorMessage]);
      }
    },
    [input]
  );

  function handleSend() {
    sendMessage();
  }

  /* ── Voice dictation ── */
  function handleVoice() {
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }

    const SpeechRecognitionClass = getSpeechRecognition();
    if (!SpeechRecognitionClass) {
      alert(
        "Voice recognition is not supported in this browser. Please try Chrome, Edge, or Safari."
      );
      return;
    }

    const rec = new SpeechRecognitionClass();
    recognitionRef.current = rec;
    voiceTranscriptRef.current = "";

    rec.lang = "en-US";
    rec.continuous = false;
    rec.interimResults = true;

    rec.onstart = () => setListening(true);

    rec.onend = () => {
      setListening(false);
      recognitionRef.current = null;

      // Auto-send the final transcript
      const finalText = voiceTranscriptRef.current.trim();
      if (finalText) {
        setInput("");
        sendMessage(finalText);
        voiceTranscriptRef.current = "";
      }
    };

    rec.onerror = () => {
      setListening(false);
      recognitionRef.current = null;
      voiceTranscriptRef.current = "";
    };

    rec.onresult = (event: any) => {
      let interimTranscript = "";
      let finalTranscript = "";

      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      voiceTranscriptRef.current = finalTranscript || interimTranscript;
      setInput(voiceTranscriptRef.current);
    };

    // Just start — browser shows its own permission dialog automatically
    try {
      rec.start();
    } catch {
      setListening(false);
      recognitionRef.current = null;
    }
  }

  /* ── Cleanup recognition on unmount / close ── */
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
        recognitionRef.current = null;
      }
    };
  }, []);

  if (!isOpen || !pos) return null;

  const panelStyle: React.CSSProperties = {
    position: "fixed",
    left: pos.x,
    top: pos.y,
    zIndex: 10000,
  };

  return (
    <div ref={panelRef} className="butlerChatPanel" style={panelStyle}>
      {/* ── Drag handle (header) ── */}
      <div
        className="butlerChatHeader"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        style={{ touchAction: "none", userSelect: "none" }}
      >
        <span className="butlerChatTitle">🤵 AI Butler</span>
        <button
          className="butlerCloseBtn"
          onClick={onClose}
          aria-label="Close chat"
        >
          ×
        </button>
      </div>

      <div className="butlerMessages">
        {messages.length === 0 && (
          <div className="butlerWelcome">
            Ask me for something in the catalogue — I am your personal style
            butler. Try &quot;Prada bag&quot; or &quot;Rolex watch&quot;.
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
                          <div className="butlerResultPrice">
                            {item.price}
                          </div>
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
          placeholder="Ask the butler…"
          className="butlerInput"
        />
        <button onClick={handleSend} className="butlerSendBtn">
          Send
        </button>
        <button
          onClick={handleVoice}
          className={`butlerVoiceBtn ${listening ? "listening" : ""}`}
          title={listening ? "Stop listening" : "Voice input"}
        >
          🎙️
        </button>
      </div>

      <style jsx>{`
        .butlerChatPanel {
          width: 340px;
          max-width: 90vw;
          background: #ffffff;
          color: #000000;
          border-radius: 16px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
          padding: 0 12px 12px;
          font-size: 13px;
        }
        .butlerChatHeader {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0 6px;
          cursor: grab;
        }
        .butlerChatHeader:active {
          cursor: grabbing;
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
          font-family: inherit;
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
          transition: background 0.2s;
        }
        .butlerVoiceBtn.listening {
          background: #ef4444;
          color: #fff;
          animation: pulse-mic 1s infinite;
        }

        @keyframes pulse-mic {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }

        @media (max-width: 768px) {
          .butlerChatPanel {
            width: 300px;
            max-width: 85vw;
            font-size: 12px;
          }
          .butlerMessages {
            height: 160px;
          }
        }
        @media (max-width: 480px) {
          .butlerChatPanel {
            width: 280px;
            max-width: 80vw;
          }
        }
      `}</style>
    </div>
  );
}
