// FILE: /pages/api/offers/create.ts
import type { NextApiRequest, NextApiResponse } from "next";
// body: { productId, price, message }
export default async function handler(req:NextApiRequest,res:NextApiResponse){
  if (req.method!=="POST") return res.status(405).end();
  // TODO: write offer to Firestore 'offers' with buyerId/sellerId
  res.status(201).json({ ok:true, offerId: Math.random().toString(36).slice(2,8) });
}
