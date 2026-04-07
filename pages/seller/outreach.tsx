// FILE: /pages/seller/outreach.tsx
// Seller Outreach Tool — share listings with personal contacts via branded email,
// shareable link, or WhatsApp / SMS copy-paste.

import Head from "next/head";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useEffect, useState } from "react";
import { useRequireSeller } from "../../hooks/useRequireSeller";
import { sellerFetch } from "../../utils/sellerClient";

type Listing = {
  id: string;
  title: string;
  price: number;
  brand?: string;
  imageUrl?: string;
  status: string;
};

type Contact = {
  id: string;
  name: string;
  email: string;
};

const SITE_URL =
  typeof window !== "undefined"
    ? window.location.origin
    : "https://www.myfamousfinds.com";

export default function SellerOutreach() {
  const { loading: authLoading } = useRequireSeller();

  /* ─── State ─── */
  const [listings, setListings] = useState<Listing[]>([]);
  const [loadingListings, setLoadingListings] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [contactError, setContactError] = useState<string | null>(null);

  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sellerName, setSellerName] = useState("");

  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{
    ok: boolean;
    sent?: number;
    failed?: string[];
    error?: string;
  } | null>(null);

  const [testMode, setTestMode] = useState(false);

  const TEST_ITEM = {
    id: "test-item",
    title: "Sample Chanel Classic Flap Bag",
    price: 4500,
    brand: "Chanel",
    imageUrl: "https://www.myfamousfinds.com/FF-Logo.png",
  };

  /* ─── Load listings ─── */
  useEffect(() => {
    const sellerEmail = String(
      typeof window !== "undefined"
        ? window.localStorage.getItem("ff-email") || ""
        : ""
    )
      .trim()
      .toLowerCase();
    if (sellerEmail) {
      const parts = sellerEmail.split("@")[0];
      setSellerName(parts.charAt(0).toUpperCase() + parts.slice(1));
    }

    sellerFetch("/api/seller/listings")
      .then((r) => r.json())
      .then((data) => {
        if (data?.ok && Array.isArray(data.items)) {
          const live = data.items
            .filter((i: any) => /live|approved|active/i.test(i.status || ""))
            .map((i: any) => ({
              id: i.id,
              title: i.title || "Untitled",
              price: Number(i.price || 0),
              brand: i.brand || "",
              imageUrl: i.imageUrl || i.imageDataUrl || "",
              status: i.status || "",
            }));
          setListings(live);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingListings(false));
  }, []);

  /* ─── Contact management ─── */
  const addContact = () => {
    setContactError(null);
    const email = newEmail.trim().toLowerCase();
    const name = newName.trim();
    if (!email || !email.includes("@")) {
      setContactError("Enter a valid email address.");
      return;
    }
    if (contacts.find((c) => c.email === email)) {
      setContactError("This email is already in your list.");
      return;
    }
    if (contacts.length >= 50) {
      setContactError("Maximum 50 contacts per send.");
      return;
    }
    setContacts((prev) => [
      ...prev,
      { id: Date.now().toString(), name: name || email.split("@")[0], email },
    ]);
    setNewName("");
    setNewEmail("");
  };

  const removeContact = (id: string) =>
    setContacts((prev) => prev.filter((c) => c.id !== id));

  /* ─── Item selection ─── */
  const toggleItem = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectedListings = listings.filter((l) => selectedIds.has(l.id));

  /* ─── Send email ─── */
  const sendEmail = async () => {
    setSendResult(null);
    if (!contacts.length) {
      setSendResult({ ok: false, error: "Add at least one contact." });
      return;
    }
    const itemsToSend = testMode ? [TEST_ITEM] : selectedListings;
    if (!itemsToSend.length) {
      setSendResult({ ok: false, error: "Select at least one listing to share." });
      return;
    }
    setSending(true);
    try {
      const res = await sellerFetch("/api/seller/outreach-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contacts: contacts.map((c) => c.email),
          subject: testMode ? `[TEST] ${subject || "Famous Finds test email"}` : subject,
          message: testMode ? `[This is a test email to verify template styling]\n\n${message}` : message,
          sellerName,
          items: itemsToSend.map((l) => ({
            id: l.id,
            title: l.title,
            price: l.price,
            brand: l.brand,
            imageUrl: l.imageUrl,
          })),
        }),
      });
      const json = await res.json();
      setSendResult(json);
    } catch {
      setSendResult({ ok: false, error: "Network error. Please try again." });
    } finally {
      setSending(false);
    }
  };

  /* ─── Copy helpers ─── */
  const copyLink = (id: string) => {
    const url = `${SITE_URL}/product/${id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2200);
    });
  };

  const copyWhatsApp = (listing: Listing) => {
    const url = `${SITE_URL}/product/${listing.id}`;
    const text = `Hi! I'm selling this ${listing.brand ? listing.brand + " " : ""}${listing.title} for US$${listing.price.toLocaleString("en-US")} on MyFamousFinds.com — check it out: ${url}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(`wa-${listing.id}`);
      setTimeout(() => setCopiedId(null), 2200);
    });
  };

  const copyAllLinks = () => {
    if (!selectedListings.length) return;
    const text = selectedListings
      .map(
        (l) =>
          `${l.brand ? l.brand + " — " : ""}${l.title} (US$${l.price.toLocaleString("en-US")}): ${SITE_URL}/product/${l.id}`
      )
      .join("\n");
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId("all");
      setTimeout(() => setCopiedId(null), 2200);
    });
  };

  if (authLoading) return <div className="outreach-page" />;

  return (
    <>
      <Head>
        <title>Outreach — Share Your Listings | Famous Finds</title>
      </Head>
      <div className="outreach-page">
        <Header />
        <main className="outreach-main">
          <div className="outreach-back">
            <Link href="/seller/dashboard">← Back to Dashboard</Link>
          </div>
          <div className="outreach-header">
            <h1>Share Your Listings</h1>
            <p className="outreach-subtitle">
              Invite your circle of influence to browse and buy your items on MyFamousFinds.com.
              Send a branded email, or copy links for WhatsApp / SMS.
            </p>
          </div>

          {/* ─── Tab switcher ─── */}
          <div className="tabs">
            <button
              className={`tab-btn${tab === "email" ? " tab-active" : ""}`}
              onClick={() => setTab("email")}
            >
              ✉️ Email Outreach
            </button>
            <button
              className={`tab-btn${tab === "links" ? " tab-active" : ""}`}
              onClick={() => setTab("links")}
            >
              🔗 Copy Links (WhatsApp / SMS)
            </button>
          </div>

          {/* ─── Shared: item picker ─── */}
          <section className="card">
            <h2 className="card-title">
              Select items to share
              {selectedIds.size > 0 && !testMode && (
                <span className="selected-badge">{selectedIds.size} selected</span>
              )}
              {testMode && (
                <span className="selected-badge" style={{ background: "#b45309" }}>TEST MODE</span>
              )}
            </h2>

            {/* Test email toggle */}
            <div className="test-mode-row">
              <label className="test-mode-label">
                <input
                  type="checkbox"
                  checked={testMode}
                  onChange={(e) => setTestMode(e.target.checked)}
                  style={{ marginRight: 8 }}
                />
                Send test email (uses a sample item — no real listings required)
              </label>
              {testMode && (
                <p className="test-mode-hint">
                  A sample item card will be included so you can verify the email template, logo, and styling.
                </p>
              )}
            </div>
            {!testMode && (loadingListings ? (
              <p className="hint-text">Loading your listings…</p>
            ) : listings.length === 0 ? (
              <p className="hint-text">
                No live listings found.{" "}
                <Link href="/seller/bulk-simple">Create a listing →</Link>
              </p>
            ) : (
              <div className="items-grid">
                {listings.map((listing) => {
                  const selected = selectedIds.has(listing.id);
                  return (
                    <div
                      key={listing.id}
                      className={`item-card${selected ? " item-card--selected" : ""}`}
                      onClick={() => toggleItem(listing.id)}
                    >
                      <div className="item-card-check">
                        {selected ? "✓" : ""}
                      </div>
                      {listing.imageUrl ? (
                        <img
                          src={listing.imageUrl}
                          alt={listing.title}
                          className="item-card-img"
                        />
                      ) : (
                        <div className="item-card-no-img">👜</div>
                      )}
                      <div className="item-card-body">
                        {listing.brand && (
                          <span className="item-card-brand">{listing.brand}</span>
                        )}
                        <p className="item-card-title">{listing.title}</p>
                        <p className="item-card-price">
                          US${listing.price.toLocaleString("en-US")}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </section>

          {/* ─── EMAIL TAB ─── */}
          {tab === "email" && (
            <>
              {/* Contacts */}
              <section className="card">
                <h2 className="card-title">
                  Your contacts
                  {contacts.length > 0 && (
                    <span className="selected-badge">{contacts.length} / 50</span>
                  )}
                </h2>
                <p className="hint-text">
                  Add the people you want to invite. Emails are sent from Famous Finds on your behalf.
                </p>
                <div className="contact-add-row">
                  <input
                    className="contact-input"
                    type="text"
                    placeholder="Name (optional)"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addContact()}
                  />
                  <input
                    className="contact-input contact-email-input"
                    type="email"
                    placeholder="Email address *"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addContact()}
                  />
                  <button className="btn-add-contact" onClick={addContact}>
                    + Add
                  </button>
                </div>
                {contactError && (
                  <p className="error-text">{contactError}</p>
                )}
                {contacts.length > 0 && (
                  <div className="contact-list">
                    {contacts.map((c) => (
                      <div key={c.id} className="contact-tag">
                        <span className="contact-tag-name">{c.name}</span>
                        <span className="contact-tag-email">{c.email}</span>
                        <button
                          className="contact-tag-remove"
                          onClick={() => removeContact(c.id)}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Compose */}
              <section className="card">
                <h2 className="card-title">Compose</h2>
                <div className="compose-field">
                  <label className="compose-label">Your name (shown in email)</label>
                  <input
                    className="compose-input"
                    type="text"
                    value={sellerName}
                    onChange={(e) => setSellerName(e.target.value)}
                    placeholder="e.g. Sarah"
                  />
                </div>
                <div className="compose-field">
                  <label className="compose-label">Subject (optional)</label>
                  <input
                    className="compose-input"
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. I'm selling some luxury pieces you might love"
                  />
                </div>
                <div className="compose-field">
                  <label className="compose-label">Personal message (optional)</label>
                  <textarea
                    className="compose-textarea"
                    rows={3}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="e.g. Hi! I've been clearing out my wardrobe and thought you might love these pieces…"
                  />
                </div>
              </section>

              {/* Send */}
              <div className="send-row">
                <button
                  className="btn-send"
                  onClick={sendEmail}
                  disabled={sending || !contacts.length || (!testMode && !selectedListings.length)}
                >
                  {sending
                    ? "Sending…"
                    : `Send to ${contacts.length} contact${contacts.length !== 1 ? "s" : ""}`}
                </button>
              </div>

              {sendResult && (
                <div className={`send-result${sendResult.ok ? " send-result--ok" : " send-result--err"}`}>
                  {sendResult.ok ? (
                    <>
                      <strong>✓ Sent successfully</strong> — {sendResult.sent} email
                      {sendResult.sent !== 1 ? "s" : ""} delivered.
                      {sendResult.failed && sendResult.failed.length > 0 && (
                        <span>
                          {" "}Failed: {sendResult.failed.join(", ")}
                        </span>
                      )}
                    </>
                  ) : (
                    <><strong>Error:</strong> {sendResult.error}</>
                  )}
                </div>
              )}
            </>
          )}

          {/* ─── LINKS TAB ─── */}
          {tab === "links" && (
            <section className="card">
              <h2 className="card-title">Share links</h2>
              <p className="hint-text">
                Copy individual item links or the full message text to paste into WhatsApp, SMS, or any chat.
              </p>

              {selectedListings.length > 1 && (
                <button
                  className="btn-copy-all"
                  onClick={copyAllLinks}
                >
                  {copiedId === "all" ? "✓ Copied all!" : `Copy all ${selectedListings.length} links`}
                </button>
              )}

              {selectedListings.length === 0 ? (
                <p className="hint-text" style={{ marginTop: 12 }}>
                  Select items above to generate shareable links.
                </p>
              ) : (
                <div className="links-list">
                  {selectedListings.map((listing) => {
                    const url = `${SITE_URL}/product/${listing.id}`;
                    return (
                      <div key={listing.id} className="link-row">
                        <div className="link-row-info">
                          {listing.imageUrl && (
                            <img src={listing.imageUrl} alt="" className="link-row-img" />
                          )}
                          <div>
                            {listing.brand && (
                              <span className="link-row-brand">{listing.brand}</span>
                            )}
                            <p className="link-row-title">{listing.title}</p>
                            <p className="link-row-price">
                              US${listing.price.toLocaleString("en-US")}
                            </p>
                          </div>
                        </div>
                        <div className="link-row-url">
                          <span className="link-url-text">{url}</span>
                        </div>
                        <div className="link-row-actions">
                          <button
                            className="btn-copy-link"
                            onClick={() => copyLink(listing.id)}
                          >
                            {copiedId === listing.id ? "✓ Copied!" : "Copy link"}
                          </button>
                          <button
                            className="btn-copy-wa"
                            onClick={() => copyWhatsApp(listing)}
                          >
                            {copiedId === `wa-${listing.id}` ? "✓ Copied!" : "Copy WhatsApp / SMS text"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          )}
        </main>
        <Footer />
      </div>

      <style jsx>{`
        .outreach-page {
          background: #f9fafb;
          min-height: 100vh;
          color: #111827;
        }
        .outreach-main {
          max-width: 860px;
          margin: 0 auto;
          padding: 24px 16px 64px;
        }
        .outreach-back a {
          color: #4b5563;
          font-size: 13px;
          text-decoration: none;
        }
        .outreach-back a:hover { color: #111827; }
        .outreach-header {
          margin: 16px 0 24px;
        }
        .outreach-header h1 {
          font-size: 28px;
          font-weight: 800;
          margin: 0 0 6px;
        }
        .outreach-subtitle {
          font-size: 14px;
          color: #6b7280;
          margin: 0;
          max-width: 600px;
          line-height: 1.6;
        }

        /* Tabs */
        .tabs {
          display: flex;
          gap: 8px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }
        .tab-btn {
          padding: 10px 22px;
          border-radius: 999px;
          border: 1px solid #d1d5db;
          background: #fff;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          color: #374151;
          transition: all 0.15s;
        }
        .tab-btn:hover { border-color: #111827; }
        .tab-active {
          background: #111827;
          color: #fff;
          border-color: #111827;
        }

        /* Cards */
        .card {
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 14px;
          padding: 24px;
          margin-bottom: 20px;
        }
        .card-title {
          font-size: 16px;
          font-weight: 700;
          margin: 0 0 14px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .selected-badge {
          background: #111827;
          color: #fff;
          font-size: 12px;
          font-weight: 600;
          padding: 2px 10px;
          border-radius: 999px;
        }
        .hint-text {
          font-size: 13px;
          color: #6b7280;
          margin: 0 0 14px;
          line-height: 1.5;
        }
        .hint-text a {
          color: #b8860b;
          text-decoration: none;
        }
        .error-text {
          font-size: 13px;
          color: #dc2626;
          margin: 6px 0 0;
        }

        /* Item grid */
        .items-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
          gap: 12px;
        }
        .item-card {
          border: 2px solid #e5e7eb;
          border-radius: 10px;
          cursor: pointer;
          overflow: hidden;
          transition: border-color 0.15s, box-shadow 0.15s;
          position: relative;
          background: #fff;
        }
        .item-card:hover { border-color: #b8860b; }
        .item-card--selected {
          border-color: #111827;
          box-shadow: 0 0 0 2px #111827;
        }
        .item-card-check {
          position: absolute;
          top: 6px;
          right: 6px;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: #111827;
          color: #fff;
          font-size: 13px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.15s;
        }
        .item-card--selected .item-card-check { opacity: 1; }
        .item-card-img {
          width: 100%;
          height: 110px;
          object-fit: cover;
          display: block;
        }
        .item-card-no-img {
          width: 100%;
          height: 110px;
          background: #f5f5f4;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 36px;
        }
        .item-card-body {
          padding: 8px 10px 10px;
        }
        .item-card-brand {
          font-size: 10px;
          font-weight: 700;
          color: #b8860b;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          display: block;
          margin-bottom: 2px;
        }
        .item-card-title {
          font-size: 12px;
          font-weight: 600;
          color: #111827;
          margin: 0 0 4px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .item-card-price {
          font-size: 13px;
          font-weight: 700;
          color: #1c1917;
          margin: 0;
        }

        /* Contact add row */
        .contact-add-row {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 10px;
        }
        .contact-input {
          padding: 9px 12px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 14px;
          flex: 1;
          min-width: 130px;
          background: #fff;
          color: #111827;
        }
        .contact-input:focus {
          outline: none;
          border-color: #111827;
        }
        .contact-email-input { flex: 2; }
        .btn-add-contact {
          padding: 9px 18px;
          background: #111827;
          color: #fff;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
        }
        .btn-add-contact:hover { opacity: 0.85; }

        /* Contact tags */
        .contact-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 12px;
        }
        .contact-tag {
          display: flex;
          align-items: center;
          gap: 6px;
          background: #f3f4f6;
          border: 1px solid #e5e7eb;
          border-radius: 999px;
          padding: 5px 10px 5px 12px;
          font-size: 13px;
        }
        .contact-tag-name { font-weight: 600; color: #111827; }
        .contact-tag-email { color: #6b7280; }
        .contact-tag-remove {
          background: none;
          border: none;
          cursor: pointer;
          color: #9ca3af;
          font-size: 16px;
          line-height: 1;
          padding: 0 2px;
        }
        .contact-tag-remove:hover { color: #dc2626; }

        /* Compose */
        .compose-field { margin-bottom: 16px; }
        .compose-label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 6px;
        }
        .compose-input {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 14px;
          background: #fff;
          color: #111827;
          box-sizing: border-box;
        }
        .compose-input:focus, .compose-textarea:focus {
          outline: none;
          border-color: #111827;
        }
        .compose-textarea {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 14px;
          background: #fff;
          color: #111827;
          resize: vertical;
          font-family: inherit;
          line-height: 1.5;
          box-sizing: border-box;
        }

        /* Send */
        .send-row {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 16px;
        }
        .btn-send {
          padding: 12px 36px;
          background: #111827;
          color: #fff;
          border: none;
          border-radius: 999px;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          transition: opacity 0.15s;
        }
        .btn-send:hover { opacity: 0.85; }
        .btn-send:disabled { background: #9ca3af; cursor: not-allowed; opacity: 1; }
        .send-result {
          padding: 14px 18px;
          border-radius: 10px;
          font-size: 14px;
          margin-bottom: 20px;
        }
        .send-result--ok { background: #f0fdf4; border: 1px solid #bbf7d0; color: #166534; }
        .send-result--err { background: #fef2f2; border: 1px solid #fecaca; color: #991b1b; }

        /* Links tab */
        .btn-copy-all {
          margin-bottom: 18px;
          padding: 10px 24px;
          background: #1c1917;
          color: #d4a843;
          border: none;
          border-radius: 999px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          letter-spacing: 0.02em;
        }
        .btn-copy-all:hover { opacity: 0.85; }
        .links-list { display: flex; flex-direction: column; gap: 14px; }
        .link-row {
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          padding: 14px;
          background: #fafafa;
        }
        .link-row-info {
          display: flex;
          gap: 12px;
          align-items: center;
          margin-bottom: 10px;
        }
        .link-row-img {
          width: 52px;
          height: 52px;
          object-fit: cover;
          border-radius: 6px;
          flex-shrink: 0;
        }
        .link-row-brand {
          font-size: 11px;
          font-weight: 700;
          color: #b8860b;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          display: block;
          margin-bottom: 2px;
        }
        .link-row-title {
          font-size: 14px;
          font-weight: 600;
          color: #111827;
          margin: 0 0 2px;
        }
        .link-row-price {
          font-size: 13px;
          font-weight: 700;
          color: #1c1917;
          margin: 0;
        }
        .link-row-url {
          background: #f3f4f6;
          border-radius: 6px;
          padding: 7px 10px;
          margin-bottom: 10px;
          overflow: hidden;
        }
        .link-url-text {
          font-size: 12px;
          color: #374151;
          word-break: break-all;
          font-family: monospace;
        }
        .link-row-actions { display: flex; gap: 8px; flex-wrap: wrap; }
        .btn-copy-link {
          padding: 8px 16px;
          border-radius: 999px;
          border: 1px solid #111827;
          background: #fff;
          color: #111827;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
        }
        .btn-copy-link:hover { background: #111827; color: #fff; }
        .btn-copy-wa {
          padding: 8px 16px;
          border-radius: 999px;
          border: none;
          background: #25d366;
          color: #fff;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.15s;
        }
        .btn-copy-wa:hover { opacity: 0.85; }

        /* Test mode */
        .test-mode-row {
          margin-bottom: 14px;
          padding: 10px 14px;
          background: #fffbeb;
          border: 1px solid #fde68a;
          border-radius: 8px;
        }
        .test-mode-label {
          display: flex;
          align-items: center;
          font-size: 13px;
          font-weight: 600;
          color: #92400e;
          cursor: pointer;
        }
        .test-mode-hint {
          margin: 6px 0 0 24px;
          font-size: 12px;
          color: #b45309;
          line-height: 1.5;
        }
      `}</style>
    </>
  );
}
