// FILE: /pages/buyer/signup.tsx

import { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import Header from "../../components/Header";
import Footer from "../../components/Footer";

import firebaseApp from "../../utils/firebaseClient";
import {
  getAuth,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);

export default function BuyerSignUpPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedName = name.trim();

    try {
      const userCred = await createUserWithEmailAndPassword(
        auth,
        trimmedEmail,
        password
      );

      await setDoc(doc(db, "buyers", userCred.user.uid), {
        name: trimmedName,
        email: trimmedEmail,
        createdAt: serverTimestamp(),
      });

      router.push("/buyer/dashboard");
    } catch (err: any) {
      console.error("buyer_signup_error", err);
      const code = err?.code as string | undefined;

      if (code === "auth/email-already-in-use") {
        setError(
          'An account with this email already exists. Please sign in instead or use "Forgot password" on the sign-in page.'
        );
      } else if (code === "auth/weak-password") {
        setError("Password is too weak. Please use at least 6 characters.");
      } else {
        setError("Unable to create your account right now. Please try again.");
      }
    }
  };

  return (
    <>
      <Head>
        <title>Create Buyer Account | Famous Finds</title>
      </Head>
      <Header />

      <main className="auth-main">
        <div className="auth-inner">
          <h1 className="auth-title">Create account</h1>

          {error && <p className="auth-error">{error}</p>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-field">
              <label className="auth-label">Full name</label>
              <input
                className="auth-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="auth-field">
              <label className="auth-label">Email</label>
              <input
                type="email"
                className="auth-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="auth-field">
              <label className="auth-label">Password</label>
              <input
                type="password"
                className="auth-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            <button type="submit" className="auth-button">
              Create account
            </button>
          </form>

          <p className="auth-switch">
            Already have an account?{" "}
            <Link href="/buyer/signin">Sign in</Link>
          </p>
        </div>
      </main>

      <Footer />
    </>
  );
}
