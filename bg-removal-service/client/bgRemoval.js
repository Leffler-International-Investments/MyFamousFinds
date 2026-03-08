/**
 * MyFamousFinds — Background Removal Client Helper
 * Copy to: src/lib/bgRemoval.js
 * Update the firebase import path below to match your project.
 */

import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase"; // <-- adjust if your firebase init is elsewhere

const WATCH_PATH = "products/"; // must match firebase-function WATCH_PATH

/**
 * Upload an image to Firebase Storage.
 * The Cloud Function automatically processes it and saves a _nobg.png version.
 *
 * @param {File} file - The image file to upload
 * @param {string} sellerId - Seller's UID
 * @param {string} itemId - Listing/item ID
 * @returns {{ originalUrl: string, noBgUrl: string|null }}
 */
export async function uploadWithBgRemoval(file, sellerId, itemId) {
  const ext = file.name.split(".").pop();
  const filePath = `${WATCH_PATH}${sellerId}/${itemId}.${ext}`;
  const storageRef = ref(storage, filePath);

  await uploadBytes(storageRef, file, { contentType: file.type });
  const originalUrl = await getDownloadURL(storageRef);

  const noBgPath = `${WATCH_PATH}${sellerId}/${itemId}_nobg.png`;
  const noBgUrl = await pollForProcessedImage(noBgPath);

  return { originalUrl, noBgUrl };
}

/**
 * Poll Firebase Storage until the bg-removed file appears.
 * Cloud Function usually completes within 10-30 seconds.
 *
 * @param {string} filePath - Storage path to poll
 * @param {number} maxWaitMs - Max wait time in ms (default 60s)
 * @param {number} intervalMs - Poll interval in ms (default 3s)
 * @returns {string|null} Download URL or null if timed out
 */
export async function pollForProcessedImage(
  filePath,
  maxWaitMs = 60000,
  intervalMs = 3000
) {
  const noBgRef = ref(storage, filePath);
  const deadline = Date.now() + maxWaitMs;

  while (Date.now() < deadline) {
    try {
      const url = await getDownloadURL(noBgRef);
      return url;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
  }

  console.warn(`Timed out waiting for processed image: ${filePath}`);
  return null;
}

/**
 * Get the bg-removed version URL for an already-uploaded image.
 * Returns null if not yet processed.
 *
 * @param {string} sellerId
 * @param {string} itemId
 * @returns {string|null}
 */
export async function getBgRemovedUrl(sellerId, itemId) {
  try {
    const noBgRef = ref(storage, `${WATCH_PATH}${sellerId}/${itemId}_nobg.png`);
    return await getDownloadURL(noBgRef);
  } catch {
    return null;
  }
}
