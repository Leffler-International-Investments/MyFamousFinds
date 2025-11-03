// FILE: /pages/api/disputes/create.ts
import type { NextApiRequest, NextApiResponse } from "next";
export default async function handler(req:NextApiRequest,res:NextApiResponse){
  if (req.method!=="POST") return res.status(405).end();
  // TODO: create dispute doc and notify admin
  res.status(201).json({ ok:true, ticketId: Math.random().toString(36).slice(2,8) });
}
