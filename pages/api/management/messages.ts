// FILE: /pages/api/management/messages.ts

import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb, FieldValue } from "../../../utils/firebaseAdmin";

type MessageType = "info" | "promo" | "alert";

const collectionRef = adminDb.collection("buyer_messages");

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { method } = req;

    if (method === "POST") {
      // CREATE
      const {
        text,
        linkText = "",
        linkUrl = "",
        imageUrl = "",
        videoUrl = "",
        type = "info",
      } = req.body as {
        text?: string;
        linkText?: string;
        linkUrl?: string;
        imageUrl?: string;
        videoUrl?: string;
        type?: MessageType;
      };

      if (!text || !text.trim()) {
        return res.status(400).json({ ok: false, error: "Text is required" });
      }

      const payload = {
        text: text.trim(),
        linkText: linkText.trim(),
        linkUrl: linkUrl.trim(),
        imageUrl: imageUrl.trim(),
        videoUrl: videoUrl.trim(),
        type: (type as MessageType) || "info",
        active: true,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };

      const ref = await collectionRef.add(payload);
      return res.status(200).json({ ok: true, id: ref.id });
    }

    if (method === "PUT") {
      // UPDATE
      const {
        id,
        text,
        linkText = "",
        linkUrl = "",
        imageUrl = "",
        videoUrl = "",
        type = "info",
      } = req.body as {
        id?: string;
        text?: string;
        linkText?: string;
        linkUrl?: string;
        imageUrl?: string;
        videoUrl?: string;
        type?: MessageType;
      };

      if (!id || !text || !text.trim()) {
        return res
          .status(400)
          .json({ ok: false, error: "ID and text are required" });
      }

      const docRef = collectionRef.doc(id);
      await docRef.update({
        text: text.trim(),
        linkText: linkText.trim(),
        linkUrl: linkUrl.trim(),
        imageUrl: imageUrl.trim(),
        videoUrl: videoUrl.trim(),
        type: (type as MessageType) || "info",
        updatedAt: FieldValue.serverTimestamp(),
      });

      return res.status(200).json({ ok: true });
    }

    if (method === "PATCH") {
      // TOGGLE ACTIVE
      const { id, active } = req.body as { id?: string; active?: boolean };
      if (!id || typeof active !== "boolean") {
        return res
          .status(400)
          .json({ ok: false, error: "ID and active flag required" });
      }

      const docRef = collectionRef.doc(id);
      await docRef.update({
        active,
        updatedAt: FieldValue.serverTimestamp(),
      });

      return res.status(200).json({ ok: true });
    }

    if (method === "DELETE") {
      const { id } = req.query as { id?: string };
      if (!id) {
        return res.status(400).json({ ok: false, error: "ID is required" });
      }

      const docRef = collectionRef.doc(String(id));
      await docRef.delete();
      return res.status(200).json({ ok: true });
    }

    res.setHeader("Allow", "POST,PUT,PATCH,DELETE");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  } catch (error: any) {
    console.error("Error in /api/management/messages:", error);
    return res
      .status(500)
      .json({ ok: false, error: error?.message || "Server error" });
  }
}
