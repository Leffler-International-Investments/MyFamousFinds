// FILE: /pages/login.tsx
// Unified Login Portal — single sign-in for both buyers and sellers (RealReal model)

import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { FormEvent, useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";

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

  const from =
    typeof router.query.from === "string" ? router.query.from : null;

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
        // User is an approved seller — require 2FA
        setIsSeller(true);
        setStep("choose_method");
        setLoading(false);
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
            ) : step === "choose_method" ? (
              <div className="method-choice">
                <div className="seller-badge">Seller account detected</div>
                <p className="auth-secondary-text">
                  How would you like to receive your verification code?
                </p>
                <div className="method-buttons">
                  <button
                    type="button"
                    disabled={disabled}
                    className="method-button"
                    onClick={() => handleChooseMethod("email")}
                  >
                    <span className="method-icon">&#9993;</span>
                    <span className="method-label">Email</span>
                    <span className="method-desc">Send code to your email</span>
                  </button>
                  <button
                    type="button"
                    disabled={disabled}
                    className="method-button"
                    onClick={() => handleChooseMethod("sms")}
                  >
                    <span className="method-icon">&#128241;</span>
                    <span className="method-label">SMS</span>
                    <span className="method-desc">Send code to your mobile</span>
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
                  Enter the 6-digit code sent to your{" "}
                  {chosenMethod === "sms" ? "mobile" : "email"}.
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
                      setStep("choose_method");
                      setCode("");
                      setInfo(null);
                      setError(null);
                    }}
                  >
                    Try a different method
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
      `}</style>
    </>
  );
}
