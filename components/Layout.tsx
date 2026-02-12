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
        {/* Page content */}
        <div className="max-w-5xl mx-auto px-4 pb-10">{children}</div>
      </main>
    </>
  );
}
