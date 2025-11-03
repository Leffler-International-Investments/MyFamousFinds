// FILE: /pages/api/seller/bulk-commit.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb, FieldValue } from "../../../utils/firebaseAdmin";
import { getSellerId } from "../../../utils/authServer";

export default async function handler(req:NextApiRequest,res:NextApiResponse){
  if (req.method!=="POST") return res.status(405).end();
  const sellerId = getSellerId(req);
  const { rows=[] } = req.body || {};
  if (!Array.isArray(rows)) return res.status(400).json({ ok:false, error:"invalid_rows" });

  // Minimal validation
  const valid = rows.filter((r:any)=>r?.title && r?.brand && r?.price);
  if (!valid.length) return res.status(400).json({ ok:false, error:"no_valid_rows" });

  // Batch write (chunked by 400)
  let created = 0;
  for (let i=0;i<valid.length;i+=400){
    const chunk = valid.slice(i,i+400);
    const batch = adminDb.batch();
    chunk.forEach((r:any)=>{
      const ref = adminDb.collection("listings").doc();
      batch.set(ref, {
        sellerId,
        title: String(r.title),
        brand: String(r.brand),
        category: String(r.category||""),
        sku: String(r.sku||ref.id),
        price: Number(r.price)||0,
        condition: String(r.condition||""),
        imageUrl: String(r.imageUrl||""),
        status: "Active",
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    });
    await batch.commit();
    created += chunk.length;
  }

  return res.status(200).json({ ok:true, created });
}
