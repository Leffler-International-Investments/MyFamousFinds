// FILE: /pages/management/login.tsx
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
type Start2faError = { ok: false; message: string };
type Start2faResponse = Start2faSuccess | Start2faError;

type Verify2faSuccess = { ok: true; email: string; role: string };
type Verify2faError = { ok: false; message: string };
type Verify2faResponse = Verify2faSuccess | Verify2faError;

type TwoFactorStep = "credentials" | "verify";
// The TwoFactorMethod type is no longer needed as we hardcode "email"
// type TwoFactorMethod = "email" | "sms";

export default function ManagementLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // const [method, setMethod] = useState<TwoFactorMethod>("email"); // Removed
  // const [phone, setPhone] = useState(""); // Removed
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

      // Removed SMS check
      // if (method === "sms" && !phone.trim()) { ... }

      const trimmedEmail = email.toLowerCase().trim();

      const res = await fetch("/api/auth/start-2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: trimmedEmail,
          role: "management",
          method: "email", // Hardcoded to "email"
          // phone: phone || undefined, // Removed
        }),
      });

      const json = (await res.json()) as Start2faResponse;

      if (!json.ok) {
        const errJson = json as Start2faError;
        setError(errJson.message || "Could not start verification step.");
        setLoading(false);
        return;
      }

      setChallengeId(json.challengeId);
      setStep("verify");

      // Simplified message
      let message = "We’ve sent a 6-digit code to your email address.";

      if (json.devCode) {
        message += ` (Dev code: ${json.devCode})`;
      }

      setInfo(message);
    } catch (err: any) {
      console.error("management_login_error", err);
      const message =
        err?.message || "Unable to sign you in. Please check your details.";
      setError(message);
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
        setLoading(false);
        return;
      }

      const trimmedEmail = email.toLowerCase().trim();

      if (typeof window !== "undefined") {
        window.localStorage.setItem("ff-role", "management");
        window.localStorage.setItem("ff-email", trimmedEmail);
      }

      router.push("/management/dashboard");
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
        <title>Management Login — Famous Finds</title>
      </Head>
      <div className="flex min-h-screen flex-col bg-black text-gray-100">
        <Header />

        <main className="flex flex-1 justify-center px-4 py-8">
          <div className="w-full max-w-md rounded-2xl bg-neutral-900/80 p-6 shadow-lg ring-1 ring-white/10">
            <h1 className="text-center text-2xl font-semibold tracking-tight text-white">
              Management Admin Login
            </h1>
            <p className="mt-1 text-center text-xs text-gray-400">
              Sign in with your admin email and password, then confirm with a
              one-time code.
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
                    Admin Email
                  </label>
                  <input
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 w-full rounded-md border border-neutral-700 bg-black/40 px-3 py-2 text-sm text-gray-100 focus:border-gray-100 focus:outline-none"
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

                {/* --- Removed 2FA SMS options --- */}

                <button
                  type="submit"
                  disabled={disabled}
                  className="mt-2 flex w-full items-center justify-center rounded-md bg-white py-2 text-sm font-semibold text-black shadow-sm hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading ? "Checking…" : "Send code & continue"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifySubmit} className="mt-6 space-y-4">
                <p className="text-xs text-gray-300">
                  Enter the 6-digit code we sent to your email address to
                  finish signing in.
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
                    className="mt-1 w-full rounded-md border border-neutral-700 bg-black/40 px-3 py-2 text-sm tracking-[0.35em] text-gray-100 focus:border-gray-100 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={disabled}
                  className="mt-2 flex w-full items-center justify-center rounded-md bg-white py-2 text-sm font-semibold text-black shadow-sm hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading ? "Verifying…" : "Enter Admin Console"}
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

            <div className="mt-4 text-center">
              <Link
                href="/"
                className="text-xs text-gray-400 hover:text-gray-200"
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
