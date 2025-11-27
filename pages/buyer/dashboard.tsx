import { useEffect, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import Header from "../../components/Header";
import Footer from "../../components/Footer";

import {
  initializeApp,
  getApps,
  getApp,
} from "firebase/app";
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
    const load = async (collectionName: string) => {
      const q = query(collection(db, collectionName), where("userId", "==", uid));
      const snap = await getDocs(q);
      return snap.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as any),
      })) as ItemRow[];
    };

    setSavedItems(await load("buyerSavedItems"));
    setViewedItems(await load("buyerRecentlyViewed"));
    setActiveOffers(await load("buyerOffers"));
  };

  const logout = async () => {
    await signOut(auth);
    router.push("/");
  };

  return (
    <>
      <Head>
        <title>Buyer Dashboard</title>
      </Head>
      <Header />

      <main className="wrap py-10">
        <div className="flex justify-between mb-10">
          <div>
            <h1 className="text-3xl font-semibold">Your Dashboard</h1>
            {user && (
              <p className="text-sm text-gray-500">
                Signed in as {user.email}
              </p>
            )}
          </div>

          <button onClick={logout} className="underline text-sm">
            Sign out
          </button>
        </div>

        {loading && <p>Loading…</p>}

        {!loading && (
          <>
            <section className="mb-10">
              <h2 className="text-xl font-medium mb-3">Saved items</h2>
              {savedItems.length === 0 ? (
                <p className="text-sm text-gray-500">None saved yet.</p>
              ) : (
                <ul className="space-y-1 text-sm">
                  {savedItems.map((i) => (
                    <li key={i.id}>{i.title}</li>
                  ))}
                </ul>
              )}
            </section>

            <section className="mb-10">
              <h2 className="text-xl font-medium mb-3">Recently viewed</h2>
              {viewedItems.length === 0 ? (
                <p className="text-sm text-gray-500">None viewed yet.</p>
              ) : (
                <ul className="space-y-1 text-sm">
                  {viewedItems.map((i) => (
                    <li key={i.id}>{i.title}</li>
                  ))}
                </ul>
              )}
            </section>

            <section className="mb-10">
              <h2 className="text-xl font-medium mb-3">Active offers</h2>
              {activeOffers.length === 0 ? (
                <p className="text-sm text-gray-500">No active offers.</p>
              ) : (
                <ul className="space-y-1 text-sm">
                  {activeOffers.map((i) => (
                    <li key={i.id}>{i.title}</li>
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
