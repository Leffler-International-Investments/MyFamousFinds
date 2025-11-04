// FILE: /pages/management/stripe-settings.tsx
import { FormEvent, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useRequireAdmin } from "../../hooks/useRequireAdmin";

export default function ManagementStripe() {
  const { loading: authLoading } = useRequireAdmin();

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);

    const fd = new FormData(e.currentTarget);
    const payload = {
      publishableKey: String(fd.get("publishableKey") || ""),
      secretKey: String(fd.get("secretKey") || ""),
      platformCommission: Number(fd.get("platformCommission") || 0),
      minPayout: Number(fd.get("minPayout") || 0),
      testMode: fd.get("testMode") === "on",
    };

    try {
      const res = await fetch("/api/management/stripe-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`Request failed: ${res.status}`);
      }

      setMessage("Payment settings saved.");
    } catch (err: any) {
      console.error(err);
      setError("Failed to save settings.");
    } finally {
      setSaving(false);
    }
  }

  if (authLoading) return null;

  return (
    <>
      <Head>
        <title>Stripe & Payment Settings — Admin</title>
      </Head>
      <div className="min-h-screen bg-gray-50 text-gray-900">
        <Header />
        <main className="mx-auto max-w-3xl px-4 pb-16 pt-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Stripe & Payment Settings
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Configure Stripe Connect, platform fees, and payout rules.
              </p>
            </div>
            <Link
              href="/management/dashboard"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              ← Back to Management Dashboard
            </Link>
          </div>

          <form
            className="space-y-5 rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
            onSubmit={handleSubmit}
          >
            <div>
              <label className="block text-xs font-medium text-gray-700">
                Stripe Publishable Key
              </label>
              <input
                name="publishableKey"
                type="text"
                placeholder="pk_live_..."
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700">
                Stripe Secret Key
              </label>
              <input
                name="secretKey"
                type="password"
                placeholder="sk_live_..."
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-gray-700">
                  Platform Commission (%)
                </label>
                <input
                  name="platformCommission"
                  type="number"
                  defaultValue={15}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700">
                  Minimum Payout (USD)
                </label>
                <input
                  name="minPayout"
                  type="number"
                  defaultValue={50}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                id="test-mode"
                name="testMode"
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
              />
              <label htmlFor="test-mode" className="text-xs text-gray-700">
                Enable test mode (sandbox keys)
              </label>
            </div>

            {message && (
              <p className="text-xs text-green-700">{message}</p>
            )}
            {error && <p className="text-xs text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-black disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save Payment Settings"}
            </button>

            <p className="text-xs text-gray-500">
              Backend TODO: implement{" "}
              <code>/api/management/stripe-settings</code> to validate and
              persist these values securely (env/config store).
            </p>
          </form>
        </main>
        <Footer />
      </div>
    </>
  );
}
