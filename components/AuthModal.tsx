// FILE: /components/AuthModal.tsx
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  FacebookAuthProvider,
  updateProfile,
} from "firebase/auth";
import { auth } from "../utils/firebaseClient";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (uid: string, email: string) => void;
};

export default function AuthModal({ isOpen, onClose, onSuccess }: Props) {
  const [mode, setMode] = useState<"choose" | "email-signin" | "email-signup">("choose");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Ensure we only use createPortal on the client (document.body exists)
  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle redirect result from signInWithRedirect (fallback for popup failures)
  useEffect(() => {
    if (!auth) return;
    getRedirectResult(auth)
      .then((result) => {
        if (result) {
          onSuccess(result.user.uid, result.user.email || "");
        }
      })
      .catch((err) => {
        if (err?.code !== "auth/popup-closed-by-user") {
          console.error("redirect_result_error", err);
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!isOpen || !mounted) return null;

  const handleSocialSignIn = async (providerType: "google" | "facebook") => {
    if (!auth) return;
    setError("");
    setLoading(true);
    try {
      const provider =
        providerType === "google"
          ? new GoogleAuthProvider()
          : new FacebookAuthProvider();

      let result;
      try {
        result = await signInWithPopup(auth, provider);
      } catch (popupErr: any) {
        if (popupErr?.code === "auth/popup-closed-by-user") {
          setLoading(false);
          return;
        }
        console.warn("Popup sign-in failed, falling back to redirect:", popupErr?.code);
        await signInWithRedirect(auth, provider);
        return;
      }

      onSuccess(result.user.uid, result.user.email || "");
    } catch (err: any) {
      if (err?.code === "auth/popup-closed-by-user") return;
      const label = providerType === "google" ? "Google" : "Facebook";
      const msg =
        err?.code === "auth/unauthorized-domain"
          ? "This domain is not authorized for sign-in. Please contact support."
          : err?.code === "auth/account-exists-with-different-credential"
          ? "An account already exists with this email using a different sign-in method."
          : `${label} sign-in failed. Please try again.`;
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => handleSocialSignIn("google");
  const handleFacebookSignIn = () => handleSocialSignIn("facebook");

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;
    setError("");
    setLoading(true);
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      onSuccess(result.user.uid, result.user.email || "");
    } catch (err: any) {
      if (err?.code === "auth/user-not-found" || err?.code === "auth/invalid-credential") {
        setError("No account found. Please sign up.");
        setMode("email-signup");
      } else if (err?.code === "auth/wrong-password") {
        setError("Incorrect password.");
      } else {
        setError(err?.message || "Sign-in failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;
    setError("");
    if (!fullName.trim()) {
      setError("Please enter your full name.");
      return;
    }
    setLoading(true);
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(result.user, { displayName: fullName.trim() });
      onSuccess(result.user.uid, result.user.email || "");
    } catch (err: any) {
      if (err?.code === "auth/email-already-in-use") {
        setError("Account already exists. Try signing in.");
        setMode("email-signin");
      } else if (err?.code === "auth/weak-password") {
        setError("Password must be at least 6 characters.");
      } else {
        setError(err?.message || "Sign-up failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  const resetToChoose = () => {
    setMode("choose");
    setError("");
    setEmail("");
    setPassword("");
    setFullName("");
  };

  const modal = (
    <>
      <div className="auth-overlay" onClick={onClose}>
        <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
          <button className="auth-close-btn" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>

          <div className="auth-modal-body">
            <h2 className="auth-heading">Welcome</h2>
            <p className="auth-subtext">Sign in or create an account to continue</p>

            {error && <div className="auth-error-msg">{error}</div>}

            {mode === "choose" && (
              <>
                <button className="auth-social-btn auth-google" onClick={handleGoogleSignIn} disabled={loading}>
                  <svg viewBox="0 0 24 24" width="20" height="20">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  <span>Continue with Google</span>
                </button>

                <button className="auth-social-btn auth-facebook" onClick={handleFacebookSignIn} disabled={loading}>
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="#1877F2">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  <span>Continue with Facebook</span>
                </button>

                <div className="auth-divider">
                  <span>or</span>
                </div>

                <button className="auth-social-btn auth-email-btn" onClick={() => setMode("email-signin")} disabled={loading}>
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                  <span>Continue with email</span>
                </button>
              </>
            )}

            {mode === "email-signin" && (
              <form onSubmit={handleEmailSignIn} className="auth-email-form">
                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="auth-input"
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="auth-input"
                />
                <button type="submit" disabled={loading} className="auth-submit-btn">
                  {loading ? "Signing in..." : "Sign in"}
                </button>
                <p className="auth-switch-text">
                  Don't have an account?{" "}
                  <button type="button" className="auth-link-btn" onClick={() => { setMode("email-signup"); setError(""); }}>
                    Sign up
                  </button>
                </p>
                <button type="button" className="auth-link-btn auth-back-link" onClick={resetToChoose}>
                  Back to all options
                </button>
              </form>
            )}

            {mode === "email-signup" && (
              <form onSubmit={handleEmailSignUp} className="auth-email-form">
                <input
                  type="text"
                  placeholder="Full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="auth-input"
                />
                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="auth-input"
                />
                <input
                  type="password"
                  placeholder="Password (min. 6 characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="auth-input"
                />
                <button type="submit" disabled={loading} className="auth-submit-btn">
                  {loading ? "Creating account..." : "Create account"}
                </button>
                <p className="auth-switch-text">
                  Already have an account?{" "}
                  <button type="button" className="auth-link-btn" onClick={() => { setMode("email-signin"); setError(""); }}>
                    Sign in
                  </button>
                </p>
                <button type="button" className="auth-link-btn auth-back-link" onClick={resetToChoose}>
                  Back to all options
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .auth-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 99999;
          padding: 20px;
        }
        .auth-modal {
          background: #fff;
          border-radius: 16px;
          width: 100%;
          max-width: 420px;
          position: relative;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
          animation: authFadeIn 0.2s ease;
        }
        @keyframes authFadeIn {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .auth-close-btn {
          position: absolute;
          top: 16px;
          right: 16px;
          background: none;
          border: none;
          cursor: pointer;
          color: #666;
          padding: 4px;
        }
        .auth-close-btn:hover {
          color: #111;
        }
        .auth-modal-body {
          padding: 40px 32px 32px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .auth-heading {
          font-size: 24px;
          font-weight: 700;
          color: #111;
          margin: 0;
          text-align: center;
        }
        .auth-subtext {
          font-size: 14px;
          color: #666;
          margin: 0 0 8px;
          text-align: center;
        }
        .auth-error-msg {
          background: #fef2f2;
          color: #b91c1c;
          border: 1px solid #fecaca;
          border-radius: 10px;
          padding: 10px 14px;
          font-size: 13px;
          text-align: center;
        }

        .auth-social-btn {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          padding: 12px 16px;
          border-radius: 999px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s;
          border: 1px solid #e5e7eb;
          background: #fff;
          color: #111;
        }
        .auth-social-btn:hover:not(:disabled) {
          background: #f9fafb;
        }
        .auth-social-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .auth-divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 4px 0;
        }
        .auth-divider::before,
        .auth-divider::after {
          content: "";
          flex: 1;
          height: 1px;
          background: #e5e7eb;
        }
        .auth-divider span {
          font-size: 12px;
          color: #999;
          text-transform: lowercase;
        }

        .auth-email-form {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .auth-input {
          width: 100%;
          padding: 12px 16px;
          border: 1px solid #d1d5db;
          border-radius: 10px;
          font-size: 14px;
          outline: none;
          transition: border-color 0.15s;
          box-sizing: border-box;
        }
        .auth-input:focus {
          border-color: #111;
        }
        .auth-submit-btn {
          width: 100%;
          padding: 14px;
          background: #111827;
          color: #fff;
          border: none;
          border-radius: 999px;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.15s;
        }
        .auth-submit-btn:hover:not(:disabled) {
          background: #000;
        }
        .auth-submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .auth-switch-text {
          text-align: center;
          font-size: 13px;
          color: #666;
          margin: 0;
        }
        .auth-link-btn {
          background: none;
          border: none;
          color: #111;
          font-weight: 700;
          cursor: pointer;
          font-size: 13px;
          padding: 0;
          text-decoration: underline;
        }
        .auth-back-link {
          display: block;
          margin: 0 auto;
          color: #888;
          font-weight: 500;
        }
      `}</style>
    </>
  );

  // Render into document.body via portal so the overlay is never
  // trapped inside a parent with overflow/transform/z-index issues
  return createPortal(modal, document.body);
}
