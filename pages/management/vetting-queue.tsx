// FILE: /pages/management/vetting-queue.tsx
import { useMemo, useState } from "react";
import type { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useRequireAdmin } from "../../hooks/useRequireAdmin";
import { adminDb } from "../../utils/firebaseAdmin";

type SellerApplication = {
  id: string;
  businessName: string;
  contactEmail: string;
  submittedAt: string;
  status: "Pending" | "Approved" | "Rejected";
};

type Props = { items: SellerApplication[] };

export default function ManagementVettingQueue({ items }: Props) {
  const { loading } = useRequireAdmin();
  const [query, setQuery] = useState("");
  const [localItems, setLocalItems] = useState(items);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return localItems;
    return localItems.filter((s) => {
      return (
        s.businessName.toLowerCase().includes(q) ||
        s.contactEmail.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q)
      );
    });
  }, [localItems, query]);

  const handleAction = async (
    id: string,
    action: "approve" | "reject"
  ) => {
    if (actionLoading) return;

    let reason: string | undefined;
    if (action === "reject") {
      const input = window.prompt(
        "Add a short note for the seller explaining why the application was rejected (optional):",
        ""
      );
      if (input === null) {
        // User cancelled the dialog; don't change anything
        return;
      }
      reason = input.trim() || undefined;
    }

    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/${action}-seller/${id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reason: action === "reject" ? reason : undefined,
        }),
      });
      const json = await res.json().catch(() => ({} as any));
      if (!res.ok || json.error) {
        throw new Error(json.error || "Failed to update seller");
      }

      setLocalItems((prev) =>
        prev.map((s) =>
          s.id === id
            ? {
                ...s,
                status: action === "approve" ? "Approved" : "Rejected",
              }
            : s
        )
      );

      if (action === "approve" && json.registerUrl) {
        const emailNote =
          json.emailSent === false
            ? "\n\n⚠ We could not send the email automatically. Please copy this link and email it to the seller:"
            : "\n\nThe seller has been emailed this registration link:";
        alert(
          `Seller approved.${emailNote}\n\n${json.registerUrl}`
        );
      } else if (action === "reject") {
        alert(
          "Seller marked as Rejected. A notification email will be sent if an email address is on file."
        );
      }
    } catch (err: any) {
      alert(err?.message || "Error updating seller status.");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return <div className="dashboard-page" />;

  return (
    <>
      <Head>
        <title>Seller Vetting Queue — Admin</title>
      </Head>
      <div className="dashboard-page">
        <Header />
        <main className="dashboard-main">
          <div className="dashboard-main-inner">
            <div className="page-header">
              <div>
                <button
                  onClick={() => history.back()}
                  className="back-link inline-block mb-2"
                >
                  ← Back to Management Dashboard
                </button>
                <h1>Seller Vetting Queue</h1>
                <p className="page-subtitle">
                  Review and approve new seller applications before they get
                  access to the seller console.
                </p>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <div className="card-title">Applications</div>
                <input
                  type="text"
                  placeholder="Search by name, email or ID…"
                  className="search-input"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Business</th>
                      <th>Email</th>
                      <th>Submitted</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((s) => (
                      <tr key={s.id}>
                        <td>{s.businessName || "—"}</td>
                        <td>{s.contactEmail || "—"}</td>
                        <td>{s.submittedAt || "—"}</td>
                        <td>{s.status}</td>
                        <td>
                          <div className="actions-cell">
                            <button
                              disabled={
                                actionLoading === s.id || s.status === "Approved"
                              }
                              className="btn-small btn-primary"
                              onClick={() => handleAction(s.id, "approve")}
                            >
                              {actionLoading === s.id &&
                              s.status !== "Approved"
                                ? "Approving…"
                                : "Approve"}
                            </button>
                            <button
                              disabled={
                                actionLoading === s.id || s.status === "Rejected"
                              }
                              className="btn-small btn-outline"
                              onClick={() => handleAction(s.id, "reject")}
                            >
                              {actionLoading === s.id &&
                              s.status !== "Rejected"
                                ? "Rejecting…"
                                : "Reject"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {visible.length === 0 && (
                      <tr>
                        <td colSpan={5} className="empty-state">
                          No applications found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-8">
              <Link href="/management/sellers" className="link">
                View Seller Directory →
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async () => {
  const snapshot = await adminDb
    .collection("sellers")
    .orderBy("submittedAt", "desc")
    .limit(200)
    .get();

  const items: SellerApplication[] = snapshot.docs.map((doc) => {
    const data = doc.data() as any;
    return {
      id: doc.id,
      businessName: data.businessName || "",
      contactEmail: data.contactEmail || data.email || "",
      submittedAt: data.submittedAt
        ? new Date(data.submittedAt.toDate()).toLocaleString()
        : "",
      status: (data.status as any) || "Pending",
    };
  });

  return {
    props: {
      items,
    },
  };
};
