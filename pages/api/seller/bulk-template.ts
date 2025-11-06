// FILE: /pages/api/seller/bulk-template.ts

import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).end();
  }

  // Basic template that matches your bulk upload expectations
  const header = [
    "id",
    "title",
    "brand",
    "category",
    "price",
  ].join(",");

  const exampleRow = [
    "1",
    "Example bag",
    "Gucci",
    "bags",
    "2500",
  ].join(",");

  const csv = [header, exampleRow].join("\n");

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader(
    "Content-Disposition",
    'attachment; filename="famous-finds-bulk-template.csv"'
  );

  return res.status(200).send(csv);
}
