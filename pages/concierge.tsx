// FILE: /pages/concierge.tsx
import React, { useState } from "react";

export default function ConciergePage() {
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    // Build a plain object from the form without using FormData.entries()
    const formData = new FormData(e.currentTarget);
    const payload: Record<string, string> = {};
    formData.forEach((value, key) => {
      payload[key] = String(value);
    });

    await fetch("/api/concierge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setSent(true);
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

        <label>
          What are you looking for?
          <textarea name="request" rows={4} required />
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
        input,
        textarea {
          padding: 8px;
          border-radius: 4px;
          border: 1px solid #ccc;
          font: inherit;
        }
        button {
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
