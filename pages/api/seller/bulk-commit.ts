// FILE: /pages/api/seller/bulk-commit.ts
import type { NextApiRequest, NextApiResponse } from "next";
// TODO: write each row to Firestore 'listings' with sellerId
export default async function handler(req:NextApiRequest,res:NextApiResponse){
  if (req.method!=="POST") return res.status(405).end();
  const { rows=[] } = req.body || {};
  // validate minimal fields
  const valid = (rows as any[]).filter(r=>r.title && r.brand && r.price);
  // TODO: Firestore batch write here
  res.status(200).json({ ok:true, created: valid.length });
}
