// FILE: pages/admin/index.tsx
import Head from "next/head";
import React, { FormEvent, useState } from "react";
import { useRouter } from "next/router";
import Header from "../../components/Header";
import Footer from "../../components/Footer";

type Role = "management" | "seller";

export default function AdminEntry() {
  const router = useRouter();
  const [loadingRole, setLoadingRole] = useState<Role | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit =
    (role: Role) =>
    (event: FormEvent<HTMLFormElement>): void => {
      event.preventDefault();
      setError(null);
      setLoadingRole(role);

      const formData = new FormData(event.currentTarget);
      const email = String(formData.get("email") || "");
      const password = String(formData.get("password") || "");

      if (!email || !password) {
        setError("Please enter both email and password.");
        setLoadingRole(null);
        return;
      }

      // TODO: replace this with your real authentication
      if (typeof window !== "undefined") {
        window.localStorage.setItem("ff-role", role);
      }

      if (role === "management") {
        router.push("/admin/dashboard");
      } else {
        router.push("/seller/orders");
      }
    };

  return (
    <>
      <Head>
        <title>Admin access — Famous Finds</title>
      </Head>
      <div className="min-h-screen bg-black text-gray-100 flex flex-col">
        <Header />

        <main className="flex-1 px-6 sm:px-10 lg:px-16 xl:px-24 py-10">
          <div className="max-w-5xl mx-auto">
            {/* Back to main dashboard/index */}
            <div className="mb-6">
              <button
                onClick={() => router.push("/")}
                className="text-xs text-gray-400 hover:text-gray-100"
              >
                ← Back to Dashboard
              </button>
            </div>

            <h1 className="text-3xl sm:text-4xl font-semibold mb-2">
              Admin access
            </h1>
            <p className="text-sm text-gray-400 mb-8 max-w-2xl">
              Choose the right console for your role. Store Owners use the
              Management Admin to control the marketplace. Sellers use the
              Seller Admin to manage their own inventory, orders and payouts.
            </p>

            {error && (
              <p className="mb-4 text-sm text-red-400">
                {error}
              </p>
            )}

            <div className="grid gap-8 md:grid-cols-2">
              {/* MANAGEMENT ADMIN LOGIN */}
              <form
                onSubmit={handleSubmit("management")}
                className="rounded-2xl border border-neutral-800 bg-neutral-950/80 p-6 shadow-lg"
              >
                <h2 className="text-lg font-semibold mb-1">
                  Management Admin Login
                </h2>
                <p className="text-xs text-gray-400 mb-4">
                  Full control of the Famous Finds marketplace, payments,
                  sellers and disputes.
                </p>

                <label className="block mb-3 text-xs font-medium text-gray-300">
                  Email
                  <input
                    name="email"
                    type="email"
                    className="mt-1 w-full rounded-lg border border-neutral-700 bg-black px-3 py-2 text-sm outline-none focus:border-white"
                    placeholder="owner@famous-finds.com"
                    autoComplete="username"
                  />
                </label>

                <label className="block mb-4 text-xs font-medium text-gray-300">
                  Password
                  <input
                    name="password"
                    type="password"
                    className="mt-1 w-full rounded-lg border border-neutral-700 bg-black px-3 py-2 text-sm outline-none focus:border-white"
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                </label>

                <button
                  type="submit"
                  className="w-full rounded-lg bg-white py-2.5 text-sm font-medium text-black hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={loadingRole === "management"}
                >
                  {loadingRole === "management"
                    ? "Signing in..."
                    : "Enter Management Admin"}
                </button>

                <p className="mt-3 text-[11px] text-gray-500">
                  In production this should be restricted to the store owner
                  and trusted staff only.
                </p>
              </form>

              {/* SELLER ADMIN LOGIN */}
              <form
                onSubmit={handleSubmit("seller")}
                className="rounded-2xl border border-neutral-800 bg-neutral-950/80 p-6 shadow-lg"
              >
                <h2 className="text-lg font-semibold mb-1">
                  Seller Admin Login
                </h2>
                <p className="text-xs text-gray-400 mb-4">
                  Manage listings, bulk uploads, orders, statements and wallet
                  payouts.
                </p>

                <label className="block mb-3 text-xs font-medium text-gray-300">
                  Email
                  <input
                    name="email"
                    type="email"
                    className="mt-1 w-full rounded-lg border border-neutral-700 bg-black px-3 py-2 text-sm outline-none focus:border-white"
                    placeholder="you@example.com"
                    autoComplete="username"
                  />
                </label>

                <label className="block mb-4 text-xs font-medium text-gray-300">
                  Password
                  <input
                    name="password"
                    type="password"
                    className="mt-1 w-full rounded-lg border border-neutral-700 bg-black px-3 py-2 text-sm outline-none focus:border-white"
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                </label>

                <button
                  type="submit"
                  className="w-full rounded-lg bg-white py-2.5 text-sm font-medium text-black hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={loadingRole === "seller"}
                >
                  {loadingRole === "seller"
                    ? "Signing in..."
                    : "Enter Seller Admin"}
                </button>

                <p className="mt-3 text-[11px] text-gray-500">
                  Hook this up to your real authentication (Auth0, Clerk,
                  NextAuth or a custom API) when you&apos;re ready.
                </p>
              </form>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}
