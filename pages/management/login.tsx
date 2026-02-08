// FILE: /pages/management/login.tsx
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { FormEvent, useState } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import PasswordInput from "../../components/PasswordInput";

type ManagementLoginOk = { ok: true; managementId: string };
type ManagementLoginError = {
  ok: false;
  code: "pending" | "not_authorised" | "bad_credentials" | string;
  message: string;
};
type ManagementLoginResponse = ManagementLoginOk | ManagementLoginError;

type TwoFactorStep = "credentials" | "verify";

// ✅ EXTENDED SESSION (8 hours)
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;

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

  // ---------------------------
  // STEP 1: EMAIL + PASSWORD
  // ---------------------------
  async function handleCredentialsSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setInfo(null);

    const trimmedEmail = email.toLowerCase().trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !trimmedPassword) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);

    try {
      // 🔐 Check credentials via management-specific API
      const res = await fetch("/api/management/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: trimmedEmail,
          password: trimmedPassword,
        }),
      });

      const json = (await res.json()) as ManagementLoginResponse;

      if (!json.ok) {
        const errJson = json as ManagementLoginError;

        if (errJson.code === "not_authorised") {
          setError("This email is not registered for management access. Please contact the site owner.");
          return;
        }

        if (errJson.code === "pending") {
          setInfo("Your management access is still under review. We'll email you as soon as it is approved.");
          return;
        }

        if (errJson.code === "bad_credentials") {
          setError("Incorrect email or password. Please try again.");
          return;
        }

        setError(errJson.message || "Unable to sign you in. Please try again.");
        return;
      }

      // ✅ Credentials OK → Start 2FA strictly with "management" role
      const twofaRes = await fetch("/api/auth/start-2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: trimmedEmail,
          role: "management", // <— Critical for management dashboard access
          method: "email",
        }),
      });

      const twofaJson = await twofaRes.json();

      if (!twofaJson.ok) {
        setError(twofaJson.message || "We couldn't start the verification process. Please try again.");
        return;
      }

      setChallengeId(twofaJson.challengeId);
      setStep("verify");

      const message = twofaJson.devCode
        ? `Your 6-digit code is: ${twofaJson.devCode}`
        : "Your 6-digit code has been sent to your email.";
      setInfo(message);
    } catch (err) {
      console.error("management_login_error", err);
      setError("Unexpected error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // ---------------------------
  // STEP 2: VERIFY 2FA CODE
  // ---------------------------
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

      const json = await res.json();

      if (!json.ok) {
        setError(json.message || "Incorrect or expired code.");
        return;
      }

      // ✅ Mark session as management
      if (typeof window !== "undefined") {
        window.localStorage.setItem("ff-role", "management");
        window.localStorage.setItem("ff-email", email.toLowerCase().trim());

        // ✅ EXTEND SESSION
        window.localStorage.setItem(
          "ff-session-exp",
          String(Date.now() + SESSION_TTL_MS)
        );
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
            <h1>Management Login</h1>
            <p className="auth-subtitle">Secure admin access.</p>

            {error && <div className="auth-error">{error}</div>}
            {info && <div className="auth-info">{info}</div>}

            {step === "credentials" ? (
              <form onSubmit={handleCredentialsSubmit}>
                <div className="auth-fields">
                  <div className="auth-field">
                    <label htmlFor="email">Admin Email</label>
                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="auth-input"
                      placeholder="name@famousfinds.com"
                      disabled={disabled}
                    />
                  </div>

                  <PasswordInput
                    label="Password"
                    value={password}
                    onChange={setPassword}
                    name="password"
                    required
                    showStrength={false}
                    placeholder="Enter password"
                  />

                  <button
                    type="submit"
                    disabled={disabled}
                    className="auth-button-primary"
                  >
                    {loading ? "Checking..." : "Sign In"}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleVerifySubmit}>
                <p className="auth-secondary-link-inline">
                  Enter the 6-digit code sent to your email.
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
                    {loading ? "Verifying..." : "Confirm"}
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
                    Back to login
                  </button>
                </p>
              </form>
            )}

            <p className="auth-secondary-link">
              <Link href="/">Return to Store</Link>
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
          max-width: 400px;
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
        .auth-error {
          background: #fef2f2;
          color: #b91c1c;
          border-radius: 12px;
          padding: 10px;
          font-size: 13px;
          margin-bottom: 16px;
          text-align: center;
        }
        .auth-info {
          background: #eff6ff;
          color: #1d4ed8;
          border-radius: 12px;
          padding: 10px;
          font-size: 13px;
          margin-bottom: 16px;
          text-align: center;
        }
        .auth-code-input {
          text-align: center;
          letter-spacing: 0.2em;
          font-weight: 600;
        }
        .auth-secondary-link {
          margin-top: 20px;
          text-align: center;
          font-size: 13px;
        }
        .auth-secondary-link a {
          color: #6b7280;
          text-decoration: underline;
        }
        .auth-secondary-link a:hover {
          color: #111;
        }
        .auth-secondary-link-inline {
          text-align: center;
          font-size: 13px;
          color: #666;
          margin-bottom: 16px;
        }
        .auth-secondary-link-inline button {
          border: none;
          background: none;
          text-decoration: underline;
          cursor: pointer;
          color: #111;
        }
      `}</style>
    </>
  );
}
