// FILE: /pages/vip-login.tsx

import Head from "next/head";
import Link from "next/link";
import { useState, FormEvent } from "react";
import { useRouter } from "next/router";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../utils/firebaseClient";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function VipLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/vip-welcome");
    } catch (err: any) {
      console.error("vip_login_error", err);
      setError(
        "Your email or password is incorrect. Please try again or reset it from your main account."
      );
      setLoading(false);
    }
  }

  return (
    <>
      <Head>
        <title>VIP Login – Sign in to your Front Row profile</title>
      </Head>

      <style jsx global>{`
        .vip-auth-page {
          min-height: 100vh;
          background: radial-gradient(
            ellipse at 50% -20%,
            #f9fafb 0%,
            #e5e7eb 45%,
            #d1d5db 100%
          );
          display: flex;
          flex-direction: column;
        }

        .vip-auth-main {
          flex: 1;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 40px 16px 60px;
        }

        .vip-auth-card {
          width: 100%;
          max-width: 440px;
          background: #ffffff;
          border-radius: 18px;
          box-shadow: 0 24px 60px rgba(15, 23, 42, 0.14);
          padding: 32px 28px 30px;
          text-align: center;
        }

        .vip-auth-kicker {
          font-size: 11px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #6b7280;
          margin-bottom: 4px;
        }

        .vip-auth-title {
          font-size: 24px;
          font-weight: 600;
          margin: 0;
          color: #111827;
        }

        .vip-auth-subtitle {
          margin-top: 8px;
          margin-bottom: 24px;
          font-size: 14px;
          color: #4b5563;
        }

        .vip-auth-form {
          text-align: left;
        }

        .vip-auth-field {
          margin-bottom: 14px;
        }

        .vip-auth-label {
          display: block;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          margin-bottom: 4px;
          color: #6b7280;
        }

        .vip-auth-input {
          width: 100%;
          border-radius: 9999px;
          border: 1px solid #d1d5db;
          padding: 10px 14px;
          font-size: 14px;
          outline: none;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }

        .vip-auth-input:focus {
          border-color: #111827;
          box-shadow: 0 0 0 1px #11182722;
        }

        .vip-auth-error {
          margin-top: 6px;
          margin-bottom: 6px;
          font-size: 12px;
          color: #b91c1c;
        }

        .vip-auth-button {
          width: 100%;
          margin-top: 14px;
          border: none;
          border-radius: 9999px;
          padding: 11px 18px;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          background: #111827;
          color: #ffffff;
          cursor: pointer;
          transition: opacity 0.15s ease, transform 0.1s ease;
        }

        .vip-auth-button:hover {
          opacity: 0.92;
          transform: translateY(-1px);
        }

        .vip-auth-button:disabled {
          opacity: 0.6;
          cursor: default;
          transform: none;
        }

        .vip-auth-footer-text {
          margin-top: 14px;
          font-size: 13px;
          color: #4b5563;
        }

        .vip-auth-footer-text a {
          color: #111827;
          text-decoration: underline;
        }

        @media (max-width: 480px) {
          .vip-auth-card {
            padding: 24px 18px 24px;
          }
        }
      `}</style>

      <div className="vip-auth-page">
        <Header />

        <main className="vip-auth-main">
          <section className="vip-auth-card">
            <p className="vip-auth-kicker">VIP CLUB</p>
            <h1 className="vip-auth-title">Sign in to your VIP profile</h1>
            <p className="vip-auth-subtitle">
              Access your points, tier, and member-only perks.
            </p>

            <form className="vip-auth-form" onSubmit={handleSubmit}>
              <div className="vip-auth-field">
                <label className="vip-auth-label">Email</label>
                <input
                  type="email"
                  className="vip-auth-input"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="vip-auth-field">
                <label className="vip-auth-label">Password</label>
                <input
                  type="password"
                  className="vip-auth-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {error && <p className="vip-auth-error">{error}</p>}

              <button
                type="submit"
                className="vip-auth-button"
                disabled={loading}
              >
                {loading ? "Signing you in..." : "Sign In"}
              </button>
            </form>

            <p className="vip-auth-footer-text">
              New to the Front Row?{" "}
              <Link href="/vip-signup">Join the Club</Link>
            </p>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
}
