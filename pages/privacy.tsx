// FILE: /pages/privacy.tsx
import Head from "next/head";
import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function Privacy() {
  return (
    <>
      <Head>
        <title>Privacy – Famous Finds</title>
      </Head>
      <div className="min-h-screen bg-black text-white">
        <Header />
        <main className="mx-auto max-w-3xl px-4 py-10 text-sm text-gray-100">
          <Link
            href="/"
            className="text-xs text-gray-400 hover:text-gray-100"
          >
            ← Back to Dashboard
          </Link>

          <h1 className="mt-4 text-2xl font-semibold">Privacy</h1>
          <p className="mt-3">
            This is a demo privacy page. Your final legal text can be pasted
            here. It should cover what data you collect, how you use it, and
            how customers can contact you for privacy-related requests.
          </p>
        </main>
        <Footer />
      </div>
    </>
  );
}
