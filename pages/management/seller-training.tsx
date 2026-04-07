// FILE: /pages/management/seller-training.tsx
// Management tool: send training invites, view quiz results, certify/revoke sellers.

import Head from "next/head";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useRequireAdmin } from "../../hooks/useRequireAdmin";
import { useEffect, useState } from "react";

type SellerRow = {
  id: string;
  name: string;
  email: string;
  status: string;
};

type TrainingRecord = {
  status?: string;
  certified?: boolean;
  score?: number;
  total?: number;
  passed?: boolean;
  inviteSentAt?: string;
  submittedAt?: string;
  certifiedAt?: string;
};

export default function SellerTrainingPage() {
  const { loading: authLoading } = useRequireAdmin();
  const [sellers, setSellers] = useState<SellerRow[]>([]);
  const [training, setTraining] = useState<Record<string, TrainingRecord>>({});
  const [loadingSellers, setLoadingSellers] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/management/sellers-list", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (data?.sellers) {
          setSellers(data.sellers);
          // Fetch training status for each seller
          Promise.all(
            data.sellers.map((s: SellerRow) =>
              fetch(`/api/management/seller-training?sellerId=${encodeURIComponent(s.id)}`, { credentials: "include" })
                .then((r) => r.json())
                .then((t) => ({ id: s.id, data: t }))
                .catch(() => ({ id: s.id, data: {} }))
            )
          ).then((results) => {
            const map: Record<string, TrainingRecord> = {};
            results.forEach(({ id, data }) => { map[id] = data; });
            setTraining(map);
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoadingSellers(false));
  }, []);

  const doAction = async (sellerId: string, action: string, extra: Record<string, string> = {}) => {
    setActionLoading(`${sellerId}-${action}`);
    setMessage(null);
    try {
      const seller = sellers.find((s) => s.id === sellerId);
      const res = await fetch("/api/management/seller-training", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          sellerId,
          sellerEmail: seller?.email || "",
          sellerName: seller?.name || "",
          ...extra,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed");
      // Refresh training record
      const updated = await fetch(`/api/management/seller-training?sellerId=${encodeURIComponent(sellerId)}`, { credentials: "include" }).then((r) => r.json());
      setTraining((prev) => ({ ...prev, [sellerId]: updated }));
      setMessage(action === "send" ? "Training invite sent!" : action === "certify" ? "Seller certified!" : "Certification revoked.");
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = sellers.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase())
  );

  const statusBadge = (t: TrainingRecord | undefined) => {
    if (!t || t.status === "not_sent" || !t.status) return <span className="badge badge-gray">Not invited</span>;
    if (t.certified) return <span className="badge badge-gold">✓ Certified FF Seller</span>;
    if (t.status === "failed") return <span className="badge badge-red">Failed ({t.score}/{t.total})</span>;
    if (t.status === "invited") return <span className="badge badge-blue">Invited</span>;
    if (t.status === "revoked") return <span className="badge badge-gray">Revoked</span>;
    return <span className="badge badge-gray">{t.status}</span>;
  };

  if (authLoading) return <div className="dashboard-page" />;

  return (
    <>
      <Head><title>Seller Training & Certification — Management</title></Head>
      <div className="dashboard-page">
        <Header />
        <main className="dashboard-main">
          <div className="dashboard-header">
            <div>
              <h1>Seller Training & Certification</h1>
              <p>Send the training module and quiz to sellers. Certified sellers display the <strong>Certified FF Seller</strong> badge.</p>
            </div>
            <Link href="/management/dashboard" className="btn-primary-dark">← Dashboard</Link>
          </div>

          {message && (
            <div className={`banner ${message.startsWith("Error") ? "banner-err" : "banner-ok"}`}>
              {message}
            </div>
          )}

          <div className="search-row">
            <input
              className="search-input"
              placeholder="Search by name or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <span className="search-count">{filtered.length} sellers</span>
          </div>

          {loadingSellers ? (
            <p style={{ color: "#6b7280", padding: "24px 0" }}>Loading sellers…</p>
          ) : (
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Seller</th>
                    <th>Email</th>
                    <th>Status</th>
                    <th>Score</th>
                    <th>Invited</th>
                    <th>Submitted</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={7} className="table-empty">No sellers found</td></tr>
                  ) : filtered.map((seller) => {
                    const t = training[seller.id];
                    const busy = actionLoading?.startsWith(seller.id);
                    return (
                      <tr key={seller.id}>
                        <td style={{ fontWeight: 600 }}>{seller.name}</td>
                        <td style={{ color: "#6b7280", fontSize: 13 }}>{seller.email}</td>
                        <td>{statusBadge(t)}</td>
                        <td style={{ fontSize: 13 }}>
                          {t?.score != null ? `${t.score} / ${t.total}` : "—"}
                        </td>
                        <td style={{ fontSize: 12, color: "#6b7280" }}>
                          {t?.inviteSentAt ? new Date(t.inviteSentAt).toLocaleDateString("en-US") : "—"}
                        </td>
                        <td style={{ fontSize: 12, color: "#6b7280" }}>
                          {t?.submittedAt ? new Date(t.submittedAt).toLocaleDateString("en-US") : "—"}
                        </td>
                        <td>
                          <div className="action-row">
                            <button
                              className="btn-sm btn-dark"
                              disabled={!!busy}
                              onClick={() => doAction(seller.id, "send")}
                            >
                              {t?.inviteSentAt ? "Re-send" : "Send Training"}
                            </button>
                            {t?.passed && !t?.certified && (
                              <button
                                className="btn-sm btn-gold"
                                disabled={!!busy}
                                onClick={() => doAction(seller.id, "certify")}
                              >
                                Certify
                              </button>
                            )}
                            {t?.certified && (
                              <button
                                className="btn-sm btn-red"
                                disabled={!!busy}
                                onClick={() => {
                                  if (window.confirm("Revoke this seller's certification?")) {
                                    doAction(seller.id, "revoke");
                                  }
                                }}
                              >
                                Revoke
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </main>
        <Footer />
      </div>

      <style jsx>{`
        .banner { padding: 12px 16px; border-radius: 8px; font-size: 14px; font-weight: 500; margin-bottom: 20px; }
        .banner-ok { background: #f0fdf4; border: 1px solid #bbf7d0; color: #166534; }
        .banner-err { background: #fef2f2; border: 1px solid #fecaca; color: #991b1b; }
        .search-row { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
        .search-input { flex: 1; padding: 9px 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; max-width: 360px; }
        .search-count { font-size: 13px; color: #6b7280; }
        .table-wrapper { overflow-x: auto; }
        .data-table { width: 100%; border-collapse: collapse; font-size: 14px; }
        .data-table th, .data-table td { padding: 10px 12px; border-bottom: 1px solid #e5e7eb; text-align: left; }
        .data-table thead th { font-size: 12px; text-transform: uppercase; letter-spacing: 0.04em; color: #6b7280; background: #f9fafb; }
        .table-empty { text-align: center; padding: 24px; color: #6b7280; }
        .badge { display: inline-block; padding: 3px 10px; border-radius: 999px; font-size: 12px; font-weight: 600; }
        .badge-gray { background: #f3f4f6; color: #6b7280; }
        .badge-blue { background: #eff6ff; color: #1d4ed8; }
        .badge-gold { background: #fffbeb; color: #b45309; border: 1px solid #fde68a; }
        .badge-red { background: #fef2f2; color: #dc2626; }
        .action-row { display: flex; gap: 6px; flex-wrap: wrap; }
        .btn-sm { padding: 5px 12px; border-radius: 999px; border: none; font-size: 12px; font-weight: 600; cursor: pointer; white-space: nowrap; }
        .btn-dark { background: #111827; color: #fff; }
        .btn-dark:hover { opacity: 0.85; }
        .btn-gold { background: #b8860b; color: #fff; }
        .btn-gold:hover { opacity: 0.85; }
        .btn-red { background: #dc2626; color: #fff; }
        .btn-red:hover { opacity: 0.85; }
        .btn-sm:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>
    </>
  );
}
