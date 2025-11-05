// FILE: /pages/seller/profile.tsx
import Head from "next/head";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { FormEvent, useState } from "react";
import { useRequireSeller } from "../../hooks/useRequireSeller"; // Import seller security

export default function SellerProfile() {
  // Add security hook
  const { loading: authLoading } = useRequireSeller();

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    // TODO: Add API call to save data
    await new Promise((res) => setTimeout(res, 1000)); // Simulate save
    setMessage("Profile updated successfully.");
    setSaving(false);
  }

  // Show loading while checking auth
  if (authLoading) {
    return <div className="min-h-screen bg-white"></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <Head>
        <title>Seller Profile — Famous Finds</title>
      </Head>
      <Header />

      <main className="mx-auto max-w-6xl px-4 pb-16 pt-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">
            Seller Profile
          </h1>
          <Link
            href="/seller/dashboard"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            ← Back to Seller Dashboard
          </Link>
        </div>
        
        {/* --- Main Form --- */}
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Section 1: Business Details */}
          <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">
              Business Details
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              This information will be shown on your public seller profile.
            </p>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-gray-700">
                  Business Name
                </label>
                <input
                  type="text"
                  name="businessName"
                  defaultValue="VintageLux Boutique"
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700">
                  Contact Email
                </label>
                <input
                  type="email"
                  name="email"
                  defaultValue="hello@vintagelux.com"
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-xs font-medium text-gray-700">
                Public Bio
              </label>
              <textarea
                name="bio"
                rows={3}
                defaultValue="Curators of fine vintage bags and accessories. All items 100% authentic."
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none"
              />
            </div>
          </section>

          {/* Section 2: Payouts (Stripe) */}
          <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">
              Bank & Payout Details
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Your bank details are managed securely by Stripe. We do not store
              this information.
            </p>
            <div className="mt-4">
              <button
                type="button"
                className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-black"
              >
                Manage Stripe Payout Account
              </button>
              <p className="mt-2 text-xs text-gray-500">
                (This will redirect to Stripe Connect to securely manage your
                bank account.)
              </p>
            </div>
          </section>

          {/* Section 3: Tax (Avalara/Tax1099) */}
          <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">
              Tax Information (W-9)
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              We are required to collect this information for all US sellers.
            </p>
            <div className="mt-4">
              <button
                type="button"
                className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Update W-9 Tax Form
              </button>
              <p className="mt-2 text-xs text-gray-500">
                (This will open a secure form from our tax partner, Avalara.)
              </p>
            </div>
          </section>

          {/* Save Button */}
          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Profile"}
            </button>
            {message && (
              <p className="text-sm text-green-700">{message}</p>
            )}
          </div>
        </form>
      </main>
      <Footer />
    </div>
  );
}
