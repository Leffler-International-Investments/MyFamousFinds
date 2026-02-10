// FILE: /pages/seller/consignment-agreement.tsx
// Consignment Agreement page — first step for approved sellers before gaining dashboard access.
// Offers two paths: Download PDF to sign & email, or sign electronically.

import Head from "next/head";
import Link from "next/link";
import { useState, useEffect, useRef, FormEvent } from "react";
import { useRouter } from "next/router";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { isRoleSessionValid, getRoleSession, touchRoleSession } from "../../utils/roleSession";

export default function ConsignmentAgreementPage() {
  const router = useRouter();
  const [authChecking, setAuthChecking] = useState(true);
  const [sellerEmail, setSellerEmail] = useState("");

  // Form state
  const [fullName, setFullName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [downloadReady, setDownloadReady] = useState(false);

  const agreementRef = useRef<HTMLDivElement>(null);

  // Auth check (seller must be logged in, but we do NOT check agreement status here)
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isRoleSessionValid("seller")) {
      touchRoleSession();
      const { email } = getRoleSession();
      setSellerEmail(email || "");
      setAuthChecking(false);
    } else {
      router.replace("/seller/login?from=/seller/consignment-agreement");
    }
  }, [router]);

  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  async function handleElectronicSign(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!fullName.trim()) {
      setError("Please enter your full legal name.");
      return;
    }
    if (!agreedToTerms) {
      setError(
        "You must agree to the terms of the Consignment Agreement to proceed."
      );
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/seller/sign-agreement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: sellerEmail,
          fullName: fullName.trim(),
          businessName: businessName.trim(),
          address: address.trim(),
          phone: phone.trim(),
          method: "electronic",
        }),
      });
      const json = await res.json();

      if (!json.ok) {
        setError(json.message || "Failed to submit agreement.");
        return;
      }

      // Mark agreement as signed in localStorage
      window.localStorage.setItem("ff-agreement-signed", "true");
      setSuccess(
        "Agreement signed successfully! Redirecting to your dashboard..."
      );
      setTimeout(() => router.push("/seller/dashboard"), 2000);
    } catch (err) {
      console.error("sign_agreement_error", err);
      setError("Unexpected error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDownloadAndEmail() {
    setError(null);
    setSuccess(null);

    if (!fullName.trim()) {
      setError("Please enter your full legal name before downloading.");
      return;
    }

    setLoading(true);
    try {
      // Record that they chose the email method
      const res = await fetch("/api/seller/sign-agreement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: sellerEmail,
          fullName: fullName.trim(),
          businessName: businessName.trim(),
          address: address.trim(),
          phone: phone.trim(),
          method: "email",
        }),
      });
      const json = await res.json();

      if (!json.ok) {
        setError(json.message || "Failed to record agreement request.");
        return;
      }

      // Trigger browser print dialog for PDF
      setDownloadReady(true);
      setTimeout(() => window.print(), 500);

      setSuccess(
        "Please print or save as PDF, sign the document, and email it to admin@myfamousfinds.com. You will gain full access once we confirm receipt of your signed agreement."
      );
    } catch (err) {
      console.error("download_agreement_error", err);
      setError("Unexpected error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (authChecking) {
    return <div className="dashboard-page" />;
  }

  return (
    <>
      <Head>
        <title>Consignment Agreement - Famous Finds</title>
      </Head>
      <div className="dashboard-page">
        <Header />
        <main className="dashboard-main">
          <div className="dashboard-header">
            <div>
              <h1>Luxury Consignment Agreement</h1>
              <p>
                Please review and sign the agreement below to activate your
                seller account.
              </p>
            </div>
            <Link href="/seller/login">Back to Login</Link>
          </div>

          {error && (
            <div
              style={{
                background: "#fef2f2",
                color: "#b91c1c",
                padding: "12px 16px",
                borderRadius: "12px",
                marginBottom: "20px",
                fontSize: "14px",
              }}
            >
              {error}
            </div>
          )}
          {success && (
            <div
              style={{
                background: "#f0fdf4",
                color: "#166534",
                padding: "12px 16px",
                borderRadius: "12px",
                marginBottom: "20px",
                fontSize: "14px",
              }}
            >
              {success}
            </div>
          )}

          {/* Step indicator */}
          <div
            style={{
              background: "#fffbeb",
              border: "1px solid #fcd34d",
              borderRadius: "16px",
              padding: "16px 20px",
              marginBottom: "24px",
              fontSize: "14px",
              color: "#92400e",
            }}
          >
            <strong>Step 1 of 2:</strong> Sign the Consignment Agreement below.
            You can either sign electronically or download, sign, and email it
            to <strong>admin@myfamousfinds.com</strong>.
          </div>

          {/* Seller Details Form */}
          <section
            style={{
              background: "#fff",
              borderRadius: "18px",
              border: "1px solid #e5e7eb",
              padding: "24px",
              marginBottom: "24px",
              boxShadow: "0 12px 30px rgba(15,23,42,0.06)",
            }}
          >
            <h2
              style={{
                margin: "0 0 16px",
                fontSize: "18px",
                fontWeight: 600,
              }}
            >
              Your Details (Consignor)
            </h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "16px",
              }}
            >
              <label
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#374151",
                }}
              >
                Full Legal Name *
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  placeholder="Your full legal name"
                  style={{
                    padding: "10px",
                    borderRadius: "8px",
                    border: "1px solid #d1d5db",
                    fontSize: "14px",
                  }}
                />
              </label>
              <label
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#374151",
                }}
              >
                Business Name
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Your business name (if applicable)"
                  style={{
                    padding: "10px",
                    borderRadius: "8px",
                    border: "1px solid #d1d5db",
                    fontSize: "14px",
                  }}
                />
              </label>
              <label
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#374151",
                }}
              >
                Address
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Your mailing address"
                  style={{
                    padding: "10px",
                    borderRadius: "8px",
                    border: "1px solid #d1d5db",
                    fontSize: "14px",
                  }}
                />
              </label>
              <label
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#374151",
                }}
              >
                Phone
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Your phone number"
                  style={{
                    padding: "10px",
                    borderRadius: "8px",
                    border: "1px solid #d1d5db",
                    fontSize: "14px",
                  }}
                />
              </label>
              <label
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#374151",
                }}
              >
                Email
                <input
                  type="email"
                  value={sellerEmail}
                  disabled
                  style={{
                    padding: "10px",
                    borderRadius: "8px",
                    border: "1px solid #d1d5db",
                    fontSize: "14px",
                    background: "#f9fafb",
                    color: "#6b7280",
                  }}
                />
              </label>
            </div>
          </section>

          {/* Agreement Document */}
          <div
            ref={agreementRef}
            id="agreement-document"
            style={{
              background: "#fff",
              borderRadius: "18px",
              border: "1px solid #e5e7eb",
              padding: "32px",
              marginBottom: "24px",
              boxShadow: "0 12px 30px rgba(15,23,42,0.06)",
              fontFamily: '"Times New Roman", Georgia, serif',
              fontSize: "14px",
              lineHeight: "1.7",
              color: "#111",
            }}
          >
            <h2
              style={{
                textAlign: "center",
                fontSize: "22px",
                fontWeight: 700,
                marginBottom: "4px",
                letterSpacing: "0.02em",
              }}
            >
              LUXURY CONSIGNMENT AGREEMENT
            </h2>
            <p style={{ textAlign: "center", fontSize: "13px", color: "#6b7280", marginBottom: "24px" }}>
              MyFamousFinds.com
            </p>

            <p>
              <strong>Agreement Date:</strong> {today}
            </p>

            <h3 style={{ fontSize: "16px", marginTop: "20px" }}>
              1. PARTIES
            </h3>
            <p>
              This Consignment Agreement (&ldquo;Agreement&rdquo;) is entered
              into between:
            </p>
            <p>
              <strong>Consignor (Supplier):</strong>
              <br />
              Name: {fullName || "___________________"}
              <br />
              Business: {businessName || "___________________"}
              <br />
              Address: {address || "___________________"}
              <br />
              Email: {sellerEmail || "___________________"}
              <br />
              Phone: {phone || "___________________"}
            </p>
            <p>
              <strong>Consignee:</strong>
              <br />
              MyFamousFinds
              <br />
              Email: admin@myfamousfinds.com
            </p>

            <h3 style={{ fontSize: "16px", marginTop: "20px" }}>
              2. CONSIGNED ITEMS
            </h3>
            <p>
              The Consignor hereby delivers authentic luxury item(s) to the
              Consignee for sale on consignment. Items will be individually
              documented through the MyFamousFinds seller platform at the time
              of listing.
            </p>

            <h3 style={{ fontSize: "16px", marginTop: "20px" }}>
              3. CONSIGNOR REPRESENTATIONS AND WARRANTIES
            </h3>
            <p>The Consignor represents, warrants, and certifies that:</p>
            <ul style={{ paddingLeft: "24px" }}>
              <li>
                The Consignor is the lawful owner of all items listed and has
                full legal right and authority to consign these items for sale.
              </li>
              <li>
                All consigned items are authentic luxury goods and are not
                counterfeit, replica, or unauthorized copies.
              </li>
              <li>
                The items were lawfully acquired and the Consignor has clear
                title to all items without any liens, encumbrances, or
                third-party claims.
              </li>
              <li>
                The Consignor authorizes the Consignee to sell these items under
                the first sale doctrine (exhaustion of rights), which permits the
                resale of authentic goods that were lawfully purchased.
              </li>
              <li>
                The Consignor grants the Consignee permission to photograph,
                describe, and market the items through all sales channels
                including online platforms.
              </li>
              <li>
                All items are accurately described, including any defects or
                condition issues.
              </li>
            </ul>

            <h3 style={{ fontSize: "16px", marginTop: "20px" }}>
              4. CONSIGNMENT TERMS
            </h3>
            <p>
              <strong>4.1 Commission and Payment</strong>
              <br />
              Commission rates and payment terms are as agreed upon separately
              and documented in the MyFamousFinds seller platform settings.
              Payment will be processed through the Consignee&apos;s payment system
              (Stripe) according to the configured payout schedule.
            </p>
            <p>
              <strong>4.2 Consignment Period</strong>
              <br />
              Items remain listed until sold, removed by the Consignor, or
              otherwise agreed upon. Either party may request removal of specific
              items at any time.
            </p>
            <p>
              <strong>4.3 Pricing and Adjustments</strong>
              <br />
              Pricing is set by the Consignor through the seller platform. The
              Consignee may suggest price adjustments but will not change prices
              without Consignor approval.
            </p>
            <p>
              <strong>4.4 Item Return</strong>
              <br />
              If items are to be returned to the Consignor, the Consignor must
              arrange retrieval within 14 days of notification. Unclaimed items
              may be subject to storage fees.
            </p>

            <h3 style={{ fontSize: "16px", marginTop: "20px" }}>
              5. CONSIGNEE RESPONSIBILITIES
            </h3>
            <ul style={{ paddingLeft: "24px" }}>
              <li>
                Market and sell the consigned items through appropriate sales
                channels.
              </li>
              <li>
                Exercise reasonable care in handling and storing the items.
              </li>
              <li>
                Maintain insurance coverage for consigned items while in
                possession.
              </li>
              <li>Provide regular updates on item status and sales efforts.</li>
              <li>
                Authenticate items and ensure only genuine luxury goods are sold.
              </li>
              <li>
                Remit payment to Consignor according to the agreed timeline.
              </li>
            </ul>

            <h3 style={{ fontSize: "16px", marginTop: "20px" }}>
              6. LIABILITY AND INSURANCE
            </h3>
            <p>
              The Consignee maintains appropriate insurance coverage for loss,
              theft, or damage while items are in the Consignee&apos;s possession. The
              Consignor is responsible for ensuring adequate insurance coverage
              beyond this amount if desired.
            </p>

            <h3 style={{ fontSize: "16px", marginTop: "20px" }}>
              7. TERMINATION
            </h3>
            <p>
              Either party may terminate this agreement with 30 days written
              notice. Upon termination, all unsold items must be retrieved by the
              Consignor within 14 days, and all pending payments for sold items
              must be settled.
            </p>

            <h3 style={{ fontSize: "16px", marginTop: "20px" }}>
              8. INDEMNIFICATION
            </h3>
            <p>
              The Consignor agrees to indemnify and hold harmless the Consignee
              from any claims, damages, or legal actions arising from: (a) false
              representations about item authenticity or ownership, (b) copyright
              or trademark infringement claims, (c) third-party claims of
              ownership or liens on the consigned items.
            </p>

            <h3 style={{ fontSize: "16px", marginTop: "20px" }}>
              9. GOVERNING LAW
            </h3>
            <p>
              This Agreement shall be governed by the laws of the State of New
              York, United States.
            </p>

            <h3 style={{ fontSize: "16px", marginTop: "20px" }}>
              10. SIGNATURES
            </h3>
            <p>
              By signing below, both parties acknowledge that they have read,
              understood, and agree to be bound by the terms of this Consignment
              Agreement.
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "32px",
                marginTop: "24px",
              }}
            >
              <div>
                <p style={{ marginBottom: "4px", fontWeight: 700 }}>
                  CONSIGNOR
                </p>
                <p style={{ borderBottom: "1px solid #111", paddingBottom: "4px", marginBottom: "4px" }}>
                  {fullName || "___________________"}
                </p>
                <p style={{ fontSize: "12px", color: "#6b7280" }}>
                  Print Name
                </p>
                <p style={{ marginTop: "12px", fontSize: "12px", color: "#6b7280" }}>
                  Date: {today}
                </p>
              </div>
              <div>
                <p style={{ marginBottom: "4px", fontWeight: 700 }}>
                  CONSIGNEE
                </p>
                <p style={{ borderBottom: "1px solid #111", paddingBottom: "4px", marginBottom: "4px" }}>
                  MyFamousFinds
                </p>
                <p style={{ fontSize: "12px", color: "#6b7280" }}>
                  Print Name
                </p>
                <p style={{ marginTop: "12px", fontSize: "12px", color: "#6b7280" }}>
                  Date: {today}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {!success && (
            <section
              style={{
                background: "#fff",
                borderRadius: "18px",
                border: "1px solid #e5e7eb",
                padding: "24px",
                marginBottom: "24px",
                boxShadow: "0 12px 30px rgba(15,23,42,0.06)",
              }}
            >
              <h2
                style={{
                  margin: "0 0 8px",
                  fontSize: "18px",
                  fontWeight: 600,
                }}
              >
                Sign the Agreement
              </h2>
              <p
                style={{
                  margin: "0 0 20px",
                  fontSize: "14px",
                  color: "#6b7280",
                }}
              >
                Choose one of the options below to complete the agreement.
              </p>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "20px",
                }}
              >
                {/* Option A: Electronic Signature */}
                <div
                  style={{
                    padding: "20px",
                    borderRadius: "14px",
                    border: "2px solid #059669",
                    background: "#f0fdf4",
                  }}
                >
                  <h3
                    style={{
                      margin: "0 0 8px",
                      fontSize: "16px",
                      fontWeight: 600,
                      color: "#059669",
                    }}
                  >
                    Option A: Sign Electronically
                  </h3>
                  <p
                    style={{
                      margin: "0 0 16px",
                      fontSize: "13px",
                      color: "#374151",
                    }}
                  >
                    Sign digitally now and get immediate access to your seller
                    dashboard. Your typed name serves as your legal electronic
                    signature.
                  </p>
                  <form onSubmit={handleElectronicSign}>
                    <label
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "8px",
                        fontSize: "13px",
                        color: "#374151",
                        marginBottom: "12px",
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={agreedToTerms}
                        onChange={(e) => setAgreedToTerms(e.target.checked)}
                        style={{ marginTop: "2px" }}
                      />
                      <span>
                        I, <strong>{fullName || "[enter your name above]"}</strong>,
                        have read and agree to all terms of this Luxury
                        Consignment Agreement. I understand that typing my name
                        constitutes a legally binding electronic signature.
                      </span>
                    </label>
                    <button
                      type="submit"
                      disabled={loading || !fullName.trim() || !agreedToTerms}
                      style={{
                        width: "100%",
                        padding: "12px",
                        borderRadius: "999px",
                        border: "none",
                        background:
                          loading || !fullName.trim() || !agreedToTerms
                            ? "#9ca3af"
                            : "#059669",
                        color: "#fff",
                        fontSize: "14px",
                        fontWeight: 600,
                        cursor:
                          loading || !fullName.trim() || !agreedToTerms
                            ? "default"
                            : "pointer",
                      }}
                    >
                      {loading ? "Submitting..." : "Sign Agreement Electronically"}
                    </button>
                  </form>
                </div>

                {/* Option B: Download & Email */}
                <div
                  style={{
                    padding: "20px",
                    borderRadius: "14px",
                    border: "2px solid #d1d5db",
                    background: "#f9fafb",
                  }}
                >
                  <h3
                    style={{
                      margin: "0 0 8px",
                      fontSize: "16px",
                      fontWeight: 600,
                      color: "#374151",
                    }}
                  >
                    Option B: Download, Sign & Email
                  </h3>
                  <p
                    style={{
                      margin: "0 0 16px",
                      fontSize: "13px",
                      color: "#374151",
                    }}
                  >
                    Download the agreement as a PDF, sign it by hand, and email
                    the signed copy to{" "}
                    <strong>admin@myfamousfinds.com</strong>. Your account will
                    be activated once we confirm receipt.
                  </p>
                  <button
                    type="button"
                    onClick={handleDownloadAndEmail}
                    disabled={loading || !fullName.trim()}
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: "999px",
                      border: "1px solid #d1d5db",
                      background:
                        loading || !fullName.trim() ? "#e5e7eb" : "#fff",
                      color: "#111",
                      fontSize: "14px",
                      fontWeight: 600,
                      cursor:
                        loading || !fullName.trim() ? "default" : "pointer",
                    }}
                  >
                    {loading ? "Preparing..." : "Download Agreement as PDF"}
                  </button>
                  <p
                    style={{
                      marginTop: "8px",
                      fontSize: "12px",
                      color: "#6b7280",
                      textAlign: "center",
                    }}
                  >
                    Uses your browser&apos;s print dialog — choose &ldquo;Save as
                    PDF&rdquo;
                  </p>
                </div>
              </div>
            </section>
          )}
        </main>
        <Footer />
      </div>

      {/* Print styles — only show the agreement document when printing */}
      <style jsx global>{`
        @media print {
          header,
          footer,
          .dashboard-header,
          nav,
          .dashboard-welcome-banner {
            display: none !important;
          }
          .dashboard-page {
            background: #fff !important;
          }
          .dashboard-main {
            padding: 0 !important;
          }
          .dashboard-main > *:not(#agreement-document) {
            display: none !important;
          }
          #agreement-document {
            display: block !important;
            border: none !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            padding: 20px !important;
            font-size: 12px !important;
          }
        }

        @media (max-width: 768px) {
          #agreement-actions-grid {
            grid-template-columns: 1fr !important;
          }
          #seller-details-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </>
  );
}
