// FILE: /pages/management/login.tsx
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { FormEvent, useState } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import PasswordInput from "../../components/PasswordInput";

// --- Import Firebase client auth ---
import {
  getAuth,
  signInWithEmailAndPassword,
  PhoneAuthProvider,
  PhoneMultiFactorGenerator,
  MultiFactorResolver,
  AuthError,
} from "firebase/auth";
import { firebaseApp } from "../../utils/firebaseClient";

export default function ManagementLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("leffleryd@gmail.com");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // --- New state for 2FA ---
  const [step, setStep] = useState(1); // 1 = password, 2 = code
  const [code, setCode] = useState("");
  const [resolver, setResolver] = useState<MultiFactorResolver | null>(null);
  const [verificationId, setVerificationId] = useState("");

  const from =
    typeof router.query.from === "string" ? router.query.from : null;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const auth = getAuth(firebaseApp);

    if (step === 1) {
      // --- Step 1: Handle Email/Password Login ---
      try {
        await signInWithEmailAndPassword(auth, email, password);
        
        // If it succeeds *without* 2FA error, they are logged in.
        // (This happens if 2FA is not enforced yet)
        if (typeof window !== "undefined") {
          window.localStorage.setItem("ff-role", "management");
          window.localStorage.setItem("ff-email", email.toLowerCase().trim());
        }
        router.push(from || "/management/dashboard");

      } catch (err) {
        const error = err as AuthError;
        // --- THIS IS THE KEY ---
        if (error.code === "auth/multi-factor-required") {
          // 2FA is required. Move to step 2.
          setResolver(error.resolver);
          const phoneInfo = error.resolver.hints[0]; // Get the first enrolled phone
          
          const phoneAuthProvider = new PhoneAuthProvider(auth);
          const newVerificationId = await phoneAuthProvider.verifyPhoneNumber(
            phoneInfo,
            // This requires a reCAPTCHA container in your JSX
            (window as any).recaptchaVerifier 
          );
          setVerificationId(newVerificationId);
          setStep(2); // Move to the code entry screen
        } else {
          setError(error.message || "Invalid email or password.");
        }
      } finally {
        setLoading(false);
      }
    } else {
      // --- Step 2: Handle 6-Digit Code Verification ---
      if (!resolver || !verificationId) {
        setError("Session expired. Please log in again.");
        setStep(1);
        setLoading(false);
        return;
      }
      
      try {
        const credential = PhoneAuthProvider.credential(verificationId, code);
        const assertion = PhoneMultiFactorGenerator.assertion(credential);
        
        // Complete the sign-in
        await resolver.resolveSignIn(assertion);
        
        // SUCCESS!
        if (typeof window !== "undefined") {
          window.localStorage.setItem("ff-role", "management");
          window.localStorage.setItem("ff-email", email.toLowerCase().trim());
        }
        router.push(from || "/management/dashboard");

      } catch (err) {
        const error = err as AuthError;
        setError(error.message || "Invalid code. Please try again.");
      } finally {
        setLoading(false);
      }
    }
  }

  return (
    <>
      <Head>
        <title>Management Admin Login — Famous Finds</title>
      </Head>
      {/* Container for reCAPTCHA */}
      <div id="recaptcha-container"></div>
      
      <div className="min-h-screen bg-gray-900 text-gray-100">
        <Header />

        <main className="mx-auto flex max-w-3xl flex-col items-center px-4 pb-16 pt-10">
          <div className="w-full max-w-md rounded-2xl border border-gray-700 bg-gray-950/80 p-6 shadow-xl">
            
            {step === 1 ? (
              // --- Step 1: Email/Password Form ---
              <>
                <h1 className="text-center text-2xl font-semibold text-white">
                  Management Admin Login
                </h1>
                <p className="mt-2 text-center text-xs text-gray-400">
                  Only authorized admins can access this console.
                </p>
                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-300">
                      Email
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="mt-1 w-full rounded-md border border-gray-600 bg-gray-900 px-3 py-2 text-sm text-gray-100 focus:border-gray-300 focus:outline-none"
                    />
                  </div>
                  <PasswordInput
                    label="Password"
                    value={password}
                    onChange={setPassword}
                    name="password"
                    required
                    placeholder="Enter your admin password"
                  />
                  <div className="text-right">
                    <Link
                      href="/management/forgot-password"
                      className="text-xs font-medium text-blue-400 hover:text-blue-200"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="mt-2 w-full rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-100 disabled:opacity-60"
                  >
                    {loading ? "Signing in…" : "Sign In"}
                  </button>
                </form>
              </>
            ) : (
              // --- Step 2: 2FA Code Form ---
              <>
                <h1 className="text-center text-2xl font-semibold text-white">
                  Check Your Phone
                </h1>
                <p className="mt-2 text-center text-sm text-gray-400">
                  We sent a 6-digit verification code to your registered mobile
                  number.
                </p>
                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-300">
                      Verification Code
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      required
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      className="mt-1 w-full rounded-md border border-gray-600 bg-gray-900 px-3 py-2 text-sm text-gray-100 focus:border-gray-300 focus:outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="mt-2 w-full rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-100 disabled:opacity-60"
                  >
                    {loading ? "Verifying…" : "Verify & Sign In"}
                  </button>
                </form>
              </>
            )}

            {error && (
              <p className="mt-4 text-xs text-red-400">{error}</p>
            )}

            <div className="mt-4 text-center">
              <Link
                href="/"
                className="text-xs text-gray-400 hover:text-gray-200"
              >
                ← Back to storefront
              </Link>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}
