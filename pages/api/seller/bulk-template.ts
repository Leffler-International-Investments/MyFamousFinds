// FILE: /pages/api/seller/bulk-template.ts
import type { NextApiRequest, NextApiResponse } from "next";

// --- UPDATED: Added new authenticity fields ---
const CSV_HEADERS = [
  "title",
  "brand",
  "category",
  "price",
  "imageUrls", // For one or more image URLs, comma-separated
  "purchase_source", // e.g., "Gucci Store, NYC"
  "purchase_proof", // e.g., "Original Receipt"
  "serial_number", // e.g., "123456" or "N/A"
  "auth_photos", // One or more URLs to photos of receipt, serial, etc.
  "authenticity_confirmed" // Must be YES
];
// ---------------------------------------------

// Helper to escape CSV fields
const escape = (str: string) => {
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // 1. Create the header row
  const header = CSV_HEADERS.map(escape).join(",");

  // 2. Create example rows
  const row1 = [
    "Example Bag",
    "Prada",
    "Bags",
    "1500",
    "https://link.to/image1.jpg, https://link.to/image2.jpg",
    "Prada Store, NYC",
    "Original Receipt",
    "B01234567",
    "https://link.to/photo-of-serial.jpg",
    "YES"
  ].map(escape).join(",");
  
  const row2 = [
    "Example Watch",
    "Rolex",
    "Watches",
    "7500",
    "https://link.to/watch.jpg",
    "Authenticated Dealer",
    "Certificate of Authenticity",
    "R98765432",
    "https://link.to/photo-of-papers.jpg, https://link.to/box.jpg",
    "YES"
  ].map(escape).join(",");

  const csv = `${header}\n${row1}\n${row2}\n`;

  res.setHeader("Content-Type", "text/csv");
  res.setHeader(
    "Content-Disposition",
    'attachment; filename="famous-finds-bulk-template.csv"'
  );
  res.status(200).send(csv);
}
