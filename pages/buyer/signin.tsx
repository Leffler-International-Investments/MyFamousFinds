// FILE: /pages/buyer/signin.tsx

import { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import Header from "../../components/Header";
import Footer from "../../components/Footer";

import firebaseApp from "../../utils/firebaseClient";
import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
} from "firebase/auth";

const auth = getAuth(firebaseApp);

export default function BuyerSignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) router.replace("/buyer/dashboard");
    });
    return () => unsub();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const trimmedEmail = email.trim().toLowerCase();

    try {
      await signInWithEmailAndPassword(auth, trimmedEmail, password);
      router.push("/buyer/dashboard");
    } catch (err: any) {
      console.error("buyer_signin_error", err);
      const code = err?.code as string | undefined;

      if (code === "auth/invalid-credential" || code === "auth/wrong-password") {
        setError("Email or password is incorrect. Please try again.");
      } else if (code === "auth/user-not-found") {
        setError(
          "We couldn’t find an account with this email. Please create a free buyer account."
        );
      } else if (code === "auth/too-many-requests") {
        setError(
          "Too many unsuccessful attempts. Please wait a moment or reset your password."
        );
      } else {
        setError("Unable to sign you in right now. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setError(null);
    setResetSent(false);

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      setError('Enter your email above and then click "Forgot password".');
      return;
    }

    setResetLoading(true);
    try {
      await sendPasswordResetEmail(auth, trimmedEmail);
      setResetSent(true);
    } catch (err: any) {
      console.error("buyer_reset_error", err);
      setError(
        "We couldn’t send a reset email. Please double-check the address or try again later."
      );
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Sign in | Famous Finds</title>
      </Head>
      <Header />

      <main className="auth-main">
        <div className="auth-inner">
          <h1 className="auth-title">Sign in</h1>

          {/* Banner when reset email sent */}
          {resetSent && (
            <div className="auth-banner">
              Password reset email sent to <strong>{email.trim()}</strong>.{" "}
              Please check your inbox (and spam/junk) and follow the link to set
              your password. Then return here and sign in.
            </div>
          )}

          {error && <p className="auth-error">{error}</p>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-field">
              <label className="auth-label">Email</label>
              <input
                type="email"
                className="auth-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="auth-field">
              <label className="auth-label">Password</label>
              <input
                type="password"
                className="auth-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="auth-button"
              disabled={loading}
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>

            <button
              type="button"
              className="auth-link-button"
              onClick={handleForgotPassword}
              disabled={resetLoading}
            >
              {resetLoading ? "Sending reset email…" : "Forgot password?"}
            </button>
          </form>

          <p className="auth-switch">
            Don&apos;t have an account yet?{" "}
            <Link href="/buyer/signup">Create a free buyer account</Link>
          </p>
        </div>
      </main>

      <Footer />

      <style jsx>{`
        .auth-banner {
          margin-bottom: 16px;
          padding: 10px 12px;
          border-radius: 8px;
          background: #ecfdf5;
          border: 1px solid #16a34a;
          color: #14532d;
          font-size: 0.9rem;
        }
        .auth-link-button {
          margin-top: 8px;
          background: none;
          border: none;
          color: #f97316;
          font-size: 0.875rem;
          cursor: pointer;
          text-decoration: underline;
        }
        .auth-link-button:disabled {
          opacity: 0.6;
          cursor: default;
        }
      `}</style>
    </>
  );
}
