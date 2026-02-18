// FILE: /pages/account.tsx
// Unified Account Dashboard — shopping + optional "become a seller" + preferences

import { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import Header from "../components/Header";
import Footer from "../components/Footer";

import { onAuthStateChanged, signOut, User } from "firebase/auth";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db, firebaseClientReady } from "../utils/firebaseClient";

const INTEREST_OPTIONS = [
  "Bags & Handbags",
  "Shoes & Sneakers",
  "Jewelry & Watches",
  "Women's Clothing",
  "Men's Clothing",
  "Kids & Baby",
  "Accessories",
  "Home & Decor",
];

const SIZE_OPTIONS = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "One Size"];

const AGE_RANGE_OPTIONS = [
  "18-24",
  "25-34",
  "35-44",
  "45-54",
  "55+",
  "Prefer not to say",
];

type ItemRow = {
  id: string;
  title: string;
  brand?: string;
  price?: number;
  currency?: string;
  status?: string;
  listingId?: string;
  imageUrl?: string;
};

type SellerStatus = "none" | "pending" | "approved" | "rejected";

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Dashboard data
  const [savedItems, setSavedItems] = useState<ItemRow[]>([]);
  const [cartItems, setCartItems] = useState<ItemRow[]>([]);
  const [purchasedItems, setPurchasedItems] = useState<ItemRow[]>([]);

  // Seller status
  const [sellerStatus, setSellerStatus] = useState<SellerStatus>("none");

  // Preferences
  const [showPrefs, setShowPrefs] = useState(false);
  const [interests, setInterests] = useState<string[]>([]);
  const [preferredSize, setPreferredSize] = useState("");
  const [ageRange, setAgeRange] = useState("");
  const [savingPrefs, setSavingPrefs] = useState(false);

  // Recommendations
  const [recommendations, setRecommendations] = useState<ItemRow[]>([]);

  useEffect(() => {
    if (!firebaseClientReady || !auth || !db) {
      setLoading(false);
      return;
    }

    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        router.replace("/login");
        return;
      }
      setUser(u);
      try {
        await Promise.all([loadData(u.uid, u.email || ""), loadSellerStatus(u.email || ""), loadPreferences(u.uid)]);
      } catch (err) {
        console.error("Account data load failed:", err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async (uid: string, email: string) => {
    if (!db) return;

    const loadCollection = async (name: string): Promise<ItemRow[]> => {
      try {
        const q = query(collection(db, name), where("userId", "==", uid));
        const snap = await getDocs(q);
        return snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any),
        })) as ItemRow[];
      } catch (err) {
        console.error(`Failed to load ${name}:`, err);
        return [];
      }
    };

    const [saved, cart] = await Promise.all([
      loadCollection("buyerSavedItems"),
      loadCollection("buyerCartItems"),
    ]);
    setSavedItems(saved);
    setCartItems(cart);

    // Load purchase history
    const orders: ItemRow[] = [];
    const seen = new Set<string>();
    const pushOrder = (docSnap: any) => {
      if (seen.has(docSnap.id)) return;
      seen.add(docSnap.id);
      const d: any = docSnap.data() || {};
      const amt = typeof d.amountTotal === "number" ? d.amountTotal / 100 : (d.total || d.amount || 0);
      orders.push({
        id: docSnap.id,
        title: d.listingTitle || d.title || "Purchased item",
        brand: d.listingBrand || d.brand || "",
        price: amt,
        currency: d.currency || "USD",
      });
    };
    try {
      if (email) {
        const ordersByEmail = await getDocs(
          query(collection(db, "orders"), where("buyerEmail", "==", email))
        );
        ordersByEmail.forEach(pushOrder);
        // Also check buyerFormEmail — the checkout form email may differ from PayPal email
        const ordersByFormEmail = await getDocs(
          query(collection(db, "orders"), where("buyerFormEmail", "==", email))
        );
        ordersByFormEmail.forEach(pushOrder);
      }
      const ordersByUid = await getDocs(
        query(collection(db, "orders"), where("buyerId", "==", uid))
      );
      ordersByUid.forEach(pushOrder);
    } catch (err) {
      console.error("Failed to load purchase history:", err);
    }
    setPurchasedItems(orders);

    // Load personalized recommendations
    try {
      const recSnap = await getDocs(
        query(collection(db, "buyerRecommendations"), where("userId", "==", uid))
      );
      const recs = recSnap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      })) as ItemRow[];
      setRecommendations(recs);
    } catch (err) {
      console.error("Failed to load recommendations:", err);
    }
  };

  const loadSellerStatus = async (email: string) => {
    if (!db || !email) return;
    const lowerEmail = email.trim().toLowerCase();
    const applyFormatId = lowerEmail.replace(/\./g, "_");

    const applyStatus = (data: any) => {
      const status = String(data.status || "").toLowerCase();
      if (status === "approved") setSellerStatus("approved");
      else if (status === "pending") setSellerStatus("pending");
      else if (status === "rejected") setSellerStatus("rejected");
      else setSellerStatus("pending");
    };

    try {
      // Try raw email as doc ID (profile/onboard/login path)
      const byRawEmail = await getDoc(doc(db, "sellers", lowerEmail));
      if (byRawEmail.exists()) { applyStatus(byRawEmail.data()); return; }

      // Try underscore-format doc ID (apply path)
      if (applyFormatId !== lowerEmail) {
        const byUnderscoreId = await getDoc(doc(db, "sellers", applyFormatId));
        if (byUnderscoreId.exists()) { applyStatus(byUnderscoreId.data()); return; }
      }

      // Fallback: query by email field
      const byEmailField = await getDocs(
        query(collection(db, "sellers"), where("email", "==", lowerEmail))
      );
      if (!byEmailField.empty) { applyStatus(byEmailField.docs[0].data()); return; }

      // Fallback: query by contactEmail field
      const byContactEmail = await getDocs(
        query(collection(db, "sellers"), where("contactEmail", "==", lowerEmail))
      );
      if (!byContactEmail.empty) { applyStatus(byContactEmail.docs[0].data()); return; }
    } catch (err) {
      console.error("Failed to load seller status:", err);
    }
  };

  const loadPreferences = async (uid: string) => {
    if (!db) return;
    try {
      const prefDoc = await getDoc(doc(db, "userPreferences", uid));
      if (prefDoc.exists()) {
        const data = prefDoc.data() as any;
        setInterests(data.interests || []);
        setPreferredSize(data.preferredSize || "");
        setAgeRange(data.ageRange || "");
      }
    } catch {}
  };

  function toggleInterest(interest: string) {
    setInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
  }

  async function handleSavePreferences() {
    setSavingPrefs(true);
    try {
      if (auth.currentUser) {
        const token = await auth.currentUser.getIdToken();
        await fetch("/api/user/preferences", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ interests, preferredSize, ageRange }),
        });
      }
    } catch {}
    setSavingPrefs(false);
    setShowPrefs(false);
  }

  const handleSignOut = async () => {
    if (auth) await signOut(auth);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("ff-role");
      window.localStorage.removeItem("ff-email");
      window.localStorage.removeItem("ff-session-exp");
    }
    router.push("/");
  };

  const role = typeof window !== "undefined"
    ? window.localStorage.getItem("ff-role")
    : null;

  if (!firebaseClientReady) {
    return (
      <>
        <Head><title>My Account | Famous Finds</title></Head>
        <Header />
        <main style={{ padding: "60px 16px", textAlign: "center" }}>
          <p>Account features are currently unavailable.</p>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Head>
        <title>My Account | Famous Finds</title>
      </Head>
      <Header />

      <main className="account-main">
        <div className="account-wrap">
          {/* Header */}
          <div className="account-header">
            <div>
              <h1>My Account</h1>
              {user && (
                <p className="account-email">
                  {user.displayName ? `${user.displayName} — ` : ""}
                  {user.email}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              className="btn-signout"
            >
              Sign out
            </button>
          </div>

          {loading ? (
            <p className="loading-text">Loading your account...</p>
          ) : (
            <div className="account-body">
              {/* Quick stats */}
              <div className="stats-row">
                <div className="stat-card">
                  <div className="stat-number">{savedItems.length}</div>
                  <div className="stat-label">Saved Items</div>
                </div>
                <div className="stat-card">
                  <div className="stat-number">{cartItems.length}</div>
                  <div className="stat-label">In Bag</div>
                </div>
                <div className="stat-card">
                  <div className="stat-number">{purchasedItems.length}</div>
                  <div className="stat-label">Purchases</div>
                </div>
              </div>

              {/* Quick actions */}
              <div className="stats-row actions-row-bottom">
                <div
                  className="stat-card stat-card-link"
                  onClick={() => router.push("/cart")}
                  role="button"
                  tabIndex={0}
                >
                  <div className="stat-label">Shopping Bag</div>
                </div>
                <div
                  className="stat-card stat-card-link"
                  onClick={() => router.push("/my-orders")}
                  role="button"
                  tabIndex={0}
                >
                  <div className="stat-label">My Orders</div>
                </div>
                <div
                  className="stat-card stat-card-link"
                  onClick={() => setShowPrefs(!showPrefs)}
                  role="button"
                  tabIndex={0}
                >
                  <div className="stat-label">Preferences</div>
                </div>
              </div>

              {/* Become a Seller section */}
              <section className="seller-section">
                <h2>Selling on Famous Finds</h2>
                {sellerStatus === "none" && (
                  <div className="seller-cta">
                    <p>
                      Have luxury items to consign? Apply to become a seller and
                      reach thousands of buyers.
                    </p>
                    <Link href="/become-seller" className="btn-become-seller">
                      Become a Seller
                    </Link>
                  </div>
                )}
                {sellerStatus === "pending" && (
                  <div className="seller-status-card pending">
                    <p>
                      Your seller application is under review. We will email you
                      once approved.
                    </p>
                  </div>
                )}
                {sellerStatus === "approved" && (
                  <div className="seller-status-card approved">
                    <p>You are an approved seller.</p>
                    <Link href="/seller/dashboard" className="btn-seller-dash">
                      Go to Seller Dashboard
                    </Link>
                  </div>
                )}
                {sellerStatus === "rejected" && (
                  <div className="seller-status-card rejected">
                    <p>
                      Your previous application was not approved. You may
                      re-apply at any time.
                    </p>
                    <Link href="/become-seller" className="btn-become-seller">
                      Re-apply
                    </Link>
                  </div>
                )}
              </section>

              {/* Preferences panel */}
              {showPrefs && (
                <section className="prefs-section">
                  <h2>Shopping Preferences</h2>
                  <div className="pref-group">
                    <label>Interests</label>
                    <div className="pref-chips">
                      {INTEREST_OPTIONS.map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          className={`pref-chip${
                            interests.includes(opt) ? " active" : ""
                          }`}
                          onClick={() => toggleInterest(opt)}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="pref-group">
                    <label>Preferred Size</label>
                    <div className="pref-chips">
                      {SIZE_OPTIONS.map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          className={`pref-chip${
                            preferredSize === opt ? " active" : ""
                          }`}
                          onClick={() =>
                            setPreferredSize(preferredSize === opt ? "" : opt)
                          }
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="pref-group">
                    <label>Age Range</label>
                    <div className="pref-chips">
                      {AGE_RANGE_OPTIONS.map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          className={`pref-chip${
                            ageRange === opt ? " active" : ""
                          }`}
                          onClick={() =>
                            setAgeRange(ageRange === opt ? "" : opt)
                          }
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn-save-prefs"
                    onClick={handleSavePreferences}
                    disabled={savingPrefs}
                  >
                    {savingPrefs ? "Saving..." : "Save Preferences"}
                  </button>
                </section>
              )}

              {/* Personalized recommendations */}
              {recommendations.length > 0 && (
                <section className="recs-section">
                  <h2>Recommended for You</h2>
                  <div className="recs-grid">
                    {recommendations.slice(0, 4).map((item) => (
                      <Link
                        key={item.id}
                        href={`/product/${item.listingId || item.id}`}
                        className="rec-card"
                      >
                        {item.imageUrl && (
                          <img
                            src={item.imageUrl}
                            alt={item.title}
                            className="rec-img"
                          />
                        )}
                        <div className="rec-info">
                          {item.brand && (
                            <span className="rec-brand">{item.brand}</span>
                          )}
                          <span className="rec-title">{item.title}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {/* Recent purchases — consignment opportunity */}
              {purchasedItems.length > 0 && (
                <section className="consign-section">
                  <h2>Ready to Consign?</h2>
                  <p className="consign-text">
                    Loved something you bought? When you are ready to part with
                    it, list it on Famous Finds and earn from your pre-loved
                    pieces.
                  </p>
                  {sellerStatus === "none" && (
                    <Link href="/become-seller" className="btn-become-seller">
                      Start Selling
                    </Link>
                  )}
                  {sellerStatus === "approved" && (
                    <Link href="/seller/dashboard" className="btn-seller-dash">
                      List an Item
                    </Link>
                  )}
                </section>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />

      <style jsx>{`
        .account-main {
          min-height: 60vh;
          padding: 32px 16px 60px;
          background: #f8fafc;
        }
        .account-wrap {
          max-width: 800px;
          margin: 0 auto;
        }
        .account-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 28px;
        }
        .account-header h1 {
          font-family: ui-serif, "Times New Roman", serif;
          font-size: 28px;
          font-weight: 700;
          margin: 0;
          color: #111827;
        }
        .account-email {
          margin: 4px 0 0;
          font-size: 13px;
          color: #6b7280;
        }
        .btn-signout {
          border-radius: 999px;
          border: 1px solid #d1d5db;
          background: #ffffff;
          padding: 8px 18px;
          font-size: 13px;
          font-weight: 500;
          color: #374151;
          cursor: pointer;
        }
        .btn-signout:hover {
          border-color: #111827;
        }
        .loading-text {
          color: #6b7280;
          font-size: 14px;
        }

        /* Stats */
        .stats-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-bottom: 12px;
        }
        .stat-card {
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          padding: 20px;
          text-align: center;
        }
        .actions-row-bottom {
          margin-bottom: 28px;
        }
        .stat-card-link {
          cursor: pointer;
          transition: all 0.15s;
        }
        .stat-card-link:hover {
          border-color: #111827;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        }
        .stat-number {
          font-size: 28px;
          font-weight: 700;
          color: #111827;
        }
        .stat-label {
          font-size: 12px;
          color: #6b7280;
          margin-top: 4px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        /* Seller section */
        .seller-section {
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          padding: 24px;
          margin-bottom: 20px;
        }
        .seller-section h2 {
          font-size: 16px;
          font-weight: 600;
          margin: 0 0 12px;
          color: #111827;
        }
        .seller-cta p {
          font-size: 14px;
          color: #6b7280;
          margin: 0 0 12px;
          line-height: 1.5;
        }
        .btn-become-seller {
          display: inline-block;
          border-radius: 999px;
          background: #111827;
          color: #ffffff;
          padding: 10px 24px;
          font-size: 14px;
          font-weight: 600;
          text-decoration: none;
          transition: opacity 0.2s;
        }
        .btn-become-seller:hover {
          opacity: 0.9;
        }
        .seller-status-card {
          border-radius: 12px;
          padding: 14px;
          font-size: 14px;
        }
        .seller-status-card.pending {
          background: #eff6ff;
          color: #1d4ed8;
        }
        .seller-status-card.approved {
          background: #ecfdf5;
          color: #065f46;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }
        .seller-status-card.rejected {
          background: #fef2f2;
          color: #b91c1c;
        }
        .btn-seller-dash {
          border-radius: 999px;
          background: #059669;
          color: #ffffff;
          padding: 8px 18px;
          font-size: 13px;
          font-weight: 600;
          text-decoration: none;
          white-space: nowrap;
        }

        /* Preferences */
        .prefs-section {
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          padding: 24px;
          margin-bottom: 20px;
        }
        .prefs-section h2 {
          font-size: 16px;
          font-weight: 600;
          margin: 0 0 16px;
          color: #111827;
        }
        .pref-group {
          margin-bottom: 16px;
        }
        .pref-group label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 8px;
        }
        .pref-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .pref-chip {
          border-radius: 999px;
          border: 1px solid #d1d5db;
          background: #f9fafb;
          padding: 6px 14px;
          font-size: 13px;
          color: #374151;
          cursor: pointer;
          transition: all 0.15s;
        }
        .pref-chip:hover {
          border-color: #111827;
        }
        .pref-chip.active {
          background: #111827;
          color: #ffffff;
          border-color: #111827;
        }
        .btn-save-prefs {
          margin-top: 8px;
          border-radius: 999px;
          background: #111827;
          color: #ffffff;
          padding: 10px 24px;
          font-size: 14px;
          font-weight: 600;
          border: none;
          cursor: pointer;
        }
        .btn-save-prefs:disabled {
          opacity: 0.6;
        }

        /* Recommendations */
        .recs-section {
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          padding: 24px;
          margin-bottom: 20px;
        }
        .recs-section h2 {
          font-size: 16px;
          font-weight: 600;
          margin: 0 0 12px;
          color: #111827;
        }
        .recs-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
        }
        .rec-card {
          text-decoration: none;
          color: inherit;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          overflow: hidden;
          transition: box-shadow 0.2s;
        }
        .rec-card:hover {
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
        }
        .rec-img {
          width: 100%;
          aspect-ratio: 1;
          object-fit: cover;
          display: block;
        }
        .rec-info {
          padding: 8px 10px;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .rec-brand {
          font-size: 10px;
          font-weight: 600;
          color: #6b7280;
          text-transform: uppercase;
        }
        .rec-title {
          font-size: 12px;
          color: #111827;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        /* Consign section */
        .consign-section {
          background: linear-gradient(135deg, #fef3c7, #fde68a);
          border-radius: 16px;
          padding: 24px;
          margin-bottom: 20px;
        }
        .consign-section h2 {
          font-size: 16px;
          font-weight: 600;
          margin: 0 0 8px;
          color: #92400e;
        }
        .consign-text {
          font-size: 14px;
          color: #78350f;
          margin: 0 0 12px;
          line-height: 1.5;
        }

        @media (max-width: 640px) {
          .stats-row {
            grid-template-columns: repeat(2, 1fr);
            gap: 8px;
          }
          .recs-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
    </>
  );
}
