// FILE: /pages/api/support.ts
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();
  const { name, email, topic, message } = req.body || {};
  if (!name || !email || !message) return res.status(400).json({ ok:false, error:"missing_fields" });
  // MVP: just acknowledge. (Hook to DB / email provider when ready.)
  res.status(201).json({ ok:true, ticketId: Math.random().toString(36).slice(2,8) });
}
