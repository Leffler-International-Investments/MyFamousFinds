// FILE: /pages/admin/dashboard.tsx
import Head from "next/head";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { adminDb } from "../../utils/firebaseAdmin";
import type { GetServerSideProps } from "next";

type DashboardProps = {
  stats: {
    listings: number;
    sellers: number;
    orders: number;
    activeListings: number;
  };
};

export default function AdminDashboard({ stats }: DashboardProps) {
  return (
    <div className="min-h-screen bg-black text-gray-100">
      <Head>
        <title>Admin dashboard – Famous Finds</title>
      </Head>

      <Header />

      <main className="mx-auto max-w-6xl px-4 pb-16 pt-6 text-sm">
        <h1 className="text-2xl font-semibold text-white">Admin dashboard</h1>
        <p className="mt-1 text-xs text-gray-400">
          High-level snapshot of marketplace activity. This is based on live
          Firestore data.
        </p>

        <section className="mt-6 grid gap-4 md:grid-cols-4">
          <div className="card">
            <p className="label">Total listings</p>
            <p className="value">{stats.listings.toLocaleString("en-AU")}</p>
          </div>
          <div className="card">
            <p className="label">Active listings</p>
            <p className="value">
              {stats.activeListings.toLocaleString("en-AU")}
            </p>
          </div>
          <div className="card">
            <p className="label">Sellers</p>
            <p className="value">{stats.sellers.toLocaleString("en-AU")}</p>
          </div>
          <div className="card">
            <p className="label">Orders</p>
            <p className="value">{stats.orders.toLocaleString("en-AU")}</p>
          </div>
        </section>
      </main>

      <Footer />

      <style jsx>{`
        .card {
          border-radius: 16px;
          border: 1px solid #27272a;
          background: #020617;
          padding: 14px 16px;
        }
        .label {
          font-size: 11px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #9ca3af;
        }
        .value {
          margin-top: 6px;
          font-size: 22px;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps<DashboardProps> = async () => {
  try {
    const [listingsSnap, activeSnap, sellersSnap, ordersSnap] =
      await Promise.all([
        adminDb.collection("listings").get(),
        adminDb
          .collection("listings")
          .where("status", "==", "Active")
          .get(),
        adminDb.collection("sellers").get(),
        adminDb.collection("orders").get(),
      ]);

    return {
      props: {
        stats: {
          listings: listingsSnap.size,
          activeListings: activeSnap.size,
          sellers: sellersSnap.size,
          orders: ordersSnap.size,
        },
      },
    };
  } catch (err) {
    console.error("admin_dashboard_error", err);
    return {
      props: {
        stats: {
          listings: 0,
          activeListings: 0,
          sellers: 0,
          orders: 0,
        },
      },
    };
  }
};
