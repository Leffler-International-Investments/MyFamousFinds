// FILE: components/Layout.tsx
import Head from "next/head";
import React from "react";

type Props = {
  title?: string;
  children: React.ReactNode;
};

export default function Layout({ title = "Famous Finds", children }: Props) {
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div className="min-h-screen flex flex-col">
        <header className="w-full border-b">
          <div className="max-w-6xl mx-auto px-4 py-4 text-xl font-semibold">
            Famous Finds
          </div>
        </header>

        <main className="flex-1">{children}</main>

        <footer className="w-full border-t">
          <div className="max-w-6xl mx-auto px-4 py-6 text-sm">
            © {new Date().getFullYear()} Famous Finds
          </div>
        </footer>
      </div>
    </>
  );
}
