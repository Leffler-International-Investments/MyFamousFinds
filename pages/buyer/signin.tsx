// FILE: /pages/buyer/signin.tsx
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { FormEvent, useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";

import Header from "../../components/Header";
import Footer from "../../components/Footer";
import PasswordInput from "../../components/PasswordInput";
import { auth } from "../../utils/firebaseClient";

export default function BuyerSigninPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const from =
    typeof router.query.from === "string" ? router.query.from : null;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, trimmedEmail, password);

      if (typeof window !== "undefined") {
        window.localStorage.setItem("ff-role", "buyer");
        window.localStorage.setItem("ff-email", trimmedEmail);
      }

      if (from) {
        router.push(from);
      } else {
        router.push("/buyer/dashboard");
      }
    } catch (err: any) {
      console.error("buyer_signin_error", err);
      // Gentle message – no red “FUCKING” alert
      setError("Email or password did not match. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const disabled = loading;

  return (
    <>
      <Head>
        <title>Sign in - Famous Finds</title>
      </Head>

      <div className="auth-page">
        <Header />
        <main className="auth-main">
          <div className="auth-card">
            <h1>Welcome back</h1>
            <p className="auth-subtitle">
              Sign in to view your VIP profile and shopping bag.
            </p>

            {error && <div className="auth-warning">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="auth-fields">
                <div className="auth-field">
                  <label htmlFor="email">Email</label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="auth-input"
                    placeholder="name@example.com"
                    disabled={disabled}
                  />
                </div>

                <PasswordInput
                  label="Password"
                  name="password"
                  value={password}
                  onChange={setPassword}
                  required
                  placeholder="Enter password"
                />

                <button
                  type="submit"
                  className="auth-button-primary"
                  disabled={disabled}
                >
                  {loading ? "Signing in..." : "Continue"}
                </button>
              </div>
            </form>

            <p className="auth-secondary-link">
              <Link href="/buyer/forgot-password">Forgot password?</Link>
            </p>
            <p className="auth-secondary-link">
              Don’t have an account?{" "}
              <Link href="/buyer/signup">Create one</Link>
            </p>
          </div>
        </main>
        <Footer />
      </div>

      <style jsx>{`
        .auth-page {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: #f8fafc;
          color: #111827;
        }
        .auth-main {
          flex: 1;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding: 60px 16px 40px;
        }
        .auth-card {
          width: 100%;
          max-width: 420px;
          background: #ffffff;
          border-radius: 28px;
          border: 1px solid #e5e7eb;
          padding: 32px 28px 28px;
          box-shadow: 0 20px 40px rgba(15, 23, 42, 0.08);
        }
        h1 {
          font-family: ui-serif, "Times New Roman", serif;
          font-size: 26px;
          font-weight: 700;
          margin: 0 0 8px;
          letter-spacing: -0.02em;
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
        :global(.auth-input) {
          width: 100%;
          border-radius: 999px;
          border: 1px solid #d1d5db;
          background: #f9fafb;
          padding: 10px 14px;
          font-size: 14px;
          color: #111827;
          transition: all 0.2s ease;
        }
        :global(.auth-input:focus) {
          outline: none;
          border-color: #111827;
          background: #ffffff;
          box-shadow: 0 2px 8px rgba(15, 23, 42, 0.06);
        }
        .auth-button-primary {
          margin-top: 4px;
          width: 100%;
          border-radius: 999px;
          padding: 12px;
          border: none;
          font-size: 14px;
          font-weight: 600;
          background: #111827;
          color: #ffffff;
          cursor: pointer;
          transition: transform 0.1s ease, opacity 0.2s;
        }
        .auth-button-primary:hover {
          opacity: 0.9;
        }
        .auth-button-primary:disabled {
          opacity: 0.6;
          cursor: default;
        }
        .auth-warning {
          border-radius: 12px;
          padding: 10px;
          margin-bottom: 16px;
          font-size: 13px;
          text-align: center;
          background: #fef3c7;
          color: #92400e;
        }
        .auth-secondary-link {
          margin-top: 12px;
          text-align: center;
          font-size: 13px;
          color: #6b7280;
        }
        .auth-secondary-link a {
          color: #111827;
          text-decoration: underline;
        }
        .auth-secondary-link a:hover {
          color: #000000;
        }
      `}</style>
    </>
  );
}
