// FILE: /pages/api/admin/seed-categories.ts
// Seeds the Firestore "categories" collection with the canonical product categories.
// Also seeds "menuCategories" for the navigation header if not already present.
// Requires x-admin-key header matching ADMIN_SEED_KEY env var.

import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb, isFirebaseAdminReady } from "../../../utils/firebaseAdmin";

const slug = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

/**
 * Default product categories for Famous Finds.
 * These match the canonical list used in listings, MegaNav, and update-category API.
 */
const DEFAULT_CATEGORIES: {
  name: string;
  slug: string;
  parent?: string;
  active: boolean;
  position: number;
}[] = [
  { name: "Women", slug: "women", active: true, position: 10 },
  { name: "Men", slug: "men", active: true, position: 20 },
  { name: "Bags", slug: "bags", active: true, position: 30 },
  { name: "Shoes", slug: "shoes", active: true, position: 40 },
  { name: "Jewelry", slug: "jewelry", active: true, position: 50 },
  { name: "Watches", slug: "watches", active: true, position: 60 },
  { name: "Kids", slug: "kids", active: true, position: 70 },
  { name: "Clothing", slug: "clothing", active: true, position: 80 },
  { name: "Accessories", slug: "accessories", active: true, position: 90 },
  { name: "Party Dresses", slug: "party-dresses", parent: "women", active: true, position: 100 },
  { name: "New Arrivals", slug: "new-arrivals", active: true, position: 5 },
];

/**
 * Default menu categories for the navigation header (menuCategories collection).
 * These match the MegaNav and the seed logic in /pages/management/menu.tsx.
 */
const DEFAULT_MENU_CATEGORIES = [
  {
    name: "NEW ARRIVALS",
    position: 10,
    submenus: [
      { label: "All New Arrivals", href: "/category/new-arrivals", position: 10 },
      { label: "New Bags", href: "/category/bags?sort=new", position: 20 },
      { label: "New Shoes", href: "/category/shoes?sort=new", position: 30 },
      { label: "New Watches", href: "/category/watches?sort=new", position: 40 },
    ],
  },
  {
    name: "DESIGNERS",
    position: 20,
    submenus: [
      { label: "All Designers", href: "/designers", position: 10 },
    ],
  },
  {
    name: "WOMEN",
    position: 30,
    submenus: [
      { label: "All Women", href: "/category/women", position: 10 },
      { label: "Bags", href: "/category/bags?for=women", position: 20 },
      { label: "Shoes", href: "/category/shoes?for=women", position: 30 },
      { label: "Clothing", href: "/category/clothing?for=women", position: 40 },
      { label: "Jewelry", href: "/category/jewelry?for=women", position: 50 },
    ],
  },
  {
    name: "BAGS",
    position: 40,
    submenus: [
      { label: "All Bags", href: "/category/bags", position: 10 },
      { label: "Totes", href: "/category/bags?tote=1", position: 20 },
      { label: "Crossbody", href: "/category/bags?crossbody=1", position: 30 },
      { label: "Mini Bags", href: "/category/bags?mini=1", position: 40 },
    ],
  },
  {
    name: "MEN",
    position: 50,
    submenus: [
      { label: "All Men", href: "/category/men", position: 10 },
      { label: "Bags", href: "/category/bags?for=men", position: 20 },
      { label: "Shoes", href: "/category/shoes?for=men", position: 30 },
      { label: "Accessories", href: "/category/accessories?for=men", position: 40 },
      { label: "Watches", href: "/category/watches?for=men", position: 50 },
    ],
  },
  {
    name: "KIDS",
    position: 55,
    submenus: [
      { label: "All Kids", href: "/category/kids", position: 10 },
      { label: "Girls", href: "/category/kids?for=girls", position: 20 },
      { label: "Boys", href: "/category/kids?for=boys", position: 30 },
    ],
  },
  {
    name: "JEWELRY",
    position: 60,
    submenus: [
      { label: "All Jewelry", href: "/category/jewelry", position: 10 },
      { label: "Necklaces", href: "/category/jewelry?type=necklace", position: 20 },
      { label: "Bracelets", href: "/category/jewelry?type=bracelet", position: 30 },
      { label: "Earrings", href: "/category/jewelry?type=earrings", position: 40 },
      { label: "Brooches", href: "/category/jewelry?type=brooch", position: 50 },
    ],
  },
  {
    name: "WATCHES",
    position: 70,
    submenus: [
      { label: "All Watches", href: "/category/watches", position: 10 },
      { label: "Men's Watches", href: "/category/watches?for=men", position: 20 },
      { label: "Women's Watches", href: "/category/watches?for=women", position: 30 },
    ],
  },
];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "method_not_allowed" });
  }

  const key = req.headers["x-admin-key"] as string;
  if (!key || key !== process.env.ADMIN_SEED_KEY) {
    return res.status(401).json({ ok: false, error: "unauthorized" });
  }

  if (!isFirebaseAdminReady || !adminDb) {
    return res.status(500).json({
      ok: false,
      error:
        "Firebase Admin not initialized. Check FIREBASE_SERVICE_ACCOUNT_JSON (or FB_PROJECT_ID/FB_CLIENT_EMAIL/FB_PRIVATE_KEY) in Vercel env vars.",
    });
  }

  try {
    // --- 1. Seed "categories" collection ---
    const catBatch = adminDb.batch();
    let catUpserted = 0;

    for (const cat of DEFAULT_CATEGORIES) {
      const ref = adminDb.collection("categories").doc(cat.slug);
      catBatch.set(
        ref,
        {
          name: cat.name,
          slug: cat.slug,
          ...(cat.parent ? { parent: cat.parent } : {}),
          active: cat.active,
          position: cat.position,
          updatedAt: new Date(),
        },
        { merge: true }
      );
      catUpserted++;
    }

    await catBatch.commit();

    // --- 2. Seed "menuCategories" collection (skip existing slugs) ---
    const existingSnap = await adminDb.collection("menuCategories").get();
    const existingSlugs = new Set(
      existingSnap.docs.map((d) => {
        const data = d.data();
        return (data.slug || slug(data.name || d.id)).toLowerCase();
      })
    );

    let menuUpserted = 0;

    for (const def of DEFAULT_MENU_CATEGORIES) {
      const s = slug(def.name);
      if (existingSlugs.has(s)) continue;

      const submenus = def.submenus.map((sub) => ({
        id: `${s}-${sub.position}`,
        label: sub.label,
        href: sub.href,
        position: sub.position,
      }));

      await adminDb.collection("menuCategories").add({
        name: def.name,
        slug: s,
        position: def.position,
        active: true,
        submenus,
      });
      menuUpserted++;
    }

    return res.status(200).json({
      ok: true,
      categories: catUpserted,
      menuCategories: menuUpserted,
      message: `Seeded ${catUpserted} categories and ${menuUpserted} new menu categories.`,
    });
  } catch (e: any) {
    console.error("[seed-categories] Error:", e);
    return res.status(500).json({ ok: false, error: e?.message || "seed_failed" });
  }
}
