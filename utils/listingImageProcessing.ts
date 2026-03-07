// FILE: /utils/listingImageProcessing.ts

import crypto from "crypto";
import sharp from "sharp";
import admin, { isFirebaseAdminReady } from "./firebaseAdmin";

// Env vars:
// - REMBG_API_URL: URL of self-hosted rembg API (e.g. http://localhost:8000).
//   Background removal is enabled when this is set.
// - FIREBASE_STORAGE_BUCKET or NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: storage bucket name.
const REMBG_API_URL = process.env.REMBG_API_URL || "";
const REQUIRE_BG_REMOVAL = process.env.REQUIRE_BG_REMOVAL === "true";
const REMBG_TIMEOUT_MS = Number(process.env.REMBG_TIMEOUT_MS || 20000);
const STORAGE_BUCKET =
  process.env.FIREBASE_STORAGE_BUCKET ||
  process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
  "";

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

async function removeBackgroundIfConfigured(
  buffer: Buffer,
  _contentType: string
): Promise<Buffer | null> {
  if (!REMBG_API_URL) {
    if (REQUIRE_BG_REMOVAL) {
      throw new Error("Background removal required but REMBG_API_URL is not set.");
    }
    return null;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REMBG_TIMEOUT_MS);

  try {
    const formData = new FormData();
    formData.append("file", new Blob([new Uint8Array(buffer)]), "image.jpg");

    const response = await fetch(`${REMBG_API_URL}/remove-bg`, {
      method: "POST",
      body: formData,
      signal: controller.signal,
    });

    if (!response.ok) {
      const msg = `rembg API error: ${response.status} ${response.statusText}`;
      if (REQUIRE_BG_REMOVAL) throw new Error(msg);
      console.warn(msg);
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    const out = Buffer.from(arrayBuffer);
    if (!out.length) {
      if (REQUIRE_BG_REMOVAL) throw new Error("rembg returned empty output");
      return null;
    }
    return out;
  } catch (error) {
    if (REQUIRE_BG_REMOVAL) throw error;
    console.warn("rembg error:", error);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function createWhiteDisplayImage(
  buffer: Buffer,
  contentType: string
): Promise<Buffer> {
  const removed = await removeBackgroundIfConfigured(buffer, contentType);
  const workingBuffer = removed || buffer;

  const pipeline = sharp(workingBuffer)
    .rotate()
    .resize(800, 1067, {
      fit: "contain",
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .flatten({ background: "#ffffff" });

  return pipeline
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

  const displayBuffer = await createWhiteDisplayImage(input.buffer, contentType);

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
  rembgConfigured: boolean;
  rembgUrl: string;
  requireBgRemoval: boolean;
  storageBucketConfigured: boolean;
  firebaseAdminReady: boolean;
};

export function getImageProcessingStatus(): ImageProcessingStatus {
  return {
    rembgConfigured: Boolean(REMBG_API_URL),
    rembgUrl: REMBG_API_URL || "",
    requireBgRemoval: REQUIRE_BG_REMOVAL,
    storageBucketConfigured: Boolean(STORAGE_BUCKET),
    firebaseAdminReady: isFirebaseAdminReady,
  };
}

export function hasBackgroundRemovalKey(): boolean {
  return Boolean(REMBG_API_URL);
}

export function hasStorageBucket(): boolean {
  return Boolean(STORAGE_BUCKET) && isFirebaseAdminReady;
}
