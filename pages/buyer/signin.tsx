// FILE: /pages/buyer/signin.tsx

import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { FormEvent, useState } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import PasswordInput from "../../components/PasswordInput";

type LoginSuccess = { ok: true; buyerId: string };
type LoginError = { ok: false; code: string; message: string };
type LoginResponse = LoginSuccess | LoginError;

type Start2faSuccess = { ok: true; challengeId: string; via: "email"; devCode?: string };
type Start2faError = { ok: false; message?: string };
type Start2faResponse = Start2faSuccess | Start2faError;

type Verify2faSuccess = { ok: true };
type Verify2faError = { ok: false; message?: string };
type Verify2faResponse = Verify2faSuccess | Verify2faError;

type Step = "credentials" | "verify";

export default function BuyerSignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<Step>("credentials");
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submitCredentials(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);

    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/buyer/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed, password }),
      });
      const json = (await res.json()) as LoginResponse;

      if (!json.ok) {
        setError("Incorrect email or password. Please try again.");
        return;
      }

      const twofa = await fetch("/api/auth/start-2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed, role: "buyer", method: "email" }),
      });
      const twofaJson = (await twofa.json()) as Start2faResponse;

      if (!twofaJson.ok) {
        setError("Unable to start verification. Please try again.");
        return;
      }

      setChallengeId(twofaJson.challengeId);
      setStep("verify");

      let msg = "We sent a 6-digit code to your email.";
      if (twofaJson.devCode) msg += ` (Dev code: ${twofaJson.devCode})`;
      setInfo(msg);
    } finally {
      setLoading(false);
    }
  }

  async function submitVerify(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!challengeId) {
      setError("Session expired. Please sign in again.");
      return;
    }

    if (!code.trim()) {
      setError("Enter the verification code.");
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
        setError("Incorrect or expired code.");
        return;
      }

      window.localStorage.setItem("ff-role", "buyer");
      window.localStorage.setItem("ff-email", email.toLowerCase().trim());

      router.push("/");
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
          <h1>Welcome Back</h1>
          <p className="auth-subtitle">Sign in to continue shopping.</p>

          {error && <div className="auth-error">{error}</div>}
          {info && <div className="auth-info">{info}</div>}

          {step === "credentials" ? (
            <form onSubmit={submitCredentials}>
              <div className="auth-fields">
                <label>Email</label>
                <input
                  type="email"
                  className="auth-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  disabled={loading}
                />

                <PasswordInput
                  label="Password"
                  value={password}
                  onChange={setPassword}
                  name="password"
                  required
                />

                <button className="auth-button-primary" disabled={loading}>
                  {loading ? "Checking..." : "Continue"}
                </button>

                <div className="auth-secondary">
                  <Link href="/buyer/forgot-password">Forgot password?</Link>
                </div>
              </div>
            </form>
          ) : (
            <form onSubmit={submitVerify}>
              <p className="auth-subtitle-small">Enter the 6-digit code we emailed you.</p>
              <input
                className="auth-input auth-code"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                inputMode="numeric"
              />

              <button className="auth-button-primary" disabled={loading}>
                {loading ? "Verifying..." : "Confirm Login"}
              </button>

              <p className="auth-secondary-inline">
                <button
                  type="button"
                  onClick={() => {
                    if (loading) return;
                    setStep("credentials");
                    setCode("");
                    setInfo(null);
                    setError(null);
                  }}
                >
                  Use different email
                </button>
              </p>
            </form>
          )}

          <p className="auth-secondary-link">
            Don’t have an account?{" "}
            <Link href="/buyer/signup">Create one</Link>
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
          max-width: 420px;
          width: 100%;
          padding: 32px;
          border-radius: 22px;
          border: 1px solid #eee;
          background: #fff;
          box-shadow: 0 10px 30px rgba(0,0,0,0.05);
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
        .auth-input {
          border-radius: 14px;
          border: 1px solid #ddd;
          padding: 12px;
          background: #fafafa;
        }
        .auth-input:focus {
          background: white;
          border-color: black;
        }
        .auth-error {
          padding: 12px;
          background: #fff4d4;
          color: #7a4a00;
          border-radius: 12px;
          margin-bottom: 16px;
          text-align: center;
        }
        .auth-info {
          padding: 12px;
          background: #eef7ff;
          color: #0b4dad;
          border-radius: 12px;
          margin-bottom: 16px;
          text-align: center;
        }
        .auth-button-primary {
          width: 100%;
          padding: 12px;
          border-radius: 999px;
          border: none;
          background: #111;
          color: #fff;
          font-weight: 600;
          margin-top: 10px;
        }
        .auth-secondary a {
          font-size: 13px;
          text-decoration: underline;
          color: #444;
        }
        .auth-code {
          text-align: center;
          font-size: 20px;
          letter-spacing: 0.4em;
          font-weight: 700;
        }
        .auth-secondary-link {
          margin-top: 20px;
          text-align: center;
        }
      `}</style>
    </>
  );
}
