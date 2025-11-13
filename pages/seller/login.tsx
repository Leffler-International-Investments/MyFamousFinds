// FILE: /pages/seller/login.tsx
// Seller login with clear orange pill CTA for new sellers

import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { FormEvent, useState } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import PasswordInput from "../../components/PasswordInput";

type LoginSuccess = { ok: true; sellerId: string };
type LoginError = {
  ok: false;
  code: "apply_first" | "pending" | "bad_credentials" | string;
  message: string;
};
type LoginResponse = LoginSuccess | LoginError;

type Start2faSuccess = {
  ok: true;
  challengeId: string;
  via: "sms" | "email";
  devCode?: string;
};
type Start2faError = { ok: false; message?: string };
type Start2faResponse = Start2faSuccess | Start2faError;

type Verify2faSuccess = { ok: true };
type Verify2faError = { ok: false; message?: string };
type Verify2faResponse = Verify2faSuccess | Verify2faError;

type TwoFactorStep = "credentials" | "verify";

export default function SellerLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<TwoFactorStep>("credentials");
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const from =
    typeof router.query.from === "string" ? router.query.from : null;

  async function handleCredentialsSubmit(e: FormEvent<HTMLFormElement>) {
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
      const res = await fetch("/api/seller/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail, password }),
      });

      const json = (await res.json()) as LoginResponse;

      if (!json.ok) {
        const errJson = json as LoginError;

        if (errJson.code === "apply_first") {
          setError("");
          setInfo(
            "We couldn't find a completed seller application for this email. Please apply as a seller first using the orange button below."
          );
          return;
        }

        if (errJson.code === "pending") {
          setError("");
          setInfo(
            "Your seller application is still under review. We'll email you as soon as it's approved."
          );
          return;
        }

        if (errJson.code === "bad_credentials") {
          setError("Incorrect email or password. Please try again.");
          return;
        }

        setError(
          errJson.message ||
            "We couldn't sign you in. Please check your details and try again."
        );
        return;
      }

      const twofaRes = await fetch("/api/auth/start-2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: trimmedEmail,
          role: "seller",
          method: "email",
        }),
      });

      const twofaJson = (await twofaRes.json()) as Start2faResponse;

      if (!twofaJson.ok) {
        const errJson = twofaJson as Start2faError;
        setError(
          errJson.message ||
            "We couldn't start the verification process. Please try again."
        );
        return;
      }

      setChallengeId(twofaJson.challengeId);
      setStep("verify");
      let message = "We've sent a 6-digit code to your email address.";
      if ((twofaJson as Start2faSuccess).devCode) {
        message += ` (Dev code: ${(twofaJson as Start2faSuccess).devCode})`;
      }
      setInfo(message);
    } catch (err) {
      console.error("seller_login_error", err);
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
        body: JSON.stringify({
          challengeId,
          code: code.trim(),
        }),
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
      }

      if (from) {
        router.push(from);
      } else {
        router.push("/seller/dashboard");
      }
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
        <title>Seller Login - Famous Finds</title>
      </Head>
      <div className="auth-page">
        <Header />
        <main className="auth-main">
          <div className="auth-card">
            <h1>Seller Login</h1>
            <p className="auth-subtitle">
              Only <strong>approved sellers</strong> can log in here.
              <br />
              If you are new, please first complete your seller profile and
              application.
            </p>

            {error && <div className="auth-error">{error}</div>}
            {info && <div className="auth-info">{info}</div>}

            {step === "credentials" ? (
              <form onSubmit={handleCredentialsSubmit}>
                <div className="auth-fields">
                  <div className="auth-field">
                    <label htmlFor="email">Email</label>
                    <input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="auth-input"
                      placeholder="you@example.com"
                      disabled={disabled}
                    />
                  </div>
                  <PasswordInput
                    label="Password"
                    value={password}
                    onChange={setPassword}
                    name="password"
                    required
                    showStrength
                    placeholder="Enter your seller password"
                  />
                  <button
                    type="submit"
                    disabled={disabled}
                    className="auth-button-primary"
                  >
                    {loading ? "Checking..." : "Send code & continue"}
                  </button>

                  {/* BIG ORANGE PILL for new sellers */}
                  <p className="auth-apply-link">
                    <Link
                      href="/seller/register-vetting"
                      className="auth-apply-pill"
                    >
                      New here? Complete your seller profile &amp; apply
                    </Link>
                  </p>
                </div>
              </form>
            ) : (
              <form onSubmit={handleVerifySubmit}>
                <p className="auth-secondary-link-inline">
                  Enter the 6-digit code we sent to your email address to finish
                  signing in.
                </p>
                <div className="auth-fields">
                  <div className="auth-field">
                    <label htmlFor="code">Verification code</label>
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
                    {loading ? "Verifying..." : "Confirm & continue"}
                  </button>
                </div>
                <p className="auth-secondary-link-inline">
                  <button
                    type="button"
                    onClick={() => {
                      if (disabled) return;
                      setStep("credentials");
                      setCode("");
                      setInfo(null);
                      setError(null);
                    }}
                  >
                    Use a different email
                  </button>
                </p>
              </form>
            )}

            <p className="auth-secondary-link">
              <Link href="/">Back to storefront</Link>
            </p>
            <p className="auth-secondary-link">
              <Link href="/seller/forgot-password">Forgot password?</Link>
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
          background: #020617;
          color: #f9fafb;
        }

        .auth-main {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px 16px 40px;
        }

        .auth-card {
          width: 100%;
          max-width: 420px;
          background: #020617;
          border-radius: 16px;
          border: 1px solid rgba(148, 163, 184, 0.4);
          padding: 24px 20px 20px;
          box-shadow: 0 18px 45px rgba(15, 23, 42, 0.7);
        }

        h1 {
          font-size: 20px;
          margin: 0 0 8px;
        }

        .auth-subtitle {
          margin: 0 0 16px;
          font-size: 12px;
          color: #9ca3af;
          line-height: 1.5;
        }

        .auth-error {
          background: #7f1d1d;
          color: #fee2e2;
          border-radius: 8px;
          padding: 8px 10px;
          font-size: 12px;
          margin-bottom: 10px;
        }

        .auth-info {
          background: #0f172a;
          color: #e5e7eb;
          border-radius: 8px;
          padding: 8px 10px;
          font-size: 12px;
          margin-bottom: 10px;
          border: 1px solid rgba(148, 163, 184, 0.5);
        }

        .auth-fields {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .auth-field label {
          font-size: 12px;
          color: #e5e7eb;
          display: block;
          margin-bottom: 4px;
        }

        .auth-input {
          width: 100%;
          border-radius: 999px;
          border: 1px solid rgba(148, 163, 184, 0.7);
          background: rgba(15, 23, 42, 0.85);
          padding: 10px 12px;
          font-size: 13px;
          color: #f9fafb;
        }

        .auth-input::placeholder {
          color: #6b7280;
        }

        .auth-button-primary {
          margin-top: 4px;
          width: 100%;
          border-radius: 999px;
          border: none;
          padding: 10px 12px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          background: #f9fafb;
          color: #020617;
        }

        .auth-button-primary:disabled {
          opacity: 0.7;
          cursor: default;
        }

        .auth-code-input {
          letter-spacing: 0.2em;
          text-align: center;
        }

        .auth-secondary-link,
        .auth-secondary-link-inline {
          margin-top: 12px;
          font-size: 12px;
          color: #9ca3af;
          text-align: center;
        }

        .auth-secondary-link a {
          color: #e5e7eb;
          text-decoration: underline;
          text-underline-offset: 2px;
        }

        .auth-secondary-link-inline button {
          border: none;
          background: transparent;
          color: #e5e7eb;
          text-decoration: underline;
          text-underline-offset: 2px;
          font-size: 12px;
          cursor: pointer;
        }
        
        /* --- 1. THIS CLASS IS UPDATED --- */
        .auth-apply-link {
          margin-top: 18px;
          /* text-align: center; (Removed as it's no longer needed) */
        }

        /* --- 2. THIS CLASS IS UPDATED TO BE FULL-WIDTH --- */
        .auth-apply-pill {
          /* Style to match the primary button */
          display: block;
          width: 100%;
          padding: 10px 12px; /* Matches .auth-button-primary */
          border-radius: 999px;
          font-size: 13px;  /* Matches .auth-button-primary */
          font-weight: 600; /* Matches .auth-button-primary */
          text-decoration: none;
          text-align: center;
          
          /* Orange colors */
          background: #f97316; /* orange-500 */
          color: #111827;
          box-shadow: 0 8px 18px rgba(249, 115, 22, 0.4);
        }

        .auth-apply-pill:hover {
          background: #ea580c; /* orange-600 */
        }
      `}</style>
    </>
  );
}
