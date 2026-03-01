// FILE: /pages/seller/reset-password.tsx
// Password reset form — the seller lands here from the email link.
// Reads ?oobCode= from the URL, verifies it with Firebase client SDK,
// lets the seller set a new password, then redirects to login.

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import PasswordInput from "../../components/PasswordInput";
import {
  verifyPasswordResetCode,
  confirmPasswordReset,
} from "firebase/auth";
import { auth } from "../../utils/firebaseClient";

type Step = "loading" | "form" | "success" | "error";

export default function SellerResetPasswordPage() {
  const router = useRouter();

  const [step, setStep] = useState<Step>("loading");
  const [oobCode, setOobCode] = useState<string | null>(null);
  const [verifiedEmail, setVerifiedEmail] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Verify oobCode on mount ────────────────────
  useEffect(() => {
    if (!router.isReady) return;

    const code =
      (router.query.oobCode as string) ||
      (router.query.token as string) ||
      null;

    if (!code) {
      setError("Reset link is invalid or missing. Please request a new one.");
      setStep("error");
      return;
    }

    if (!auth) {
      setError(
        "Firebase is not configured. Please contact support."
      );
      setStep("error");
      return;
    }

    setOobCode(code);

    verifyPasswordResetCode(auth, code)
      .then((email) => {
        setVerifiedEmail(email);
        setStep("form");
      })
      .catch((err) => {
        console.error("[reset-password] verifyPasswordResetCode failed:", err);
        const msg = friendlyError(err?.code);
        setError(msg);
        setStep("error");
      });
  }, [router.isReady, router.query.oobCode, router.query.token]);

  // ── Submit new password ────────────────────────
  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!password || password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (!oobCode || !auth) {
      setError("Invalid reset session. Please request a new link.");
      return;
    }

    setLoading(true);
    try {
      await confirmPasswordReset(auth, oobCode, password);
      setStep("success");
    } catch (err: any) {
      console.error("[reset-password] confirmPasswordReset failed:", err);
      setError(friendlyError(err?.code));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <Head>
        <title>Set new password | Famous Finds</title>
      </Head>

      <Header />

      <main className="auth-main">
        <div className="auth-card">
          {/* ── Loading state ── */}
          {step === "loading" && (
            <>
              <h1>Verifying link&hellip;</h1>
              <p className="auth-subtitle">
                Please wait while we verify your reset link.
              </p>
            </>
          )}

          {/* ── Invalid / expired link ── */}
          {step === "error" && (
            <>
              <h1>Unable to reset password</h1>
              {error && <div className="auth-error">{error}</div>}
              <div className="link-group">
                <Link href="/seller/forgot-password" className="auth-button-primary-link">
                  Request a new reset link
                </Link>
                <Link href="/seller/login" className="auth-secondary-link">
                  &larr; Back to Login
                </Link>
              </div>
            </>
          )}

          {/* ── Password form ── */}
          {step === "form" && (
            <>
              <h1>Set a new password</h1>
              <p className="auth-subtitle">
                {verifiedEmail ? (
                  <>
                    Enter a new password for{" "}
                    <span className="highlight">{verifiedEmail}</span>.
                  </>
                ) : (
                  "Enter your new password below."
                )}
              </p>

              {error && <div className="auth-error">{error}</div>}

              <form onSubmit={handleSubmit}>
                <div className="auth-fields">
                  <PasswordInput
                    label="New password"
                    value={password}
                    onChange={setPassword}
                    name="new-password"
                    required
                    showStrength
                    placeholder="Min 8 characters"
                  />
                  <PasswordInput
                    label="Confirm password"
                    value={confirm}
                    onChange={setConfirm}
                    name="confirm-password"
                    required
                    showStrength={false}
                    placeholder="Re-enter password"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="auth-button-primary"
                  >
                    {loading ? "Resetting\u2026" : "Reset password"}
                  </button>
                </div>
              </form>

              <p className="auth-secondary-link-bottom">
                <Link href="/seller/login">&larr; Back to Login</Link>
              </p>
            </>
          )}

          {/* ── Success ── */}
          {step === "success" && (
            <>
              <h1>Password updated</h1>
              <div className="auth-success">
                Your password has been reset successfully. You can now sign in
                with your new password.
              </div>
              <div className="link-group">
                <Link href="/seller/login" className="auth-button-primary-link">
                  Go to Seller Login
                </Link>
              </div>
            </>
          )}
        </div>
      </main>

      <Footer />

      <style jsx>{`
        .auth-page {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: #ffffff;
          color: #111;
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
          border-radius: 22px;
          border: 1px solid #e5e7eb;
          padding: 32px 28px;
          box-shadow: 0 12px 35px rgba(0, 0, 0, 0.06);
        }
        h1 {
          font-family: ui-serif, "Times New Roman", serif;
          font-size: 26px;
          font-weight: 700;
          margin: 0 0 8px;
          letter-spacing: -0.02em;
          color: #111;
          text-align: center;
        }
        .auth-subtitle {
          margin: 0 0 24px;
          font-size: 14px;
          color: #6b7280;
          text-align: center;
          line-height: 1.5;
        }
        .highlight {
          font-weight: 600;
          color: #111827;
        }
        .auth-fields {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        :global(.auth-input) {
          width: 100%;
          border-radius: 14px !important;
          border: 1px solid #d1d5db !important;
          background: #fafafa !important;
          padding: 10px 14px !important;
          font-size: 14px !important;
          color: #111 !important;
          transition: all 0.2s ease;
        }
        :global(.auth-input:focus) {
          outline: none;
          border-color: #111 !important;
          background: #fff !important;
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
          transition: transform 0.1s ease, opacity 0.2s;
        }
        .auth-button-primary:hover {
          opacity: 0.9;
        }
        .auth-button-primary:disabled {
          opacity: 0.5;
          cursor: default;
        }
        .auth-button-primary-link {
          display: block;
          text-align: center;
          width: 100%;
          border-radius: 999px;
          padding: 12px;
          font-size: 14px;
          font-weight: 600;
          background: #111;
          color: #fff;
          text-decoration: none;
          transition: opacity 0.2s;
        }
        .auth-button-primary-link:hover {
          opacity: 0.9;
        }
        .auth-error {
          border-radius: 12px;
          padding: 10px;
          font-size: 13px;
          margin-bottom: 16px;
          text-align: center;
          background: #fef2f2;
          color: #b91c1c;
        }
        .auth-success {
          border-radius: 12px;
          padding: 10px;
          font-size: 13px;
          margin-bottom: 16px;
          text-align: center;
          background: #ecfdf5;
          color: #065f46;
        }
        .link-group {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: 8px;
        }
        .auth-secondary-link {
          text-align: center;
          font-size: 13px;
          color: #6b7280;
          text-decoration: underline;
        }
        .auth-secondary-link:hover {
          color: #111;
        }
        .auth-secondary-link-bottom {
          margin-top: 16px;
          text-align: center;
          font-size: 13px;
        }
        .auth-secondary-link-bottom a {
          color: #6b7280;
          text-decoration: underline;
        }
        .auth-secondary-link-bottom a:hover {
          color: #111;
        }
      `}</style>
    </div>
  );
}

/** Map Firebase error codes to user-friendly messages. */
function friendlyError(code?: string): string {
  switch (code) {
    case "auth/expired-action-code":
      return "This reset link has expired. Please request a new one.";
    case "auth/invalid-action-code":
      return "This reset link is invalid or has already been used. Please request a new one.";
    case "auth/user-disabled":
      return "This account has been disabled. Please contact support.";
    case "auth/user-not-found":
      return "No account found for this link. Please contact support.";
    case "auth/weak-password":
      return "Password is too weak. Please use at least 8 characters with a mix of letters, numbers, and symbols.";
    default:
      return "Something went wrong. Please try requesting a new reset link.";
  }
}
