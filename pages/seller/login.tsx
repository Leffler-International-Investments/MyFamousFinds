// FILE: /pages/seller/login.tsx
// Seller login with password setup for new approved sellers

import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { FormEvent, useState } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import PasswordInput from "../../components/PasswordInput";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../utils/firebaseClient";

// Password verification is now handled server-side by the API (like management login)

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

type PageMode = "login" | "setup";
type TwoFactorStep = "credentials" | "choose_method" | "verify";

const SESSION_TTL_MS = 168 * 60 * 60 * 1000; // 7 days

export default function SellerLoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<PageMode>("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<TwoFactorStep>("credentials");
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [chosenMethod, setChosenMethod] = useState<"email" | "sms">("email");
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [setupEmail, setSetupEmail] = useState("");
  const [setupPassword, setSetupPassword] = useState("");
  const [setupConfirm, setSetupConfirm] = useState("");
  const [setupLoading, setSetupLoading] = useState(false);
  const [setupError, setSetupError] = useState<string | null>(null);
  const [setupSuccess, setSetupSuccess] = useState<string | null>(null);

  const from =
    typeof router.query.from === "string" ? router.query.from : null;

  async function handleCredentialsSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPassword = password;
    if (!trimmedEmail || !trimmedPassword) {
      setError("Please enter your email and password.");
      return;
    }
    setLoading(true);
    try {
      // Send password to the API for server-side verification (same as management login)
      const res = await fetch("/api/seller/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail, password: trimmedPassword }),
      });
      const json = (await res.json()) as LoginResponse;
      if (!json.ok) {
        const errJson = json as LoginError;
        if (errJson.code === "apply_first") {
          setError("");
          setInfo("We couldn't find a completed seller application for this email. Please apply as a seller first using the button below.");
          return;
        }
        if (errJson.code === "pending") {
          setError("");
          setInfo("Your seller application is still under review. We'll email you as soon as it's approved.");
          return;
        }
        if (errJson.code === "server_not_configured") {
          setError("");
          setInfo(errJson.message || "Server not configured.");
          return;
        }
        setError(errJson.message || "We couldn't sign you in. Please check your details and try again.");
        return;
      }

      // Credentials OK -> show method choice
      setStep("choose_method");
    } catch (err) {
      console.error("seller_login_error", err);
      setError("Unexpected error. Please try again.");
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
        setStep("choose_method");
        setError(errJson.message || "We couldn't start the verification process. Please try again.");
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
        window.localStorage.setItem("ff-session-exp", String(Date.now() + SESSION_TTL_MS));
      }

      // Establish Firebase Auth session so sellerFetch can get Bearer tokens
      try {
        if (auth && password) {
          await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
        }
      } catch (e) {
        // Non-fatal: localStorage session is sufficient for role-based page access.
        // Bearer tokens may be unavailable for some API calls.
        console.warn("[seller-login] Firebase Auth sign-in skipped:", e);
      }

      if (from) router.push(from);
      else router.push("/seller/dashboard");
    } catch (err) {
      console.error("seller_verify_2fa_error", err);
      setError("Unable to verify the code. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSetupSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSetupError(null);
    setSetupSuccess(null);
    const trimmedEmail = setupEmail.trim().toLowerCase();
    if (!trimmedEmail || !trimmedEmail.includes("@")) {
      setSetupError("Please enter your seller email address.");
      return;
    }
    if (!setupPassword || setupPassword.length < 8) {
      setSetupError("Password must be at least 8 characters.");
      return;
    }
    if (setupPassword !== setupConfirm) {
      setSetupError("Passwords do not match.");
      return;
    }
    setSetupLoading(true);
    try {
      const res = await fetch("/api/seller/setup-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail, password: setupPassword }),
      });
      const json = await res.json();
      if (!json.ok) {
        setSetupError(json.message || "Unable to set up your password.");
        return;
      }
      setSetupSuccess("Password set successfully! You can now sign in with your email and password.");
      setEmail(trimmedEmail);
      setPassword("");
      setTimeout(() => {
        setMode("login");
        setSetupSuccess(null);
      }, 3000);
    } catch (err: any) {
      console.error("seller_setup_password_error", err);
      setSetupError(err?.message || "Unexpected error. Please try again.");
    } finally {
      setSetupLoading(false);
    }
  }

  function switchMode(newMode: PageMode) {
    setMode(newMode);
    setError(null);
    setInfo(null);
    setSetupError(null);
    setSetupSuccess(null);
  }

  const disabled = loading;

  return (
    <>
      <Head><title>Seller Login - Famous Finds</title></Head>
      <div className="auth-page">
        <Header />
        <main className="auth-main">
          <div className="auth-card">
            {mode === "login" ? (
              <>
                <h1>Seller Portal</h1>
                <p className="auth-subtitle">Log in to manage your listings and orders.</p>
                {error && <div className="auth-error">{error}</div>}
                {info && <div className="auth-info">{info}</div>}

                {step === "credentials" ? (
                  <form onSubmit={handleCredentialsSubmit}>
                    <div className="auth-fields">
                      <div className="auth-field">
                        <label htmlFor="email">Email</label>
                        <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="auth-input" placeholder="name@example.com" disabled={disabled} />
                      </div>
                      <PasswordInput label="Password" value={password} onChange={setPassword} name="password" required showStrength={false} placeholder="Enter password" />
                      <button type="submit" disabled={disabled} className="auth-button-primary">{loading ? "Checking..." : "Continue"}</button>
                      <div className="auth-apply-button-wrapper">
                        <Link href="/seller/register-vetting" className="auth-apply-button">New here? <strong>Apply to Sell</strong></Link>
                      </div>
                    </div>
                  </form>
                ) : step === "choose_method" ? (
                  <div className="method-choice">
                    <p className="auth-secondary-link-inline">
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
                    <p className="auth-secondary-link-inline">
                      <button
                        type="button"
                        onClick={() => {
                          if (disabled) return;
                          setStep("credentials");
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
                    <p className="auth-secondary-link-inline">
                      Enter the 6-digit code sent to your {chosenMethod === "sms" ? "mobile" : "email"}.
                    </p>
                    <div className="auth-fields">
                      <div className="auth-field">
                        <label htmlFor="code">Verification Code</label>
                        <input id="code" type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value)} className="auth-input auth-code-input" disabled={disabled} />
                      </div>
                      <button type="submit" disabled={disabled} className="auth-button-primary">{loading ? "Verifying..." : "Confirm Login"}</button>
                    </div>
                    <p className="auth-secondary-link-inline">
                      <button type="button" onClick={() => { if (disabled) return; setStep("choose_method"); setCode(""); setInfo(null); setError(null); }}>Try a different method</button>
                    </p>
                  </form>
                )}

                <p className="auth-secondary-link">
                  <button type="button" className="auth-link-button" onClick={() => switchMode("setup")}>Approved seller? Set up your password</button>
                </p>
                <p className="auth-secondary-link"><Link href="/">Back to Storefront</Link></p>
                <p className="auth-secondary-link"><Link href="/seller/forgot-password">Forgot password?</Link></p>
              </>
            ) : (
              <>
                <h1>Set Up Password</h1>
                <p className="auth-subtitle">For approved sellers only. Enter the email from your seller application and choose a password.</p>
                {setupError && <div className="auth-error">{setupError}</div>}
                {setupSuccess && <div className="auth-info">{setupSuccess}</div>}
                <form onSubmit={handleSetupSubmit}>
                  <div className="auth-fields">
                    <div className="auth-field">
                      <label htmlFor="setup-email">Seller Email</label>
                      <input id="setup-email" type="email" autoComplete="email" required value={setupEmail} onChange={(e) => setSetupEmail(e.target.value)} className="auth-input" placeholder="name@example.com" disabled={setupLoading} />
                    </div>
                    <PasswordInput label="Create Password" value={setupPassword} onChange={setSetupPassword} name="setup-password" required showStrength={true} placeholder="Min 8 characters" />
                    <PasswordInput label="Confirm Password" value={setupConfirm} onChange={setSetupConfirm} name="setup-confirm" required showStrength={false} placeholder="Re-enter password" />
                    <button type="submit" disabled={setupLoading} className="auth-button-primary">{setupLoading ? "Setting up..." : "Set Password"}</button>
                  </div>
                </form>
                <p className="auth-secondary-link">
                  <button type="button" className="auth-link-button" onClick={() => switchMode("login")}>Already have a password? Sign in</button>
                </p>
                <p className="auth-secondary-link"><Link href="/seller/register-vetting">Not yet approved? Apply to Sell</Link></p>
              </>
            )}
          </div>
        </main>
        <Footer />
      </div>

      <style jsx>{`
        .auth-page { min-height: 100vh; display: flex; flex-direction: column; background: #ffffff; color: #111; }
        .auth-main { flex: 1; display: flex; align-items: flex-start; justify-content: center; padding: 60px 16px 40px; }
        .auth-card { width: 100%; max-width: 400px; background: #ffffff; border-radius: 22px; border: 1px solid #e5e7eb; padding: 32px 28px; box-shadow: 0 12px 35px rgba(0,0,0,0.06); }
        h1 { font-family: ui-serif, "Times New Roman", serif; font-size: 26px; font-weight: 700; margin: 0 0 8px; letter-spacing: -0.02em; color: #111; text-align: center; }
        .auth-subtitle { margin: 0 0 24px; font-size: 14px; color: #6b7280; text-align: center; line-height: 1.5; }
        .auth-fields { display: flex; flex-direction: column; gap: 16px; }
        .auth-field label { display: block; margin-bottom: 6px; font-size: 13px; font-weight: 500; color: #374151; }
        :global(.auth-input) { width: 100%; border-radius: 14px !important; border: 1px solid #d1d5db !important; background: #fafafa !important; padding: 10px 14px !important; font-size: 14px !important; color: #111 !important; transition: all 0.2s ease; }
        :global(.auth-input:focus) { outline: none; border-color: #111 !important; background: #fff !important; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
        .auth-button-primary { margin-top: 8px; width: 100%; border-radius: 999px; padding: 12px; border: none; font-size: 14px; font-weight: 600; background: #111; color: #fff; cursor: pointer; transition: transform 0.1s ease, opacity 0.2s; }
        .auth-button-primary:hover { opacity: 0.9; }
        .auth-button-primary:disabled { opacity: 0.5; cursor: default; }
        .auth-error, .auth-info { border-radius: 12px; padding: 10px; font-size: 13px; margin-bottom: 16px; text-align: center; }
        .auth-error { background: #fef2f2; color: #b91c1c; }
        .auth-info { background: #eff6ff; color: #1d4ed8; }
        .auth-code-input { text-align: center; letter-spacing: 0.2em; font-weight: 600; }
        .auth-apply-button-wrapper { margin-top: 20px; }
        .auth-apply-button { display: block; width: 100%; text-align: center; border-radius: 999px; padding: 10px 14px; font-size: 13px; font-weight: 500; background: #fff; color: #111; border: 1px solid #e5e7eb; text-decoration: none; transition: all 0.2s; }
        .auth-apply-button:hover { border-color: #111; background: #fafafa; }
        .method-choice { display: flex; flex-direction: column; gap: 16px; }
        .method-buttons { display: flex; gap: 12px; }
        .method-button { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 20px 12px; border-radius: 16px; border: 1px solid #d1d5db; background: #fafafa; cursor: pointer; transition: all 0.2s ease; }
        .method-button:hover { border-color: #111; background: #fff; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
        .method-button:disabled { opacity: 0.5; cursor: default; }
        .method-icon { font-size: 28px; line-height: 1; }
        .method-label { font-size: 14px; font-weight: 600; color: #111; }
        .method-desc { font-size: 11px; color: #6b7280; }
        .auth-secondary-link { margin-top: 12px; text-align: center; font-size: 13px; }
        .auth-secondary-link a { color: #6b7280; text-decoration: underline; }
        .auth-secondary-link a:hover { color: #111; }
        .auth-link-button { border: none; background: none; color: #6b7280; text-decoration: underline; cursor: pointer; font-size: 13px; }
        .auth-link-button:hover { color: #111; }
        .auth-secondary-link-inline { text-align: center; font-size: 13px; color: #666; margin-bottom: 16px; }
        .auth-secondary-link-inline button { border: none; background: none; text-decoration: underline; cursor: pointer; color: #111; }
      `}</style>
    </>
  );
}
