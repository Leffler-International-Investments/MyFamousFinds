// FILE: /pages/concierge.tsx
import React, { useState, useRef } from "react";
import Head from "next/head";
import Header from "../components/Header";
import Footer from "../components/Footer";
import {
  isSpeechAvailable,
  startSpeechRecognition,
} from "../utils/speechRecognition";

// Type for the form payload
type FormPayload = {
  name: string;
  email: string;
  request: string;
};

export default function ConciergePage() {
  const [requestText, setRequestText] = useState("");
  const [listening, setListening] = useState(false);
  const stopSpeechRef = useRef<(() => void) | null>(null);
  
  // New state for the AI flow
  const [isLoading, setIsLoading] = useState(false);
  const [aiAnswer, setAiAnswer] = useState("");
  const [humanSent, setHumanSent] = useState(false);
  const [originalPayload, setOriginalPayload] = useState<FormPayload | null>(null);

  // 1. UPDATED submit - now calls AI Butler first
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setAiAnswer(""); // Clear old answer

    // Build payload from the form
    const formData = new FormData(e.currentTarget);
    const payload: FormPayload = {
      name: String(formData.get("name")),
      email: String(formData.get("email")),
      request: requestText,
    };
    setOriginalPayload(payload); // Save for later

    // Call the AI Butler API
    try {
      const res = await fetch("/api/butler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: payload.request }),
      });
      const data = await res.json();
      setAiAnswer(data.answer || "The AI Butler had no response.");
    } catch {
      setAiAnswer("There was a connection error to the AI Butler.");
    }
    
    setIsLoading(false);
  }

  // 2. NEW function to forward to human support
  async function handleForwardToSupport() {
    if (!originalPayload) return;
    
    setIsLoading(true); // Show loading again
    
    // Call the original /api/concierge endpoint
    await fetch("/api/concierge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(originalPayload),
    });

    setIsLoading(false);
    setHumanSent(true); // Show final "thank you" message
  }

  // 3. Cross-platform voice input (native + web)
  async function handleVoice(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();

    if (listening && stopSpeechRef.current) {
      stopSpeechRef.current();
      stopSpeechRef.current = null;
      return;
    }

    if (!isSpeechAvailable()) {
      alert("Voice input is not available. Please try Chrome, Edge, or Safari.");
      return;
    }

    const stopFn = await startSpeechRecognition({
      onStart: () => setListening(true),
      onResult: (transcript) => setRequestText(transcript),
      onEnd: () => {
        setListening(false);
        stopSpeechRef.current = null;
      },
      onError: (message) => {
        setListening(false);
        stopSpeechRef.current = null;
        alert(message);
      },
    });

    stopSpeechRef.current = stopFn;
  }

  // 4. RENDER logic based on state
  
  // State 1: Final "Thank You" message
  if (humanSent) {
    return (
      <div className="dark-theme-page">
        <Header />
        <main className="page">
          <h1>Request Sent</h1>
          <p>Thank you. Your request has been forwarded to our human support team, and we’ll be in touch shortly.</p>
        </main>
        <Footer />
        <style jsx>{`/* ... */`}</style> {/* Styles are below */}
      </div>
    );
  }
  
  // State 2: AI has answered
  if (aiAnswer) {
    return (
      <div className="dark-theme-page">
        <Header />
        <main className="page">
          <h1>AI Butler Response</h1>
          <p>Here's what the AI Butler found based on your request:</p>
          
          <div className="ai-answer-box">
            {aiAnswer}
          </div>
          
          {isLoading ? (
             <p>Forwarding to support...</p>
          ) : (
            <div className="button-group">
              <button onClick={handleForwardToSupport} className="submit-btn">
                This wasn't helpful, send to support
              </button>
              <button onClick={() => setAiAnswer("")} className="secondary-btn">
                Ask another question
              </button>
            </div>
          )}
        </main>
        <Footer />
        <style jsx>{`/* ... */`}</style> {/* Styles are below */}
      </div>
    );
  }

  // State 3: Default form (or loading)
  return (
    // FIX: Apply dark theme
    <div className="dark-theme-page">
      <Head>
        <title>Concierge — Famous Finds</title>
      </Head>
      <Header />
      <main className="page">
        <h1>Concierge</h1>
        <p>Tell us what you’re looking for and we’ll hunt it down for you.</p>

        {isLoading ? (
          <div>
            <h2>Searching...</h2>
            <p>The AI Butler is analyzing your request.</p>
          </div>
        ) : (
          <form onSubmit={submit} className="form">
            <label>
              Your name
              <input name="name" type="text" required />
            </label>

            <label>
              Email
              <input name="email" type="email" required />
            </label>

            <label>
              <div className="label-row">
                <span>What are you looking for?</span>
                <button
                  onClick={handleVoice}
                  className={`voiceButton ${listening ? "listening" : ""}`}
                  title={listening ? "Stop recording" : "Start recording"}
                >
                  🎙️
                </button>
              </div>
              <textarea
                name="request"
                rows={4}
                required
                value={requestText}
                onChange={(e) => setRequestText(e.target.value)}
              />
            </label>

            <button type="submit" className="submit-btn">
              Send request to AI Butler
            </button>
          </form>
        )}
      </main>
      <Footer />

      {/* 5. STYLES updated for dark theme */}
      <style jsx>{`
        .page {
          max-width: 640px;
          margin: 40px auto;
          padding: 24px 16px 80px;
        }
        h1 {
          font-size: 24px;
          margin-bottom: 8px;
        }
        p {
          margin-bottom: 16px;
          color: #d1d5db; /* gray-300 */
        }
        .form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        label {
          display: flex;
          flex-direction: column;
          font-size: 14px;
          font-weight: 600;
          gap: 6px;
        }
        .label-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .voiceButton {
          padding: 4px 8px;
          border-radius: 4px;
          border: 1px solid #4b5563; /* gray-600 */
          background: #374151; /* gray-700 */
          color: #e5e7eb; /* gray-200 */
          cursor: pointer;
        }
        .voiceButton.listening {
          background: #ef4444; /* red-500 */
          border-color: #ef4444;
          color: #ffffff;
        }
        input,
        textarea {
          padding: 10px 12px;
          border-radius: 8px;
          background: #1f2937; /* gray-800 */
          border: 1px solid #4b5563; /* gray-600 */
          color: #f9fafb; /* gray-50 */
          font: inherit;
          font-weight: 400;
        }
        
        .submit-btn, .secondary-btn {
          margin-top: 8px;
          padding: 10px 16px;
          border-radius: 999px;
          border: none;
          cursor: pointer;
          font-weight: 700;
          font-size: 14px;
        }
        .submit-btn {
          background: #facc15; /* yellow-400 */
          color: #111827;
        }
        .secondary-btn {
          background: #374151; /* gray-700 */
          color: #f9fafb;
          border: 1px solid #4b5563; /* gray-600 */
        }
        .button-group {
            display: flex;
            gap: 12px;
            margin-top: 16px;
        }
        
        .ai-answer-box {
          background: #1f2937; /* gray-800 */
          border: 1px solid #374151; /* gray-700 */
          border-radius: 8px;
          padding: 16px;
          line-height: 1.6;
          color: #e5e7eb; /* gray-200 */
          white-space: pre-wrap; /* Preserves newlines from AI */
        }
      `}</style>
    </div>
  );
}
