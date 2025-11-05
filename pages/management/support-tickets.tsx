// FILE: /pages/management/support-tickets.tsx
import { useMemo, useState } from "react";
import type { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useRequireAdmin } from "../../hooks/useRequireAdmin";
import { adminDb } from "../../utils/firebaseAdmin";

type Ticket = {
  id: string;
  subject: string;
  from: string;
  status: string;
  priority: string;
};

type Props = {
  tickets: Ticket[];
};

export default function ManagementSupport({ tickets }: Props) {
  const { loading } = useRequireAdmin();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tickets.filter((t) => {
      if (statusFilter !== "All" && t.status !== statusFilter) return false;
      if (!q) return true;
      return (
        t.subject.toLowerCase().includes(q) ||
        t.from.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q)
      );
    });
  }, [tickets, query, statusFilter]);

  if (loading) return null;

  function statusBadgeClasses(status: string) {
    if (status === "Open") return "bg-red-100 text-red-700";
    if (status === "In Progress") return "bg-yellow-100 text-yellow-800";
    if (status === "Closed") return "bg-emerald-100 text-emerald-700";
    return "bg-gray-100 text-gray-700";
  }

  return (
    <>
      <Head>
        <title>Support Tickets — Admin</title>
      </Head>
      <div className="min-h-screen bg-gray-50 text-gray-900">
        <Header />

        <main className="mx-auto max-w-6xl px-4 pb-16 pt-6">
          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Support Tickets
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Central inbox for buyer and seller requests.
              </p>
            </div>
            <Link
              href="/management/dashboard"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              ← Back to Management Dashboard
            </Link>
          </div>

          <div className="mb-4 flex flex-wrap items-center gap-3">
            <input
              type="text"
              placeholder="Search by subject, email, or ticket ID…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full max-w-xs rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
            >
              <option value="All">All statuses</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Closed">Closed</option>
            </select>
          </div>

          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">
                    Ticket
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">
                    From
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">
                    Status
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">
                    Priority
                  </th>
                  <th className="px-4 py-2 text-right font-medium text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {visible.map((t) => (
                  <tr key={t.id}>
                    <td className="px-4 py-2 text-sm text-gray-900">
                      <div className="font-medium">{t.subject}</div>
                      <div className="text-xs text-gray-500">{t.id}</div>
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-700">
                      {t.from}
                    </td>
                    <td className="px-4 py-2 text-xs">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${statusBadgeClasses(
                          t.status
                        )}`}
                      >
                        {t.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-xs text-gray-700">
                      {t.priority}
                    </td>
                    <td className="px-4 py-2 text-right text-xs">
                      <button className="font-medium text-blue-600 hover:text-blue-800">
                        View
                      </button>
                    </td>
                  </tr>
                ))}
                {!visible.length && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-6 text-center text-xs text-gray-500"
                    >
                      No tickets found for the current filters.
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
    const snap = await adminDb
      .collection("supportTickets")
      .orderBy("createdAt", "desc")
      .limit(200)
      .get();

    const tickets: Ticket[] = snap.docs.map((doc) => {
      const d: any = doc.data() || {};
      return {
        id: doc.id,
        subject: d.subject || "Support request",
        from: d.from || d.email || "",
        status: d.status || "Open",
        priority: d.priority || "Medium",
      };
    });

    return { props: { tickets } };
  } catch (err) {
    console.error("Error loading support tickets", err);
    return { props: { tickets: [] } };
  }
};
