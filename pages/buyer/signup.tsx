// FILE: /pages/buyer/signup.tsx
import Head from "next/head";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/router";
import { createUserWithEmailAndPassword } from "firebase/auth";

import Header from "../../components/Header";
import Footer from "../../components/Footer";
import PasswordInput from "../../components/PasswordInput";
import { auth } from "../../utils/firebaseClient";

type BannerState =
  | null
  | { type: "error" | "info"; message: string; code?: string };

export default function BuyerSignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [banner, setBanner] = useState<BannerState>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBanner(null);

    const trimmedEmail = email.trim().toLowerCase();
    if (!fullName.trim() || !trimmedEmail || !password) {
      setBanner({
        type: "error",
        message: "Please fill in your name, email and password.",
      });
      return;
    }

    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, trimmedEmail, password);

      if (typeof window !== "undefined") {
        window.localStorage.setItem("ff-role", "buyer");
        window.localStorage.setItem("ff-email", trimmedEmail);
      }

      // Save profile to Firestore (including phone for 2FA)
      try {
        const token = await cred.user.getIdToken();
        await fetch("/api/user/profile", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            fullName: fullName.trim(),
            email: trimmedEmail,
            phone: phone.trim(),
          }),
        });
      } catch {
        // Non-blocking — profile will be created later
      }

      router.push("/buyer/dashboard");
    } catch (err: any) {
      console.error("buyer_signup_error", err);

      const code = err?.code as string | undefined;

      if (code === "auth/email-already-in-use") {
        setBanner({
          type: "info",
          code,
          message:
            'An account with this email already exists. Please sign in instead or use "Forgot password" on the sign-in page.',
        });
      } else if (code === "auth/weak-password") {
        setBanner({
          type: "error",
          code,
          message: "Please choose a stronger password (at least 6 characters).",
        });
      } else {
        setBanner({
          type: "error",
          code,
          message:
            "We couldn’t create your account. Please check your details and try again.",
        });
      }
    } finally {
      setLoading(false);
    }
  }

  const disabled = loading;

  return (
    <>
      <Head>
        <title>Create account - Famous Finds</title>
      </Head>

      <div className="auth-page">
        <Header />
        <main className="auth-main">
          <div className="auth-card">
            <h1>Create account</h1>
            <p className="auth-subtitle">
              Join Famous Finds to save favourites and manage your orders.
            </p>

            {banner && (
              <div
                className={
                  banner.type === "error" ? "auth-banner error" : "auth-banner"
                }
              >
                <p>{banner.message}</p>
                {banner.code === "auth/email-already-in-use" && (
                  <p className="auth-inline-links">
                    <Link href="/buyer/signin">Please sign in</Link>
                    {"  •  "}
                    <Link href="/buyer/forgot-password">Forgot password</Link>
                  </p>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="auth-fields">
                <div className="auth-field">
                  <label htmlFor="name">Full name</label>
                  <input
                    id="name"
                    type="text"
                    autoComplete="name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="auth-input"
                    placeholder="Full name"
                    disabled={disabled}
                    required
                  />
                </div>

                <div className="auth-field">
                  <label htmlFor="email">Email</label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="auth-input"
                    placeholder="name@example.com"
                    disabled={disabled}
                    required
                  />
                </div>

                <div className="auth-field">
                  <label htmlFor="phone">Mobile number (for 2FA)</label>
                  <input
                    id="phone"
                    type="tel"
                    autoComplete="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="auth-input"
                    placeholder="+1 (555) 000-0000"
                    disabled={disabled}
                  />
                </div>

                <PasswordInput
                  label="Password"
                  name="password"
                  value={password}
                  onChange={setPassword}
                  required
                  placeholder="Create password"
                  showStrength={true}
                />

                <button
                  type="submit"
                  className="auth-button-primary"
                  disabled={disabled}
                >
                  {loading ? "Creating account..." : "Create account"}
                </button>
              </div>
            </form>

            <p className="auth-secondary-link">
              Already have an account? <Link href="/buyer/signin">Sign in</Link>
            </p>
          </div>
        </main>
        <Footer />
      </div>

      <style jsx>{`
        .auth-page {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: #f8fafc;
          color: #111827;
        }
        .auth-main {
          flex: 1;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding: 60px 16px 40px;
        }
        .auth-card {
          width: 100%;
          max-width: 420px;
          background: #ffffff;
          border-radius: 28px;
          border: 1px solid #e5e7eb;
          padding: 32px 28px 28px;
          box-shadow: 0 20px 40px rgba(15, 23, 42, 0.08);
        }
        h1 {
          font-family: ui-serif, "Times New Roman", serif;
          font-size: 26px;
          font-weight: 700;
          margin: 0 0 8px;
          letter-spacing: -0.02em;
          text-align: center;
        }
        .auth-subtitle {
          margin: 0 0 24px;
          font-size: 14px;
          color: #6b7280;
          text-align: center;
        }
        .auth-fields {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .auth-field label {
          display: block;
          margin-bottom: 6px;
          font-size: 13px;
          font-weight: 500;
          color: #374151;
        }
        :global(.auth-input) {
          width: 100%;
          border-radius: 999px;
          border: 1px solid #d1d5db;
          background: #f9fafb;
          padding: 10px 14px;
          font-size: 14px;
          color: #111827;
          transition: all 0.2s ease;
        }
        :global(.auth-input:focus) {
          outline: none;
          border-color: #111827;
          background: #ffffff;
          box-shadow: 0 2px 8px rgba(15, 23, 42, 0.06);
        }
        .auth-button-primary {
          margin-top: 4px;
          width: 100%;
          border-radius: 999px;
          padding: 12px;
          border: none;
          font-size: 14px;
          font-weight: 600;
          background: #111827;
          color: #ffffff;
          cursor: pointer;
          transition: transform 0.1s ease, opacity 0.2s;
        }
        .auth-button-primary:hover {
          opacity: 0.9;
        }
        .auth-button-primary:disabled {
          opacity: 0.6;
          cursor: default;
        }
        .auth-banner {
          border-radius: 12px;
          padding: 10px;
          margin-bottom: 16px;
          font-size: 13px;
          text-align: center;
          background: #fef3c7;
          color: #92400e;
        }
        .auth-banner.error {
          background: #fef2f2;
          color: #b91c1c;
        }
        .auth-inline-links {
          margin-top: 4px;
        }
        .auth-inline-links a {
          color: #111827;
          text-decoration: underline;
        }
        .auth-secondary-link {
          margin-top: 12px;
          text-align: center;
          font-size: 13px;
          color: #6b7280;
        }
        .auth-secondary-link a {
          color: #111827;
          text-decoration: underline;
        }
        .auth-secondary-link a:hover {
          color: #000000;
        }
      `}</style>
    </>
  );
}
