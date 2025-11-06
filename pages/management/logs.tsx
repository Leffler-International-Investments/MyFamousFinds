// FILE: /pages/management/logs.tsx
import type { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useRequireAdmin } from "../../hooks/useRequireAdmin";
import { adminDb } from "../../utils/firebaseAdmin";

type LogEntry = {
  id: string | number;
  time: string;
  actor: string;
  action: string;
};

type Props = {
  logs: LogEntry[];
};

export default function ManagementLogs({ logs }: Props) {
  const { loading } = useRequireAdmin();
  if (loading) return null;

  const hasAny = logs.length > 0;

  return (
    <>
      <Head>
        <title>Logs & Audit Trail — Admin</title>
      </Head>
      <div className="min-h-screen bg-gray-50 text-gray-900">
        <Header />
        <main className="mx-auto max-w-6xl px-4 pb-16 pt-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Logs & Audit Trail
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                View recent system events and admin actions for compliance.
              </p>
            </div>
            <Link
              href="/management/dashboard"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              ← Back to Management Dash
            </Link>
          </div>

          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">
                    Time
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">
                    Actor
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {hasAny ? (
                  logs.map((log) => (
                    <tr key={String(log.id)}>
                      <td className="px-4 py-2 text-gray-700">
                        {log.time || "—"}
                      </td>
                      <td className="px-4 py-2 text-gray-900">
                        {log.actor || "system"}
                      </td>
                      <td className="px-4 py-2 text-gray-700">
                        {log.action || "—"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-4 py-6 text-center text-sm text-gray-500"
                    >
                      No audit log entries found.
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

function formatDateTime(ts: any): string {
  try {
    if (!ts) return "";
    const d =
      typeof ts.toDate === "function"
        ? ts.toDate()
        : ts instanceof Date
        ? ts
        : null;
    if (!d) return "";
    const pad = (n: number) => String(n).padStart(2, "0");
    return (
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
      `${pad(d.getHours())}:${pad(d.getMinutes())}`
    );
  } catch {
    return "";
  }
}

export const getServerSideProps: GetServerSideProps<Props> = async () => {
  try {
    const snap = await adminDb
      .collection("adminLogs")
      .orderBy("createdAt", "desc")
      .limit(200)
      .get();

    const logs: LogEntry[] = snap.docs.map((doc, index) => {
      const d: any = doc.data() || {};
      return {
        id: doc.id || index,
        time: formatDateTime(d.createdAt),
        actor: d.actor || d.user || "system",
        action: d.action || d.message || "",
      };
    });

    return { props: { logs } };
  } catch (err) {
    console.error("Error loading logs", err);
    return { props: { logs: [] } };
  }
};

