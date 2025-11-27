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
  Timestamp,
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

type SnapshotCounts = {
  saved: number;
  viewed: number;
  offers: number;
};

type ItemRow = {
  id: string;
  title: string;
  brand?: string;
  createdAt?: Timestamp | null;
};

export default function BuyerDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [counts, setCounts] = useState<SnapshotCounts>({
    saved: 0,
    viewed: 0,
    offers: 0,
  });
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
    // Saved items
    const savedQ = query(
      collection(db, "buyerSavedItems"),
      where("userId", "==", uid)
    );
    const savedSnap = await getDocs(savedQ);
    const saved: ItemRow[] = savedSnap.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as any),
    }));

    // Recently viewed
    const viewedQ = query(
      collection(db, "buyerRecentlyViewed"),
      where("userId", "==", uid)
    );
    const viewedSnap = await getDocs(viewedQ);
    const viewed: ItemRow[] = viewedSnap.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as any),
    }));

    // Active offers
    const offersQ = query(
      collection(db, "buyerOffers"),
      where("userId", "==", uid),
      where("status", "in", ["pending", "counter", "accepted"])
    );
    const offersSnap = await getDocs(offersQ);
    const offers: ItemRow[] = offersSnap.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as any),
    }));

    setCounts({
      saved: saved.length,
      viewed: viewed.length,
      offers: offers.length,
    });
    setSavedItems(saved);
    setViewedItems(viewed);
    setActiveOffers(offers);
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
      <main className="max-w-5xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-semibold mb-1">
              Your Famous Finds Snapshot
            </h1>
            {user && (
              <p className="text-sm text-gray-500">
                Signed in as {user.email}
              </p>
            )}
          </div>
          <button
            onClick={handleSignOut}
            className="text-sm underline text-gray-600"
          >
            Sign out
          </button>
        </div>

        {/* Snapshot card */}
        <section className="bg-white rounded-3xl shadow-sm border px-6 py-6 mb-10 max-w-md">
          <div className="text-xs font-semibold tracking-[0.16em] text-gray-400 mb-4">
            GUEST VIEW
          </div>
          <div className="flex justify-between text-sm py-1">
            <span>Saved Items</span>
            <span>{counts.saved}</span>
          </div>
          <div className="flex justify-between text-sm py-1">
            <span>Recently Viewed</span>
            <span>{counts.viewed}</span>
          </div>
          <div className="flex justify-between text-sm py-1">
            <span>Active Offers</span>
            <span>{counts.offers}</span>
          </div>
        </section>

        {loading && <p className="text-sm text-gray-500">Loading…</p>}

        {!loading && (
          <>
            {/* Saved items */}
            <section className="mb-8">
              <h2 className="text-xl font-medium mb-3">Saved items</h2>
              {savedItems.length === 0 ? (
                <p className="text-sm text-gray-500">
                  You haven&apos;t saved any pieces yet.
                </p>
              ) : (
                <ul className="text-sm space-y-2">
                  {savedItems.map((item) => (
                    <li key={item.id}>
                      <span className="font-medium">{item.title}</span>
                      {item.brand && <span> — {item.brand}</span>}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Recently viewed */}
            <section className="mb-8">
              <h2 className="text-xl font-medium mb-3">Recently viewed</h2>
              {viewedItems.length === 0 ? (
                <p className="text-sm text-gray-500">
                  No recently viewed items yet.
                </p>
              ) : (
                <ul className="text-sm space-y-2">
                  {viewedItems.map((item) => (
                    <li key={item.id}>
                      <span className="font-medium">{item.title}</span>
                      {item.brand && <span> — {item.brand}</span>}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Active offers */}
            <section className="mb-8">
              <h2 className="text-xl font-medium mb-3">Active offers</h2>
              {activeOffers.length === 0 ? (
                <p className="text-sm text-gray-500">
                  You don&apos;t have any active offers at the moment.
                </p>
              ) : (
                <ul className="text-sm space-y-2">
                  {activeOffers.map((item) => (
                    <li key={item.id}>
                      <span className="font-medium">{item.title}</span>
                      {item.brand && <span> — {item.brand}</span>}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </main>
      <Footer />
    </>
  );
}
