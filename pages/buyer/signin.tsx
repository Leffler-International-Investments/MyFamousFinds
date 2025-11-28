// FILE: /pages/buyer/signin.tsx

import { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import Header from "../../components/Header";
import Footer from "../../components/Footer";

// 🔥 IMPORTANT: use the SAME Firebase client as Seller & Management
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

      const code = err?.code;

      if (code === "auth/user-not-found") {
        setError("No account found for this email. Please sign up.");
      } else if (code === "auth/wrong-password" || code === "auth/invalid-credential") {
        setError("Email or password is incorrect. Try again or reset your password.");
      } else if (code === "auth/too-many-requests") {
        setError("Too many attempts. Reset your password.");
      } else {
        setError("Unable to sign you in right now. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setResetSent(false);
    setResetLoading(true);
    setError(null);

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      setError("Enter your email first, then click Forgot Password.");
      setResetLoading(false);
      return;
    }

    try {
      await sendPasswordResetEmail(auth, trimmedEmail);
      setResetSent(true);
    } catch (err) {
      console.error("buyer_reset_error", err);
      setError("Unable to send reset email. Try again.");
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

          {resetSent && (
            <div className="auth-banner">
              Password reset email sent to <strong>{email}</strong>.  
              Check your inbox and follow the link.
            </div>
          )}

          {error && (
            <div className="auth-error-box">
              {error}

              <div className="auth-error-actions">
                <Link href="/buyer/signin?forgot=true" className="auth-btn forgot">
                  Forgot Password
                </Link>

                <Link href="/buyer/signup" className="auth-btn signup">
                  Create Account
                </Link>
              </div>
            </div>
          )}

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

            <button className="auth-button" type="submit" disabled={loading}>
              {loading ? "Signing in…" : "Sign in"}
            </button>

            <button
              type="button"
              className="auth-link-button"
              onClick={handleForgotPassword}
              disabled={resetLoading}
            >
              {resetLoading ? "Sending…" : "Forgot password?"}
            </button>
          </form>

          <p className="auth-switch">
            Don’t have an account? <Link href="/buyer/signup">Create one</Link>
          </p>

        </div>
      </main>

      <Footer />

      <style jsx>{`
        .auth-banner {
          background: #ecfdf5;
          border: 1px solid #16a34a;
          padding: 12px;
          border-radius: 6px;
          color: #14532d;
          margin-bottom: 12px;
        }

        .auth-error-box {
          background: #fff1f1;
          border: 1px solid #ffcccc;
          padding: 12px;
          border-radius: 6px;
          margin-bottom: 12px;
        }

        .auth-error-actions {
          margin-top: 10px;
          display: flex;
          gap: 10px;
        }

        .auth-btn {
          flex: 1;
          padding: 10px;
          text-align: center;
          border-radius: 6px;
          color: white;
          font-weight: 600;
          cursor: pointer;
        }

        .forgot {
          background: #1f2937;
        }

        .signup {
          background: #f97316;
        }
      `}</style>
    </>
  );
}
