// FILE: /pages/management/forgot-password.tsx

import Head from "next/head";
import Link from "next/link";
import { FormEvent, useState } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";

export default function ManagementForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      setError("Please enter your email address.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/auth/send-password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed, role: "management" }),
      });
      const json = await res.json();
      if (!json.ok) {
        setError(json.message || "We couldn't send the reset link. Please try again.");
        return;
      }
      setSent(true);
    } catch (err: any) {
      console.error(err);
      setError(
        err?.message ||
          "We couldn't send a reset link. Please check the email and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const disabled = loading;

  return (
    <>
      <Head>
        <title>Management – Forgot Password | Famous Finds</title>
      </Head>

      <div className="auth-page">
        <Header />
        <main className="auth-main">
          <div className="auth-card">
            <h1>Reset your admin password</h1>
            {!sent ? (
              <>
                <p className="auth-subtitle">
                  Enter the email address associated with your admin account and
                  we&apos;ll email you a secure password reset link.
                </p>

                {error && <div className="auth-error">{error}</div>}

                <form onSubmit={handleSubmit}>
                  <div className="auth-fields">
                    <div className="auth-field">
                      <label htmlFor="email">Admin email address</label>
                      <input
                        id="email"
                        type="email"
                        autoComplete="email"
                        className="auth-input"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={disabled}
                        placeholder="admin@example.com"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      className="auth-button-primary"
                      disabled={disabled}
                    >
                      {loading ? "Sending reset link…" : "Send reset link"}
                    </button>
                  </div>
                </form>

                <p className="auth-secondary-link">
                  <Link href="/management/login">← Back to admin login</Link>
                </p>
              </>
            ) : (
              <>
                <p className="auth-info">
                  If there&apos;s an account for{" "}
                  <strong>{email.toLowerCase()}</strong>, we&apos;ve emailed a
                  password reset link. Please check your inbox (and spam folder)
                  and follow the instructions.
                </p>

                <p className="auth-secondary-link">
                  <Link href="/management/login">
                    ← Return to admin login
                  </Link>
                </p>
              </>
            )}
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}
