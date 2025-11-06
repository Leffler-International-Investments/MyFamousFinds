// FILE: /pages/seller/login.tsx
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { FormEvent, useState } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import PasswordInput from "../../components/PasswordInput";

type LoginResponse =
  | { ok: true; sellerId: string }
  | {
      ok: false;
      code: "apply_first" | "pending" | "bad_credentials" | string;
      message: string;
    };

export default function SellerLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const from =
    typeof router.query.from === "string" ? router.query.from : null;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

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
        body: JSON.stringify({
          email: trimmedEmail,
          password,
        }),
      });

      const json = (await res.json()) as LoginResponse;

      if (!json.ok) {
        if (json.code === "apply_first") {
          setError(
            json.message ||
              "We couldn’t find a seller account for that email. Please apply to become a seller first using the link below."
          );
        } else if (json.code === "pending") {
          setError(
            json.message ||
              "Your seller application is still under review. You’ll be notified once approved."
          );
        } else {
          setError(json.message || "Incorrect email or password.");
        }
        return;
      }

      // Success → remember role locally and redirect
      if (typeof window !== "undefined") {
        window.localStorage.setItem("ff-role", "seller");
        window.localStorage.setItem("ff-email", trimmedEmail);
        window.localStorage.setItem("ff-seller-id", json.sellerId);
      }

      const target = from || "/seller/dashboard";
      router.push(target);
    } catch (err) {
      console.error("seller_login_error", err);
      setError("Unexpected error while logging in. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Head>
        <title>Seller Login — Famous Finds</title>
      </Head>
      <div className="min-h-screen bg-gray-900 text-gray-100">
        <Header />

        <main className="mx-auto flex max-w-3xl flex-col items-center px-4 pb-16 pt-10">
          <div className="w-full max-w-md rounded-2xl border border-gray-700 bg-gray-950/80 p-6 shadow-xl">
            <h1 className="text-center text-2xl font-semibold text-white">
              Seller Login
            </h1>
            <p className="mt-2 text-center text-xs text-gray-400">
              Only vetted and approved sellers can access this console.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-300">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full rounded-md border border-gray-600 bg-gray-900 px-3 py-2 text-sm text-gray-100 focus:border-gray-300 focus:outline-none"
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

              <div className="text-right">
                <Link
                  href="/seller/forgot-password"
                  className="text-xs font-medium text-blue-400 hover:text-blue-200"
                >
                  Forgot password?
                </Link>
              </div>

              {error && (
                <p className="text-xs text-red-400" role="alert">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-100 disabled:opacity-60"
              >
                {loading ? "Signing in…" : "Enter Seller Console"}
              </button>
            </form>

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
