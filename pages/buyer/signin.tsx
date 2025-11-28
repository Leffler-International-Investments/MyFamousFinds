// FILE: /pages/buyer/signin.tsx

import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { FormEvent, useState } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import PasswordInput from "../../components/PasswordInput";

type LoginSuccess = { ok: true; buyerId: string };
type LoginError = { ok: false; code?: string; message?: string };
type LoginResponse = LoginSuccess | LoginError;

type Start2faSuccess = { ok: true; challengeId: string; devCode?: string };
type Start2faError = { ok: false; error: string; message?: string };
type Start2faResponse = Start2faSuccess | Start2faError;

type Verify2faSuccess = { ok: true };
type Verify2faError = { ok: false; error: string; message?: string };
type Verify2faResponse = Verify2faSuccess | Verify2faError;

type Step = "credentials" | "verify";

export default function BuyerSignInPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleCredentials(e: FormEvent) {
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
      const res = await fetch("/api/buyer/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail, password }),
      });

      let json: LoginResponse | any = {};
      try {
        json = await res.json();
      } catch {
        // ignore
      }

      if (!res.ok || !json.ok) {
        setError("Email or password did not match. Please try again.");
        return;
      }

      // start 2FA
      const twoRes = await fetch("/api/auth/start-2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: trimmedEmail,
          role: "buyer",
        }),
      });

      const twoJson = (await twoRes.json()) as Start2faResponse;
      if (!twoJson.ok) {
        setError(
          twoJson.message ||
            "We couldn't start verification. Please try again."
        );
        return;
      }

      setChallengeId(twoJson.challengeId);
      setStep("verify");
      let msg = "We sent a 6-digit code to your email.";
      if (twoJson.devCode) msg += ` (Dev code: ${twoJson.devCode})`;
      setInfo(msg);
    } catch (err) {
      console.error("buyer_login_error", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!challengeId) {
      setError("Session expired. Please sign in again.");
      return;
    }
    if (!code.trim()) {
      setError("Please enter the 6-digit code.");
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
        setError(json.message || "Incorrect or expired code.");
        return;
      }

      if (typeof window !== "undefined") {
        window.localStorage.setItem("ff-role", "buyer");
        window.localStorage.setItem("ff-email", email.toLowerCase().trim());
      }

      router.push("/");
    } catch (err) {
      console.error("buyer_verify_2fa_error", err);
      setError("Unable to verify the code. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Head>
        <title>Sign In - Famous Finds</title>
      </Head>

      <Header />

      <main className="auth-main">
        <div className="auth-card">
          <h1>Welcome back</h1>
          <p className="auth-subtitle">
            Sign in to view your VIP profile and shopping bag.
          </p>

          {error && <div className="auth-error">{error}</div>}
          {info && <div className="auth-info">{info}</div>}

          {step === "credentials" ? (
            <form onSubmit={handleCredentials}>
              <div className="auth-fields">
                <div className="auth-field">
                  <label htmlFor="email">Email</label>
                  <input
                    id="email"
                    type="email"
                    className="auth-input"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                  />
                </div>

                <PasswordInput
                  label="Password"
                  value={password}
                  onChange={setPassword}
                  name="password"
                  required
                  placeholder="Enter password"
                />

                <button
                  type="submit"
                  className="auth-button-primary"
                  disabled={loading}
                >
                  {loading ? "Checking..." : "Continue"}
                </button>

                <p className="auth-secondary">
                  <Link href="/buyer/forgot-password">Forgot password?</Link>
                </p>
              </div>
            </form>
          ) : (
            <form onSubmit={handleVerify}>
              <p className="auth-subtitle-small">
                Enter the 6-digit code we emailed you.
              </p>
              <div className="auth-field">
                <input
                  type="text"
                  maxLength={6}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  className="auth-input auth-code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  disabled={loading}
                />
              </div>
              <button
                type="submit"
                className="auth-button-primary"
                disabled={loading}
              >
                {loading ? "Verifying..." : "Confirm login"}
              </button>
              <p className="auth-secondary-inline">
                <button
                  type="button"
                  onClick={() => {
                    if (loading) return;
                    setStep("credentials");
                    setCode("");
                    setError(null);
                    setInfo(null);
                  }}
                >
                  Use a different email
                </button>
              </p>
            </form>
          )}

          <p className="auth-secondary-link">
            Don’t have an account? <Link href="/buyer/signup">Create one</Link>
          </p>
        </div>
      </main>

      <Footer />

      <style jsx>{`
        .auth-main {
          min-height: 70vh;
          display: flex;
          justify-content: center;
          padding: 60px 16px;
          background: #ffffff;
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
          font-size: 26px;
          font-weight: 700;
          margin: 0 0 8px;
          text-align: center;
        }
        .auth-subtitle {
          margin: 0 0 24px;
          font-size: 14px;
          color: #6b7280;
          text-align: center;
        }
        .auth-subtitle-small {
          margin: 0 0 12px;
          font-size: 13px;
          color: #4b5563;
          text-align: center;
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
        .auth-input {
          width: 100%;
          border-radius: 14px;
          border: 1px solid #d1d5db;
          background: #fafafa;
          padding: 10px 14px;
          font-size: 14px;
          transition: all 0.2s ease;
        }
        .auth-input:focus {
          outline: none;
          border-color: #111;
          background: #fff;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }
        .auth-code {
          text-align: center;
          letter-spacing: 0.25em;
          font-weight: 600;
          font-size: 18px;
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
          background: #fff4d4;
          color: #7a4a00;
        }
        .auth-info {
          background: #eff6ff;
          color: #1d4ed8;
        }
        .auth-secondary,
        .auth-secondary-link,
        .auth-secondary-inline {
          margin-top: 12px;
          text-align: center;
          font-size: 13px;
        }
        .auth-secondary a,
        .auth-secondary-link a,
        .auth-secondary-inline button {
          color: #6b7280;
          text-decoration: underline;
        }
        .auth-secondary-inline button {
          border: none;
          background: none;
          cursor: pointer;
        }
      `}</style>
    </>
  );
}
