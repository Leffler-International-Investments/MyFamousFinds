// FILE: /pages/api/management/listings.ts
import type { NextApiRequest, NextApiResponse } from "next";

// This is mock data. Later, you will replace this with a real database query.
const mockListings = [
  { id: "L-1001", title: "Hermès Kelly 28", seller: "VintageLux Boutique", status: "Live", price: 8900 },
  { id: "L-1002", title: "Rolex Submariner 16610", seller: "Classic Timepieces", status: "Pending", price: 10500 },
  { id: "L-1003", title: "Chanel Classic Flap", seller: "Paris Finds", status: "Rejected", price: 6200 },
];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // TODO: Add admin security check here
  
  const { search } = req.query;

  // Simulate a database search
  let items = mockListings;
  if (typeof search === 'string' && search.trim()) {
    const s = search.toLowerCase();
    items = mockListings.filter(
      (item) =>
        item.title.toLowerCase().includes(s) ||
        item.seller.toLowerCase().includes(s) ||
        item.id.toLowerCase().includes(s)
    );
  }

  // Simulate a network delay
  await new Promise((res) => setTimeout(res, 500));

  res.status(200).json({ items });
}
