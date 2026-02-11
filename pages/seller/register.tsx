// FILE: /pages/seller/register.tsx

import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState, FormEvent } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";

import { auth, db } from "../../utils/firebaseClient";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";

export default function SellerRegisterPage() {
  const router = useRouter();
  const { id, token } = router.query;

  const [loading, setLoading] = useState(true);
  const [valid, setValid] = useState(false);
  const [email, setEmail] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function verifyInvite() {
      if (!id || !token || Array.isArray(id) || Array.isArray(token)) return;
      setLoading(true);
      setError(null);

      try {
        const ref = doc(db, "sellers", id);
        const snap = await getDoc(ref);
        if (!snap.exists()) {
          setError("This invitation is not valid anymore.");
          setValid(false);
          return;
        }
        const data: any = snap.data() || {};
        if (
          !data.invitationToken ||
          String(data.invitationToken) !== String(token)
        ) {
          setError("This invitation link is invalid or has expired.");
          setValid(false);
          return;
        }
        if (String(data.status || "").toLowerCase() !== "approved") {
          setError("This seller application is not marked as approved.");
          setValid(false);
          return;
        }

        setEmail(
          (data.email as string) ||
            (data.contactEmail as string) ||
            ""
        );
        setBusinessName(
          (data.businessName as string) || "Seller"
        );
        setValid(true);
      } catch (err) {
        console.error("verify_invite_error", err);
        setError("Unable to verify this invitation.");
        setValid(false);
      } finally {
        setLoading(false);
      }
    }

    verifyInvite();
  }, [id, token]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!valid || !email) return;
    setError(null);
    setSuccess(false);

    try {
      if (password.length < 8) {
        setError("Password should be at least 8 characters long.");
        return;
      }

      await createUserWithEmailAndPassword(auth, email, password);

      if (!Array.isArray(id) && id) {
        try {
          const ref = doc(db, "sellers", id);
          await updateDoc(ref, {
            invitationToken: null,
            registeredAt: new Date(),
          });
        } catch (err) {
          console.error("update_seller_registered_error", err);
        }
      }

      setSuccess(true);

      // Set seller session so useRequireSeller allows dashboard access
      if (typeof window !== "undefined") {
        window.localStorage.setItem("ff-role", "seller");
        window.localStorage.setItem("ff-email", email);
        window.localStorage.setItem(
          "ff-session-exp",
          String(Date.now() + 72 * 60 * 60 * 1000)
        );
      }

      // From now on, seller should log in via the main Seller Admin Login
      setTimeout(() => {
        router.push("/seller/dashboard");
      }, 1500);
    } catch (err: any) {
      console.error("seller_register_error", err);
      setError(
        err?.message ||
          "We couldn't complete your registration. You may already have an account with this email."
      );
    }
  }

  return (
    <div className="auth-page">
      <Head>
        <title>Seller Registration - Famous Finds</title>
      </Head>
      <Header />
      <main className="auth-main">
        <div className="auth-card">
          <h1>Complete your seller registration</h1>
          {businessName && (
            <p className="auth-subtitle">
              Welcome, {businessName}. Set a password to access your Seller
              Admin Console.
            </p>
          )}

          {loading && <p>Checking your invitation…</p>}
          {!loading && !valid && error && (
            <p className="auth-error">{error}</p>
          )}

          {!loading && valid && (
            <form onSubmit={handleSubmit}>
              {error && <p className="auth-error">{error}</p>}
              {success && (
                <p className="auth-info">
                  Registration complete! From now on, please log in via the main
                  dashboard using the <strong>Seller Admin Login</strong>
                  button.
                </p>
              )}

              <div className="auth-fields">
                <div className="auth-field">
                  <label>Email</label>
                  <input
                    type="email"
                    value={email}
                    disabled
                    className="auth-input"
                  />
                </div>
                <div className="auth-field">
                  <label>Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="auth-input"
                    placeholder="Create a strong password"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="auth-button-primary"
                  disabled={loading}
                >
                  Create account &amp; continue
                </button>
              </div>
            </form>
          )}

          <p className="auth-secondary-link">
            After registration, you can always access your console from the main
            Famous Finds dashboard via{" "}
            <strong>Seller Admin Login</strong>.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
