// FILE: /pages/seller-terms.tsx

import Head from "next/head";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function SellerTermsPage() {
  return (
    <div className="page">
      <Head>
        <title>Seller Terms &amp; Conditions – Famous Finds</title>
      </Head>

      <Header />

      <main className="wrap">
        <a href="/help" className="back-link">
          &larr; Back to Help
        </a>

        <h1>Seller Terms &amp; Conditions</h1>
        <p className="intro">
          These Seller Terms &amp; Conditions govern the listing and sale of
          items by sellers on the Famous Finds platform. By listing an item for
          sale, you agree to be bound by these terms in full.
        </p>

        <div className="card">
          <h2>1. Introduction &amp; Scope</h2>
          <p>
            Famous Finds operates a curated online marketplace dedicated to
            pre-loved luxury goods. These Seller Terms &amp; Conditions
            (&quot;Seller Terms&quot;) apply to all individuals and entities
            (&quot;Sellers&quot;) who list or sell items through the Famous Finds
            platform. Famous Finds acts solely as an intermediary, providing the
            technology and services that enable Sellers to connect with buyers.
            Famous Finds is not a party to the transaction between the buyer and
            the Seller, and does not take ownership or possession of items unless
            expressly stated otherwise (for example, during the authentication
            process). These Seller Terms supplement the general{" "}
            <a href="/terms">Terms &amp; Conditions</a> of the platform. In the
            event of a conflict between these Seller Terms and the general Terms
            &amp; Conditions, these Seller Terms shall prevail with respect to
            selling activities.
          </p>
        </div>

        <div className="card">
          <h2>2. Eligibility</h2>
          <p>
            To sell on Famous Finds, you must be at least 18 years of age and
            possess the legal capacity to enter into binding agreements. You must
            provide accurate, current, and complete information during
            registration and keep your account details up to date at all times.
            You are solely responsible for all activity that occurs under your
            Seller account. By listing items on the platform, you represent and
            warrant that you comply with all applicable local, national, and
            international laws and regulations, including but not limited to
            consumer protection, taxation, and anti-money-laundering legislation.
            Famous Finds reserves the right to request additional verification
            documentation at any time, and failure to provide such documentation
            may result in the suspension or termination of your account.
          </p>
        </div>

        <div className="card">
          <h2>3. Listing Items</h2>
          <p>
            Sellers are responsible for ensuring that all listings are accurate,
            truthful, and complete. Each listing must include a clear and
            detailed description of the item, including the brand, model,
            material, size, colour, and any other relevant attributes. Sellers
            must upload clear, high-quality photographs that accurately represent
            the item&apos;s current condition. Any defects, signs of wear,
            repairs, alterations, or missing components must be explicitly
            disclosed in the listing description and visible in the photographs.
            Famous Finds reserves the right, at its sole discretion, to reject,
            edit, or remove any listing that does not meet the platform&apos;s
            quality standards, is incomplete or misleading, or otherwise violates
            these Seller Terms. Listings must not contain external links,
            promotional material, or any attempt to direct transactions outside
            the Famous Finds platform.
          </p>
        </div>

        <div className="card">
          <h2>4. Pricing &amp; Commission</h2>
          <p>
            Sellers are free to set their own listing prices, provided they meet
            the minimum listing price established by Famous Finds (as displayed
            on the platform at the time of listing). All prices must be stated in
            the currency supported by the platform. Upon a successful sale,
            Famous Finds will deduct a commission of up to 25% of the final sale
            price, plus a payment processing fee of 3% of the final sale price.
            The net amount after these deductions constitutes the Seller&apos;s
            payout. The applicable commission rate may vary based on factors such
            as item category, sale price, and Seller status, and will be clearly
            displayed to the Seller before a listing is confirmed. Famous Finds
            reserves the right to modify commission rates and fees at any time,
            with reasonable notice provided to Sellers. Any promotional
            discounts, vouchers, or price adjustments applied by Famous Finds
            shall not affect the commission calculation, which is always based on
            the final sale price paid by the buyer.
          </p>
        </div>

        <div className="card">
          <h2>5. Sale Confirmation &amp; Shipping</h2>
          <p>
            When an item is purchased, the Seller will receive a sale
            confirmation notification via email and within the Seller dashboard.
            The Seller must ship the item within 7 calendar days of receiving the
            sale confirmation. Items must be clean, properly and securely
            packaged to prevent damage during transit, and shipped using a
            tracked and insured shipping service. The Seller is responsible for
            providing the tracking number via the Seller dashboard. Failure to
            ship within the required timeframe, or to provide valid tracking
            information, may result in automatic cancellation of the order, and
            Famous Finds reserves the right to impose penalties, including but
            not limited to account suspension or deduction of cancellation fees.
            The Seller bears all risk of loss or damage to the item until it has
            been delivered to the buyer or to the Famous Finds authentication
            centre, as applicable. Sellers must comply with all applicable
            shipping and customs regulations.
          </p>
        </div>

        <div className="card">
          <h2>6. Authentication &amp; Quality Control</h2>
          <p>
            Famous Finds is committed to maintaining the integrity of its
            marketplace. Items may be subject to inspection and authentication by
            Famous Finds or its appointed third-party authentication partners,
            either before or after delivery to the buyer. If an item is found to
            be counterfeit, materially different from the listing description,
            not of the stated brand or model, or in a condition that is
            unacceptable (for example, undisclosed damage, excessive wear, or
            hygiene concerns), Famous Finds reserves the right to reject the
            item, cancel the sale, and return the item to the Seller at the
            Seller&apos;s expense. In cases involving counterfeit goods, Famous
            Finds may confiscate and destroy the item in accordance with
            applicable law, and no compensation will be provided to the Seller.
            Repeated authentication failures may result in permanent account
            termination.
          </p>
        </div>

        <div className="card">
          <h2>7. Payment &amp; Payouts</h2>
          <p>
            Seller payouts are processed via PayPal. The Seller must maintain a
            valid PayPal account linked to their Famous Finds Seller profile.
            Payouts are initiated after the buyer has confirmed receipt of the
            item in satisfactory condition, or after the buyer confirmation
            window has elapsed without a dispute being raised. Processing time
            for payouts is typically 3 to 5 business days following buyer
            confirmation or expiry of the confirmation window. Famous Finds
            reserves the right to withhold payouts in cases where a dispute,
            claim, or investigation is pending. Sellers are solely responsible
            for any tax obligations arising from their sales on the platform,
            including income tax, value-added tax, and any other applicable
            levies. Famous Finds does not provide tax advice and recommends that
            Sellers consult a qualified tax professional.
          </p>
        </div>

        <div className="card">
          <h2>8. Prohibited Items</h2>
          <p>
            The following items are strictly prohibited from being listed or sold
            on the Famous Finds platform: counterfeit or replica goods of any
            kind; stolen property; hazardous, toxic, or dangerous materials;
            items that infringe upon the intellectual property rights of any
            third party; items that do not fall within the luxury or pre-loved
            category as defined by Famous Finds; items subject to product
            recalls; weapons, ammunition, or explosives; drugs, pharmaceuticals,
            or controlled substances; and any items whose sale is prohibited or
            restricted by applicable law. Famous Finds reserves the right to
            remove any listing and suspend or terminate any Seller account found
            to be in violation of this section, without prior notice and without
            liability. Sellers found listing counterfeit items may be reported to
            the relevant law enforcement authorities.
          </p>
        </div>

        <div className="card">
          <h2>9. Returns &amp; Disputes</h2>
          <p>
            Buyers may raise a claim within 72 hours of confirmed delivery if an
            item is not as described, is damaged, or fails authentication.
            Claims must be submitted through the Famous Finds platform with
            supporting evidence, including photographs. Famous Finds will act as
            a neutral mediator in all disputes between buyers and Sellers and
            will make a determination based on the evidence provided by both
            parties. If the Seller is found to be at fault (for example, the
            item was materially misrepresented, defects were not disclosed, or
            the item is not authentic), the sale may be reversed, the buyer
            refunded, and the item returned to the Seller at the Seller&apos;s
            expense. In such cases, the Seller will not receive a payout for the
            transaction, and Famous Finds may deduct any associated costs
            (including return shipping and authentication fees) from the
            Seller&apos;s account or future payouts. The decision of Famous
            Finds in any dispute shall be final and binding.
          </p>
        </div>

        <div className="card">
          <h2>10. Account Suspension &amp; Termination</h2>
          <p>
            Famous Finds reserves the right to suspend or permanently terminate
            any Seller account, at its sole discretion and without prior notice,
            for any of the following reasons: listing or attempting to sell
            counterfeit, prohibited, or restricted items; receiving repeated
            negative buyer feedback or dispute rulings; failure to ship items
            within the required timeframe on multiple occasions; engaging in
            fraudulent, deceptive, or abusive conduct; attempting to circumvent
            platform fees or direct transactions outside the Famous Finds
            platform; violating any provision of these Seller Terms or the
            general Terms &amp; Conditions; or any other conduct that Famous
            Finds reasonably determines to be harmful to the platform, its
            users, or its reputation. Upon termination, any pending payouts may
            be withheld pending resolution of outstanding claims or
            investigations. The Seller remains liable for any obligations
            incurred prior to account termination.
          </p>
        </div>

        <div className="card">
          <h2>11. Liability</h2>
          <p>
            To the fullest extent permitted by applicable law, Famous Finds
            shall not be liable for any indirect, incidental, special,
            consequential, or punitive damages arising out of or in connection
            with the Seller&apos;s use of the platform, including but not
            limited to loss of profits, loss of data, loss of goodwill, or
            business interruption. The total aggregate liability of Famous Finds
            to any Seller, for any and all claims arising under or in connection
            with these Seller Terms, shall not exceed the total amount of
            commissions earned by Famous Finds from that Seller in the twelve
            (12) months preceding the event giving rise to the claim. The Seller
            agrees to indemnify, defend, and hold harmless Famous Finds, its
            officers, directors, employees, agents, and affiliates from and
            against any and all claims, liabilities, damages, losses, costs, and
            expenses (including reasonable legal fees) arising out of or related
            to the Seller&apos;s listings, items sold, breach of these Seller
            Terms, or violation of any applicable law or the rights of any third
            party.
          </p>
        </div>

        <div className="card">
          <h2>12. Changes to These Terms</h2>
          <p>
            Famous Finds reserves the right to modify, amend, or replace these
            Seller Terms at any time. Any changes will be posted on this page,
            and where practicable, Sellers will be notified of material changes
            via email or through the Seller dashboard. The &quot;Last
            Updated&quot; date at the top of these terms will be revised
            accordingly. Continued use of the platform after the publication of
            revised Seller Terms constitutes your acceptance of and agreement to
            the updated terms. If you do not agree with the revised terms, you
            must cease listing and selling items on the platform and may request
            closure of your Seller account.
          </p>
        </div>

        <div className="card">
          <h2>13. Contact</h2>
          <p>
            If you have any questions, concerns, or feedback regarding these
            Seller Terms &amp; Conditions, or if you require assistance with
            your Seller account, please visit our{" "}
            <a href="/contact">Contact</a> page. Our support team is available
            to help with any queries related to selling on Famous Finds.
          </p>
        </div>
      </main>

      <Footer />

      <style jsx>{`
        .page {
          min-height: 100vh;
          background: #ffffff;
          color: #111827;
          display: flex;
          flex-direction: column;
        }
        .wrap {
          max-width: 900px;
          margin: 24px auto 60px;
          padding: 0 16px;
        }
        .back-link {
          display: inline-block;
          font-size: 14px;
          color: #2563eb;
          text-decoration: none;
          margin-bottom: 16px;
        }
        .back-link:hover {
          color: #1d4ed8;
          text-decoration: underline;
        }
        h1 {
          font-family: "Georgia", serif;
          font-size: 26px;
          margin-bottom: 8px;
        }
        .intro {
          font-size: 14px;
          color: #4b5563;
          margin-bottom: 18px;
        }
        .card {
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 18px;
          padding: 16px 18px;
          margin-bottom: 16px;
          box-shadow: 0 10px 30px rgba(15, 23, 42, 0.04);
        }
        .card h2 {
          font-size: 18px;
          margin-bottom: 6px;
        }
        .card p {
          font-size: 14px;
          color: #4b5563;
          line-height: 1.6;
        }
        .card a {
          color: #2563eb;
          text-decoration: underline;
        }
        .card a:hover {
          color: #1d4ed8;
        }
      `}</style>
    </div>
  );
}
