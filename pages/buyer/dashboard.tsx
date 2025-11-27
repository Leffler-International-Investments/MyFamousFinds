// FILE: pages/buyer/dashboard.tsx

import { useEffect, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import Header from "../../components/Header";
import Footer from "../../components/Footer";

import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
  User,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY as string,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN as string,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID as string,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET as string,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID as string,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID as string,
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

type ItemRow = {
  id: string;
  title: string;
  brand?: string;
};

export default function BuyerDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  const [savedItems, setSavedItems] = useState<ItemRow[]>([]);
  const [viewedItems, setViewedItems] = useState<ItemRow[]>([]);
  const [activeOffers, setActiveOffers] = useState<ItemRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        router.replace("/buyer/signin");
        return;
      }
      setUser(u);
      await loadData(u.uid);
      setLoading(false);
    });
    return () => unsub();
  }, [router]);

  const loadData = async (uid: string) => {
    const loadCollection = async (name: string) => {
      const q = query(collection(db, name), where("userId", "==", uid));
      const snap = await getDocs(q);
      return snap.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as any),
      })) as ItemRow[];
    };

    setSavedItems(await loadCollection("buyerSavedItems"));
    setViewedItems(await loadCollection("buyerRecentlyViewed"));
    setActiveOffers(await loadCollection("buyerOffers"));
  };

  const handleSignOut = async () => {
    await signOut(auth);
    router.push("/");
  };

  return (
    <>
      <Head>
        <title>Buyer Dashboard | Famous Finds</title>
      </Head>

      <Header />

      <main className="buyer-dashboard-main">
        <div className="wrap buyer-dashboard-wrap">
          {/* Top header */}
          <div className="buyer-dashboard-header">
            <div>
              <h1 className="buyer-dashboard-title">
                Your Famous Finds Snapshot
              </h1>
              {user && (
                <p className="buyer-dashboard-meta">
                  Signed in as {user.email}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={handleSignOut}
              className="buyer-dashboard-signout"
            >
              Sign out
            </button>
          </div>

          <div className="buyer-dashboard-body">
            {/* Snapshot card on the right (similar look to homepage) */}
            <section className="buyer-snapshot-card">
              <div className="buyer-snapshot-label">GUEST VIEW</div>
              <div className="buyer-snapshot-row">
                <span>Saved Items</span>
                <span>{savedItems.length}</span>
              </div>
              <div className="buyer-snapshot-row">
                <span>Recently Viewed</span>
                <span>{viewedItems.length}</span>
              </div>
              <div className="buyer-snapshot-row">
                <span>Active Offers</span>
                <span>{activeOffers.length}</span>
              </div>
            </section>

            {/* Lists on the left */}
            <section className="buyer-lists">
              {loading && <p className="buyer-loading">Loading…</p>}

              {!loading && (
                <>
                  <div className="buyer-list-block">
                    <h2 className="buyer-list-title">Saved items</h2>
                    {savedItems.length === 0 ? (
                      <p className="buyer-list-empty">
                        You haven&apos;t saved any pieces yet.
                      </p>
                    ) : (
                      <ul className="buyer-list">
                        {savedItems.map((item) => (
                          <li key={item.id}>
                            <span className="buyer-item-title">
                              {item.title}
                            </span>
                            {item.brand && (
                              <span className="buyer-item-brand">
                                {" "}
                                — {item.brand}
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="buyer-list-block">
                    <h2 className="buyer-list-title">Recently viewed</h2>
                    {viewedItems.length === 0 ? (
                      <p className="buyer-list-empty">
                        No recently viewed pieces yet.
                      </p>
                    ) : (
                      <ul className="buyer-list">
                        {viewedItems.map((item) => (
                          <li key={item.id}>
                            <span className="buyer-item-title">
                              {item.title}
                            </span>
                            {item.brand && (
                              <span className="buyer-item-brand">
                                {" "}
                                — {item.brand}
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="buyer-list-block">
                    <h2 className="buyer-list-title">Active offers</h2>
                    {activeOffers.length === 0 ? (
                      <p className="buyer-list-empty">
                        You don&apos;t have any active offers yet.
                      </p>
                    ) : (
                      <ul className="buyer-list">
                        {activeOffers.map((item) => (
                          <li key={item.id}>
                            <span className="buyer-item-title">
                              {item.title}
                            </span>
                            {item.brand && (
                              <span className="buyer-item-brand">
                                {" "}
                                — {item.brand}
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </>
              )}
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
