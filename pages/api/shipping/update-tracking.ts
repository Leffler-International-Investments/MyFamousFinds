// FILE: /pages/api/shipping/update-tracking.ts
import type { NextApiRequest, NextApiResponse } from "next";
// body: { orderId, carrier, tracking }
export default async function handler(req:NextApiRequest,res:NextApiResponse){
  if (req.method!=="POST") return res.status(405).end();
  // TODO: update order doc with tracking fields
  res.status(200).json({ ok:true });
}
