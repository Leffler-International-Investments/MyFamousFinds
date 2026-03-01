// FILE: /scripts/seed-demo.ts
import { adminDb, FieldValue } from "../utils/firebaseAdmin";

async function run(){
  const sellerId = "seller-demo-001";
  const buyerId = "user-demo-001";

  const L = await adminDb.collection("listings").add({
    sellerId, title:"Gucci Marmont Mini", brand:"Gucci", sku:"GG-1001",
    price:2450, condition:"Excellent", imageUrl:"/demo/gucci-bag-1.jpg",
    status:"Active", createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(),
  });

  await adminDb.collection("orders").add({
    sellerId, buyerId, brand:"Gucci", sku:"GG-1001", title:"Gucci Marmont Mini",
    qty:1, price:2450, feePct:0.10, feeFixed:0, status:"PAID",
    createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(),
    listingId: L.id,
  });
  console.log("Seed complete");
}

run().then(()=>process.exit(0));
