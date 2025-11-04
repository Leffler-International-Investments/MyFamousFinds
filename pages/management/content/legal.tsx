// FILE: /pages/management/content/legal.tsx
import AdminPlaceholder from "../../../components/AdminPlaceholder";
import { useRequireAdmin } from "../../../hooks/useRequireAdmin";

export default function ManagementContentLegal() {
  const { loading } = useRequireAdmin();
  if (loading) return null;

  return <AdminPlaceholder pageTitle="Legal & Policies" />;
}
