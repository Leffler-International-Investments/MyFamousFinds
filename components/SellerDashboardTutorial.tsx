// FILE: /components/SellerDashboardTutorial.tsx

import React from "react";

const SellerDashboardTutorial: React.FC = () => {
  return (
    <section
      style={{
        border: "1px solid #ddd",
        borderRadius: "8px",
        padding: "16px",
        marginBottom: "24px",
        backgroundColor: "#f9fafb",
      }}
    >
      <h2 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 700, textAlign: "center" }}>
        Snap. Submit. Sell.
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
          <strong>Snap</strong>
          <br />
          Create your listing by uploading photos, setting your price, and adding
          key details like brand and condition.
        </li>
        <li>
          <strong>Submit</strong>
          <br />
          Your item is reviewed by the FF team for quality and authentication.
          This process takes up to 24 hours, and you&apos;ll be notified once
          it&apos;s approved or if edits are needed.
        </li>
        <li>
          <strong>Sell</strong>
          <br />
          Once live, manage your listing, track orders, and ship items as they
          sell. If it sits for a while, the FF team may suggest updates. Payouts
          are issued on the 15th of each month.
        </li>
      </ol>
    </section>
  );
};

export default SellerDashboardTutorial;
