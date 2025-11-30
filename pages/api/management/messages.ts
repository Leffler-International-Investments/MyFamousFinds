// FILE: /pages/api/management/messages.ts

import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb, FieldValue } from "../../../utils/firebaseAdmin";

type MessageType = "info" | "promo" | "alert";

const collectionRef = adminDb.collection("buyer_messages");

type ApiResponse =
  | { ok: true; id?: string }
  | { ok: false; error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  try {
    const { method } = req;

    // ------------------------------------------------------
    // CREATE
    // ------------------------------------------------------
    if (method === "POST") {
      const { text, linkText, linkUrl, imageUrl, videoUrl, type } =
        req.body || {};

      if (!text || typeof text !== "string") {
        return res
          .status(400)
          .json({ ok: false, error: "Message text is required" });
      }

      const docRef = await collectionRef.add({
        text: text.trim(),
        linkText: (linkText || "").trim(),
        linkUrl: (linkUrl || "").trim(),
        imageUrl: (imageUrl || "").trim(), // ✅ NEW
        videoUrl: (videoUrl || "").trim(), // ✅ NEW
        type: (type as MessageType) || "info",
        active: true,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      return res.status(200).json({ ok: true, id: docRef.id });
    }

    // ------------------------------------------------------
    // UPDATE FULL MESSAGE
    // ------------------------------------------------------
    if (method === "PUT") {
      const { id, text, linkText, linkUrl, imageUrl, videoUrl, type } =
        req.body || {};

      if (!id || typeof id !== "string") {
        return res
          .status(400)
          .json({ ok: false, error: "Missing message id" });
      }
      if (!text || typeof text !== "string") {
        return res
          .status(400)
          .json({ ok: false, error: "Message text is required" });
      }

      const docRef = collectionRef.doc(id);

      await docRef.update({
        text: text.trim(),
        linkText: (linkText || "").trim(),
        linkUrl: (linkUrl || "").trim(),
        imageUrl: (imageUrl || "").trim(), // ✅ NEW
        videoUrl: (videoUrl || "").trim(), // ✅ NEW
        type: (type as MessageType) || "info",
        updatedAt: FieldValue.serverTimestamp(),
      });

      return res.status(200).json({ ok: true });
    }

    // ------------------------------------------------------
    // TOGGLE ACTIVE
    // ------------------------------------------------------
    if (method === "PATCH") {
      const { id, active } = req.body || {};

      if (!id || typeof id !== "string") {
        return res
          .status(400)
          .json({ ok: false, error: "Missing message id" });
      }

      const docRef = collectionRef.doc(id);

      await docRef.update({
        active: !!active,
        updatedAt: FieldValue.serverTimestamp(),
      });

      return res.status(200).json({ ok: true });
    }

    // ------------------------------------------------------
    // DELETE
    // ------------------------------------------------------
    if (method === "DELETE") {
      const id =
        (req.query.id as string | undefined) ||
        (req.body && (req.body.id as string | undefined));

      if (!id || typeof id !== "string") {
        return res
          .status(400)
          .json({ ok: false, error: "Missing message id" });
      }

      const docRef = collectionRef.doc(String(id));
      await docRef.delete();
      return res.status(200).json({ ok: true });
    }

    // ------------------------------------------------------
    // METHOD NOT ALLOWED
    // ------------------------------------------------------
    res.setHeader("Allow", "POST,PUT,PATCH,DELETE");
    return res
      .status(405)
      .json({ ok: false, error: "Method not allowed" });
  } catch (error: any) {
    console.error("Error in /api/management/messages:", error);
    return res
      .status(500)
      .json({ ok: false, error: error?.message || "Server error" });
  }
}
