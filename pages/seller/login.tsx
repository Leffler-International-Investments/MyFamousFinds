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

                  <div className="auth-apply-button-wrapper">
                    <Link
                      href="/seller/register-vetting"
                      className="auth-apply-button"
                    >
                      New here? Complete your seller profile &amp; apply
                    </Link>
                  </div>
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
          background: #ffffff;
          color: #111827;
        }

        .auth-main {
          flex: 1;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding: 32px 16px 40px;
        }

        .auth-card {
          max-width: 420px;
          margin: 0 auto;
          background: #ffffff;
          border-radius: 16px;
          border: 1px solid rgba(226, 232, 240, 1);
          padding: 24px 22px 22px;
          box-shadow: 0 18px 45px rgba(15, 23, 42, 0.08);
        }

        h1 {
          font-size: 22px;
          margin: 0 0 8px;
        }

        .auth-subtitle {
          margin: 0 0 14px;
          font-size: 12px;
          line-height: 1.5;
          color: #6b7280;
        }

        .auth-instruction {
          margin: 0 0 10px;
          font-size: 12px;
          color: #6b7280;
        }

        .auth-fields {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .auth-field label {
          display: block;
          margin-bottom: 4px;
          font-size: 12px;
          font-weight: 500;
          color: #4b5563;
        }

        .auth-input {
          width: 100%;
          border-radius: 999px;
          padding: 8px 12px;
          border: 1px solid #e5e7eb;
          font-size: 13px;
          color: #111827;
          background: #f9fafb;
        }

        .auth-input:focus {
          outline: none;
          border-color: #f97316;
          box-shadow: 0 0 0 1px rgba(249, 115, 22, 0.3);
        }

        .auth-meta-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 4px;
          margin-bottom: 10px;
        }

        .auth-secondary-link-inline {
          font-size: 12px;
          color: #6b7280;
          margin-bottom: 12px;
        }

        .auth-secondary-link-inline a {
          color: #111827;
          font-weight: 500;
          text-decoration: underline;
          text-underline-offset: 2px;
        }

        .auth-secondary-link {
          margin: 4px 0;
          font-size: 12px;
        }

        .auth-secondary-link a {
          color: #4b5563;
          text-decoration: underline;
          text-underline-offset: 2px;
        }

        .auth-status {
          margin-bottom: 10px;
          font-size: 12px;
          color: #4b5563;
        }

        .auth-status strong {
          font-weight: 600;
        }

        .auth-error,
        .auth-info,
        .auth-success {
          border-radius: 12px;
          padding: 8px 10px;
          font-size: 12px;
          margin-bottom: 10px;
        }

        .auth-error {
          background: #fef2f2;
          color: #b91c1c;
        }

        .auth-info {
          background: #eff6ff;
          color: #1d4ed8;
        }

        .auth-success {
          background: #ecfdf3;
          color: #166534;
        }

        .auth-apply-button-wrapper {
          margin-top: 14px;
        }

        .auth-apply-button {
          display: block;
          width: 100%;
          text-align: center;
          border-radius: 999px;
          padding: 10px 14px;
          font-size: 13px;
          font-weight: 600;
          background: #fb923c;
          color: #111827;
          text-decoration: none;
        }

        .auth-apply-button:hover {
          background: #f97316;
        }

        .auth-footer-note {
          margin-top: 12px;
          font-size: 11px;
          color: #9ca3af;
        }

        .auth-button-primary {
          width: 100%;
          border-radius: 999px;
          padding: 9px 14px;
          border: none;
          font-size: 13px;
          font-weight: 600;
          background: #111827;
          color: #f9fafb;
          cursor: pointer;
        }

        .auth-button-primary:disabled {
          opacity: 0.7;
          cursor: default;
        }
      `}</style>
    </>
  );
}
