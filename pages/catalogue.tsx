// FILE: /pages/catalogue.tsx

import type { GetServerSideProps } from "next";

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    redirect: {
      destination: "/seller/catalogue",
      permanent: false,
    },
  };
};

export default function CatalogueRedirect() {
  return null;
}
