// FILE: /pages/buyer/signup.tsx

import Head from "next/head";
import Link from "next/link";
import { FormEvent, useState } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import PasswordInput from "../../components/PasswordInput";

type SignupSuccess = { ok: true; buyerId: string };
type SignupError = { ok: false; code?: string; message?: string };
type SignupResponse = SignupSuccess | SignupError;

export default function BuyerSignupPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);

    const trimmedEmail = email.trim().toLowerCase();
    if (!fullName || !trimmedEmail || !password) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/buyer/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fullName,
          email: trimmedEmail,
          password,
        }),
      });

      let json: SignupResponse | any = {};
      try {
        json = await res.json();
      } catch {
        // ignore
      }

      if (!res.ok || !json.ok) {
        const msg: string =
          json?.message ||
          "An account with this email already exists. Please sign in instead or use \"Forgot password\" on the sign-in page.";
        setError(msg);
        return;
      }

      setInfo("Account created. Please sign in to continue.");
    } catch (err) {
      console.error("buyer_signup_error", err);
      setError("We couldn't create your account. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const showExistingLinks =
    error &&
    error
      .toLowerCase()
      .includes("already exists");

  return (
    <>
      <Head>
        <title>Create Account - Famous Finds</title>
      </Head>

      <Header />

      <main className="auth-main">
        <div className="auth-card">
          <h1>Create account</h1>
          <p className="auth-subtitle">
            Join Famous Finds to save favourites and manage your orders.
          </p>

          {error && (
            <div className="auth-error">
              {error}
              {showExistingLinks && (
                <div className="auth-helper-links">
                  <Link href="/buyer/signin">Please sign in</Link>
                  <span> • </span>
                  <Link href="/buyer/forgot-password">Forgot password</Link>
                </div>
              )}
            </div>
          )}

          {info && <div className="auth-info">{info}</div>}

          <form onSubmit={handleSubmit}>
            <div className="auth-fields">
              <div className="auth-field">
                <label htmlFor="name">Full name</label>
                <input
                  id="name"
                  type="text"
                  className="auth-input"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="auth-field">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  className="auth-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>

              <PasswordInput
                label="Password"
                value={password}
                onChange={setPassword}
                name="password"
                required
              />

              <button
                type="submit"
                className="auth-button-primary"
                disabled={loading}
              >
                {loading ? "Creating..." : "Create account"}
              </button>
            </div>
          </form>

          <p className="auth-secondary-link">
            Already have an account? <Link href="/buyer/signin">Sign in</Link>
          </p>
        </div>
      </main>

      <Footer />

      <style jsx>{`
        .auth-main {
          min-height: 70vh;
          display: flex;
          justify-content: center;
          padding: 60px 16px;
          background: #ffffff;
        }
        .auth-card {
          width: 100%;
          max-width: 420px;
          background: #ffffff;
          border-radius: 22px;
          border: 1px solid #e5e7eb;
          padding: 32px 28px;
          box-shadow: 0 12px 35px rgba(0, 0, 0, 0.06);
        }
        h1 {
          font-size: 26px;
          font-weight: 700;
          margin: 0 0 8px;
          text-align: center;
        }
        .auth-subtitle {
          margin: 0 0 24px;
          font-size: 14px;
          color: #6b7280;
          text-align: center;
        }
        .auth-fields {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .auth-field label {
          display: block;
          margin-bottom: 6px;
          font-size: 13px;
          font-weight: 500;
          color: #374151;
        }
        .auth-input {
          width: 100%;
          border-radius: 14px;
          border: 1px solid #d1d5db;
          background: #fafafa;
          padding: 10px 14px;
          font-size: 14px;
          transition: all 0.2s ease;
        }
        .auth-input:focus {
          outline: none;
          border-color: #111;
          background: #fff;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }
        .auth-button-primary {
          margin-top: 8px;
          width: 100%;
          border-radius: 999px;
          padding: 12px;
          border: none;
          font-size: 14px;
          font-weight: 600;
          background: #111;
          color: #fff;
          cursor: pointer;
        }
        .auth-error,
        .auth-info {
          border-radius: 12px;
          padding: 10px;
          font-size: 13px;
          margin-bottom: 16px;
          text-align: center;
        }
        .auth-error {
          background: #fff4d4;
          color: #7a4a00;
        }
        .auth-info {
          background: #eff6ff;
          color: #1d4ed8;
        }
        .auth-helper-links {
          margin-top: 8px;
          font-size: 12px;
        }
        .auth-helper-links a {
          text-decoration: underline;
          color: #6b7280;
        }
        .auth-secondary-link {
          margin-top: 20px;
          text-align: center;
          font-size: 13px;
        }
        .auth-secondary-link a {
          text-decoration: underline;
          color: #6b7280;
        }
      `}</style>
    </>
  );
}
