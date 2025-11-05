// FILE: /pages/management/login.tsx
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { FormEvent, useState } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import PasswordInput from "../../components/PasswordInput";

export default function ManagementLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("leffleryd@gmail.com"); // you can change default
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const from =
    typeof router.query.from === "string" ? router.query.from : null;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/management-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(
          data?.error || "Login failed. Please check your details and try again."
        );
        return;
      }

      if (typeof window !== "undefined") {
        window.localStorage.setItem("ff-role", "management");
        window.localStorage.setItem("ff-email", email.toLowerCase().trim());
      }

      const target = from || "/management/dashboard";
      router.push(target);
    } catch (err) {
      console.error(err);
      setError("Unexpected error while logging in.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Head>
        <title>Management Admin Login — Famous Finds</title>
      </Head>
      <div className="min-h-screen bg-gray-900 text-gray-100">
        <Header />

        <main className="mx-auto flex max-w-3xl flex-col items-center px-4 pb-16 pt-10">
          <div className="w-full max-w-md rounded-2xl border border-gray-700 bg-gray-950/80 p-6 shadow-xl">
            <h1 className="text-center text-2xl font-semibold text-white">
              Management Admin Login
            </h1>
            <p className="mt-2 text-center text-xs text-gray-400">
              Only Ariel Richardson and Dan Leffler are authorized to access
              this console.
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
                placeholder="Enter your admin password"
              />

              {error && (
                <p className="text-xs text-red-400">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-100 disabled:opacity-60"
              >
                {loading ? "Signing in…" : "Enter Management Admin"}
              </button>
            </form>

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
