// FILE: /components/ManagementDashboardTutorial.tsx

import React from "react";

const ManagementDashboardTutorial: React.FC = () => {
  return (
    <section
      style={{
        border: "1px solid #ddd",
        borderRadius: "8px",
        padding: "16px",
        marginBottom: "24px",
        backgroundColor: "#f3f4f6",
      }}
    >
      <h2 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 600 }}>
        How to use the Management Dashboard
      </h2>

      <ol
        style={{
          marginTop: "12px",
          paddingLeft: "18px",
          lineHeight: 1.6,
          fontSize: "0.9rem",
        }}
      >
        <li style={{ marginBottom: "12px" }}>
          <strong>Start with vetting &amp; risk</strong>
          <p style={{ margin: "4px 0 0 0", padding: 0 }}>
            Begin in the <strong>Vetting queue / Listing review</strong> section to handle new
            and flagged items. Approve, reject or request changes. This keeps only trusted,
            compliant items on the marketplace.
          </p>
        </li>
        <li style={{ marginBottom: "12px" }}>
          <strong>Monitor sellers</strong>
          <p style={{ margin: "4px 0 0 0", padding: 0 }}>
            In <strong>Sellers / Seller profiles</strong> you can see each seller’s status,
            documents, strike history and performance. Use this area to approve new sellers,
            temporarily pause problematic accounts, or review high-value sellers.
          </p>
        </li>
        <li style={{ marginBottom: "12px" }}>
          <strong>Control listings &amp; categories</strong>
          <p style={{ margin: "4px 0 0 0", padding: 0 }}>
            Use <strong>Listings</strong> to search, filter and manage all active items. Here you
            can unlist items, correct categories, and adjust visibility when necessary. In{" "}
            <strong>Categories</strong> you maintain the taxonomy (add/rename/retire categories
            and sub-categories).
          </p>
        </li>
        <li style={{ marginBottom: "12px" }}>
          <strong>Orders, disputes &amp; customer care</strong>
          <p style={{ margin: "4px 0 0 0", padding: 0 }}>
            In <strong>Orders</strong> you can see all marketplace orders and step in if
            something is stuck (for example, shipping delays). The{" "}
            <strong>Disputes</strong> section is for returns, chargebacks and buyer–seller
            conflicts. Coordinate with support and document all decisions carefully.
          </p>
        </li>
        <li style={{ marginBottom: "12px" }}>
          <strong>Payouts, fees &amp; tax</strong>
          <p style={{ margin: "4px 0 0 0", padding: 0 }}>
            The <strong>Payouts</strong> area shows pending, completed and failed payouts, plus
            the fees collected by the platform. <strong>Tax</strong> helps track tax-related
            summaries and export data for your accountant or tax advisor (depending on how it is
            configured in your region).
          </p>
        </li>
        <li style={{ marginBottom: "12px" }}>
          <strong>Stripe &amp; financial settings</strong>
          <p style={{ margin: "4px 0 0 0", padding: 0 }}>
            In <strong>Stripe settings</strong> you manage platform commission, payout rules and
            test/live mode (where enabled). Only authorised management users should change these
            settings and any change should be coordinated with finance.{" "}
            <strong>
              Note: Access to these financial areas is often protected by an "Owner Guard".
            </strong>
          </p>
        </li>
        <li style={{ marginBottom: "12px" }}>
          <strong>Analytics &amp; logs</strong>
          <p style={{ margin: "4px 0 0 0", padding: 0 }}>
            The <strong>Analytics</strong> view gives you high-level KPIs (GMV, take rate, number
            of active sellers, average order value, etc.). Use <strong>Logs / System logs</strong>{" "}
            to trace important events (admin actions, configuration changes, critical errors).
          </p>
        </li>
        <li style={{ marginBottom: "12px" }}>
          <strong>Content &amp; support</strong>
          <p style={{ margin: "4px 0 0 0", padding: 0 }}>
            In <strong>Content</strong> you manage homepage highlights, banners and key marketing
            areas. <strong>Support tickets</strong> is where you see open, in-progress and closed
            requests from buyers and sellers. Together, these sections let you keep both the
            storefront and the service experience aligned with the brand.
          </p>
        </li>
        <li style={{ marginBottom: "12px" }}>
          <strong>Team Management &amp; System</strong>
          <p style={{ margin: "4px 0 0 0", padding: 0 }}>
            Use the <strong>Management Team</strong> page (<code>/management/team</code>)
            to add new admins and set their specific permissions (e.g., who can
            access Finance, who can manage Sellers).{" "}
            <strong>System settings</strong> covers general configuration like regions
            and currencies.
          </p>
        </li>
      </ol>
    </section>
  );
};

export default ManagementDashboardTutorial;
