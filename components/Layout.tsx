// FILE: components/Layout.tsx
import Head from "next/head";
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
      <main>{children}</main>
    </>
  );
}
