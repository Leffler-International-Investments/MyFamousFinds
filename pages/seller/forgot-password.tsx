// FILE: /pages/seller/forgot-password.tsx

import { useState, FormEvent } from "react";
import Head from "next/head";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";

type Step = "form" | "done";

export default function SellerForgotPasswordPage() {
  const [step, setStep] = useState<Step>("form");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const trimmed = email.trim();
    if (!trimmed) {
      setError("Please enter your email address.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/seller/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });

      if (!res.ok) {
        let msg = "Unable to send reset link. Please try again.";
        try {
          const json = await res.json();
          if (json?.error) msg = json.error;
        } catch {
          /* ignore */
        }
        setError(msg);
        return;
      }

      setStep("done");
    } catch (err: any) {
      console.error("seller_forgot_password_error", err);
      setError(err?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Head>
        <title>Reset seller password | Famous Finds</title>
      </Head>

      <Header />

      <main className="flex-1">
        <div className="max-w-xl mx-auto px-4 py-10">
          <Link
            href="/seller/login"
            className="text-sm text-gray-500 hover:text-gray-800"
          >
            ← Back to Login
          </Link>

          {step === "form" && (
            <div className="mt-6 bg-white border border-gray-200 rounded-xl shadow-sm px-6 py-8">
              <h1 className="text-2xl font-semibold text-gray-900 mb-1">
                Reset your seller password
              </h1>
              <p className="text-sm text-gray-600 mb-5">
                Enter the email address associated with your seller account and
                we&apos;ll send you a secure link to reset your password.
              </p>

              {error && (
                <div className="mb-4 rounded-lg border border-red-400 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Email address
                  </label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-black focus:border-black"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center rounded-full bg-black text-white text-sm font-medium px-4 py-2.5 hover:bg-gray-900 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? "Sending reset link..." : "Send reset link"}
                </button>
              </form>
            </div>
          )}

          {step === "done" && (
            <div className="mt-6 bg-white border border-gray-200 rounded-xl shadow-sm px-6 py-8">
              <h1 className="text-2xl font-semibold text-gray-900 mb-1">
                Check your email
              </h1>
              <p className="text-sm text-gray-600 mb-4">
                If an account exists for{" "}
                <span className="font-medium">{email}</span>, you&apos;ll
                receive an email with a link to reset your password. The email
                may take a few minutes and can sometimes land in your spam or
                promotions folder.
              </p>

              {error && (
                <div className="mb-4 rounded-lg border border-red-400 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => setStep("form")}
                  className="w-full inline-flex items-center justify-center rounded-full border border-gray-300 text-sm font-medium px-4 py-2.5 text-gray-800 hover:bg-gray-50"
                >
                  Send another reset link
                </button>

                <Link
                  href="/seller/login"
                  className="w-full text-center text-sm text-gray-600 hover:text-gray-900"
                >
                  ← Back to Login
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
