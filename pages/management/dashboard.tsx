// /pages/management/dashboard.tsx
import Link from "next/link";
import ButlerChat from "../../components/ButlerChat";
import Header from "../../components/Header"; // Added
import Footer from "../../components/Footer"; // Added

export default function ManagementDashboard() {
  const modules = [
    "Dashboard",
    "Sellers Directory",
    "Seller Profiles / Controls",
    "All Listings",
    "Listing Review Queue",
    "Orders Overview",
    "Returns & Disputes Centre",
    "Support Tickets / Helpdesk",
    "Payouts & Finance",
    "Stripe & Payment Settings",
    "Tax & Compliance",
    "Categories & Attributes",
    "Campaigns & Promotions",
    "Content Management",
    "Reviews & Moderation",
    "Analytics & Reports",
    "User & Role Management",
    "System Settings",
    "Logs & Audit Trail",
    "Developer / Integrations",
    "Logout",
  ];

  return (
    // Updated to white background
    <div className="min-h-screen bg-white text-gray-900">
      <Header />

      <main className="mx-auto max-w-6xl px-4 pb-16 pt-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">
            Management Admin Dashboard
          </h1>
          <Link
            href="/"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            ← Return to Dashboard
          </Link>
        </div>
        
        {/* Updated button styles */}
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {modules.map((m) => (
            <Link
              key={m}
              href={`/management/${m.toLowerCase().replace(/[^a-z]+/g, "-")}`}
              className="block rounded-lg border border-gray-200 bg-white p-4 text-sm font-medium text-gray-700 shadow-sm transition-all hover:border-blue-500 hover:text-black hover:shadow-md"
            >
              {m}
            </Link>
          ))}
        </div>
      </main>
      
      <ButlerChat />
      <Footer />
    </div>
  );
}
