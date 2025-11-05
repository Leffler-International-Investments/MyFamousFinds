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

export default function ManagementLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState(""); // no hard-coded demo email
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const from =
    typeof router.query.from === "string" ? router.query.from : "";

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const auth = getAuth(firebaseApp);
      await signInWithEmailAndPassword(
        auth,
        email.toLowerCase().trim(),
        password
      );

      if (typeof window !== "undefined") {
        window.localStorage.setItem("ff-role", "management");
        window.localStorage.setItem("ff-email", email.toLowerCase().trim());
      }

      const target = from || "/management/dashboard";
      router.push(target);
    } catch (err: any) {
      console.error(err);
      if (err?.code === "auth/invalid-credential") {
        setError("Invalid email or password.");
      } else {
        setError("Unable to sign in. Please try again.");
      }
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

        <main className="mx-auto flex max-w-md flex-1 items-center justify-center px-4 pb-16 pt-6">
          <div className="w-full rounded-xl border border-gray-800 bg-gray-950/70 p-6 shadow-lg">
            <h1 className="mb-1 text-xl font-semibold">
              Management Admin Login
            </h1>
            <p className="mb-4 text-xs text-gray-400">
              Sign in with your admin email and password.
            </p>

            {error && (
              <div className="mb-3 rounded-md bg-red-900/40 px-3 py-2 text-xs text-red-200">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
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
                  className="mt-1 w-full rounded-md border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-gray-100 focus:border-gray-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300">
                  Password
                </label>
                <PasswordInput
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  inputClassName="mt-1 w-full rounded-md border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-gray-100 focus:border-gray-100 focus:outline-none"
                />
              </div>

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
