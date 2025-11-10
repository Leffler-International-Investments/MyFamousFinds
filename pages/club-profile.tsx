// FILE: /pages/club-profile.tsx
// --- Provided "as-is" from your original VIP Club files ---
import { useState, useEffect } from "react";
import { auth, db } from "../utils/firebaseClient";
import { onAuthStateChanged, User, signOut } from "firebase/auth";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import Header from "../components/Header";
import Footer from "../components/Footer"; // Assuming you have a Footer component
import { useRouter } from "next/router";
import Head from "next/head";

type UserProfile = {
  name: string;
  email: string;
  vipTier: string;
  points: number;
};

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
        // User is logged in, listen for profile changes
        const userRef = doc(db, "users", user.uid);
        const unsubProfile = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            setProfile(docSnap.data() as UserProfile);
          } else {
            console.error("No user profile found in Firestore!");
            // This can happen if auth succeeded but the API call in club-register failed
            // Or if a seller/admin logs in via this flow by mistake
          }
          setLoading(false);
        });
        return () => unsubProfile(); // Cleanup profile listener
      } else {
        // User is not logged in, redirect to login
        router.push("/club-login");
      }
    });
    return () => unsubscribe(); // Cleanup auth listener
  }, [router]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/");
  };

  if (loading) {
    return <div className="dark-theme-page" style={{padding: "40px"}}>Loading VIP profile...</div>;
  }

  if (!profile) {
    return (
        <div className="dark-theme-page" style={{padding: "40px"}}>
            <h1>Error</h1>
            <p>Could not load your VIP profile.</p>
            <p>This may be because you are logged in as a Seller or Admin. Please sign out and sign in with a VIP Club account.</p>
            <button
              onClick={handleLogout}
              className="mt-8 rounded-md bg-gray-700 px-4 py-2 text-sm text-white hover:bg-gray-600"
            >
              Sign Out
            </button>
        </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-black text-gray-100">
      <Head>
        <title>My Profile — Famous Finds</title>
      </Head>
      <Header />

      <main className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="text-3xl font-bold">Welcome, {profile.name}!</h1>
        <p className="text-gray-400">
          You are a{" "}
          <span style={{ color: "#facc15" }}>{profile.vipTier}</span> member.
        </UPPERCASE>

        <div
          className="mt-8 bg-neutral-900 p-6 rounded-lg"
          style={{ border: "1px solid #333" }}
        >
          <h2 className="text-xl font-semibold">Your VIP Status</h2>
          <div className="mt-4 text-center">
            <div className="text-5xl font-bold">{profile.points}</div>
            <div className="text-gray-400">Loyalty Points</div>
          </div>
          <p className="mt-4 text-center text-sm text-gray-300">
            You are {1000 - profile.points} points away from the Gold tier!
          </p>
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-semibold">Member Perks</h2>
          <ul className="mt-4 list-disc list-inside space-y-2 text-gray-300">
            <li>Exclusive discounts (Applied automatically at checkout)</li>
            <li>Early access to new arrivals</li>
            <li>Saved cart & quick checkout</li>
          </ul>
        </div>

        <button
          onClick={handleLogout}
          className="mt-8 rounded-md bg-gray-700 px-4 py-2 text-sm text-white hover:bg-gray-600"
        >
          Sign Out
        </button>
      </main>

      {/* <Footer /> */}
    </div>
  );
}
