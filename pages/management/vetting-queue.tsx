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
  country: string;
  // This is the human-readable label ("Pending", "Approved", "Rejected")
  status: string;
};

type Props = {
  applications: SellerApplication[];
};

export default function ManagementVettingQueue({ applications }: Props) {
  const { loading } = useRequireAdmin();

  // Local mutable copy so Approve / Deny can update UI
  const [items, setItems] = useState<SellerApplication[]>(applications);
  const [pendingOnly, setPendingOnly] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const visible = useMemo(
    () =>
      pendingOnly
        ? items.filter((a) => a.status === "Pending")
        : items,
    [items, pendingOnly]
  );

  if (loading) return null;

  async function handleDecision(
    appId: string,
    decision: "approved" | "rejected"
  ) {
    try {
      setUpdatingId(appId);
      const res = await fetch("/api/management/seller-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: appId, decision }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || "Request failed");
      }

      const label =
        decision === "approved" ? "Approved" : "Rejected";

      setItems((prev) =>
        prev.map((app) =>
          app.id === appId ? { ...app, status: label } : app
        )
      );
    } catch (err: any) {
      console.error("vetting_decision_error", err);
      alert(
        err?.message ||
          "Unable to update seller status. Please try again."
      );
    } finally {
      setUpdatingId(null);
    }
  }

  function handleExportCsv() {
    if (!visible.length) return;
    const header = [
      "Application ID",
      "Business Name",
      "Contact Email",
      "Country",
      "Submitted",
      "Status",
    ];
    const rows = visible.map((a) => [
      a.id,
      a.businessName,
      a.contactEmail,
      a.country,
      a.submittedAt,
      a.status,
    ]);

    const csv =
      [header, ...rows]
        .map((row) =>
          row
            .map((cell) =>
              `"${String(cell ?? "")
                .replace(/"/g, '""')
                .replace(/\r?\n/g, " ")}"`
            )
            .join(",")
        )
        .join("\n") + "\n";

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "seller-applications.csv";
    link.click();
    window.URL.revokeObjectURL(url);
  }

  return (
    <>
      <Head>
        <title>Seller Vetting Queue — Admin</title>
      </Head>
      <div className="min-h-screen bg-gray-50 text-gray-900">
        <Header />

        <main className="mx-auto max-w-6xl px-4 pb-16 pt-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Seller Vetting Queue
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Approve or deny new seller applications before they can
                list inventory.
              </p>
            </div>
            <Link
              href="/management/dashboard"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              ← Back to Management Dashboard
            </Link>
          </div>

          <div className="mb-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setPendingOnly((v) => !v)}
              className="rounded-md border border-gray-300 px-3 py-2 text-xs text-gray-700 hover:bg-gray-100"
            >
              {pendingOnly ? "Show All Applications" : "Show Pending Only"}
            </button>
            <button
              type="button"
              onClick={handleExportCsv}
              className="rounded-md border border-gray-300 px-3 py-2 text-xs text-gray-700 hover:bg-gray-100"
            >
              Export Applications (CSV)
            </button>
          </div>

          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">
                    Application ID
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">
                    Business Name
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">
                    Contact Email
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">
                    Country
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">
                    Submitted
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">
                    Status
                  </th>
                  <th className="px-4 py-2 text-right font-medium text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {visible.map((app) => (
                  <tr key={app.id}>
                    <td className="px-4 py-2 text-xs font-mono text-gray-700">
                      {app.id}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-900">
                      {app.businessName}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-700">
                      {app.contactEmail}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-700">
                      {app.country}
                    </td>
                    <td className="px-4 py-2 text-xs text-gray-500">
                      {app.submittedAt}
                    </td>
                    <td className="px-4 py-2 text-xs">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                          app.status === "Pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : app.status === "Approved"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {app.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right text-xs">
                      <button
                        disabled={!!updatingId}
                        onClick={() =>
                          handleDecision(app.id, "approved")
                        }
                        className="mr-2 font-medium text-green-700 hover:text-green-900 disabled:opacity-60"
                      >
                        {updatingId === app.id
                          ? "Saving…"
                          : "Approve"}
                      </button>
                      <button
                        disabled={!!updatingId}
                        onClick={() =>
                          handleDecision(app.id, "rejected")
                        }
                        className="font-medium text-red-600 hover:text-red-800 disabled:opacity-60"
                      >
                        Deny
                      </button>
                    </td>
                  </tr>
                ))}
                {!visible.length && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-6 text-center text-xs text-gray-500"
                    >
                      No applications found for the current filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async () => {
  try {
    const snap = await adminDb.collection("sellers").get();

    const applications: SellerApplication[] = snap.docs.map((doc) => {
      const d: any = doc.data() || {};
      const createdAt =
        d.createdAt && typeof d.createdAt.toDate === "function"
          ? d.createdAt.toDate()
          : null;
      const iso =
        createdAt && !isNaN(createdAt.getTime())
          ? createdAt.toISOString().slice(0, 10)
          : "";

      const rawStatus = String(d.status || "pending").toLowerCase();
      let label = "Pending";
      if (rawStatus === "approved") label = "Approved";
      else if (rawStatus === "rejected") label = "Rejected";

      return {
        id: doc.id,
        businessName:
          d.businessName || d.displayName || "Unknown seller",
        contactEmail: d.email || "",
        country: d.country || "",
        submittedAt: iso,
        status: label,
      };
    });

    return { props: { applications } };
  } catch (err) {
    console.error("Error loading vetting queue", err);
    return { props: { applications: [] } };
  }
};
