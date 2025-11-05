// FILE: /pages/admin.tsx
import Head from "next/head";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/router";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function AdminAccess() {
  const router = useRouter();
  const [managementError, setManagementError] = useState<string | null>(null);
  const [sellerError, setSellerError] = useState<string | null>(null);
  const [managementLoading, setManagementLoading] = useState(false);
  const [sellerLoading, setSellerLoading] = useState(false);

  const redirectFrom =
    typeof router.query.from === "string" ? router.query.from : null;

  async function handleManagementSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setManagementError(null);
    setManagementLoading(true);

    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") || "").toLowerCase().trim();
    const password = String(fd.get("password") || "");

    try {
      const res = await fetch("/api/auth/management-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setManagementError(
          data?.error || "Login failed. Please check your details."
        );
        return;
      }

      // ✅ Credentials are correct – mark user as management admin.
      if (typeof window !== "undefined") {
        window.localStorage.setItem("ff-role", "management");
        window.localStorage.setItem("ff-email", email);
      }

      const target = redirectFrom || "/management/dashboard";
      router.push(target);
    } catch (err) {
      console.error(err);
      setManagementError("Unexpected error while logging in.");
    } finally {
      setManagementLoading(false);
    }
  }

  async function handleSellerSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSellerError(null);
    setSellerLoading(true);

    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") || "").toLowerCase().trim();
    const password = String(fd.get("password") || "");

    if (!email || !password) {
      setSellerError("Please enter your email and password.");
      setSellerLoading(false);
      return;
    }

    // For now we accept any email/password here. Later you will call
    // a real seller-login API that checks vetting & credentials.
    if (typeof window !== "undefined") {
      window.localStorage.setItem("ff-role", "seller");
      window.localStorage.setItem("ff-email", email);
    }

    const target = redirectFrom || "/seller/dashboard";
    router.push(target);
    setSellerLoading(false);
  }

  return (
    <>
      <Head>
        <title>Admin access — Famous Finds</title>
      </Head>

      <div className="min-h-screen bg-gray-900 text-gray-100">
        <Header />

        <main className="mx-auto max-w-6xl px-4 pb-16 pt-6">
          <Link
            href="/"
            className="text-sm text-gray-400 hover:text-gray-200"
          >
            ← Back to Dashboard
          </Link>

          <h1 className="mt-4 text-3xl font-semibold text-white">
            Admin access
          </h1>
          <p className="mt-2 max-w-xl text-sm text-gray-300">
            Choose the right console for your role. Store Owners use the
            Management Admin to control the marketplace. Sellers use the Seller
            Admin to manage their own inventory, orders and payouts.
          </p>

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {/* Management Admin card */}
            <section className="rounded-xl border border-gray-700 bg-gray-800 p-6 shadow-lg">
              <h2 className="text-lg font-semibold text-white">
                Management Admin Login
              </h2>
              <p className="mt-1 text-sm text-gray-300">
                Full control of the Famous Finds marketplace, payments, sellers
                and disputes.
              </p>

              <form
                onSubmit={handleManagementSubmit}
                className="mt-4 space-y-4"
              >
                <div>
                  <label className="block text-xs font-medium text-gray-300">
                    Email
                  </label>
                  <input
                    name="email"
                    type="email"
                    defaultValue="leffleryd@gmail.com"
                    className="mt-1 w-full rounded-md border border-gray-600 bg-gray-900 px-3 py-2 text-sm text-gray-100 focus:border-gray-300 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-300">
                    Password
                  </label>
                  <input
                    name="password"
                    type="password"
                    className="mt-1 w-full rounded-md border border-gray-600 bg-gray-900 px-3 py-2 text-sm text-gray-100 focus:border-gray-300 focus:outline-none"
                  />
                </div>

                {managementError && (
                  <p className="text-xs text-red-400">{managementError}</p>
                )}

                <button
                  type="submit"
                  disabled={managementLoading}
                  className="w-full rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-100 disabled:opacity-60"
                >
                  {managementLoading ? "Signing in…" : "Enter Management Admin"}
                </button>

                <p className="mt-2 text-xs text-gray-400">
                  Right now only Ariel and Dan can sign in here. Later you can
                  move this to a full auth provider (Auth0, Clerk, etc.).
                </p>
              </form>
            </section>

            {/* Seller Admin card */}
            <section className="rounded-xl border border-gray-700 bg-gray-800 p-6 shadow-lg">
              <h2 className="text-lg font-semibold text-white">
                Seller Admin Login
              </h2>
              <p className="mt-1 text-sm text-gray-300">
                Manage listings, bulk uploads, orders, statements and wallet
                payouts.
              </p>

              <form onSubmit={handleSellerSubmit} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-300">
                    Email
                  </label>
                  <input
                    name="email"
                    type="email"
                    className="mt-1 w-full rounded-md border border-gray-600 bg-gray-900 px-3 py-2 text-sm text-gray-100 focus:border-gray-300 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-300">
                    Password
                  </label>
                  <input
                    name="password"
                    type="password"
                    className="mt-1 w-full rounded-md border border-gray-600 bg-gray-900 px-3 py-2 text-sm text-gray-100 focus:border-gray-300 focus:outline-none"
                  />
                </div>

                {sellerError && (
                  <p className="text-xs text-red-400">{sellerError}</p>
                )}

                <button
                  type="submit"
                  disabled={sellerLoading}
                  className="w-full rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-100 disabled:opacity-60"
                >
                  {sellerLoading ? "Signing in…" : "Enter Seller Admin"}
                </button>

                <p className="mt-2 text-xs text-gray-400">
                  Later this will verify that the seller has been vetted and
                  approved before allowing login.
                </p>
              </form>
            </section>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}
