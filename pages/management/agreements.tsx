// FILE: /pages/management/agreements.tsx
// Management page to view and manage all seller consignment agreements

import Head from "next/head";
import Link from "next/link";
import { useState, useEffect } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useRequireAdmin } from "../../hooks/useRequireAdmin";

type Agreement = {
  id: string;
  sellerId: string;
  sellerEmail: string;
  fullName: string;
  businessName: string;
  method: string;
  status: string;
  signedAt: string | null;
  createdAt: string;
};

export default function ManagementAgreements() {
  const { loading: authLoading } = useRequireAdmin();
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    fetchAgreements();
  }, [authLoading]);

  async function fetchAgreements() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/management/agreements");
      const json = await res.json();
      if (json.ok) {
        setAgreements(json.agreements);
      } else {
        setError(json.message || "Failed to load agreements.");
      }
    } catch {
      setError("Network error loading agreements.");
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(
    agreementId: string,
    action: "confirm" | "revoke"
  ) {
    const label = action === "confirm" ? "confirm" : "revoke";
    if (!window.confirm(`Are you sure you want to ${label} this agreement?`))
      return;

    setActionLoading(agreementId);
    try {
      const res = await fetch("/api/management/agreement-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agreementId, action }),
      });
      const json = await res.json();
      if (json.ok) {
        await fetchAgreements();
      } else {
        alert(json.message || `Failed to ${label} agreement.`);
      }
    } catch {
      alert(`Network error while trying to ${label} agreement.`);
    } finally {
      setActionLoading(null);
    }
  }

  const filtered = agreements.filter((a) => {
    const matchesSearch =
      !search ||
      a.sellerEmail.toLowerCase().includes(search.toLowerCase()) ||
      a.fullName.toLowerCase().includes(search.toLowerCase()) ||
      a.businessName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      filterStatus === "all" || a.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const statusCounts = {
    all: agreements.length,
    signed: agreements.filter((a) => a.status === "signed").length,
    pending_email: agreements.filter((a) => a.status === "pending_email")
      .length,
    revoked: agreements.filter((a) => a.status === "revoked").length,
  };

  if (authLoading) return null;

  return (
    <div className="dashboard-page">
      <Head>
        <title>Consignment Agreements - Management</title>
      </Head>
      <Header />
      <main className="dashboard-main">
        <div className="dashboard-header">
          <div>
            <h1>Consignment Agreements</h1>
            <p>
              View and manage all seller consignment agreements. Confirm emailed
              agreements or revoke access.
            </p>
          </div>
          <Link href="/management/dashboard">Back to Dashboard</Link>
        </div>

        {/* Summary cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: "16px",
            marginBottom: "24px",
          }}
        >
          {[
            {
              label: "Total",
              count: statusCounts.all,
              color: "#111827",
              bg: "#f3f4f6",
            },
            {
              label: "Signed",
              count: statusCounts.signed,
              color: "#059669",
              bg: "#ecfdf5",
            },
            {
              label: "Awaiting Email",
              count: statusCounts.pending_email,
              color: "#d97706",
              bg: "#fffbeb",
            },
            {
              label: "Revoked",
              count: statusCounts.revoked,
              color: "#dc2626",
              bg: "#fef2f2",
            },
          ].map((card) => (
            <div
              key={card.label}
              style={{
                background: card.bg,
                borderRadius: "14px",
                padding: "16px",
                textAlign: "center",
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: "28px",
                  fontWeight: 700,
                  color: card.color,
                }}
              >
                {card.count}
              </p>
              <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#6b7280" }}>
                {card.label}
              </p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div
          style={{
            display: "flex",
            gap: "12px",
            marginBottom: "20px",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <input
            type="text"
            placeholder="Search by name, email, or business..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: 1,
              minWidth: "200px",
              padding: "10px 14px",
              borderRadius: "10px",
              border: "1px solid #d1d5db",
              fontSize: "14px",
            }}
          />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{
              padding: "10px 14px",
              borderRadius: "10px",
              border: "1px solid #d1d5db",
              fontSize: "14px",
              background: "#fff",
            }}
          >
            <option value="all">All Statuses</option>
            <option value="signed">Signed</option>
            <option value="pending_email">Awaiting Email</option>
            <option value="revoked">Revoked</option>
          </select>
        </div>

        {error && (
          <div
            style={{
              background: "#fef2f2",
              color: "#b91c1c",
              padding: "12px 16px",
              borderRadius: "12px",
              marginBottom: "20px",
              fontSize: "14px",
            }}
          >
            {error}
          </div>
        )}

        {loading ? (
          <p style={{ color: "#6b7280", fontSize: "14px" }}>
            Loading agreements...
          </p>
        ) : filtered.length === 0 ? (
          <div
            style={{
              background: "#fff",
              borderRadius: "18px",
              border: "1px solid #e5e7eb",
              padding: "40px",
              textAlign: "center",
              color: "#6b7280",
              fontSize: "14px",
            }}
          >
            {agreements.length === 0
              ? "No consignment agreements yet."
              : "No agreements match your search."}
          </div>
        ) : (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            {filtered.map((agreement) => (
              <div
                key={agreement.id}
                style={{
                  background: "#fff",
                  borderRadius: "14px",
                  border: "1px solid #e5e7eb",
                  padding: "16px 20px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "16px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
                }}
              >
                <div style={{ flex: 1 }}>
                  <p
                    style={{
                      margin: "0 0 4px",
                      fontSize: "15px",
                      fontWeight: 600,
                    }}
                  >
                    {agreement.fullName || agreement.sellerEmail}
                  </p>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "13px",
                      color: "#6b7280",
                    }}
                  >
                    {agreement.sellerEmail}
                    {agreement.businessName &&
                      ` | ${agreement.businessName}`}
                  </p>
                  <p
                    style={{
                      margin: "4px 0 0",
                      fontSize: "12px",
                      color: "#9ca3af",
                    }}
                  >
                    {agreement.method === "electronic"
                      ? "Signed electronically"
                      : "Download & email"}{" "}
                    | Created:{" "}
                    {new Date(agreement.createdAt).toLocaleDateString()}
                    {agreement.signedAt &&
                      ` | Signed: ${new Date(
                        agreement.signedAt
                      ).toLocaleDateString()}`}
                  </p>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  {/* Status badge */}
                  <span
                    style={{
                      padding: "4px 10px",
                      borderRadius: "999px",
                      fontSize: "11px",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                      background:
                        agreement.status === "signed"
                          ? "#ecfdf5"
                          : agreement.status === "pending_email"
                          ? "#fffbeb"
                          : agreement.status === "revoked"
                          ? "#fef2f2"
                          : "#f3f4f6",
                      color:
                        agreement.status === "signed"
                          ? "#059669"
                          : agreement.status === "pending_email"
                          ? "#d97706"
                          : agreement.status === "revoked"
                          ? "#dc2626"
                          : "#374151",
                    }}
                  >
                    {agreement.status === "pending_email"
                      ? "Awaiting Email"
                      : agreement.status}
                  </span>

                  {/* Actions */}
                  {agreement.status === "pending_email" && (
                    <button
                      onClick={() =>
                        handleAction(agreement.id, "confirm")
                      }
                      disabled={actionLoading === agreement.id}
                      style={{
                        padding: "6px 14px",
                        borderRadius: "8px",
                        border: "1px solid #059669",
                        background: "#ecfdf5",
                        color: "#059669",
                        fontSize: "12px",
                        fontWeight: 600,
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {actionLoading === agreement.id
                        ? "..."
                        : "Confirm Receipt"}
                    </button>
                  )}
                  {agreement.status !== "revoked" && (
                    <button
                      onClick={() =>
                        handleAction(agreement.id, "revoke")
                      }
                      disabled={actionLoading === agreement.id}
                      style={{
                        padding: "6px 14px",
                        borderRadius: "8px",
                        border: "1px solid #fca5a5",
                        background: "#fff",
                        color: "#dc2626",
                        fontSize: "12px",
                        fontWeight: 600,
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Revoke
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
