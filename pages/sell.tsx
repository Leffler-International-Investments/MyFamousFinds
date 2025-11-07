// FILE: /pages/sell.tsx
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import ImageUploader from "../components/ImageUploader";
import { auth, db } from "../utils/firebaseClient";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

export default function SellPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isStripeReady, setIsStripeReady] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        const userRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(userRef);
        if (docSnap.exists() && docSnap.data().stripe_charges_enabled) {
          setIsStripeReady(true);
        } else {
          setIsStripeReady(false);
        }
      } else {
        setUser(null);
        router.push("/login");
      }
    });
    return () => unsub();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!imageUrl) {
      setError("Please upload an image.");
      setLoading(false);
      return;
    }
    if (!isStripeReady) {
      setError("Your seller account is not ready. Please complete onboarding.");
      setLoading(false);
      return;
    }

    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    const idToken = await user?.getIdToken();

    const body = {
      ...data,
      image: imageUrl,
      listingType: "open-market",
    };

    try {
      const res = await fetch("/api/sell", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(body),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || json.error || "Something went wrong");
      alert("Item submitted for review!");
      router.push("/");
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const field = { marginBottom: "15px" };
  const label = { display: "block", marginBottom: "5px", fontWeight: 600 };
  const input = { width: "100%", padding: "8px", background: "#222", color: "#fff", border: "1px solid #444", borderRadius: "4px" };

  if (!user)
    return <div style={{ textAlign: "center", padding: "40px" }}>Loading...</div>;
  if (!isStripeReady)
    return (
      <div style={{ maxWidth: "600px", margin: "40px auto", padding: "20px", background: "#1a1a1a", borderRadius: "8px", textAlign: "center" }}>
        <h1>Seller Account Not Ready</h1>
        <p>You must have an active and approved seller account to list items.</p>
        <Link href="/seller/onboarding" className="linkBtn">
          Go to Seller Onboarding
        </Link>
      </div>
    );

  return (
    <div style={{ maxWidth: "700px", margin: "40px auto", padding: "20px", background: "#1a1a1a", borderRadius: "8px" }}>
      <h1 style={{ textAlign: "center", marginBottom: "25px" }}>Sell Your Item</h1>
      <form onSubmit={handleSubmit}>
        {/* Image */}
        <div style={field}>
          <label style={label}>Item Image (1 required)</label>
          <ImageUploader
            maxImages={1}
            onUploadStart={() => setIsUploading(true)}
            onUploadError={(err) => {
              setError(err);
              setIsUploading(false);
            }}
            onUploadComplete={(url) => {
              setImageUrl(url);
              setIsUploading(false);
            }}
          />
        </div>

        {/* Core item fields */}
        <div style={field}>
          <label htmlFor="title" style={label}>Title *</label>
          <input id="title" name="title" required style={input} />
        </div>

        <div style={{ display: "flex", gap: "20px", ...field }}>
          <div style={{ flex: 1 }}>
            <label htmlFor="brand" style={label}>Brand *</label>
            <input id="brand" name="brand" required style={input} />
          </div>
          <div style={{ flex: 1 }}>
            <label htmlFor="category" style={label}>Category *</label>
            <input id="category" name="category" required style={input} />
          </div>
        </div>

        {/* Authenticity section */}
        <h3 style={{ marginTop: "25px" }}>Authenticity & Purchase Details</h3>
        <div style={field}>
          <label htmlFor="purchase_source" style={label}>
            Purchased From (store / website / original owner) *
          </label>
          <input id="purchase_source" name="purchase_source" required style={input} />
        </div>

        <div style={field}>
          <label htmlFor="purchase_proof" style={label}>Proof of Authenticity *</label>
          <select id="purchase_proof" name="purchase_proof" required style={input}>
            <option value="">Select one</option>
            <option value="original_receipt">Original receipt</option>
            <option value="certificate">Certificate of authenticity</option>
            <option value="trusted_seller">Purchased from verified seller</option>
            <option value="none">No proof available</option>
          </select>
        </div>

        <div style={field}>
          <label htmlFor="serial_number" style={label}>Serial / Model Number (if applicable)</label>
          <input id="serial_number" name="serial_number" style={input} />
        </div>

        <div style={field}>
          <label htmlFor="auth_photos" style={label}>Upload Proof Photos (receipt / certificate / serial label)</label>
          <ImageUploader
            maxImages={1}
            onUploadStart={() => setIsUploading(true)}
            onUploadError={(msg) => {
              setIsUploading(false);
              setError(msg);
            }}
            onUploadComplete={(url) => {
              setIsUploading(false);
              setImageUrl(url);
            }}
          />
        </div>

        <div style={field}>
          <label htmlFor="price" style={label}>Price (USD) *</label>
          <input id="price" name="price" required type="number" step="0.01" style={input} />
        </div>

        <div style={field}>
          <label htmlFor="description" style={label}>Description</label>
          <textarea id="description" name="description" rows={4} style={input} />
        </div>

        <div style={{ display: "flex", alignItems: "center", marginBottom: "15px" }}>
          <input type="checkbox" id="terms" name="terms" required style={{ marginRight: "8px" }} />
          <label htmlFor="terms" style={{ fontSize: "13px" }}>
            I agree to the{" "}
            <Link href="/terms-of-sale" target="_blank" style={{ color: "#3b82f6" }}>
              Terms of Sale
            </Link>
          </label>
        </div>

        <button
          type="submit"
          disabled={loading || isUploading}
          style={{
            width: "100%",
            padding: "12px",
            fontSize: "16px",
            background: "#22c55e",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          {loading ? "Submitting..." : "Submit for Review"}
        </button>

        {error && <p style={{ color: "red", marginTop: "15px", textAlign: "center" }}>{error}</p>}
      </form>
    </div>
  );
}
