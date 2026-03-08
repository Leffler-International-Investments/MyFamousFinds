// FILE: /utils/listingImageProcessing.ts

import crypto from "crypto";
import sharp from "sharp";
import admin, { isFirebaseAdminReady } from "./firebaseAdmin";

const STORAGE_BUCKET =
  process.env.FIREBASE_STORAGE_BUCKET ||
  process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
  "";

const REMBG_API_KEY = process.env.REMBG_API_KEY || "";

const CONTENT_TYPE_BY_FORMAT: Record<string, string> = {
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};

const EXT_BY_CONTENT_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export type ImageBuffer = {
  buffer: Buffer;
  contentType: string;
};

export type StoredImageUrls = {
  originalUrl: string;
  displayUrl: string;
  originalPath: string;
  displayPath: string;
};

function getBucket() {
  if (!isFirebaseAdminReady || !STORAGE_BUCKET) return null;
  return admin.storage().bucket(STORAGE_BUCKET);
}

function buildDownloadUrl(bucketName: string, path: string, token: string) {
  return `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(
    path
  )}?alt=media&token=${token}`;
}

function guessContentType(format?: string, fallback?: string) {
  if (format && CONTENT_TYPE_BY_FORMAT[format]) return CONTENT_TYPE_BY_FORMAT[format];
  if (fallback && EXT_BY_CONTENT_TYPE[fallback]) return fallback;
  return "image/jpeg";
}

function guessExtension(contentType: string, fallbackFormat?: string) {
  if (EXT_BY_CONTENT_TYPE[contentType]) return EXT_BY_CONTENT_TYPE[contentType];
  if (fallbackFormat && EXT_BY_CONTENT_TYPE[CONTENT_TYPE_BY_FORMAT[fallbackFormat]]) {
    return EXT_BY_CONTENT_TYPE[CONTENT_TYPE_BY_FORMAT[fallbackFormat]];
  }
  return "jpg";
}

export function parseDataUrl(input: string): ImageBuffer | null {
  const match = input.match(/^data:(image\/[^;]+);base64,(.+)$/);
  if (!match) return null;
  const contentType = match[1];
  const data = match[2];
  return {
    buffer: Buffer.from(data, "base64"),
    contentType,
  };
}

export async function fetchImageBuffer(url: string): Promise<ImageBuffer> {
  const response = await fetch(url, { redirect: "follow" });
  if (!response.ok) {
    throw new Error(`Failed to fetch image (${response.status})`);
  }
  const contentType = response.headers.get("content-type") || "image/jpeg";
  const arrayBuffer = await response.arrayBuffer();
  return {
    buffer: Buffer.from(arrayBuffer),
    contentType,
  };
}

export async function createWhiteDisplayImage(
  buffer: Buffer,
  _contentType: string
): Promise<Buffer> {
  return sharp(buffer)
    .rotate()
    .resize(800, 1067, {
      fit: "contain",
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .flatten({ background: "#ffffff" })
    .jpeg({ quality: 85, mozjpeg: true })
    .toBuffer();
}

/**
 * Same as createWhiteDisplayImage but runs background removal first.
 * This is CPU/memory-intensive — only use in endpoints with extended
 * timeouts (e.g. the admin remove-bg route), never in bulk submission.
 */
export async function createWhiteDisplayImageWithBgRemoval(
  buffer: Buffer,
  _contentType: string
): Promise<Buffer> {
  let workingBuffer = buffer;

  try {
    const { removeBackground } = await import("@imgly/background-removal-node");
    const blob = await removeBackground(buffer);
    const arrayBuffer = await blob.arrayBuffer();
    workingBuffer = Buffer.from(arrayBuffer);
  } catch (error) {
    console.warn("Background removal failed, using original:", error);
  }

  return sharp(workingBuffer)
    .rotate()
    .resize(800, 1067, {
      fit: "contain",
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .flatten({ background: "#ffffff" })
    .jpeg({ quality: 85, mozjpeg: true })
    .toBuffer();
}

async function uploadBufferToBucket(
  bucketName: string,
  path: string,
  buffer: Buffer,
  contentType: string
) {
  const bucket = getBucket();
  if (!bucket) {
    throw new Error("Firebase Storage bucket is not configured.");
  }

  const token = crypto.randomUUID();

  await bucket.file(path).save(buffer, {
    metadata: {
      contentType,
      cacheControl: "public, max-age=31536000, immutable",
      metadata: {
        firebaseStorageDownloadTokens: token,
      },
    },
    resumable: false,
  });

  return buildDownloadUrl(bucketName, path, token);
}

/**
 * Calls rembg.com API to remove background and return white-background JPEG buffer.
 * Falls back to plain white flatten if API key is missing or call fails.
 */
async function removeBackgroundViaApi(buffer: Buffer): Promise<Buffer> {
  if (!REMBG_API_KEY) return buffer; // no key → skip, caller will flatten to white

  try {
    const FormData = (await import("form-data")).default;
    const form = new FormData();
    form.append("image", buffer, { filename: "image.jpg", contentType: "image/jpeg" });
    form.append("format", "png");
    form.append("bg_color", "#ffffffff");

    const res = await fetch("https://api.rembg.com/rmbg", {
      method: "POST",
      headers: { "x-api-key": REMBG_API_KEY, ...form.getHeaders() },
      body: form.getBuffer(),
      signal: AbortSignal.timeout(25000),
    });

    if (!res.ok) {
      console.warn("rembg.com API error:", res.status, await res.text());
      return buffer;
    }

    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (err) {
    console.warn("rembg.com API call failed, using original:", err);
    return buffer;
  }
}

export async function storeListingImages(
  input: ImageBuffer,
  prefix = "listing-images"
): Promise<StoredImageUrls> {
  if (!STORAGE_BUCKET) {
    throw new Error("Missing FIREBASE_STORAGE_BUCKET or NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET.");
  }

  const metadata = await sharp(input.buffer).metadata();
  const contentType = guessContentType(metadata.format, input.contentType);
  const ext = guessExtension(contentType, metadata.format);
  const id = crypto.randomUUID();

  const originalPath = `${prefix}/original/${id}.${ext}`;
  const displayPath = `${prefix}/display/${id}.jpg`;

  // Remove background via rembg.com API (fast, external, no 220MB binary).
  // Falls back to plain white flatten if REMBG_API_KEY is not set.
  const bgRemovedBuffer = await removeBackgroundViaApi(input.buffer);
  const displayBuffer = await createWhiteDisplayImage(bgRemovedBuffer, contentType);

  const [originalUrl, displayUrl] = await Promise.all([
    uploadBufferToBucket(STORAGE_BUCKET, originalPath, input.buffer, contentType),
    uploadBufferToBucket(STORAGE_BUCKET, displayPath, displayBuffer, "image/jpeg"),
  ]);

  return {
    originalUrl,
    displayUrl,
    originalPath,
    displayPath,
  };
}

/**
 * Upload a proof document (image or PDF) to Cloud Storage and return the
 * download URL.  When Cloud Storage is not available the data-URL is
 * returned as-is so the caller can still store *something*.
 */
export async function storeProofDocument(dataUrl: string): Promise<string> {
  if (!STORAGE_BUCKET || !getBucket()) {
    // No bucket configured – return the original data URL (base64).
    // The caller should ideally compress it, but this keeps existing
    // behaviour when Storage is not set up.
    return dataUrl;
  }

  const id = crypto.randomUUID();

  // Detect content type from the data-URL header
  const headerMatch = dataUrl.match(/^data:([^;]+);base64,/);
  const contentType = headerMatch ? headerMatch[1] : "application/octet-stream";
  const base64Body = dataUrl.replace(/^data:[^;]+;base64,/, "");
  const buffer = Buffer.from(base64Body, "base64");

  const ext =
    contentType === "application/pdf"
      ? "pdf"
      : EXT_BY_CONTENT_TYPE[contentType] || "jpg";

  const path = `proof-documents/${id}.${ext}`;

  const url = await uploadBufferToBucket(STORAGE_BUCKET, path, buffer, contentType);
  return url;
}

export type ImageProcessingStatus = {
  storageBucketConfigured: boolean;
  firebaseAdminReady: boolean;
};

export function getImageProcessingStatus(): ImageProcessingStatus {
  return {
    storageBucketConfigured: Boolean(STORAGE_BUCKET),
    firebaseAdminReady: isFirebaseAdminReady,
  };
}

export function hasStorageBucket(): boolean {
  return Boolean(STORAGE_BUCKET) && isFirebaseAdminReady;
}
