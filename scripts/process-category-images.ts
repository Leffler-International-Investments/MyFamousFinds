// FILE: /scripts/process-category-images.ts
//
// Run the same image pipeline item-upload uses on the /public/categories PNGs
// so they come out with the eggshell (#ede8e0) background that matches the
// product cards on the homepage.
//
// Usage:
//   PHOTOROOM_API_KEY=xxxx npx tsx scripts/process-category-images.ts
//
// Without PHOTOROOM_API_KEY the script will just flatten the image onto
// eggshell via sharp (no AI background removal).

import fs from "fs/promises";
import path from "path";
import sharp from "sharp";
import { removeBackgroundAndMakeWhite } from "../utils/backgroundRemovalWhite";

const CATEGORY_DIR = path.join(process.cwd(), "public", "categories");
const FILES = [
  "bags.png",
  "women.png",
  "men.png",
  "kids.png",
  "shoes.png",
  "jewlery.png",
];

const EGGSHELL = { r: 237, g: 232, b: 224, alpha: 1 };
const OUTPUT_SIZE = 1000;

async function processFile(fileName: string) {
  const srcPath = path.join(CATEGORY_DIR, fileName);
  const buf = await fs.readFile(srcPath);

  let processed: Buffer;

  if (process.env.PHOTOROOM_API_KEY) {
    const result = await removeBackgroundAndMakeWhite(buf, {
      photoRoomApiKey: process.env.PHOTOROOM_API_KEY!,
      width: OUTPUT_SIZE,
      height: OUTPUT_SIZE,
      quality: 92,
    });
    if (!result.backgroundRemoved) {
      console.warn(`  ! PhotoRoom skipped for ${fileName}: ${result.error}`);
    }
    processed = result.buffer;
  } else {
    processed = await sharp(buf)
      .rotate()
      .resize(OUTPUT_SIZE, OUTPUT_SIZE, {
        fit: "contain",
        background: EGGSHELL,
      })
      .flatten({ background: "#ede8e0" })
      .jpeg({ quality: 92, mozjpeg: true })
      .toBuffer();
  }

  // Re-encode as PNG so the filenames stay identical (no HTML churn).
  const finalPng = await sharp(processed)
    .flatten({ background: "#ede8e0" })
    .png({ compressionLevel: 9 })
    .toBuffer();

  await fs.writeFile(srcPath, finalPng);
  console.log(`  ✓ ${fileName}`);
}

async function main() {
  if (!process.env.PHOTOROOM_API_KEY) {
    console.warn(
      "PHOTOROOM_API_KEY not set — falling back to flatten-only (no AI bg removal)."
    );
  }
  for (const f of FILES) {
    try {
      await processFile(f);
    } catch (err: any) {
      console.error(`  ✗ ${f}: ${err?.message || err}`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
