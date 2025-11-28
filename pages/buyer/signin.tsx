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
      } catch {}

      if (!res.ok || !json.ok) {
        setError("Email or password did not match. Please try again.");
        return;
      }

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
        const msg =
          "message" in twoJson && twoJson.message
            ? twoJson.message
            : "We couldn't start verification. Please try again.";
        setError(msg);
        return;
      }

      setChallengeId(twoJson.challengeId);
      setStep("verify");

      let msg = "We sent a 6-digit code to your email.";
      if ("devCode" in twoJson && twoJson.devCode)
        msg += ` (Dev code: ${twoJson.devCode})`;
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
        const msg =
          "message" in json && json.message
            ? json.message
            : "Incorrect or expired code.";
        setError(msg);
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
                  <label>Email</label>
                  <input
                    type="email"
                    className="auth-input"
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
        }
        .auth-card {
          width: 100%;
          max-width: 420px;
          background: #fff;
          border-radius: 22px;
          border: 1px solid #eee;
          padding: 32px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.06);
        }
        h1 {
          text-align: center;
          font-size: 26px;
          font-weight: 700;
        }
        .auth-subtitle {
          text-align: center;
          font-size: 14px;
          color: #555;
          margin-bottom: 20px;
        }
        .auth-fields {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .auth-field label {
          font-size: 13px;
          margin-bottom: 6px;
          display: block;
        }
        .auth-input {
          border-radius: 14px;
          border: 1px solid #ddd;
          padding: 12px;
          background: #fafafa;
        }
        .auth-input:focus {
          border-color: black;
          background: white;
        }
        .auth-code {
          text-align: center;
          letter-spacing: 0.25em;
          font-weight: 600;
          font-size: 18px;
        }
        .auth-button-primary {
          width: 100%;
          padding: 12px;
          border-radius: 999px;
          border: none;
          background: #111;
          color: #fff;
          font-weight: 600;
        }
        .auth-error {
          background: #fff4d4;
          padding: 12px;
          border-radius: 10px;
          text-align: center;
          color: #7a4a00;
          margin-bottom: 16px;
        }
        .auth-info {
          background: #eef7ff;
          padding: 12px;
          border-radius: 10px;
          text-align: center;
          color: #1d4ed8;
          margin-bottom: 16px;
        }
        .auth-secondary,
        .auth-secondary-link,
        .auth-secondary-inline {
          text-align: center;
          font-size: 13px;
          margin-top: 16px;
        }
        .auth-secondary a,
        .auth-secondary-link a,
        .auth-secondary-inline button {
          text-decoration: underline;
          color: #444;
        }
        .auth-secondary-inline button {
          background: none;
          border: none;
          cursor: pointer;
        }
      `}</style>
    </>
  );
}
