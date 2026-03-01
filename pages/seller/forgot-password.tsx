// FILE: /pages/seller/forgot-password.tsx

import { useState, FormEvent } from "react";
import Head from "next/head";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";

type Step = "form" | "done";

export default function SellerForgotPasswordPage() {
  const [step, setStep] = useState<Step>("form");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debug, setDebug] = useState<string | null>(null);
  const [resendCount, setResendCount] = useState(0);

  async function requestReset(emailAddr: string) {
    setError(null);
    setDebug(null);
    setLoading(true);

    try {
      const res = await fetch("/api/seller/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailAddr }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok || (json && !json.ok)) {
        const msg =
          json?.error ||
          (res.status === 429
            ? "Too many requests. Please wait a few minutes and try again."
            : res.status === 500
              ? "Server error — see details below."
              : `Request failed with status ${res.status}`);
        setError(msg);
        if (json?.debug) setDebug(json.debug);
        return false;
      }

      return true;
    } catch (err: any) {
      console.error("seller_forgot_password_error", err);
      setError(
        err?.message === "Failed to fetch"
          ? "Network error — could not reach the server. Check your connection."
          : err?.message || "Something went wrong. Please try again."
      );
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const trimmed = email.trim();
    if (!trimmed) {
      setError("Please enter your email address.");
      return;
    }

    const ok = await requestReset(trimmed);
    if (ok) {
      setStep("done");
      setResendCount(0);
    }
  }

  async function handleResend() {
    const trimmed = email.trim();
    if (!trimmed) return;

    const ok = await requestReset(trimmed);
    if (ok) {
      setResendCount((c) => c + 1);
      setError(null);
      setDebug(null);
    }
  }

  return (
    <div className="dark-theme-page">
      <Head>
        <title>Reset seller password | Famous Finds</title>
      </Head>

      <Header />

      <main className="wrap">
        <div className="backLink">
          <Link href="/seller/login">&larr; Back to Login</Link>
        </div>

        {step === "form" && (
          <section className="card">
            <h1>Reset your seller password</h1>
            <p className="subtitle">
              Enter the email address associated with your seller account and
              we&apos;ll send you a secure link to reset your password.
            </p>

            {error && <div className="errorBox">{error}</div>}
            {debug && (
              <details className="debugBox">
                <summary>Technical details (for admin)</summary>
                <pre>{debug}</pre>
              </details>
            )}

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
                {loading ? "Sending reset link\u2026" : "Send reset link"}
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
            {debug && (
              <details className="debugBox">
                <summary>Technical details (for admin)</summary>
                <pre>{debug}</pre>
              </details>
            )}

            {resendCount > 0 && !error && (
              <div className="successBox">
                Reset link sent again. Please check your inbox.
              </div>
            )}

            <div className="actions">
              <button type="button" onClick={handleResend} disabled={loading}>
                {loading ? "Resending\u2026" : "Resend reset link"}
              </button>
              <button
                type="button"
                className="secondaryBtn"
                onClick={() => {
                  setStep("form");
                  setError(null);
                  setDebug(null);
                  setResendCount(0);
                }}
              >
                Try a different email
              </button>
              <Link href="/seller/login" className="backLogin">
                &larr; Back to Login
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
          padding: 10px 12px;
          border-radius: 8px;
          border: 1px solid #f87171;
          background: #fef2f2;
          color: #b91c1c;
          font-size: 0.85rem;
          line-height: 1.5;
        }

        .debugBox {
          margin-bottom: 14px;
          padding: 8px 10px;
          border-radius: 8px;
          border: 1px solid #fbbf24;
          background: #fffbeb;
          font-size: 0.8rem;
          color: #92400e;
        }

        .debugBox summary {
          cursor: pointer;
          font-weight: 500;
          font-size: 0.8rem;
        }

        .debugBox pre {
          margin: 6px 0 0;
          white-space: pre-wrap;
          word-break: break-all;
          font-size: 0.75rem;
          line-height: 1.4;
          color: #78350f;
        }

        .successBox {
          margin-bottom: 14px;
          padding: 8px 10px;
          border-radius: 8px;
          border: 1px solid #6ee7b7;
          background: #ecfdf5;
          color: #065f46;
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

        .secondaryBtn {
          background: #ffffff;
          color: #374151;
          border: 1px solid #d1d5db;
        }

        .secondaryBtn:hover {
          background: #f9fafb;
          border-color: #111827;
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
