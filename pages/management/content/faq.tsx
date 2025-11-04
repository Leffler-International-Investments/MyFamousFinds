// FILE: /pages/management/content/faq.tsx
import AdminPlaceholder from "../../../components/AdminPlaceholder";
import { useRequireAdmin } from "../../../hooks/useRequireAdmin";

export default function ManagementContentFaq() {
  const { loading } = useRequireAdmin();
  if (loading) return null;

  return <AdminPlaceholder pageTitle="FAQ & Help Center" />;
}
