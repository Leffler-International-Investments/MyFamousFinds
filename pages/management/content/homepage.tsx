// FILE: /pages/management/content/homepage.tsx
import AdminPlaceholder from "../../../components/AdminPlaceholder";
import { useRequireAdmin } from "../../../hooks/useRequireAdmin";

export default function ManagementContentHomepage() {
  const { loading } = useRequireAdmin();
  if (loading) return null;

  return <AdminPlaceholder pageTitle="Homepage Content" />;
}
