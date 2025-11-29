// FILE: /pages/management/messages.tsx

import Head from "next/head";
import Link from "next/link";
import { useState } from "react";
import type { GetServerSideProps } from "next";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useRequireAdmin } from "../../hooks/useRequireAdmin";
import { adminDb } from "../../utils/firebaseAdmin";
import { db } from "../../utils/firebaseClient";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";

// Define the Message type
export type BuyerMessage = {
  id: string;
  text: string;
  linkText?: string;
  linkUrl?: string;
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
  const [formType, setFormType] = useState<"info" | "promo" | "alert">("info");

  // Load data into form for editing
  const startEdit = (m: BuyerMessage) => {
    setIsEditing(m.id);
    setFormText(m.text);
    setFormLinkText(m.linkText || "");
    setFormLinkUrl(m.linkUrl || "");
    setFormType(m.type);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setIsEditing(null);
    setFormText("");
    setFormLinkText("");
    setFormLinkUrl("");
    setFormType("info");
  };

  const handleSave = async () => {
    if (!formText.trim()) return alert("Message text is required");

    try {
      const payload = {
        text: formText,
        linkText: formLinkText,
        linkUrl: formLinkUrl,
        type: formType,
        updatedAt: serverTimestamp(),
      };

      if (isEditing) {
        // Update existing
        const ref = doc(db, "buyer_messages", isEditing);
        await updateDoc(ref, payload);
        
        setMessages((prev) =>
          prev.map((m) => (m.id === isEditing ? { ...m, ...payload } : m))
        );
      } else {
        // Create new
        const ref = await addDoc(collection(db, "buyer_messages"), {
          ...payload,
          active: true,
          createdAt: serverTimestamp(),
        });

        // Add to local list immediately
        setMessages((prev) => [
          {
            id: ref.id,
            text: formText,
            linkText: formLinkText,
            linkUrl: formLinkUrl,
            active: true,
            type: formType,
            createdAt: Date.now(),
          },
          ...prev,
        ]);
      }
      cancelEdit();
    } catch (error) {
      console.error("Error saving message:", error);
      alert("Failed to save message.");
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const ref = doc(db, "buyer_messages", id);
      await updateDoc(ref, { active: !currentStatus });
      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, active: !currentStatus } : m))
      );
    } catch (error) {
      console.error("Error toggling status:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this message permanently?")) return;
    try {
      await deleteDoc(doc(db, "buyer_messages", id));
      setMessages((prev) => prev.filter((m) => m.id !== id));
    } catch (error) {
      console.error("Error deleting message:", error);
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
            <label className="span-2">
              Message Text
              <input
                value={formText}
                onChange={(e) => setFormText(e.target.value)}
                placeholder="e.g. Boker Tov Ariel - Enjoy Your New Shop"
              />
            </label>

            <label>
              Link Text (Optional)
              <input
                value={formLinkText}
                onChange={(e) => setFormLinkText(e.target.value)}
                placeholder="e.g. Catalogue"
              />
            </label>

            <label>
              Link URL (Optional)
              <input
                value={formLinkUrl}
                onChange={(e) => setFormLinkUrl(e.target.value)}
                placeholder="e.g. /designers"
              />
            </label>

            <label>
              Type
              <select
                value={formType}
                onChange={(e) => setFormType(e.target.value as any)}
              >
                <option value="info">Info (Gray/Neutral)</option>
                <option value="promo">Promo (Green/Gold)</option>
                <option value="alert">Alert (Red/Important)</option>
              </select>
            </label>
          </div>

          <div className="form-actions">
            <button className="btn-save" onClick={handleSave}>
              {isEditing ? "Update Message" : "Post Message"}
            </button>
            {isEditing && (
              <button className="btn-cancel" onClick={cancelEdit}>
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
                <div key={m.id} className={`message-item ${m.active ? "active" : "inactive"}`}>
                  <div className="message-content">
                    <span className={`type-badge ${m.type}`}>{m.type}</span>
                    <p className="text">
                      {m.text}{" "}
                      {m.linkText && (
                        <span className="link-preview">[{m.linkText}]</span>
                      )}
                    </p>
                    <span className="status">
                      {m.active ? "● Live on site" : "○ Hidden"}
                    </span>
                  </div>
                  
                  <div className="message-actions">
                    <button onClick={() => toggleActive(m.id, m.active)}>
                      {m.active ? "Hide" : "Publish"}
                    </button>
                    <button onClick={() => startEdit(m)}>Edit</button>
                    <button className="delete" onClick={() => handleDelete(m.id)}>
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
          grid-template-columns: 1fr 1fr 1fr;
          gap: 16px;
          margin-bottom: 20px;
        }
        .span-2 {
          grid-column: span 2;
        }
        label {
          display: flex;
          flex-direction: column;
          gap: 6px;
          font-size: 13px;
          font-weight: 600;
          color: #374151;
        }
        input, select {
          padding: 10px;
          border-radius: 8px;
          border: 1px solid #d1d5db;
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
          align-items: center;
          gap: 12px;
        }
        .type-badge {
          font-size: 10px;
          text-transform: uppercase;
          padding: 2px 6px;
          border-radius: 4px;
          font-weight: 700;
        }
        .type-badge.info { background: #e5e7eb; color: #374151; }
        .type-badge.promo { background: #fef08a; color: #854d0e; }
        .type-badge.alert { background: #fecaca; color: #991b1b; }

        .text {
          font-size: 14px;
          font-weight: 500;
          margin: 0;
        }
        .link-preview {
          color: #2563eb;
          font-size: 12px;
        }
        .status {
          font-size: 12px;
          color: #059669;
          font-weight: 600;
          margin-left: 12px;
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
      `}</style>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async () => {
  try {
    const snap = await adminDb
      .collection("buyer_messages")
      .orderBy("createdAt", "desc")
      .get();

    const messages = snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        text: data.text || "",
        linkText: data.linkText || "",
        linkUrl: data.linkUrl || "",
        active: data.active ?? true,
        type: data.type || "info",
        createdAt: data.createdAt?.toMillis?.() || 0,
      };
    });

    return { props: { initialMessages: messages } };
  } catch (error) {
    return { props: { initialMessages: [] } };
  }
};
