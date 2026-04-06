// FILE: /utils/authentication/referenceMatcher.ts
// Matches a listing against the authentication_reference_items Firestore collection
// and existing platform listings to find likely authentic reference candidates.

import { computeScore, type ScoreBreakdown } from "./scoring";
import { inferCategoryGroup, type CategoryGroup } from "./categoryRules";
import { extractSignals, type ExtractedSignals } from "./identifierParser";

export type ReferenceCandidate = {
  id: string;
  title: string;
  brand: string;
  model: string;
  color: string;
  material: string;
  categoryGroup: string;
  catalogueNumber: string;
  styleNumber: string;
  referenceNumber: string;
  score: ScoreBreakdown;
  source: "reference_collection" | "platform_listing";
  matchReasons: string[];
};

export type VerificationResult = {
  extractedSignals: ExtractedSignals;
  categoryGroup: CategoryGroup;
  topCandidate: ReferenceCandidate | null;
  candidates: ReferenceCandidate[];
  overallConfidence: number;
  metadataMatchConfidence: number;
  imageMatchConfidence: number;
  riskBand: string;
  aiRecommendation: string;
  mismatchWarnings: string[];
  missingData: string[];
};

type ListingInput = {
  id: string;
  title: string;
  brand?: string;
  designer?: string;
  model?: string;
  color?: string;
  material?: string;
  serial_number?: string;
  catalogue_number?: string;
  date_code?: string;
  category?: string;
  details?: string;
  price?: number;
  condition?: string;
  purchase_source?: string;
  purchase_proof?: string;
  proof_doc_url?: string;
  auth_photos?: string[];
  seller?: string;
  sellerId?: string;
};

type ReferenceItem = {
  id: string;
  brand?: string;
  title?: string;
  category?: string;
  categoryGroup?: string;
  model?: string;
  color?: string;
  material?: string;
  styleNumber?: string;
  catalogueNumber?: string;
  serialFormat?: string;
  referenceNumber?: string;
  keywords?: string[];
  imageUrls?: string[];
  notes?: string;
  active?: boolean;
};

export function runVerification(
  listing: ListingInput,
  referenceItems: ReferenceItem[],
  existingListings: ListingInput[] = []
): VerificationResult {
  // Step 1: Extract signals
  const signals = extractSignals(listing);

  // Step 2: Infer category group
  const categoryGroup = inferCategoryGroup(
    listing.category || "",
    listing.title || "",
    listing.details || ""
  );

  // Step 3: Build listing data for scoring
  const listingData = {
    brand: signals.brand,
    categoryGroup,
    model: listing.model || "",
    title: listing.title || "",
    color: signals.color,
    material: signals.material,
    serialNumber: signals.serialNumber,
    catalogueNumber: signals.catalogueNumber,
    styleNumber: signals.styleNumber,
    referenceNumber: signals.referenceNumber,
  };

  const candidates: ReferenceCandidate[] = [];

  // Match against reference collection
  for (const ref of referenceItems) {
    if (ref.active === false) continue;

    const refCatGroup = ref.categoryGroup ||
      inferCategoryGroup(ref.category || "", ref.title || "", "");

    const refData = {
      brand: ref.brand || "",
      categoryGroup: refCatGroup,
      model: ref.model || "",
      title: ref.title || "",
      color: ref.color || "",
      material: ref.material || "",
      serialFormat: ref.serialFormat,
      catalogueNumber: ref.catalogueNumber || "",
      styleNumber: ref.styleNumber || "",
      referenceNumber: ref.referenceNumber || "",
    };

    const score = computeScore(listingData, refData);

    if (score.totalScore > 10) {
      const matchReasons: string[] = [];
      if (score.brandScore > 0) matchReasons.push("Brand match");
      if (score.categoryGroupScore > 0) matchReasons.push("Category match");
      if (score.modelTitleScore > 5) matchReasons.push("Model/title similarity");
      if (score.colorScore > 0) matchReasons.push("Color match");
      if (score.materialScore > 0) matchReasons.push("Material match");
      if (score.identifierScore > 0) matchReasons.push("Identifier match");

      candidates.push({
        id: ref.id,
        title: ref.title || "Reference item",
        brand: ref.brand || "",
        model: ref.model || "",
        color: ref.color || "",
        material: ref.material || "",
        categoryGroup: refCatGroup,
        catalogueNumber: ref.catalogueNumber || "",
        styleNumber: ref.styleNumber || "",
        referenceNumber: ref.referenceNumber || "",
        score,
        source: "reference_collection",
        matchReasons,
      });
    }
  }

  // Match against existing platform listings (already authenticated)
  for (const existing of existingListings) {
    if (existing.id === listing.id) continue;

    const existingSignals = extractSignals(existing);
    const existingCatGroup = inferCategoryGroup(
      existing.category || "",
      existing.title || "",
      existing.details || ""
    );

    const refData = {
      brand: existingSignals.brand,
      categoryGroup: existingCatGroup,
      model: existing.model || "",
      title: existing.title || "",
      color: existingSignals.color,
      material: existingSignals.material,
      catalogueNumber: existingSignals.catalogueNumber,
      styleNumber: existingSignals.styleNumber,
      referenceNumber: existingSignals.referenceNumber,
    };

    const score = computeScore(listingData, refData);

    if (score.totalScore > 15) {
      const matchReasons: string[] = [];
      if (score.brandScore > 0) matchReasons.push("Brand match");
      if (score.categoryGroupScore > 0) matchReasons.push("Category match");
      if (score.modelTitleScore > 5) matchReasons.push("Model/title similarity");
      if (score.colorScore > 0) matchReasons.push("Color match");
      if (score.materialScore > 0) matchReasons.push("Material match");
      if (score.identifierScore > 0) matchReasons.push("Identifier match");

      candidates.push({
        id: existing.id,
        title: existing.title || "Platform listing",
        brand: existingSignals.brand,
        model: existing.model || "",
        color: existingSignals.color,
        material: existingSignals.material,
        categoryGroup: existingCatGroup,
        catalogueNumber: existingSignals.catalogueNumber,
        styleNumber: existingSignals.styleNumber,
        referenceNumber: existingSignals.referenceNumber,
        score,
        source: "platform_listing",
        matchReasons,
      });
    }
  }

  // Sort by score descending
  candidates.sort((a, b) => b.score.totalScore - a.score.totalScore);
  const top3 = candidates.slice(0, 3);
  const topCandidate = top3[0] || null;

  // Compute overall confidence
  const bestScore = topCandidate?.score.totalScore || 0;
  const overallConfidence = bestScore;
  const metadataMatchConfidence = topCandidate
    ? Math.round(
        ((topCandidate.score.brandScore +
          topCandidate.score.categoryGroupScore +
          topCandidate.score.modelTitleScore +
          topCandidate.score.colorScore +
          topCandidate.score.materialScore +
          topCandidate.score.identifierScore) /
          95) *
          100
      )
    : 0;
  // Placeholder for real image AI
  const imageMatchConfidence = topCandidate ? 50 : 0;

  const riskBand = topCandidate?.score.riskBand || "High Risk";
  const aiRecommendation =
    topCandidate?.score.aiRecommendation ||
    "High Mismatch / Expert Review Recommended";

  // Collect mismatch warnings
  const mismatchWarnings: string[] = [];
  if (topCandidate) {
    mismatchWarnings.push(...topCandidate.score.hardMismatches);
  }

  // Missing data
  const missingData: string[] = [];
  if (!signals.brand) missingData.push("brand");
  if (!signals.color) missingData.push("color");
  if (!signals.material) missingData.push("material");
  if (!signals.serialNumber) missingData.push("serial number");
  if (!signals.catalogueNumber) missingData.push("catalogue/style number");
  if (!listing.model) missingData.push("model");
  if (!listing.purchase_proof) missingData.push("purchase proof");
  if (!listing.auth_photos || listing.auth_photos.length === 0)
    missingData.push("authentication photos");

  return {
    extractedSignals: signals,
    categoryGroup,
    topCandidate,
    candidates: top3,
    overallConfidence,
    metadataMatchConfidence,
    imageMatchConfidence,
    riskBand,
    aiRecommendation,
    mismatchWarnings,
    missingData,
  };
}
