// FILE: /pages/seller/login.tsx
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { FormEvent, useState } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import PasswordInput from "../../components/PasswordInput";

// --- Types for the login API response ---
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
type Start2faError = { ok: false; message: string };
type Start2faResponse = Start2faSuccess | Start2faError;

type Verify2faSuccess = { ok: true; email: string; role: string };
type Verify2faError = { ok: false; message: string };
type Verify2faResponse = Verify2faSuccess | Verify2faError;

type TwoFactorStep = "credentials" | "verify";
type TwoFactorMethod = "email" | "sms";

export default function SellerLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [method, setMethod] = useState<TwoFactorMethod>("email");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<TwoFactorStep>("credentials");
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [pendingSellerId, setPendingSellerId] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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

    if (method === "sms" && !phone.trim()) {
      setError(
        "Please enter your mobile number for SMS verification or switch to email verification."
      );
      return;
    }

    setLoading(true);

    try {
      // 1) Normal seller login (email + password)
      const res = await fetch("/api/seller/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail, password }),
      });

      const json = (await res.json()) as LoginResponse;

      if (!json.ok) {
        if (json.code === "apply_first") {
          setError(
            "We couldn’t find a seller account for that email. Please apply to become a seller first."
          );
        } else if (json.code === "pending") {
          setError(
            "Your seller application is still under review. You’ll be notified once approved."
          );
        } else if (json.code === "bad_credentials") {
          setError("Incorrect email or password.");
        } else {
          setError(json.message || "Unable to sign you in. Please try again.");
        }
        return;
      }

      setPendingSellerId(json.sellerId);

      // 2) Start 2FA challenge
      const twofaRes = await fetch("/api/auth/start-2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: trimmedEmail,
          role: "seller",
          method,
          phone: phone || undefined,
        }),
      });

      const twofaJson = (await twofaRes.json()) as Start2faResponse;

      if (!twofaJson.ok) {
        setError(twofaJson.message || "Could not start verification step.");
        return;
      }

      setChallengeId(twofaJson.challengeId);
      setStep("verify");

      let message =
        twofaJson.via === "sms"
          ? "We’ve sent a 6-digit code to your mobile number."
          : "We’ve sent a 6-digit code to your email address.";

      if (twofaJson.devCode) {
        message += ` (Dev code: ${twofaJson.devCode})`;
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
        setError(json.message || "Incorrect or expired code.");
        return;
      }

      const trimmedEmail = email.trim().toLowerCase();

      if (typeof window !== "undefined") {
        window.localStorage.setItem("ff-role", "seller");
        window.localStorage.setItem("ff-email", trimmedEmail);
        if (pendingSellerId) {
          window.localStorage.setItem("ff-seller-id", pendingSellerId);
        }
      }

      const target = from || "/seller/dashboard";
      router.push(target);
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
      <div className="flex min-h-screen flex-col bg-black text-gray-100">
        <Header />

        <main className="flex flex-1 justify-center px-4 py-8">
          <div className="w-full max-w-md rounded-2xl bg-neutral-900/80 p-6 shadow-lg ring-1 ring-white/10">
            <h1 className="text-center text-2xl font-semibold tracking-tight text-white">
              Seller Login
            </h1>
            <p className="mt-1 text-center text-xs text-gray-400">
              Only vetted and approved sellers can access this console.
            </p>

            {error && (
              <div className="mt-4 rounded-md bg-red-900/40 px-3 py-2 text-xs text-red-200">
                {error}
              </div>
            )}

            {info && (
              <div className="mt-4 rounded-md bg-emerald-900/30 px-3 py-2 text-xs text-emerald-200">
                {info}
              </div>
            )}

            {step === "credentials" ? (
              <form
                onSubmit={handleCredentialsSubmit}
                className="mt-6 space-y-4"
              >
                <div>
                  <label className="block text-xs font-medium text-gray-300">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 w-full rounded-md border border-neutral-700 bg-black/40 px-3 py-2 text-sm text-gray-100 focus:border-gray-300 focus:outline-none"
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

                <div>
                  <p className="mb-1 text-xs font-medium text-gray-300">
                    Two-step verification
                  </p>
                  <div className="flex items-center gap-4 text-xs text-gray-300">
                    <label className="inline-flex items-center gap-1">
                      <input
                        type="radio"
                        className="h-3 w-3"
                        checked={method === "email"}
                        onChange={() => setMethod("email")}
                      />
                      <span>Email code</span>
                    </label>
                    <label className="inline-flex items-center gap-1">
                      <input
                        type="radio"
                        className="h-3 w-3"
                        checked={method === "sms"}
                        onChange={() => setMethod("sms")}
                      />
                      <span>SMS to mobile</span>
                    </label>
                  </div>
                  <p className="mt-1 text-[11px] text-gray-500">
                    If you prefer SMS, enter your mobile number below;
                    otherwise we&apos;ll send the code to your email.
                  </p>
                  <input
                    type="tel"
                    placeholder="Mobile number (optional)"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="mt-2 w-full rounded-md border border-neutral-700 bg-black/40 px-3 py-2 text-sm text-gray-100 focus:border-gray-300 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={disabled}
                  className="mt-2 flex w-full items-center justify-center rounded-md bg-white py-2 text-sm font-semibold text-black shadow-sm hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading ? "Checking…" : "Send code & continue"}
                </button>

                <div className="text-right">
                  <Link
                    href="/seller/forgot-password"
                    className="text-xs font-medium text-blue-400 hover:text-blue-200"
                  >
                    Forgot password?
                  </Link>
                </div>
              </form>
            ) : (
              <form onSubmit={handleVerifySubmit} className="mt-6 space-y-4">
                <p className="text-xs text-gray-300">
                  Enter the 6-digit code we sent to your{" "}
                  {method === "sms" ? "mobile number" : "email address"} to
                  complete your login.
                </p>
                <div>
                  <label className="block text-xs font-medium text-gray-300">
                    Verification code
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="mt-1 w-full rounded-md border border-neutral-700 bg-black/40 px-3 py-2 text-sm tracking-[0.35em] text-gray-100 focus:border-gray-300 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={disabled}
                  className="mt-2 flex w-full items-center justify-center rounded-md bg-white py-2 text-sm font-semibold text-black shadow-sm hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading ? "Verifying…" : "Enter Seller Console"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStep("credentials");
                    setCode("");
                    setChallengeId(null);
                  }}
                  className="w-full text-center text-xs text-gray-400 hover:text-gray-200"
                >
                  ← Start over
                </button>
              </form>
            )}

            <div className="mt-4 space-y-2 text-center">
              <Link
                href="/seller/register-vetting"
                className="block text-xs font-medium text-blue-400 hover:text-blue-200"
              >
                New here? Apply to become a seller →
              </Link>
              <Link
                href="/"
                className="block text-xs text-gray-400 hover:text-gray-200"
              >
                ← Back to storefront
              </Link>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}
