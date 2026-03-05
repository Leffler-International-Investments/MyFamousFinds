// FILE: /pages/vip-login.tsx

import Head from "next/head";
import Link from "next/link";
import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/router";
import {
  signInWithEmailAndPassword,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
} from "firebase/auth";
import { auth } from "../utils/firebaseClient";
import Header from "../components/Header";
import Footer from "../components/Footer";
import GoogleOneTap from "../components/GoogleOneTap";

export default function VipLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle redirect result from signInWithRedirect (fallback for popup failures)
  useEffect(() => {
    if (!auth) return;
    getRedirectResult(auth)
      .then((result) => {
        if (result) {
          router.push("/vip-welcome");
        }
      })
      .catch((err) => {
        if (err?.code === "auth/popup-closed-by-user") return;
        console.error("vip_redirect_result_error", err);
        setError(
          err?.code === "auth/unauthorized-domain"
            ? "This domain is not authorized for Google sign-in. Please contact support."
            : err?.code === "auth/account-exists-with-different-credential"
            ? "An account already exists with this email using a different sign-in method."
            : `Sign-in failed. Please try again.${err?.code ? ` (${err.code})` : ""}`
        );
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleGoogleSignIn() {
    if (!auth) return;
    setError(null);
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithRedirect(auth, provider);
    } catch (err: any) {
      console.error("vip_google_login_error", err);
      setError(`Sign-in failed. Please try again.${err?.code ? ` (${err.code})` : ""}`);
      setLoading(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/vip-welcome");
    } catch (err: any) {
      console.error("vip_login_error", err);
      setError(
        "Your email or password is incorrect. Please try again or reset it from your main account."
      );
      setLoading(false);
    }
  }

  return (
    <>
      <Head>
        <title>VIP Login – Sign in to your Front Row profile</title>
      </Head>

      <style jsx global>{`
        .vip-auth-page {
          min-height: 100vh;
          background: radial-gradient(
            ellipse at 50% -20%,
            #f9fafb 0%,
            #e5e7eb 45%,
            #d1d5db 100%
          );
          display: flex;
          flex-direction: column;
        }

        .vip-auth-main {
          flex: 1;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 40px 16px 60px;
        }

        .vip-auth-card {
          width: 100%;
          max-width: 440px;
          background: #ffffff;
          border-radius: 18px;
          box-shadow: 0 24px 60px rgba(15, 23, 42, 0.14);
          padding: 32px 28px 30px;
          text-align: center;
        }

        .vip-auth-kicker {
          font-size: 11px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #6b7280;
          margin-bottom: 4px;
        }

        .vip-auth-title {
          font-size: 24px;
          font-weight: 600;
          margin: 0;
          color: #111827;
        }

        .vip-auth-subtitle {
          margin-top: 8px;
          margin-bottom: 24px;
          font-size: 14px;
          color: #4b5563;
        }

        .vip-auth-form {
          text-align: left;
        }

        .vip-auth-field {
          margin-bottom: 14px;
        }

        .vip-auth-label {
          display: block;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          margin-bottom: 4px;
          color: #6b7280;
        }

        .vip-auth-input {
          width: 100%;
          border-radius: 9999px;
          border: 1px solid #d1d5db;
          padding: 10px 14px;
          font-size: 14px;
          outline: none;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }

        .vip-auth-input:focus {
          border-color: #111827;
          box-shadow: 0 0 0 1px #11182722;
        }

        .vip-auth-error {
          margin-top: 6px;
          margin-bottom: 6px;
          font-size: 12px;
          color: #b91c1c;
        }

        .vip-auth-button {
          width: 100%;
          margin-top: 14px;
          border: none;
          border-radius: 9999px;
          padding: 11px 18px;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          background: #111827;
          color: #ffffff;
          cursor: pointer;
          transition: opacity 0.15s ease, transform 0.1s ease;
        }

        .vip-auth-button:hover {
          opacity: 0.92;
          transform: translateY(-1px);
        }

        .vip-auth-button:disabled {
          opacity: 0.6;
          cursor: default;
          transform: none;
        }

        .vip-auth-footer-text {
          margin-top: 14px;
          font-size: 13px;
          color: #4b5563;
        }

        .vip-auth-footer-text a {
          color: #111827;
          text-decoration: underline;
        }

        .vip-google-btn {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          padding: 11px 16px;
          border-radius: 9999px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          border: 1px solid #d1d5db;
          background: #ffffff;
          color: #111827;
          transition: background 0.15s, border-color 0.15s;
          font-family: inherit;
          margin-bottom: 4px;
        }
        .vip-google-btn:hover:not(:disabled) {
          background: #f9fafb;
          border-color: #9ca3af;
        }
        .vip-google-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .vip-auth-divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 8px 0 16px;
        }
        .vip-auth-divider::before,
        .vip-auth-divider::after {
          content: "";
          flex: 1;
          height: 1px;
          background: #d1d5db;
        }
        .vip-auth-divider span {
          font-size: 12px;
          color: #9ca3af;
          white-space: nowrap;
        }

        @media (max-width: 480px) {
          .vip-auth-card {
            padding: 24px 18px 24px;
          }
        }
      `}</style>

      <div className="vip-auth-page">
        <Header />

        <main className="vip-auth-main">
          <section className="vip-auth-card">
            <GoogleOneTap
              onSuccess={() => router.push("/vip-welcome")}
              onError={(err) => {
                console.error("one_tap_vip_error", err);
                setError("Google sign-in failed. Please try again.");
              }}
              disabled={loading}
            />
            <p className="vip-auth-kicker">VIP CLUB</p>
            <h1 className="vip-auth-title">Sign in to your VIP profile</h1>
            <p className="vip-auth-subtitle">
              Access your points, tier, and member-only perks.
            </p>

            <button
              type="button"
              className="vip-google-btn"
              onClick={handleGoogleSignIn}
              disabled={loading}
            >
              <svg viewBox="0 0 24 24" width="20" height="20">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <span>Continue with Google</span>
            </button>

            <div className="vip-auth-divider">
              <span>or sign in with email</span>
            </div>

            <form className="vip-auth-form" onSubmit={handleSubmit}>
              <div className="vip-auth-field">
                <label className="vip-auth-label">Email</label>
                <input
                  type="email"
                  className="vip-auth-input"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="vip-auth-field">
                <label className="vip-auth-label">Password</label>
                <input
                  type="password"
                  className="vip-auth-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {error && <p className="vip-auth-error">{error}</p>}

              <button
                type="submit"
                className="vip-auth-button"
                disabled={loading}
              >
                {loading ? "Signing you in..." : "Sign In"}
              </button>
            </form>

            <p className="vip-auth-footer-text">
              New to the Front Row?{" "}
              <Link href="/vip-signup">Join the Club</Link>
            </p>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
}
