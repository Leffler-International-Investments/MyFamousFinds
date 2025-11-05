// FILE: /pages/admin.tsx
import Head from "next/head";
import Link from "next/link";
import { FormEvent } from "react";
import { useRouter } from "next/router";
import Header from "../components/Header";
import Footer from "../components/Footer";

const ALLOWED_MANAGEMENT_EMAILS = [
  "arich1114@aol.com",
  "leffleryd@gmail.com",
];

export default function AdminAccess() {
  const router = useRouter();
  const searchParams =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search)
      : null;

  const redirectFrom = searchParams?.get("from") || null;

  const [managementError, setManagementError] = React.useState<string | null>(
    null
  );
  const [sellerError, setSellerError] = React.useState<string | null>(null);

  async function handleManagementSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setManagementError(null);

    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") || "").toLowerCase().trim();
    // const password = String(fd.get("password") || ""); // not used yet

    // Only Ariel + Dan are allowed for management access
    if (!ALLOWED_MANAGEMENT_EMAILS.includes(email)) {
      setManagementError(
        "This email is not authorized for Management Admin access."
      );
      return;
    }

    if (typeof window !== "undefined") {
      window.localStorage.setItem("ff-role", "management");
      window.localStorage.setItem("ff-email", email);
    }

    // If they were redirected from a management page, go back there.
    // Otherwise go to the management dashboard.
    const target = redirectFrom || "/management/dashboard";
    router.push(target);
  }

  async function handleSellerSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSellerError(null);

    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") || "").toLowerCase().trim();
    // const password = String(fd.get("password") || "");

    // NOTE: For now we do not enforce vetting here. This will be driven
    // by a real backend check later (see section 4 below).
    if (!email) {
      setSellerError("Please enter your seller email.");
      return;
    }

    if (typeof window !== "undefined") {
      window.localStorage.setItem("ff-role", "seller");
      window.localStorage.setItem("ff-email", email);
    }

    const target = redirectFrom || "/seller/dashboard";
    router.push(target);
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
                    defaultValue="••••••••"
                    className="mt-1 w-full rounded-md border border-gray-600 bg-gray-900 px-3 py-2 text-sm text-gray-100 focus:border-gray-300 focus:outline-none"
                  />
                </div>

                {managementError && (
                  <p className="text-xs text-red-400">{managementError}</p>
                )}

                <button
                  type="submit"
                  className="w-full rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-100"
                >
                  Enter Management Admin
                </button>

                <p className="mt-2 text-xs text-gray-400">
                  In production this should be backed by a secure auth system.
                  Right now only Ariel and Dan can sign in here.
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
                  className="w-full rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-100"
                >
                  Enter Seller Admin
                </button>

                <p className="mt-2 text-xs text-gray-400">
                  Later this will check that the seller has been vetted and
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
