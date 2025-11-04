// FILE: /pages/concierge.tsx
import React, { useState } from "react";

export default function ConciergePage() {
  const [sent, setSent] = useState(false);
  const [listening, setListening] = useState(false); // Added
  const [requestText, setRequestText] = useState(""); // Added

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    // Build a plain object from the form
    const formData = new FormData(e.currentTarget);
    const payload: Record<string, string> = {};
    formData.forEach((value, key) => {
      payload[key] = String(value);
    });
    
    // Ensure the state-controlled value is in the payload
    payload['request'] = requestText;

    await fetch("/api/concierge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setSent(true);
  }

  // Added voice handler, adapted from ButlerChat.tsx
  function handleVoice(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault(); // Prevent form submission
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
      setRequestText(text); // Update the textarea state
      setListening(false);
    };

    rec.onend = () => {
      setListening(false); // Ensure listening state is reset
    };
    
    rec.onerror = () => {
      setListening(false); // Handle errors
      alert("An error occurred during voice recognition.");
    }
  }


  if (sent) {
    return (
      <main className="page">
        <h1>Concierge request sent</h1>
        <p>Thanks, we’ll be in touch shortly.</p>
      </main>
    );
  }

  return (
    <main className="page">
      <h1>Concierge</h1>
      <p>Tell us what you’re looking for and we’ll hunt it down for you.</p>

      <form onSubmit={submit} className="form">
        <label>
          Your name
          <input name="name" type="text" required />
        </label>

        <label>
          Email
          <input name="email" type="email" required />
        </label>

        {/* Updated Label for request */}
        <label>
          <div className="label-row">
            <span>What are you looking for?</span>
            <button
              onClick={handleVoice}
              className={`voiceButton ${listening ? "listening" : ""}`}
              title="Record voice"
            >
              🎙️
            </button>
          </div>
          <textarea
            name="request"
            rows={4}
            required
            value={requestText} // Bind state
            onChange={(e) => setRequestText(e.target.value)} // Update state on change
          />
        </label>

        <button type="submit">Send request</button>
      </form>

      <style jsx>{`
        .page {
          max-width: 640px;
          margin: 0 auto;
          padding: 24px 16px;
        }
        h1 {
          font-size: 24px;
          margin-bottom: 8px;
        }
        p {
          margin-bottom: 16px;
        }
        .form {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        label {
          display: flex;
          flex-direction: column;
          font-size: 14px;
          gap: 4px;
        }
        /* Added for voice button */
        .label-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .voiceButton {
          padding: 4px 8px;
          border-radius: 4px;
          border: 1px solid #ccc;
          background: #f0f0f0;
          cursor: pointer;
        }
        .voiceButton.listening {
          background: #fecaca; /* Red-100 background when listening */
        }
        input,
        textarea {
          padding: 8px;
          border-radius: 4px;
          border: 1px solid #ccc;
          font: inherit;
        }
        /* Targeted submit button specifically */
        button[type="submit"] {
          margin-top: 8px;
          padding: 10px 16px;
          border-radius: 4px;
          border: none;
          cursor: pointer;
          font-weight: 600;
        }
      `}</style>
    </main>
  );
}
