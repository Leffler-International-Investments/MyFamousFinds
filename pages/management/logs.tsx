// FILE: /pages/management/logs.tsx
import type { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { adminDb } from "../../utils/firebaseAdmin";
import { useRequireAdmin } from "../../hooks/useRequireAdmin";

type Log = {
  id: string;
  actor: string;
  action: string;
  target: string;
  createdAt: string;
};

type Props = {
  logs: Log[];
};

export default function ManagementLogs({ logs }: Props) {
  const { loading } = useRequireAdmin();
  if (loading) return null;

  return (
    <>
      <Head>
        <title>Logs &amp; Audit Trail — Admin</title>
      </Head>
      <div className="min-h-screen bg-gray-50 text-gray-900">
        <Header />
        <main className="mx-auto max-w-6xl px-4 pb-16 pt-6">
          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-semibold">Logs &amp; Audit Trail</h1>
              <p className="mt-1 text-sm text-gray-600">
                Track major admin and system actions across the platform.
              </p>
            </div>
            <Link
              href="/management/dashboard"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              ← Back to Management Dashboard
            </Link>
          </div>

          <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
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
                  <th className="px-4 py-2 text-left font-medium text-gray-700">
                    Target
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td className="px-4 py-2 text-gray-700">
                      {log.createdAt}
                    </td>
                    <td className="px-4 py-2 text-gray-700">{log.actor}</td>
                    <td className="px-4 py-2 text-gray-700">{log.action}</td>
                    <td className="px-4 py-2 text-gray-700">{log.target}</td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-6 text-center text-sm text-gray-500"
                    >
                      No log entries recorded yet.
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
      .collection("logs")
      .orderBy("createdAt", "desc")
      .limit(200)
      .get();

    const logs: Log[] = snap.docs.map((doc) => {
      const d: any = doc.data() || {};
      return {
        id: doc.id,
        actor: d.actor || "system",
        action: d.action || "",
        target: d.target || "",
        createdAt:
          d.createdAt?.toDate?.().toLocaleString("en-US") || "",
      };
    });

    return { props: { logs } };
  } catch (err) {
    console.error("Error loading logs", err);
    return { props: { logs: [] } };
  }
};
