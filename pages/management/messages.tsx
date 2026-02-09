// FILE: /pages/management/messages.tsx

import Head from "next/head";
import Link from "next/link";
import { useState } from "react";
import type { GetServerSideProps } from "next";

import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useRequireAdmin } from "../../hooks/useRequireAdmin";
import { mgmtFetch } from "../../utils/managementClient";
import { adminDb } from "../../utils/firebaseAdmin";

export type BuyerMessage = {
  id: string;
  text: string;
  linkText?: string;
  linkUrl?: string;
  imageUrl?: string;
  videoUrl?: string;
  active: boolean;
  type: "info" | "promo" | "alert";
  createdAt?: number;
};

type Props = {
  initialMessages: BuyerMessage[];
};

export default function MessageBoardManagement({ initialMessages }: Props) {
  const { loading } = useRequireAdmin();
  const [messages, setMessages] = useState<BuyerMessage[]>(initialMessages);

  // Form State
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [formText, setFormText] = useState("");
  const [formLinkText, setFormLinkText] = useState("");
  const [formLinkUrl, setFormLinkUrl] = useState("");
  const [formImageUrl, setFormImageUrl] = useState("");
  const [formVideoUrl, setFormVideoUrl] = useState("");
  const [formType, setFormType] = useState<"info" | "promo" | "alert">("info");

  const startEdit = (m: BuyerMessage) => {
    setIsEditing(m.id);
    setFormText(m.text);
    setFormLinkText(m.linkText || "");
    setFormLinkUrl(m.linkUrl || "");
    setFormImageUrl(m.imageUrl || "");
    setFormVideoUrl(m.videoUrl || "");
    setFormType(m.type);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const resetForm = () => {
    setIsEditing(null);
    setFormText("");
    setFormLinkText("");
    setFormLinkUrl("");
    setFormImageUrl("");
    setFormVideoUrl("");
    setFormType("info");
  };

  const handleSave = async () => {
    if (!formText.trim()) {
      alert("Message text is required");
      return;
    }

    try {
      const payload = {
        text: formText.trim(),
        linkText: formLinkText.trim(),
        linkUrl: formLinkUrl.trim(),
        imageUrl: formImageUrl.trim(),
        videoUrl: formVideoUrl.trim(),
        type: formType,
      };

      if (isEditing) {
        // UPDATE via API
        const res = await mgmtFetch("/api/management/messages", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: isEditing, ...payload }),
        });
        const json = await res.json();
        if (!res.ok || !json.ok) {
          throw new Error(json?.error || "Failed to update message");
        }

        setMessages((prev) =>
          prev.map((m) => (m.id === isEditing ? { ...m, ...payload } : m))
        );
      } else {
        // CREATE via API
        const res = await mgmtFetch("/api/management/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (!res.ok || !json.ok || !json.id) {
          throw new Error(json?.error || "Failed to create message");
        }

        const newMessage: BuyerMessage = {
          id: json.id,
          text: payload.text,
          linkText: payload.linkText,
          linkUrl: payload.linkUrl,
          imageUrl: payload.imageUrl,
          videoUrl: payload.videoUrl,
          type: payload.type as BuyerMessage["type"],
          active: true,
          createdAt: Date.now(),
        };

        setMessages((prev) => [newMessage, ...prev]);
      }

      resetForm();
    } catch (error) {
      console.error("Error saving message:", error);
      alert("Failed to save message.");
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const res = await mgmtFetch("/api/management/messages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, active: !currentStatus }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json?.error || "Failed to toggle status");
      }

      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, active: !currentStatus } : m))
      );
    } catch (error) {
      console.error("Error toggling status:", error);
      alert("Failed to update message status.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this message permanently?")) return;
    try {
      const res = await mgmtFetch(`/api/management/messages?id=${id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json?.error || "Failed to delete message");
      }

      setMessages((prev) => prev.filter((m) => m.id !== id));
    } catch (error) {
      console.error("Error deleting message:", error);
      alert("Failed to delete message.");
    }
  };

  if (loading) return <div className="dashboard-page" />;

  return (
    <div className="dashboard-page">
      <Head>
        <title>Message Board Management - Admin</title>
      </Head>
      <Header />

      <main className="dashboard-main">
        <div className="dashboard-header">
          <div>
            <h1>Message Board</h1>
            <p>Manage the announcements shown to buyers on the homepage.</p>
          </div>
          <Link href="/management/dashboard">← Back to Dashboard</Link>
        </div>

        {/* EDITOR CARD */}
        <section className="editor-card">
          <h2>{isEditing ? "Edit Message" : "Create New Message"}</h2>
          <div className="form-grid">
            <label className="span-3">
              Message Text
              <textarea
                value={formText}
                onChange={(e) => setFormText(e.target.value)}
                placeholder="e.g. Boker Tov Ariel – enjoy your beautiful shop."
                rows={2}
                spellCheck={true}
                autoCorrect="on"
                autoCapitalize="sentences"
              />
              <span className="hint">
                <span style={{ color: "#059669" }}>✓</span> Spellcheck &amp;
                Auto-correct enabled.
              </span>
            </label>

            <label>
              Link Text (Optional)
              <input
                value={formLinkText}
                onChange={(e) => setFormLinkText(e.target.value)}
                placeholder="e.g. View Collection"
              />
            </label>

            <label>
              Link URL (Optional)
              <input
                value={formLinkUrl}
                onChange={(e) => setFormLinkUrl(e.target.value)}
                placeholder="e.g. /catalogue?tag=celebrity-collection"
              />
            </label>

            <label>
              Type
              <select
                className="type-select"
                value={formType}
                onChange={(e) =>
                  setFormType(e.target.value as BuyerMessage["type"])
                }
              >
                <option value="info">Info (Gray/Neutral)</option>
                <option value="promo">Promo (Green/Gold)</option>
                <option value="alert">Alert (Red/Important)</option>
              </select>
            </label>

            <label>
              Image URL (Optional)
              <input
                value={formImageUrl}
                onChange={(e) => setFormImageUrl(e.target.value)}
                placeholder="https://..."
              />
              <span className="hint">Shown under the text as a photo.</span>
            </label>

            <label>
              Video URL (Optional)
              <input
                value={formVideoUrl}
                onChange={(e) => setFormVideoUrl(e.target.value)}
                placeholder="MP4 / YouTube / Vimeo link"
              />
              <span className="hint">
                Short celebrity / collection clip (optional).
              </span>
            </label>
          </div>

          <div className="form-actions">
            <button className="btn-save" onClick={handleSave}>
              {isEditing ? "Update Message" : "Post Message"}
            </button>
            {isEditing && (
              <button className="btn-cancel" onClick={resetForm}>
                Cancel
              </button>
            )}
          </div>
        </section>

        {/* LIST */}
        <section className="message-list">
          <h3>Existing Messages</h3>
          {messages.length === 0 ? (
            <p className="empty">No messages created yet.</p>
          ) : (
            <div className="list-grid">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`message-item ${m.active ? "active" : "inactive"}`}
                >
                  <div className="message-content">
                    <span className={`type-badge ${m.type}`}>{m.type}</span>
                    <div>
                      <p className="text">
                        {m.text}{" "}
                        {m.linkText && (
                          <span className="link-preview">[{m.linkText}]</span>
                        )}
                      </p>
                      {(m.imageUrl || m.videoUrl) && (
                        <p className="media-tags">
                          {m.imageUrl && <span>📷 image</span>}
                          {m.videoUrl && <span>🎥 video</span>}
                        </p>
                      )}
                      <span className="status">
                        {m.active ? "● Live on site" : "○ Hidden"}
                      </span>
                    </div>
                  </div>

                  <div className="message-actions">
                    <button onClick={() => toggleActive(m.id, m.active)}>
                      {m.active ? "Hide" : "Publish"}
                    </button>
                    <button onClick={() => startEdit(m)}>Edit</button>
                    <button
                      className="delete"
                      onClick={() => handleDelete(m.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <Footer />

      <style jsx>{`
        .editor-card {
          background: #ffffff;
          padding: 24px;
          border-radius: 16px;
          border: 1px solid #e5e7eb;
          margin-bottom: 40px;
        }
        .editor-card h2 {
          margin: 0 0 16px;
          font-size: 18px;
        }
        .form-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
          margin-bottom: 20px;
        }
        .span-3 {
          grid-column: span 3;
        }
        label {
          display: flex;
          flex-direction: column;
          gap: 6px;
          font-size: 13px;
          font-weight: 600;
          color: #374151;
        }
        .hint {
          font-size: 11px;
          color: #6b7280;
          font-weight: 400;
        }
        input,
        select,
        textarea {
          padding: 10px;
          border-radius: 8px;
          border: 1px solid #d1d5db;
          font-family: inherit;
        }
        textarea {
          resize: vertical;
          min-height: 42px;
        }
        .form-actions {
          display: flex;
          gap: 12px;
        }
        .btn-save {
          background: #111827;
          color: white;
          padding: 10px 24px;
          border-radius: 99px;
          font-weight: 600;
          border: none;
          cursor: pointer;
        }
        .btn-cancel {
          background: white;
          border: 1px solid #d1d5db;
          padding: 10px 24px;
          border-radius: 99px;
          font-weight: 600;
          cursor: pointer;
        }

        /* VIVID TYPE DROPDOWN */
        .type-select {
          padding: 8px 10px;
          border-radius: 999px;
          border: 1px solid #d1d5db;
          font-size: 14px;
          font-weight: 600;
          background: linear-gradient(135deg, #ffffff, #f3f4f6);
        }
        .type-select:focus {
          outline: none;
          border-color: #111827;
          box-shadow: 0 0 0 2px rgba(15, 23, 42, 0.2);
        }
        .type-select option[value="info"] {
          background: #dbeafe; /* bright blue */
          color: #1e3a8a;
          font-weight: 700;
        }
        .type-select option[value="promo"] {
          background: #fef3c7; /* gold */
          color: #78350f;
          font-weight: 700;
        }
        .type-select option[value="alert"] {
          background: #fecaca; /* vivid red/pink */
          color: #7f1d1d;
          font-weight: 700;
        }

        /* MESSAGE LIST IN A NICE FULL-WIDTH BOX */
        .message-list {
          background: #ffffff;
          border-radius: 20px;
          border: 1px solid #e5e7eb;
          padding: 24px 24px 28px;
          margin-top: 32px;
          box-shadow: 0 10px 25px rgba(15, 23, 42, 0.08);
          width: 100%;
        }
        .message-list h3 {
          font-size: 18px;
          margin-bottom: 16px;
        }
        .list-grid {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .message-item {
          background: #ffffff;
          padding: 16px 20px;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .message-item.inactive {
          background: #f9fafb;
          border-style: dashed;
          opacity: 0.8;
        }
        .message-content {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }
        .type-badge {
          font-size: 10px;
          text-transform: uppercase;
          padding: 2px 6px;
          border-radius: 4px;
          font-weight: 700;
          margin-top: 3px;
        }
        .type-badge.info {
          background: #e5e7eb;
          color: #374151;
        }
        .type-badge.promo {
          background: #fef08a;
          color: #854d0e;
        }
        .type-badge.alert {
          background: #fecaca;
          color: #991b1b;
        }

        .text {
          font-size: 14px;
          font-weight: 500;
          margin: 0;
        }
        .media-tags {
          margin: 4px 0;
          display: flex;
          gap: 6px;
          font-size: 12px;
          color: #6b7280;
        }
        .status {
          font-size: 12px;
          color: #059669;
          font-weight: 600;
        }
        .inactive .status {
          color: #6b7280;
        }

        .message-actions {
          display: flex;
          gap: 8px;
        }
        .message-actions button {
          padding: 6px 12px;
          font-size: 12px;
          border-radius: 6px;
          border: 1px solid #d1d5db;
          background: white;
          cursor: pointer;
        }
        .message-actions button:hover {
          background: #f3f4f6;
        }
        .message-actions button.delete {
          color: #dc2626;
          border-color: #fca5a5;
        }
        .message-actions button.delete:hover {
          background: #fef2f2;
        }
        .empty {
          font-size: 14px;
          color: #6b7280;
        }
      `}</style>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async () => {
  try {
    if (!adminDb) return { props: { initialMessages: [] } };
    const snap = await adminDb
      .collection("buyer_messages")
      .orderBy("createdAt", "desc")
      .get();

    const messages: BuyerMessage[] = snap.docs.map((d) => {
      const data = d.data() as any;
      return {
        id: d.id,
        text: data.text || "",
        linkText: data.linkText || "",
        linkUrl: data.linkUrl || "",
        imageUrl: data.imageUrl || "",
        videoUrl: data.videoUrl || "",
        active: data.active ?? true,
        type: (data.type as BuyerMessage["type"]) || "info",
        createdAt: data.createdAt?.toMillis?.() || 0,
      };
    });

    return { props: { initialMessages: messages } };
  } catch (error) {
    console.error("Error loading messages for management board:", error);
    return { props: { initialMessages: [] } };
  }
};
