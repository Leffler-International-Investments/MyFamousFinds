// FILE: /pages/seller/login.tsx
// Seller login with clear orange pill CTA for new sellers

import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { FormEvent, useState } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import PasswordInput from "../../components/PasswordInput";

import {
  parseFirebaseAuthError,
  signInSellerWithEmailPassword,
} from "../../utils/sellerAuth";

type LoginSuccess = { ok: true; sellerId: string };
type LoginError = {
  ok: false;
  code:
    | "invalid_email"
    | "invalid_password"
    | "seller_not_found"
    | "seller_not_approved"
    | "server_error";
  message: string;
};

type VerifySuccess = { ok: true; sellerId: string };
type VerifyError = { ok: false; code: "bad_code" | "expired" | "server_error"; message: string };

type LoginResponse = LoginSuccess | LoginError;
type VerifyResponse = VerifySuccess | VerifyError;

const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7;

export default function SellerLoginPage() {
  const router = useRouter();

  const [step, setStep] = useState<"email" | "verify">("email");
  const [sellerId, setSellerId] = useState<string>("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function handleCredentialsSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPassword = password;

    if (!trimmedEmail) {
      setLoading(false);
      setError("Please enter your email.");
      return;
    }
    if (!trimmedPassword) {
      setLoading(false);
      setError("Please enter your password.");
      return;
    }

    try {
      const res = await fetch("/api/seller/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail, password: trimmedPassword }),
      });

      const json = (await res.json()) as LoginResponse;
      const sellerId = json.ok ? json.sellerId : null;
      if (sellerId) setSellerId(sellerId);

      if (!json.ok) {
        setLoading(false);

        if (json.code === "seller_not_approved") {
          setError("Your seller account is pending approval. Please wait for approval email.");
          return;
        }

        setError(json.message || "Login failed.");
        return;
      }

      setInfo("Verification code sent. Please check your email.");
      setStep("verify");
      setLoading(false);
    } catch (err: any) {
      setLoading(false);
      setError(String(err?.message || err || "Login failed."));
    }
  }

  async function handleVerifySubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedCode = code.trim();

    if (!trimmedEmail) {
      setLoading(false);
      setError("Missing email.");
      return;
    }
    if (!trimmedCode) {
      setLoading(false);
      setError("Please enter the verification code.");
      return;
    }

    try {
      const res = await fetch("/api/seller/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail, code: trimmedCode }),
      });

      const errJson = await res.json();

      if (!res.ok || !errJson?.ok) {
        setLoading(false);
        setError(errJson.message || "Incorrect or expired code.");
        return;
      }

      if (typeof window !== "undefined") {
        window.localStorage.setItem("ff-role", "seller");
        window.localStorage.setItem("ff-email", email.toLowerCase().trim());
        if (sellerId) window.localStorage.setItem("ff-seller-id", sellerId);

        // ✅ EXTEND SESSION
        window.localStorage.setItem(
          "ff-session-exp",
          String(Date.now() + SESSION_TTL_MS)
        );
      }

      setLoading(false);
      router.push("/seller/dashboard");
    } catch (err: any) {
      setLoading(false);
      setError(String(err?.message || err || "Verification failed."));
    }
  }

  return (
    <>
      <Head>
        <title>Seller Login | My Famous Finds</title>
      </Head>

      <div className="min-h-screen flex flex-col bg-white">
        <Header />

        <main className="flex-1 w-full">
          <div className="max-w-3xl mx-auto px-4 py-10">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Seller Login</h1>
            <p className="text-gray-600 mb-8">
              Login to manage your listings, orders, and payouts.
            </p>

            {error ? (
              <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            {info ? (
              <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                {info}
              </div>
            ) : null}

            {step === "email" ? (
              <form
                onSubmit={handleCredentialsSubmit}
                className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
              >
                <div className="grid gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
                      placeholder="you@example.com"
                      autoComplete="email"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Password
                    </label>
                    <PasswordInput value={password} onChange={(v) => setPassword(v)} />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center justify-center rounded-full bg-orange-500 px-5 py-2.5 text-white font-semibold hover:bg-orange-600 disabled:opacity-60"
                  >
                    {loading ? "Sending code..." : "Send verification code"}
                  </button>

                  <div className="text-sm text-gray-600">
                    New seller?{" "}
                    <Link href="/seller/register" className="text-orange-600 font-semibold hover:underline">
                      Apply to sell
                    </Link>
                  </div>
                </div>
              </form>
            ) : (
              <form
                onSubmit={handleVerifySubmit}
                className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
              >
                <div className="grid gap-4">
                  <div className="text-sm text-gray-700">
                    Enter the verification code we sent to <b>{email.trim()}</b>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Verification code
                    </label>
                    <input
                      type="text"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
                      placeholder="123456"
                      inputMode="numeric"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center justify-center rounded-full bg-orange-500 px-5 py-2.5 text-white font-semibold hover:bg-orange-600 disabled:opacity-60"
                  >
                    {loading ? "Verifying..." : "Verify & continue"}
                  </button>

                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => {
                      setStep("email");
                      setCode("");
                      setError(null);
                      setInfo(null);
                    }}
                    className="text-sm text-gray-600 hover:underline text-left"
                  >
                    Back
                  </button>
                </div>
              </form>
            )}
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}
