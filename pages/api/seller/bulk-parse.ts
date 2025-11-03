// FILE: /pages/api/seller/bulk-parse.ts
import type { NextApiRequest, NextApiResponse } from "next";

export const config = { api: { bodyParser: false } };

export default async function handler(req:NextApiRequest,res:NextApiResponse){
  if (req.method!=="POST") return res.status(405).end();
  const chunks: Uint8Array[] = [];
  for await (const c of req){ chunks.push(c as Uint8Array); }
  const text = Buffer.concat(chunks).toString("utf8");
  const lines = text.trim().split(/\r?\n/);
  const hdr = lines.shift()?.split(",").map(s=>s.trim().toLowerCase())||[];
  const rows = lines.map(l => {
    const vals = l.split(",").map(s=>s.trim());
    const obj:any = {}; hdr.forEach((h,i)=>obj[h]=vals[i]??"");
    return obj;
  });
  res.status(200).json({ ok:true, rows });
}
