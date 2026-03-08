import sharp from "sharp";

export type AnyImageInput = Buffer | Uint8Array | string;

export type RemoveBgWhiteOptions = {
  photoRoomApiKey: string;
  width?: number;
  height?: number;
  quality?: number;
  timeoutMs?: number;
};

function isDataUrl(value: string): boolean {
  return /^data:image\/.+;base64,/.test(value);
}

async function resolveToBuffer(input: AnyImageInput): Promise<Buffer> {
  if (Buffer.isBuffer(input)) return input;
  if (input instanceof Uint8Array) return Buffer.from(input);
  if (isDataUrl(input)) {
    const base64 = input.replace(/^data:image\/.+;base64,/, "");
    return Buffer.from(base64, "base64");
  }
  const response = await fetch(input, { redirect: "follow" });
  if (!response.ok) {
    throw new Error(`Failed to fetch source image: ${response.status} ${response.statusText}`);
  }
  return Buffer.from(await response.arrayBuffer());
}

async function removeBackgroundWithPhotoroom(
  sourceBuffer: Buffer,
  apiKey: string,
  timeoutMs: number
): Promise<Buffer> {
  const form = new FormData();
  const sourceFile = new File([new Uint8Array(sourceBuffer)], "input.jpg", {
    type: "image/jpeg",
  });
  form.append("image_file", sourceFile);

  const response = await fetch("https://sdk.photoroom.com/v1/segment", {
    method: "POST",
    headers: { "x-api-key": apiKey },
    body: form,
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Photoroom error: ${response.status} ${response.statusText} - ${detail}`);
  }

  return Buffer.from(await response.arrayBuffer());
}

/**
 * Removes background when possible and ALWAYS returns a white-background JPEG.
 *
 * - If Photoroom succeeds, transparency is composited onto white.
 * - If Photoroom fails, original image is still normalized to white JPEG.
 */
export async function removeBackgroundAndMakeWhite(
  input: AnyImageInput,
  options: RemoveBgWhiteOptions
): Promise<Buffer> {
  const {
    photoRoomApiKey,
    width = 800,
    height = 1067,
    quality = 90,
    timeoutMs = 30000,
  } = options;

  if (!photoRoomApiKey) {
    throw new Error("Missing PHOTOROOM_API_KEY");
  }

  const sourceBuffer = await resolveToBuffer(input);
  let processed = sourceBuffer;

  try {
    processed = await removeBackgroundWithPhotoroom(sourceBuffer, photoRoomApiKey, timeoutMs);
  } catch {
    // Intentional fallback: still output white background even if AI removal fails.
    processed = sourceBuffer;
  }

  return sharp(processed)
    .rotate()
    .resize(width, height, {
      fit: "contain",
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .flatten({ background: "#ffffff" })
    .jpeg({ quality, mozjpeg: true })
    .toBuffer();
}
