// FILE: /pages/buyer/forgot-password.tsx

import { useState, FormEvent } from "react";
import Head from "next/head";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";

type Step = "form" | "done";

export default function BuyerForgotPasswordPage() {
  const [step, setStep] = useState<Step>("form");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      setError("Please enter your email address.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/send-password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed, role: "buyer" }),
      });
      const json = await res.json();
      if (!json.ok) {
        setError(json.message || "We couldn't send the reset link. Please try again.");
        return;
      }
      setStep("done");
    } catch (err: any) {
      console.error("buyer_forgot_password_error", err);
      setError(
        "We couldn't send the reset link. Please check your email and try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="dark-theme-page">
      <Head>
        <title>Reset buyer password | Famous Finds</title>
      </Head>

      <Header />

      <main className="wrap">
        <div className="backLink">
          <Link href="/buyer/signin">← Back to Sign in</Link>
        </div>

        {step === "form" && (
          <section className="card">
            <h1>Reset your password</h1>
            <p className="subtitle">
              Enter the email address associated with your Famous Finds
              account and we&apos;ll send you a secure link to reset your
              password.
            </p>

            {error && <div className="errorBox">{error}</div>}

            <form onSubmit={handleSubmit} className="form">
              <label htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />

              <button type="submit" disabled={loading}>
                {loading ? "Sending reset link…" : "Send reset link"}
              </button>
            </form>
          </section>
        )}

        {step === "done" && (
          <section className="card">
            <h1>Check your email</h1>
            <p className="subtitle">
              If an account exists for{" "}
              <span className="highlight">{email}</span>, you&apos;ll receive an
              email with a link to reset your password. It may take a few
              minutes and can sometimes land in your spam or promotions folder.
            </p>

            {error && <div className="errorBox">{error}</div>}

            <div className="actions">
              <button type="button" onClick={() => setStep("form")}>
                Send another reset link
              </button>
              <Link href="/buyer/signin" className="backLogin">
                ← Back to Sign in
              </Link>
            </div>
          </section>
        )}
      </main>

      <Footer />

      <style jsx>{`
        .wrap {
          max-width: 640px;
          margin: 0 auto;
          padding: 24px 16px 80px;
        }

        .backLink {
          margin-bottom: 8px;
          font-size: 0.875rem;
        }

        .backLink a {
          color: #6b7280;
          text-decoration: none;
        }

        .backLink a:hover {
          color: #111827;
        }

        .card {
          margin-top: 8px;
          background: #ffffff;
          border-radius: 16px;
          border: 1px solid #e5e7eb;
          padding: 24px 24px 28px;
          box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06);
        }

        h1 {
          font-size: 1.5rem;
          font-weight: 600;
          color: #111827;
          margin: 0 0 6px;
        }

        .subtitle {
          font-size: 0.9rem;
          color: #4b5563;
          margin-bottom: 18px;
        }

        .highlight {
          font-weight: 600;
          color: #111827;
        }

        .errorBox {
          margin-bottom: 14px;
          padding: 8px 10px;
          border-radius: 8px;
          border: 1px solid #f87171;
          background: #fef2f2;
          color: #b91c1c;
          font-size: 0.85rem;
        }

        .form {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        label {
          font-size: 0.85rem;
          font-weight: 500;
          color: #374151;
        }

        input {
          width: 100%;
          border-radius: 10px;
          border: 1px solid #d1d5db;
          padding: 8px 10px;
          font-size: 0.9rem;
          color: #111827;
        }

        input::placeholder {
          color: #9ca3af;
        }

        input:focus {
          outline: none;
          border-color: #111827;
        }

        button {
          margin-top: 6px;
          width: 100%;
          border-radius: 999px;
          border: none;
          padding: 9px 14px;
          font-size: 0.9rem;
          font-weight: 500;
          background: #111827;
          color: #ffffff;
          cursor: pointer;
          transition: background 0.15s ease, opacity 0.15s ease;
        }

        button:hover {
          background: #020617;
        }

        button:disabled {
          opacity: 0.6;
          cursor: default;
        }

        .actions {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-top: 12px;
        }

        .actions button {
          margin-top: 0;
        }

        .backLogin {
          text-align: center;
          font-size: 0.9rem;
          color: #6b7280;
          text-decoration: none;
        }

        .backLogin:hover {
          color: #111827;
        }

        @media (max-width: 480px) {
          .card {
            padding: 20px 16px 24px;
          }
        }
      `}</style>
    </div>
  );
}
