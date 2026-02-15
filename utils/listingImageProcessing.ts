// FILE: /utils/listingImageProcessing.ts

import crypto from "crypto";
import sharp from "sharp";
import admin, { isFirebaseAdminReady } from "./firebaseAdmin";

// Env vars:
// - BACKGROUND_REMOVAL_API_KEY: optional API key for remove.bg background removal.
// - FIREBASE_STORAGE_BUCKET or NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: storage bucket name.
const BACKGROUND_REMOVAL_API_KEY = process.env.BACKGROUND_REMOVAL_API_KEY || "";
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
  contentType: string
): Promise<Buffer | null> {
  if (!BACKGROUND_REMOVAL_API_KEY) return null;

  try {
    const form = new FormData();
    const blob = new Blob([new Uint8Array(buffer)], { type: contentType });
    form.append("image_file", blob, "upload");
    form.append("size", "auto");

    const response = await fetch("https://api.remove.bg/v1.0/removebg", {
      method: "POST",
      headers: {
        "X-Api-Key": BACKGROUND_REMOVAL_API_KEY,
      },
      body: form,
    });

    if (!response.ok) {
      const text = await response.text();
      console.warn("remove.bg failed:", response.status, text);
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.warn("remove.bg error:", error);
    return null;
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
    .resize(800, 1067, { fit: "inside", withoutEnlargement: true })
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

export function hasBackgroundRemovalKey(): boolean {
  return Boolean(BACKGROUND_REMOVAL_API_KEY);
}

export function hasStorageBucket(): boolean {
  return Boolean(STORAGE_BUCKET) && isFirebaseAdminReady;
}
