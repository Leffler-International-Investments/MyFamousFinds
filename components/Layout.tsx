// FILE: /components/Layout.tsx
import Head from "next/head";
import Link from "next/link";
import { ReactNode } from "react";

type Props = {
  title?: string;
  children: ReactNode;
};

export default function Layout({ title = "FamousFinds", children }: Props) {
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="viewport" content="width=device-width,initial-scale=1" />
      </Head>
      <main className="min-h-screen bg-black text-white">
        {/* Global “Back to Dashboard” for all Layout pages */}
        <div className="max-w-5xl mx-auto px-4 pt-4">
          <Link
            href="/"
            className="inline-flex items-center text-xs text-gray-400 hover:text-gray-100"
          >
            <span className="mr-1">←</span>
            Back to Dashboard
          </Link>
        </div>

        {/* Page content */}
        <div className="max-w-5xl mx-auto px-4 pb-10">{children}</div>
      </main>
    </>
  );
}
