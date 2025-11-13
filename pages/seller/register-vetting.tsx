// FILE: /pages/seller/register-vetting.tsx

import Head from "next/head";
import Link from "next/link";
import { FormEvent, useState } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { db } from "../../utils/firebaseClient";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

export default function SellerVetting() {
  const [businessName, setBusinessName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [social, setSocial] = useState("");
  const [inventory, setInventory] = useState("");
  const [experience, setExperience] = useState("");
  const [notes, setNotes] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedBusiness = businessName.trim();

    if (!trimmedBusiness || !trimmedEmail) {
      setError("Please enter your business name and email.");
      return;
    }
    if (!acceptTerms) {
      setError("Please confirm that you accept the seller terms.");
      return;
    }

    setSubmitting(true);
    try {
      // Use email as the seller document ID so vetting queue & profiles can find it
      const docRef = doc(db, "sellers", trimmedEmail);

      await setDoc(
        docRef,
        {
          businessName: trimmedBusiness,
          contactName: contactName.trim() || "",
          contactEmail: trimmedEmail,
          email: trimmedEmail,
          phone: phone.trim() || "",
          website: website.trim() || "",
          social: social.trim() || "",
          inventory: inventory.trim() || "",
          experience: experience.trim() || "",
          notes: notes.trim() || "",
          status: "Pending", // <- vetting queue will show this
          source: "public_vetting_form",
          submittedAt: serverTimestamp(),
          createdAt: serverTimestamp(),
        },
        { merge: true }
      );

      setSuccess(
        "Thank you! Your application has been submitted successfully. Our team will review it and contact you by email."
      );
      setSubmitting(false);

      // Reset form
      setBusinessName("");
      setContactName("");
      setEmail("");
      setPhone("");
      setWebsite("");
      setSocial("");
      setInventory("");
      setExperience("");
      setNotes("");
      setAcceptTerms(false);
    } catch (err: any) {
      console.error("seller_vetting_submit_error", err);
      setSubmitting(false);
      setError(
        err?.message || "We couldn't submit your application. Please try again."
      );
    }
  }

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Head>
        <title>Become a Seller — Famous Finds</title>
      </Head>
      <Header />

      <main className="mx-auto max-w-2xl px-4 pb-16 pt-10">
        <h1 className="text-3xl font-bold text-gray-900">Become a Seller</h1>
        <p className="mt-2 text-sm text-gray-600">
          Apply to sell pre-loved luxury items on Famous-Finds. Once approved,
          you'll receive access to the Seller Admin console.
        </p>

        <div className="mt-4 rounded-md bg-blue-50 p-3 text-xs text-blue-900">
          <p>
            Already approved?{" "}
            <Link
              href="/seller/login"
              className="font-semibold underline underline-offset-2"
            >
              Go to Seller Login
            </Link>
            .
          </p>
        </div>

        {error && (
          <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mt-4 rounded-md bg-green-50 p-3 text-sm text-green-700">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Business / Store Name *
            </label>
            <input
              type="text"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              required
              placeholder="e.g. Ariel's Luxury Closet"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Contact Name
              </label>
              <input
                type="text"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="e.g. Ariel"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Contact Email *
              </label>
              <input
                type="email"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Phone / WhatsApp
              </label>
              <input
                type="tel"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+61 4XX XXX XXX"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Website
              </label>
              <input
                type="url"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://your-shop.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Instagram / Facebook / Other Social
            </label>
            <input
              type="text"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
              value={social}
              onChange={(e) => setSocial(e.target.value)}
              placeholder="@yourshop or link"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              What do you want to sell?
            </label>
            <textarea
              rows={3}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
              value={inventory}
              onChange={(e) => setInventory(e.target.value)}
              placeholder="e.g. Pre-owned Chanel, Hermès and Dior bags; luxury shoes; accessories."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Your experience with luxury resale
            </label>
            <textarea
              rows={3}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              placeholder="Tell us briefly about your background, years in business, marketplaces you use, etc."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Anything else we should know?
            </label>
            <textarea
              rows={3}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes, questions or specific requests."
            />
          </div>

          <div className="flex items-start gap-2">
            <input
              id="acceptTerms"
              type="checkbox"
              className="mt-1 h-4 w-4 rounded border-gray-300 text-black focus:ring-black"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
            />
            <label
              htmlFor="acceptTerms"
              className="text-xs text-gray-700 leading-snug"
            >
              I confirm that the items I plan to list are authentic and that I
              accept Famous-Finds seller terms and vetting procedures.
            </label>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="flex w-full justify-center rounded-md bg-black px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 disabled:opacity-70"
            >
              {submitting ? "Submitting…" : "Submit Application"}
            </button>
          </div>
        </form>

        <p className="mt-6 text-xs text-gray-500">
          Once approved, you will receive an email with next steps and a link to
          access your Seller Admin console.
        </p>
      </main>

      <Footer />
    </div>
  );
}
