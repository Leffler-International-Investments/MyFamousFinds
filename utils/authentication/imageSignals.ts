// FILE: /utils/authentication/imageSignals.ts
// Placeholder image-signal logic for future real vision AI integration.
// V1: provides structural analysis hints based on image metadata availability.

export type ImageSignalResult = {
  hasImages: boolean;
  imageCount: number;
  hasProofDocument: boolean;
  hasAuthPhotos: boolean;
  imageMatchConfidence: number;
  notes: string[];
};

export function analyzeImageSignals(listing: {
  image_url?: string;
  auth_photos?: string[];
  proof_doc_url?: string;
}): ImageSignalResult {
  const notes: string[] = [];
  const hasImages = !!(listing.image_url);
  const authPhotos = listing.auth_photos || [];
  const hasAuthPhotos = authPhotos.length > 0;
  const hasProofDocument = !!(listing.proof_doc_url);
  const imageCount = (hasImages ? 1 : 0) + authPhotos.length;

  if (!hasImages) {
    notes.push("No primary product image available.");
  }

  if (!hasAuthPhotos) {
    notes.push("No dedicated authentication photos uploaded. Close-up detail photos would strengthen verification.");
  } else if (authPhotos.length < 3) {
    notes.push(`Only ${authPhotos.length} authentication photo(s). Recommend at least 3-4 close-up shots (logo, serial, hardware, material).`);
  } else {
    notes.push(`${authPhotos.length} authentication photos available for review.`);
  }

  if (!hasProofDocument) {
    notes.push("No proof of purchase document uploaded.");
  } else {
    notes.push("Proof of purchase document available.");
  }

  // V1 heuristic: confidence based on photo availability
  // Future: plug in real vision AI (e.g., comparing uploaded photos to reference images)
  let imageMatchConfidence = 0;
  if (hasImages) imageMatchConfidence += 15;
  if (hasAuthPhotos) imageMatchConfidence += Math.min(authPhotos.length * 10, 40);
  if (hasProofDocument) imageMatchConfidence += 10;
  // Cap at 65 since no real image comparison is happening yet
  imageMatchConfidence = Math.min(imageMatchConfidence, 65);

  if (imageMatchConfidence >= 50) {
    notes.push("Image coverage is adequate for manual comparison. Real AI image analysis will be available in a future update.");
  } else if (imageMatchConfidence > 0) {
    notes.push("Image coverage is limited. Request additional photos for more thorough verification.");
  }

  return {
    hasImages,
    imageCount,
    hasProofDocument,
    hasAuthPhotos,
    imageMatchConfidence,
    notes,
  };
}
