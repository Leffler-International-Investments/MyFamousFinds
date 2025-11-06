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
        <li>
          <strong>Start with vetting &amp; risk</strong>
          <br />
          Begin in the <strong>Vetting queue / Listing review</strong> section to handle new
          and flagged items. Approve, reject or request changes. This keeps only trusted,
          compliant items on the marketplace.
        </li>
        <li>
          <strong>Monitor sellers</strong>
          <br />
          In <strong>Sellers / Seller profiles</strong> you can see each seller’s status,
          documents, strike history and performance. Use this area to approve new sellers,
          temporarily pause problematic accounts, or review high-value sellers.
        </li>
        <li>
          <strong>Control listings &amp; categories</strong>
          <br />
          Use <strong>Listings</strong> to search, filter and manage all active items. Here you
          can unlist items, correct categories, and adjust visibility when necessary. In{" "}
          <strong>Categories</strong> you maintain the taxonomy (add/rename/retire categories
          and sub-categories).
        </li>
        <li>
          <strong>Orders, disputes &amp; customer care</strong>
          <br />
          In <strong>Orders</strong> you can see all marketplace orders and step in if
          something is stuck (for example, shipping delays). The{" "}
          <strong>Disputes</strong> section is for returns, chargebacks and buyer–seller
          conflicts. Coordinate with support and document all decisions carefully.
        </li>
        <li>
          <strong>Payouts, fees &amp; tax</strong>
          <br />
          The <strong>Payouts</strong> area shows pending, completed and failed payouts, plus
          the fees collected by the platform. <strong>Tax</strong> helps track tax-related
          summaries and export data for your accountant or tax advisor (depending on how it is
          configured in your region).
        </li>
        <li>
          <strong>Stripe &amp; financial settings</strong>
          <br />
          In <strong>Stripe settings</strong> you manage platform commission, payout rules and
          test/live mode (where enabled). Only authorised management users should change these
          settings and any change should be coordinated with finance.
        </li>
        <li>
          <strong>Analytics &amp; logs</strong>
          <br />
          The <strong>Analytics</strong> view gives you high-level KPIs (GMV, take rate, number
          of active sellers, average order value, etc.). Use <strong>Logs / System logs</strong>{" "}
          to trace important events (admin actions, configuration changes, critical errors).
        </li>
        <li>
          <strong>Content &amp; support</strong>
          <br />
          In <strong>Content</strong> you manage homepage highlights, banners and key marketing
          areas. <strong>Support tickets</strong> is where you see open, in-progress and closed
          requests from buyers and sellers. Together, these sections let you keep both the
          storefront and the service experience aligned with the brand.
        </li>
        <li>
          <strong>System settings &amp; users</strong>
          <br />
          <strong>System settings</strong> covers general configuration (regions, currencies,
          feature flags). <strong>Users / Admin users / Developer tools</strong> is where you
          manage internal access and, where applicable, developer-only tools. Changes here
          should be rare and performed carefully.
        </li>
      </ol>
    </section>
  );
};

export default ManagementDashboardTutorial;
