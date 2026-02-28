// FILE: /pages/api/auth/management-login.ts
import type { NextApiRequest, NextApiResponse } from "next";

type AdminUser = { email: string; password: string };

// TEMP: define the two management admins.
// In production, move passwords to env vars or a database.
const MANAGEMENT_ADMINS: AdminUser[] = [
  {
    email: "arich1114@aol.com",
    password: process.env.MANAGEMENT_ARIEL_PASSWORD || "",
  },
  {
    email: "leffleryd@gmail.com",
    password: process.env.MANAGEMENT_DAN_PASSWORD || "",
  },
];

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const normalizedEmail = String(email).toLowerCase().trim();
  const suppliedPassword = String(password);

  const user = MANAGEMENT_ADMINS.find(
    (u) => u.email.toLowerCase() === normalizedEmail
  );

  if (!user || !user.password || user.password !== suppliedPassword) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  return res.status(200).json({ ok: true });
}
