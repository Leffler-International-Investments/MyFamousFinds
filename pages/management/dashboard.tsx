// /pages/management/dashboard.tsx
import Link from "next/link";
import ButlerChat from "../../components/ButlerChat";

export default function ManagementDashboard() {
  const modules = [
    "Dashboard","Sellers Directory","Seller Profiles / Controls","All Listings",
    "Listing Review Queue","Orders Overview","Returns & Disputes Centre",
    "Support Tickets / Helpdesk","Payouts & Finance","Stripe & Payment Settings",
    "Tax & Compliance","Categories & Attributes","Campaigns & Promotions",
    "Content Management","Reviews & Moderation","Analytics & Reports",
    "User & Role Management","System Settings","Logs & Audit Trail",
    "Developer / Integrations","Logout",
  ];

  return (
    <div className="min-h-screen bg-white text-black p-10">
      <div className="flex justify-between mb-6">
        <h1 className="text-2xl font-bold">Management Admin Dashboard</h1>
        <Link href="/" className="text-blue-600">← Return to Dashboard</Link>
      </div>
      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
        {modules.map((m) => (
          <Link
            key={m}
            href={`/management/${m.toLowerCase().replace(/[^a-z]+/g, "-")}`}
            className="border border-gray-300 rounded-lg p-4 hover:bg-gray-100"
          >
            {m}
          </Link>
        ))}
      </div>
      <ButlerChat />
    </div>
  );
}
