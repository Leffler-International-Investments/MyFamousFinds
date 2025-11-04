// FILE: /pages/management/content/static-pages.tsx
import AdminPlaceholder from "../../../components/AdminPlaceholder";
import { useRequireAdmin } from "../../../hooks/useRequireAdmin";

export default function ManagementContentStaticPages() {
  const { loading } = useRequireAdmin();
  if (loading) return null;

  return <AdminPlaceholder pageTitle="Static Pages" />;
}
