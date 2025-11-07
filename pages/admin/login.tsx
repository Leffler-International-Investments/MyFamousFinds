// pages/admin/login.tsx

import { useState, FormEvent } from "react";
import { useRouter } from "next/router";
import Head from "next/head";

type Step = "start" | "verify";

export default function AdminLoginPage() {
  const router = useRouter();

  const [step, setStep] = useState<Step>("start");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1) Ask for email and trigger the 6-digit code email
  async function handleStartSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError("Please enter your email address.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/start-2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // The API you already have should accept `email`.
        // Extra fields like `role` are harmless if ignored.
        body: JSON.stringify({ email: trimmedEmail, role: "management" }),
      });

      if (!res.ok) {
        let message = "Unable to start login. Please check your email.";
        try {
          const json = await res.json();
          if (json?.error) message = json.error;
        } catch {
          // ignore JSON parse errors
        }
        setError(message);
        return;
      }

      // Success: show the code step
      setStep("verify");
    } catch (err: any) {
      console.error("start_2fa_error", err);
      setError(
        err?.message || "Something went wrong starting the login process."
      );
    } finally {
      setLoading(false);
    }
  }

  // 2) Verify the 6-digit code, then go to /management/dashboard
  async function handleVerifySubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const trimmedCode = code.trim();
    if (!trimmedCode) {
      setError("Please enter the 6-digit code.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Most 2FA handlers just need email + code.
        body: JSON.stringify({ email: email.trim(), code: trimmedCode, role: "management" }),
      });

      if (!res.ok) {
        let message = "The code you entered is not correct.";
        try {
          const json = await res.json();
          if (json?.error) message = json.error;
        } catch {
          // ignore
        }
        setError(message);
        return;
      }

      // ✅ Verified – now send them to the full management dashboard
      router.push("/management/dashboard");
    } catch (err: any) {
      console.error("verify_2fa_error", err);
      setError(err?.message || "Unable to verify the code.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Head>
        <title>Management Admin Login | Famous Finds</title>
      </Head>

      <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl bg-neutral-900/80 border border-neutral-800 px-6 py-8 shadow-xl">
          <div className="mb-6 text-center">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/5 border border-white/10 mb-3">
              <span className="text-lg font-semibold">FF</span>
            </div>
            <h1 className="text-2xl font-semibold">
              Management Admin Login
            </h1>
            <p className="mt-1 text-sm text-neutral-400">
              Secure access for Famous Finds management only.
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {error}
            </div>
          )}

          {step === "start" && (
            <form onSubmit={handleStartSubmit} className="space-y-4">
              <div className="space-y-1">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-neutral-200"
                >
                  Admin email
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-white focus:ring-1 focus:ring-white"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  disabled={loading}
                />
                <p className="text-xs text-neutral-500">
                  We’ll send a 6-digit login code to this address.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center rounded-lg bg-white px-3 py-2 text-sm font-medium text-black hover:bg-neutral-100 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? "Sending code..." : "Send login code"}
              </button>
            </form>
          )}

          {step === "verify" && (
            <form onSubmit={handleVerifySubmit} className="space-y-4">
              <p className="text-sm text-neutral-400">
                We’ve emailed a 6-digit login code to{" "}
                <span className="font-medium text-neutral-100">{email}</span>.
                Enter it below to continue.
              </p>

              <div className="space-y-1">
                <label
                  htmlFor="code"
                  className="block text-sm font-medium text-neutral-200"
                >
                  6-digit code
                </label>
                <input
                  id="code"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm tracking-[0.3em] text-center font-semibold outline-none focus:border-white focus:ring-1 focus:ring-white"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="••••••"
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center rounded-lg bg-white px-3 py-2 text-sm font-medium text-black hover:bg-neutral-100 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? "Verifying..." : "Verify and enter dashboard"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep("start");
                  setCode("");
                  setError(null);
                }}
                className="w-full text-center text-xs text-neutral-400 hover:text-neutral-200 mt-1"
              >
                Use a different email
              </button>
            </form>
          )}

          <p className="mt-6 text-center text-[11px] text-neutral-500">
            If you are not part of the Famous Finds management team,
            you are not authorized to use this page.
          </p>
        </div>
      </div>
    </>
  );
}
