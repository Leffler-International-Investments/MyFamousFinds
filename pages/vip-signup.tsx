// FILE: /pages/vip-signup.tsx

import Head from "next/head";
import Link from "next/link";
import { useState, FormEvent } from "react";
import { useRouter } from "next/router";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../utils/firebaseClient";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { autoPrefixPhone } from "../utils/phoneFormat";

export default function VipSignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);

      // Register in VIP members collection (API)
      const joinRes = await fetch("/api/vip/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: cred.user.uid,
          email: cred.user.email,
          fullName,
          phone: phone.trim(),
        }),
      });

      const joinJson = await joinRes.json();
      if (!joinRes.ok || !joinJson?.ok) {
        console.error("vip_join_api_error", joinJson);
      }

      router.push("/vip-welcome");
    } catch (err: any) {
      console.error("vip_signup_error", err);
      setError(
        err?.message ||
          "We couldn't create your VIP profile just now. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Head>
        <title>Join the Front Row – Famous Finds VIP Signup</title>
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

        .vip-auth-hint {
          font-size: 11px;
          color: #6b7280;
          margin-top: 2px;
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
            <h1 className="vip-auth-title">Join the Front Row</h1>
            <p className="vip-auth-subtitle">
              Free membership. Earn points on every purchase, unlock tiers, and
              get early access to drops — inspired by Nike-style rewards
              systems.
            </p>

            <form className="vip-auth-form" onSubmit={handleSubmit}>
              <div className="vip-auth-field">
                <label className="vip-auth-label">Full name</label>
                <input
                  type="text"
                  className="vip-auth-input"
                  placeholder="First and last name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>

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
                <label className="vip-auth-label">Mobile number (for 2FA)</label>
                <input
                  type="tel"
                  className="vip-auth-input"
                  placeholder="+1 (555) 000-0000"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(autoPrefixPhone(e.target.value))}
                />
              </div>

              <div className="vip-auth-field">
                <label className="vip-auth-label">Password</label>
                <input
                  type="password"
                  className="vip-auth-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
                  required
                />
                <p className="vip-auth-hint">
                  Use at least 6 characters. You’ll use this to sign in to your
                  VIP profile.
                </p>
              </div>

              {error && <p className="vip-auth-error">{error}</p>}

              <button
                type="submit"
                className="vip-auth-button"
                disabled={loading}
              >
                {loading ? "Creating your seat..." : "Join the Club"}
              </button>
            </form>

            <p className="vip-auth-footer-text">
              Already a member?{" "}
              <Link href="/vip-login">Sign in to your VIP profile</Link>
            </p>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
}
