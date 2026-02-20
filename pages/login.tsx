// FILE: /pages/login.tsx
// Unified Login Portal — single sign-in for both buyers and sellers (RealReal model)

import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { FormEvent, useState } from "react";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  FacebookAuthProvider,
} from "firebase/auth";

import Header from "../components/Header";
import Footer from "../components/Footer";
import PasswordInput from "../components/PasswordInput";
import { auth } from "../utils/firebaseClient";

type LoginSuccess = { ok: true; sellerId: string };
type LoginError = {
  ok: false;
  code: "apply_first" | "pending" | "bad_credentials" | "server_not_configured" | string;
  message: string;
};
type LoginResponse = LoginSuccess | LoginError;

type Start2faSuccess = {
  ok: true;
  challengeId: string;
  via: "sms" | "email";
  devCode?: string;
  message?: string;
};
type Start2faError = { ok: false; message?: string };
type Start2faResponse = Start2faSuccess | Start2faError;

type Verify2faSuccess = { ok: true };
type Verify2faError = { ok: false; message?: string };
type Verify2faResponse = Verify2faSuccess | Verify2faError;

type TwoFactorStep = "credentials" | "choose_method" | "verify";

const SESSION_TTL_MS = 72 * 60 * 60 * 1000;

export default function UnifiedLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  // Seller 2FA state
  const [isSeller, setIsSeller] = useState(false);
  const [step, setStep] = useState<TwoFactorStep>("credentials");
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [chosenMethod, setChosenMethod] = useState<"email" | "sms">("email");
  const [code, setCode] = useState("");

  // Promo code state
  const [showPromo, setShowPromo] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);

  async function handlePromoSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPromoError(null);
    const trimmed = promoCode.trim();
    if (!trimmed) {
      setPromoError("Please enter your promo code.");
      return;
    }
    setPromoLoading(true);
    try {
      const res = await fetch("/api/auth/verify-promo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: trimmed }),
      });
      const json = await res.json();
      if (json.ok) {
        // Promo code valid — store promo access and redirect to app
        if (typeof window !== "undefined") {
          window.localStorage.setItem("ff-role", "promo");
          window.localStorage.setItem("ff-promo-access", "true");
          window.localStorage.setItem(
            "ff-session-exp",
            String(Date.now() + SESSION_TTL_MS)
          );
        }
        router.push(from || "/");
      } else {
        setPromoError("Invalid promo code. Please try again.");
      }
    } catch {
      setPromoError("Something went wrong. Please try again.");
    } finally {
      setPromoLoading(false);
    }
  }

  const from =
    typeof router.query.from === "string" ? router.query.from : null;

  async function handleSocialSignIn(provider: "google" | "facebook") {
    if (!auth) return;
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      const authProvider =
        provider === "google"
          ? new GoogleAuthProvider()
          : new FacebookAuthProvider();
      const result = await signInWithPopup(auth, authProvider);
      const userEmail = (result.user.email || "").toLowerCase();

      // Check if user is also a seller
      const sellerRes = await fetch("/api/seller/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail }),
      });
      const sellerJson = (await sellerRes.json()) as LoginResponse;

      if (sellerJson.ok) {
        setEmail(userEmail);
        setIsSeller(true);
        setStep("choose_method");
        return;
      }

      // Sign in as buyer
      if (typeof window !== "undefined") {
        window.localStorage.setItem("ff-role", "buyer");
        window.localStorage.setItem("ff-email", userEmail);
        window.localStorage.setItem(
          "ff-session-exp",
          String(Date.now() + SESSION_TTL_MS)
        );
      }
      router.push(from || "/account");
    } catch (err: any) {
      console.error("social_login_error", err);
      if (err?.code === "auth/popup-closed-by-user") return;
      setError("Sign-in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setInfo(null);

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);
    try {
      // Authenticate with Firebase
      await signInWithEmailAndPassword(auth, trimmedEmail, password);

      // Check if user is also a seller
      const sellerRes = await fetch("/api/seller/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail }),
      });
      const sellerJson = (await sellerRes.json()) as LoginResponse;

      if (sellerJson.ok) {
        // User is an approved seller — let them pick 2FA method
        setIsSeller(true);
        setStep("choose_method");
        return;
      }

      // Not a seller or seller not approved — sign in as buyer
      if (typeof window !== "undefined") {
        window.localStorage.setItem("ff-role", "buyer");
        window.localStorage.setItem("ff-email", trimmedEmail);
        window.localStorage.setItem(
          "ff-session-exp",
          String(Date.now() + SESSION_TTL_MS)
        );
      }

      if (from) {
        router.push(from);
      } else {
        router.push("/account");
      }
    } catch (err: any) {
      console.error("unified_login_error", err);
      setError("Email or password did not match. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleChooseMethod(method: "email" | "sms") {
    setError(null);
    setInfo(null);
    setChosenMethod(method);
    setLoading(true);

    try {
      const trimmedEmail = email.trim().toLowerCase();
      const twofaRes = await fetch("/api/auth/start-2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail, role: "seller", method }),
      });
      const twofaJson = (await twofaRes.json()) as Start2faResponse;
      if (!twofaJson.ok) {
        const errJson = twofaJson as Start2faError;
        setError(errJson.message || "We couldn't start the verification process.");
        return;
      }
      setChallengeId(twofaJson.challengeId);
      setStep("verify");
      const successJson = twofaJson as Start2faSuccess;
      const message = successJson.devCode
        ? `Your 6-digit code is: ${successJson.devCode}`
        : successJson.message || "Code sent.";
      setInfo(message);
    } catch (err) {
      console.error("seller_start_2fa_error", err);
      setError("Unexpected error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifySubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!challengeId) {
      setError("Your verification session has expired. Please log in again.");
      return;
    }
    if (!code.trim()) {
      setError("Please enter the verification code.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeId, code: code.trim() }),
      });
      const json = (await res.json()) as Verify2faResponse;
      if (!json.ok) {
        const errJson = json as Verify2faError;
        setError(errJson.message || "Incorrect or expired code.");
        return;
      }
      if (typeof window !== "undefined") {
        window.localStorage.setItem("ff-role", "seller");
        window.localStorage.setItem("ff-email", email.toLowerCase().trim());
        window.localStorage.setItem(
          "ff-session-exp",
          String(Date.now() + SESSION_TTL_MS)
        );
      }
      if (from) router.push(from);
      else router.push("/account");
    } catch (err) {
      console.error("seller_verify_2fa_error", err);
      setError("Unable to verify the code. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const disabled = loading;

  return (
    <>
      <Head>
        <title>Sign In - Famous Finds</title>
      </Head>

      <div className="auth-page">
        <Header />
        <main className="auth-main">
          <div className="auth-card">
            <h1>Welcome to Famous Finds</h1>
            <p className="auth-subtitle">
              Sign in to shop, sell, and manage your account — all in one place.
            </p>

            {error && <div className="auth-error">{error}</div>}
            {info && <div className="auth-info">{info}</div>}

            {step === "credentials" ? (
              <>
                <div className="social-buttons">
                  <button
                    type="button"
                    className="social-btn"
                    onClick={() => handleSocialSignIn("google")}
                    disabled={disabled}
                  >
                    <svg viewBox="0 0 24 24" width="20" height="20">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    <span>Continue with Google</span>
                  </button>
                  <button
                    type="button"
                    className="social-btn social-btn--fb"
                    onClick={() => handleSocialSignIn("facebook")}
                    disabled={disabled}
                  >
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="#1877F2">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    <span>Continue with Facebook</span>
                  </button>
                </div>

                <div className="auth-divider">
                  <span>or sign in with email</span>
                </div>

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
                    {loading ? "Signing in..." : "Sign In"}
                  </button>
                </div>
              </form>
              </>
            ) : step === "choose_method" ? (
              <div className="method-choice">
                <p className="auth-secondary-text">
                  Seller account detected. How would you like to receive your verification code?
                </p>
                {error && <div className="auth-error">{error}</div>}
                <div className="method-buttons">
                  <button
                    type="button"
                    disabled={disabled}
                    className="method-button"
                    onClick={() => handleChooseMethod("email")}
                  >
                    <span className="method-icon">&#9993;</span>
                    <span className="method-label">Email</span>
                    <span className="method-desc">Send code to my email</span>
                  </button>
                  <button
                    type="button"
                    disabled={disabled}
                    className="method-button"
                    onClick={() => handleChooseMethod("sms")}
                  >
                    <span className="method-icon">&#128241;</span>
                    <span className="method-label">SMS</span>
                    <span className="method-desc">Send code to my phone</span>
                  </button>
                </div>
                <p className="auth-secondary-text">
                  <button
                    type="button"
                    className="auth-link-button"
                    onClick={() => {
                      setStep("credentials");
                      setIsSeller(false);
                      setError(null);
                      setInfo(null);
                    }}
                  >
                    Back to login
                  </button>
                </p>
              </div>
            ) : (
              <form onSubmit={handleVerifySubmit}>
                <p className="auth-secondary-text">
                  Enter the 6-digit code sent to your {chosenMethod === "sms" ? "phone" : "email"}.
                </p>
                <div className="auth-fields">
                  <div className="auth-field">
                    <label htmlFor="code">Verification Code</label>
                    <input
                      id="code"
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      className="auth-input auth-code-input"
                      disabled={disabled}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={disabled}
                    className="auth-button-primary"
                  >
                    {loading ? "Verifying..." : "Confirm Login"}
                  </button>
                </div>
                <p className="auth-secondary-text">
                  <button
                    type="button"
                    className="auth-link-button"
                    onClick={() => {
                      if (disabled) return;
                      setStep("credentials");
                      setIsSeller(false);
                      setCode("");
                      setInfo(null);
                      setError(null);
                    }}
                  >
                    Back to login
                  </button>
                </p>
              </form>
            )}

            <div className="auth-links">
              <p className="auth-secondary-link">
                <Link href="/buyer/forgot-password">Forgot password?</Link>
              </p>
              <p className="auth-secondary-link">
                Don&apos;t have an account?{" "}
                <Link href="/signup">Create one</Link>
              </p>
            </div>

            {/* Promo code section */}
            <div className="promo-section">
              {!showPromo ? (
                <button
                  type="button"
                  className="promo-toggle"
                  onClick={() => setShowPromo(true)}
                >
                  Have a promo code?
                </button>
              ) : (
                <form onSubmit={handlePromoSubmit} className="promo-form">
                  <p className="promo-label">Enter your promo code</p>
                  {promoError && (
                    <p className="promo-error">{promoError}</p>
                  )}
                  <div className="promo-row">
                    <input
                      type="text"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      className="promo-input"
                      placeholder="Promo code"
                      autoComplete="off"
                      disabled={promoLoading}
                    />
                    <button
                      type="submit"
                      className="promo-btn"
                      disabled={promoLoading}
                    >
                      {promoLoading ? "..." : "Go"}
                    </button>
                  </div>
                </form>
              )}
            </div>
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
          line-height: 1.5;
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
          border-radius: 14px;
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
        .auth-error,
        .auth-info {
          border-radius: 12px;
          padding: 10px;
          font-size: 13px;
          margin-bottom: 16px;
          text-align: center;
        }
        .auth-error {
          background: #fef2f2;
          color: #b91c1c;
        }
        .auth-info {
          background: #eff6ff;
          color: #1d4ed8;
        }
        .seller-badge {
          text-align: center;
          font-size: 12px;
          font-weight: 600;
          color: #059669;
          background: #ecfdf5;
          border: 1px solid #a7f3d0;
          border-radius: 999px;
          padding: 6px 14px;
          margin-bottom: 16px;
          display: inline-block;
          width: 100%;
        }
        .auth-code-input {
          text-align: center;
          letter-spacing: 0.2em;
          font-weight: 600;
        }
        .method-choice {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .method-buttons {
          display: flex;
          gap: 12px;
        }
        .method-button {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          padding: 20px 12px;
          border-radius: 16px;
          border: 1px solid #d1d5db;
          background: #fafafa;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .method-button:hover {
          border-color: #111827;
          background: #ffffff;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        }
        .method-button:disabled {
          opacity: 0.5;
          cursor: default;
        }
        .method-icon {
          font-size: 28px;
          line-height: 1;
        }
        .method-label {
          font-size: 14px;
          font-weight: 600;
          color: #111827;
        }
        .method-desc {
          font-size: 11px;
          color: #6b7280;
        }
        .auth-secondary-text {
          text-align: center;
          font-size: 13px;
          color: #6b7280;
          margin-bottom: 8px;
        }
        .auth-link-button {
          border: none;
          background: none;
          color: #111827;
          text-decoration: underline;
          cursor: pointer;
          font-size: 13px;
        }
        .auth-links {
          margin-top: 20px;
          border-top: 1px solid #f3f4f6;
          padding-top: 16px;
        }
        .auth-secondary-link {
          margin-top: 8px;
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

        /* Promo code */
        .promo-section {
          margin-top: 20px;
          padding-top: 16px;
          border-top: 1px solid #e5e7eb;
          text-align: center;
        }
        .promo-toggle {
          font-size: 13px;
          color: #6b7280;
          background: none;
          border: none;
          cursor: pointer;
          text-decoration: underline;
          text-underline-offset: 2px;
        }
        .promo-toggle:hover {
          color: #111827;
        }
        .promo-form {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .promo-label {
          font-size: 13px;
          font-weight: 500;
          color: #374151;
          margin: 0;
        }
        .promo-error {
          font-size: 12px;
          color: #b91c1c;
          margin: 0;
        }
        .promo-row {
          display: flex;
          gap: 8px;
        }
        .promo-input {
          flex: 1;
          border-radius: 999px;
          border: 1px solid #d1d5db;
          background: #f9fafb;
          padding: 8px 14px;
          font-size: 14px;
          color: #111827;
        }
        .promo-input:focus {
          outline: none;
          border-color: #111827;
          background: #ffffff;
        }
        .promo-btn {
          border-radius: 999px;
          background: #111827;
          color: #ffffff;
          border: none;
          padding: 8px 20px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
        }
        .promo-btn:hover {
          opacity: 0.9;
        }
        .promo-btn:disabled {
          opacity: 0.6;
          cursor: default;
        }

        .social-buttons {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-bottom: 4px;
        }
        .social-btn {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          padding: 12px 16px;
          border-radius: 999px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          border: 1px solid #d1d5db;
          background: #ffffff;
          color: #111827;
          transition: background 0.15s, border-color 0.15s;
          font-family: inherit;
        }
        .social-btn:hover:not(:disabled) {
          background: #f9fafb;
          border-color: #9ca3af;
        }
        .social-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .social-btn--fb {
          background: #1877F2;
          border-color: #1877F2;
          color: #ffffff;
        }
        .social-btn--fb svg {
          fill: #ffffff;
        }
        .social-btn--fb:hover:not(:disabled) {
          background: #166fe5;
          border-color: #166fe5;
        }
        .auth-divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 8px 0;
        }
        .auth-divider::before,
        .auth-divider::after {
          content: "";
          flex: 1;
          height: 1px;
          background: #e5e7eb;
        }
        .auth-divider span {
          font-size: 12px;
          color: #9ca3af;
          white-space: nowrap;
        }
      `}</style>
    </>
  );
}
