// FILE: pages/404.tsx
import Layout from "@/components/Layout";

export default function NotFound() {
  return (
    <Layout title="404 – Not Found">
      <div className="max-w-3xl mx-auto p-12 text-center">
        <h1 className="text-3xl font-bold">404</h1>
        <p className="mt-3">Page not found.</p>
      </div>
    </Layout>
  );
}
