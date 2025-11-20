// FILE: /pages/management/login.tsx
// This version uses the custom CSS classes from globals.css
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { FormEvent, useState } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import PasswordInput from "../../components/PasswordInput";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import firebaseApp from "../../utils/firebaseClient";

type Start2faSuccess = {
  ok: true;
  challengeId: string;
  via: "sms" | "email";
  devCode?: string;
};
type Start2faError = {
  ok: false;
  message?: string;
};
type Start2faResponse = Start2faSuccess | Start2faError;

type Verify2faSuccess = {
  ok: true;
};
type Verify2faError = {
  ok: false;
  message?: string;
};
type Verify2faResponse = Verify2faSuccess | Verify2faError;

type TwoFactorStep = "credentials" | "verify";

export default function ManagementLoginPage() {
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
    typeof router.query.from === "string"
      ? router.query.from
      : "/management/dashboard";

  async function handleCredentialsSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);

    try {
      const auth = getAuth(firebaseApp);
      await signInWithEmailAndPassword(
        auth,
        email.toLowerCase().trim(),
        password
      );

      const trimmedEmail = email.toLowerCase().trim();
      const res = await fetch("/api/auth/start-2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: trimmedEmail,
          role: "management",
          method: "email",
        }),
      });

      const json = (await res.json()) as Start2faResponse;

      if (!json.ok) {
        const errJson = json as Start2faError;
        setError(
          errJson.message ||
            "We couldn't start the verification process. Please try again."
        );
        setLoading(false);
        return;
      }

      setChallengeId(json.challengeId);
      setStep("verify");
      let message = "We've sent a 6-digit code to your email address.";
      if ((json as Start2faSuccess).devCode) {
        message += ` (Dev code: ${(json as Start2faSuccess).devCode})`;
      }
      setInfo(message);
    } catch (err: any) {
      console.error("management_login_error", err);
      setError(
        err?.message ||
          "Unable to sign you in. Please check your details and try again."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifySubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (!challengeId) {
      setError("Your verification session has expired. Please start again.");
      setStep("credentials");
      return;
    }

    const trimmedCode = code.trim();
    if (!trimmedCode || trimmedCode.length < 6) {
      setError("Please enter the 6-digit code.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challengeId,
          code: trimmedCode,
        }),
      });

      const json = (await res.json()) as Verify2faResponse;

      if (!json.ok) {
        const errJson = json as Verify2faError;
        setError(errJson.message || "Incorrect or expired code.");
        setLoading(false);
        return;
      }

      const trimmedEmail = email.toLowerCase().trim();
      if (typeof window !== "undefined") {
        window.localStorage.setItem("ff-role", "management");
        window.localStorage.setItem("ff-email", trimmedEmail);
      }
      router.push(from || "/management/dashboard");
    } catch (err) {
      console.error("management_verify_2fa_error", err);
      setError("Unable to verify the code. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const disabled = loading;

  return (
    <>
      <Head>
        <title>Management Login - Famous Finds</title>
      </Head>
      <div className="auth-page">
        <Header />
        <main className="auth-main">
          <div className="auth-card">
            <h1>Management Admin Login</h1>
            <p className="auth-subtitle">
              Sign in with your admin email and password, then confirm with a
              one-time code.
            </p>

            {error && <div className="auth-error">{error}</div>}
            {info && <div className="auth-info">{info}</div>}

            {step === "credentials" ? (
              <form onSubmit={handleCredentialsSubmit}>
                <div className="auth-fields">
                  <div className="auth-field">
                    <label htmlFor="email">Admin email</label>
                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
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
                    placeholder="Enter your admin password"
                  />
                  <button
                    type="submit"
                    disabled={disabled}
                    className="auth-button-primary"
                  >
                    {loading ? "Checking..." : "Send code & continue"}
                  </button>
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
              <Link href="/management/forgot-password">Forgot password?</Link>
            </p>

            <p className="auth-secondary-link">
              <Link href="/">Back to storefront</Link>
            </p>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}
