// FILE: /pages/seller/login.tsx
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
            "You need to apply and be approved as a seller before you can log in."
          );
          router.push("/seller/apply");
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

      let message = "We’ve sent a 6-digit code to your email address.";
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
        <title>Seller Login — Famous Finds</title>
      </Head>
      <div className="auth-page">
        <Header />
        <main className="auth-main">
          <div className="auth-card">
            <h1>Seller Login</h1>
            <p className="auth-subtitle">
              Only vetted and approved sellers can access this console.
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
                    {loading ? "Checking…" : "Send code & continue"}
                  </button>

                  <p className="auth-secondary-link-inline">
                    <Link href="/seller/apply">
                      New here? Apply to become a seller →
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
                    {loading ? "Verifying…" : "Confirm & continue"}
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
              <Link href="/">← Back to storefront</Link>
            </p>

            <p className="auth-secondary-link">
              <Link href="/seller/forgot-password">Forgot password?</Link>
            </p>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}
