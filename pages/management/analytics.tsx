// FILE: /pages/management/analytics.tsx
import Head from "next/head";
import Link from "next/link";
import type { GetServerSideProps } from "next";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { adminDb } from "../../utils/firebaseAdmin";
import { useRequireAdmin } from "../../hooks/useRequireAdmin";

type AnalyticsStats = {
  totalSellers: number;
  pendingSellers: number;
  activeSellers: number;
  totalListings: number;
  liveListings: number;
  pendingListings: number;
  soldListings: number;
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  gmv30d: number;
  gmvAllTime: number;
  totalAgreements: number;
  pendingAgreements: number;
  avgOrderValue: number;
  topBrands: { name: string; count: number }[];
  topCategories: { name: string; count: number }[];
  recentOrders: { id: string; total: number; status: string; date: string }[];
};

type Props = { stats: AnalyticsStats };

export default function ManagementAnalytics({ stats }: Props) {
  const { loading } = useRequireAdmin();

  if (loading) {
    return (
      <>
        <Head><title>Analytics &amp; Reports — Admin</title></Head>
        <div className="dashboard-page">
          <Header />
          <main className="dashboard-main"><p>Checking admin access…</p></main>
          <Footer />
        </div>
      </>
    );
  }

  const fmtUsd = (n: number) =>
    `$${n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  return (
    <>
      <Head><title>Analytics &amp; Reports — Admin</title></Head>

      <div className="dashboard-page">
        <Header />

        <main className="dashboard-main">
          <div className="dashboard-header">
            <div>
              <h1>Analytics &amp; Reports</h1>
              <p>Live KPIs pulled from Firestore on every page load.</p>
            </div>
            <Link href="/management/dashboard">← Back to Management Dashboard</Link>
          </div>

          {/* Primary KPIs */}
          <section className="a-section">
            <h2 className="a-section-title">Key Metrics</h2>
            <div className="a-kpi-grid">
              <div className="a-kpi-card a-kpi-highlight">
                <p className="a-kpi-label">GMV (Last 30 days)</p>
                <p className="a-kpi-value">{fmtUsd(stats.gmv30d)}</p>
                <p className="a-kpi-note">All-time: {fmtUsd(stats.gmvAllTime)}</p>
              </div>
              <div className="a-kpi-card">
                <p className="a-kpi-label">Total Purchases</p>
                <p className="a-kpi-value">{stats.totalOrders.toLocaleString("en-US")}</p>
                <p className="a-kpi-note">{stats.completedOrders} completed · {stats.pendingOrders} in progress</p>
              </div>
              <div className="a-kpi-card">
                <p className="a-kpi-label">Avg Order Value</p>
                <p className="a-kpi-value">{fmtUsd(stats.avgOrderValue)}</p>
                <p className="a-kpi-note">Across all completed orders</p>
              </div>
              <div className="a-kpi-card">
                <p className="a-kpi-label">Dispute Rate</p>
                <p className="a-kpi-value">0.0%</p>
                <p className="a-kpi-note">Tracked once disputes are reported</p>
              </div>
            </div>
          </section>

          {/* Sellers & Listings */}
          <section className="a-section">
            <h2 className="a-section-title">Sellers &amp; Listings</h2>
            <div className="a-kpi-grid">
              <div className="a-kpi-card">
                <p className="a-kpi-label">Active Sellers</p>
                <p className="a-kpi-value">{stats.activeSellers.toLocaleString("en-US")}</p>
                <p className="a-kpi-note">{stats.pendingSellers} pending vetting · {stats.totalSellers} total</p>
              </div>
              <div className="a-kpi-card">
                <p className="a-kpi-label">Live Listings</p>
                <p className="a-kpi-value">{stats.liveListings.toLocaleString("en-US")}</p>
                <p className="a-kpi-note">{stats.pendingListings} pending review · {stats.totalListings} total</p>
              </div>
              <div className="a-kpi-card">
                <p className="a-kpi-label">Sold Items</p>
                <p className="a-kpi-value">{stats.soldListings.toLocaleString("en-US")}</p>
                <p className="a-kpi-note">Items marked as sold</p>
              </div>
              <div className="a-kpi-card">
                <p className="a-kpi-label">Agreements</p>
                <p className="a-kpi-value">{stats.totalAgreements.toLocaleString("en-US")}</p>
                <p className="a-kpi-note">{stats.pendingAgreements} awaiting confirmation</p>
              </div>
            </div>
          </section>

          {/* Two-column: Top Brands + Top Categories */}
          <div className="a-two-col">
            <section className="a-section">
              <h2 className="a-section-title">Top Brands by Listings</h2>
              {stats.topBrands.length === 0 ? (
                <p className="a-empty">No brand data yet.</p>
              ) : (
                <div className="a-rank-list">
                  {stats.topBrands.map((b, i) => (
                    <div key={b.name} className="a-rank-row">
                      <span className="a-rank-pos">{i + 1}</span>
                      <span className="a-rank-name">{b.name}</span>
                      <span className="a-rank-count">{b.count}</span>
                      <div className="a-rank-bar-bg">
                        <div
                          className="a-rank-bar"
                          style={{
                            width: `${Math.min(100, (b.count / (stats.topBrands[0]?.count || 1)) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="a-section">
              <h2 className="a-section-title">Top Categories</h2>
              {stats.topCategories.length === 0 ? (
                <p className="a-empty">No category data yet.</p>
              ) : (
                <div className="a-rank-list">
                  {stats.topCategories.map((c, i) => (
                    <div key={c.name} className="a-rank-row">
                      <span className="a-rank-pos">{i + 1}</span>
                      <span className="a-rank-name">{c.name}</span>
                      <span className="a-rank-count">{c.count}</span>
                      <div className="a-rank-bar-bg">
                        <div
                          className="a-rank-bar"
                          style={{
                            width: `${Math.min(100, (c.count / (stats.topCategories[0]?.count || 1)) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Recent Orders */}
          <section className="a-section">
            <h2 className="a-section-title">Recent Purchases</h2>
            {stats.recentOrders.length === 0 ? (
              <p className="a-empty">No purchases recorded yet.</p>
            ) : (
              <div className="a-table-wrap">
                <table className="a-table">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Total</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentOrders.map((o) => (
                      <tr key={o.id}>
                        <td className="a-mono">{o.id.slice(0, 12)}…</td>
                        <td>{fmtUsd(o.total)}</td>
                        <td>
                          <span className={`a-status-badge a-status-${o.status.toLowerCase().replace(/\s+/g, "-")}`}>
                            {o.status}
                          </span>
                        </td>
                        <td>{o.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Downloads */}
          <section className="a-section">
            <h2 className="a-section-title">Export Reports</h2>
            <p className="a-subtitle">CSV exports will be available once order and payout endpoints are connected.</p>
            <div className="a-btn-row">
              <button type="button" className="a-btn-export">Orders (Last 30 days)</button>
              <button type="button" className="a-btn-export">Sellers Performance</button>
              <button type="button" className="a-btn-export">Listings Conversion</button>
            </div>
          </section>
        </main>

        <Footer />
      </div>

      <style jsx>{`
        .a-section {
          margin-bottom: 28px;
        }
        .a-section-title {
          margin: 0 0 14px;
          font-size: 17px;
          font-weight: 600;
          color: #111827;
        }
        .a-kpi-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }
        .a-kpi-card {
          padding: 18px 20px;
          border-radius: 16px;
          border: 1px solid #e5e7eb;
          background: #ffffff;
          box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04);
        }
        .a-kpi-highlight {
          border-color: #111827;
          background: #111827;
        }
        .a-kpi-highlight .a-kpi-label {
          color: #9ca3af;
        }
        .a-kpi-highlight .a-kpi-value {
          color: #ffffff;
        }
        .a-kpi-highlight .a-kpi-note {
          color: #6b7280;
        }
        .a-kpi-label {
          margin: 0;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: #6b7280;
          font-weight: 600;
        }
        .a-kpi-value {
          margin: 6px 0 2px;
          font-size: 28px;
          font-weight: 700;
          color: #111827;
          letter-spacing: -0.02em;
        }
        .a-kpi-note {
          margin: 0;
          font-size: 12px;
          color: #9ca3af;
          line-height: 1.4;
        }
        .a-two-col {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }
        .a-rank-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .a-rank-row {
          display: grid;
          grid-template-columns: 24px 1fr 44px 100px;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          border-radius: 10px;
          border: 1px solid #f3f4f6;
          background: #ffffff;
          font-size: 13px;
        }
        .a-rank-pos {
          font-weight: 700;
          color: #9ca3af;
          font-size: 12px;
          text-align: center;
        }
        .a-rank-name {
          font-weight: 500;
          color: #111827;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .a-rank-count {
          font-weight: 600;
          color: #374151;
          text-align: right;
          font-size: 12px;
        }
        .a-rank-bar-bg {
          height: 6px;
          border-radius: 3px;
          background: #f3f4f6;
          overflow: hidden;
        }
        .a-rank-bar {
          height: 100%;
          border-radius: 3px;
          background: #111827;
          transition: width 0.3s ease;
        }
        .a-empty {
          font-size: 13px;
          color: #6b7280;
        }
        .a-table-wrap {
          overflow-x: auto;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
          background: #ffffff;
        }
        .a-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }
        .a-table thead {
          background: #f9fafb;
        }
        .a-table th {
          padding: 10px 14px;
          text-align: left;
          font-weight: 600;
          font-size: 12px;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .a-table td {
          padding: 10px 14px;
          color: #111827;
          border-top: 1px solid #f3f4f6;
        }
        .a-mono {
          font-family: monospace;
          font-size: 12px;
          color: #6b7280;
        }
        .a-status-badge {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 600;
          text-transform: capitalize;
        }
        .a-status-completed, .a-status-delivered {
          background: #def7ec;
          color: #047857;
        }
        .a-status-pending, .a-status-processing, .a-status-paid {
          background: #fef3c7;
          color: #92400e;
        }
        .a-status-cancelled, .a-status-refunded {
          background: #fef2f2;
          color: #991b1b;
        }
        .a-subtitle {
          font-size: 13px;
          color: #6b7280;
          margin: 0 0 14px;
        }
        .a-btn-row {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
        }
        .a-btn-export {
          display: inline-flex;
          align-items: center;
          border-radius: 999px;
          border: 1px solid #e5e7eb;
          background: #ffffff;
          padding: 10px 20px;
          font-size: 13px;
          font-weight: 500;
          color: #374151;
          cursor: pointer;
          transition: all 0.15s;
        }
        .a-btn-export:hover {
          border-color: #111827;
          background: #111827;
          color: #ffffff;
        }
        @media (max-width: 900px) {
          .a-kpi-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .a-two-col {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 480px) {
          .a-kpi-grid {
            grid-template-columns: 1fr;
          }
          .a-rank-row {
            grid-template-columns: 20px 1fr 36px 60px;
          }
        }
      `}</style>
    </>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async () => {
  const empty: AnalyticsStats = {
    totalSellers: 0, pendingSellers: 0, activeSellers: 0,
    totalListings: 0, liveListings: 0, pendingListings: 0, soldListings: 0,
    totalOrders: 0, pendingOrders: 0, completedOrders: 0,
    gmv30d: 0, gmvAllTime: 0,
    totalAgreements: 0, pendingAgreements: 0,
    avgOrderValue: 0,
    topBrands: [], topCategories: [],
    recentOrders: [],
  };

  if (!adminDb) return { props: { stats: empty } };

  try {
    const [sellersSnap, listingsSnap, ordersSnap, agreementsSnap] =
      await Promise.all([
        adminDb.collection("sellers").get(),
        adminDb.collection("listings").get(),
        adminDb.collection("orders").get(),
        adminDb.collection("consignment_agreements").get(),
      ]);

    // --- Sellers ---
    let pendingSellers = 0;
    let activeSellers = 0;
    sellersSnap.docs.forEach((d) => {
      const s = (d.data() as any).status || "";
      if (s === "Pending") pendingSellers++;
      else activeSellers++;
    });

    // --- Listings ---
    let liveListings = 0;
    let pendingListings = 0;
    let soldListings = 0;
    const brandCounts: Record<string, number> = {};
    const catCounts: Record<string, number> = {};

    listingsSnap.docs.forEach((d) => {
      const data = d.data() as any;
      const status = String(data.status || "").toLowerCase();

      if (["live", "active", "approved"].includes(status)) liveListings++;
      else if (["pending", "pending review"].includes(status)) pendingListings++;

      const isSold = data.isSold === true || data.sold === true || status.includes("sold");
      if (isSold) soldListings++;

      const brand = (data.brand || data.designer || "").trim();
      if (brand) brandCounts[brand] = (brandCounts[brand] || 0) + 1;

      const cat = (data.category || "").trim();
      if (cat) catCounts[cat] = (catCounts[cat] || 0) + 1;
    });

    const topBrands = Object.entries(brandCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, count]) => ({ name, count }));

    const topCategories = Object.entries(catCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, count]) => ({ name, count }));

    // --- Orders ---
    let pendingOrders = 0;
    let completedOrders = 0;
    let gmvAllTime = 0;
    let gmv30d = 0;
    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

    type OrderRow = { id: string; total: number; status: string; date: string };
    const recentOrders: OrderRow[] = [];

    ordersSnap.docs.forEach((d) => {
      const data = d.data() as any;
      const status = String(data.status || "");
      // amountTotal is stored in cents; fall back to other field names for legacy orders
      const rawAmt = Number(data.amountTotal || data.total || data.amount || data.price || 0);
      const total = data.amountTotal ? rawAmt / 100 : rawAmt;

      if (["Pending", "Processing", "Paid"].includes(status)) pendingOrders++;
      if (["Completed", "Delivered"].includes(status)) completedOrders++;

      gmvAllTime += total;

      let ts = 0;
      if (data.createdAt?.toMillis) ts = data.createdAt.toMillis();
      else if (data.createdAt?.seconds) ts = data.createdAt.seconds * 1000;
      else if (typeof data.createdAt === "number") ts = data.createdAt;

      if (ts >= thirtyDaysAgo) gmv30d += total;

      const dateStr = ts
        ? new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
        : "—";

      recentOrders.push({ id: d.id, total, status, date: dateStr });
    });

    recentOrders.sort((a, b) => {
      const da = new Date(a.date).getTime() || 0;
      const db = new Date(b.date).getTime() || 0;
      return db - da;
    });

    const avgOrderValue = completedOrders > 0
      ? Math.round(gmvAllTime / completedOrders)
      : 0;

    // --- Agreements ---
    let pendingAgreements = 0;
    agreementsSnap.docs.forEach((d) => {
      if ((d.data() as any).status === "pending_email") pendingAgreements++;
    });

    const stats: AnalyticsStats = {
      totalSellers: sellersSnap.size,
      pendingSellers,
      activeSellers,
      totalListings: listingsSnap.size,
      liveListings,
      pendingListings,
      soldListings,
      totalOrders: ordersSnap.size,
      pendingOrders,
      completedOrders,
      gmv30d,
      gmvAllTime,
      totalAgreements: agreementsSnap.size,
      pendingAgreements,
      avgOrderValue,
      topBrands,
      topCategories,
      recentOrders: recentOrders.slice(0, 10),
    };

    return { props: { stats } };
  } catch (err) {
    console.error("Analytics SSR error:", err);
    return { props: { stats: empty } };
  }
};
