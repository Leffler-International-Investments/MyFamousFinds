// FILE: /pages/api/concierge.ts
import type { NextApiRequest, NextApiResponse } from "next";
export default async function handler(req:NextApiRequest,res:NextApiResponse){
  if (req.method!=="POST") return res.status(405).end();
  // TODO: store concierge lead in Firestore 'concierge_leads'
  res.status(201).json({ ok:true });
}
