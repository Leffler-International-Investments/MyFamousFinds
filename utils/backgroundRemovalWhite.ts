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

export type RemoveBgResult = {
  buffer: Buffer;
  backgroundRemoved: boolean;
  error?: string;
};

/**
 * Removes background when possible and ALWAYS returns an eggshell-background JPEG.
 *
 * - If Photoroom succeeds, transparency is composited onto eggshell (#ede8e0).
 * - If Photoroom fails, original image is still normalized to eggshell JPEG.
 *
 * The returned object includes `backgroundRemoved` so callers can detect
 * when the AI removal was skipped.
 */
export async function removeBackgroundAndMakeWhite(
  input: AnyImageInput,
  options: RemoveBgWhiteOptions
): Promise<RemoveBgResult> {
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
  let backgroundRemoved = false;
  let bgError: string | undefined;

  try {
    processed = await removeBackgroundWithPhotoroom(sourceBuffer, photoRoomApiKey, timeoutMs);
    backgroundRemoved = true;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    bgError = message;
    console.error("[backgroundRemoval] Photoroom failed, falling back to plain eggshell:", message);
    processed = sourceBuffer;
  }

  const buffer = await sharp(processed)
    .rotate()
    .resize(width, height, {
      fit: "contain",
      background: { r: 237, g: 232, b: 224, alpha: 1 },
    })
    .flatten({ background: "#ede8e0" })
    .jpeg({ quality, mozjpeg: true })
    .toBuffer();

  return { buffer, backgroundRemoved, error: bgError };
}
