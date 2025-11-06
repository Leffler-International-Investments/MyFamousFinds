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
      <h2 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 600 }}>
        How to use your Seller Dashboard
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
          <strong>Start here – Today’s overview</strong>
          <br />
          At the top you’ll see key numbers for your shop (active items, items under review,
          open orders, balance, etc.). Use this area to quickly check if anything needs your
          attention today.
        </li>
        <li>
          <strong>Create a new listing</strong>
          <br />
          To list a new item, use the <strong>“Sell an item” / “New listing”</strong> button
          or card. Fill in brand, condition, photos, price and shipping details, then submit.
          Items may go through a short vetting/review process before going live.
        </li>
        <li>
          <strong>Manage your catalogue</strong>
          <br />
          Go to <strong>Catalogue</strong> to see all your active and paused listings. From
          there you can edit details, adjust prices, pause or re-activate items, and see which
          listings are waiting for approval.
        </li>
        <li>
          <strong>Track orders &amp; shipping</strong>
          <br />
          Open <strong>Orders</strong> to see new, in-progress and completed orders. From
          here you can confirm orders, print shipping labels (where available), mark items as
          shipped, add tracking, and respond to buyer questions about a specific order.
        </li>
        <li>
          <strong>Watch your performance</strong>
          <br />
          The <strong>Insights</strong> section shows your sales over time, top brands,
          best-selling categories and conversion trends. Use this to see what sells well and
          which items might need a price change or better photos.
        </li>
        <li>
          <strong>Wallet &amp; statements</strong>
          <br />
          In <strong>Wallet</strong> you can see available balance and upcoming payouts. In{" "}
          <strong>Statements</strong> you can download a summary of items sold, fees, and net
          earnings for a chosen period – useful for bookkeeping and tax.
        </li>
        <li>
          <strong>Profile &amp; settings</strong>
          <br />
          Use <strong>Profile</strong> to update your name, shop details, contact email and
          payout information. Make sure all information is correct before listing high-value
          items.
        </li>
        <li>
          <strong>Need help?</strong>
          <br />
          If something is unclear or you believe there is an error with a listing, order or
          payout, contact support via the <strong>Help / Contact</strong> links in the menu.
          Please mention order ID or listing ID so we can assist faster.
        </li>
      </ol>
    </section>
  );
};

export default SellerDashboardTutorial;
