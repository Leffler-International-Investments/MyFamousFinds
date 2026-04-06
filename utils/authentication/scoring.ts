// FILE: /utils/authentication/scoring.ts
// Weighted similarity scoring engine for authentication verification.

import type { CategoryGroup } from "./categoryRules";

export type ScoringWeights = {
  brand: number;
  categoryGroup: number;
  modelTitle: number;
  color: number;
  material: number;
  identifierMatch: number;
  imageHeuristic: number;
};

export const DEFAULT_WEIGHTS: ScoringWeights = {
  brand: 25,
  categoryGroup: 15,
  modelTitle: 15,
  color: 10,
  material: 10,
  identifierMatch: 20,
  imageHeuristic: 5,
};

export type RiskBand = "Low Risk" | "Medium Risk" | "High Risk";

export type AiRecommendation =
  | "Likely Authentic"
  | "Review Carefully"
  | "High Mismatch / Expert Review Recommended";

export type ScoreBreakdown = {
  brandScore: number;
  categoryGroupScore: number;
  modelTitleScore: number;
  colorScore: number;
  materialScore: number;
  identifierScore: number;
  imageScore: number;
  totalScore: number;
  riskBand: RiskBand;
  aiRecommendation: AiRecommendation;
  hardMismatches: string[];
};

function normalize(s: string): string {
  return (s || "").trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

function fuzzyMatch(a: string, b: string): number {
  const na = normalize(a);
  const nb = normalize(b);
  if (!na || !nb) return 0;
  if (na === nb) return 1;
  if (na.includes(nb) || nb.includes(na)) return 0.7;
  // Simple token overlap
  const tokensA = na.split(/\s+/);
  const tokensB = new Set(nb.split(/\s+/));
  const overlap = tokensA.filter((t) => tokensB.has(t)).length;
  if (overlap > 0) return Math.min(overlap / Math.max(tokensA.length, 1), 0.5);
  return 0;
}

export function computeScore(
  listing: {
    brand: string;
    categoryGroup: CategoryGroup;
    model: string;
    title: string;
    color: string;
    material: string;
    serialNumber: string;
    catalogueNumber: string;
    styleNumber: string;
    referenceNumber: string;
  },
  reference: {
    brand: string;
    categoryGroup: string;
    model: string;
    title: string;
    color: string;
    material: string;
    serialFormat?: string;
    catalogueNumber: string;
    styleNumber: string;
    referenceNumber: string;
  },
  weights: ScoringWeights = DEFAULT_WEIGHTS
): ScoreBreakdown {
  const hardMismatches: string[] = [];

  // Brand
  const brandMatch = normalize(listing.brand) === normalize(reference.brand);
  const brandScore = brandMatch ? weights.brand : 0;
  if (!brandMatch && listing.brand && reference.brand) {
    hardMismatches.push(
      `Brand mismatch: listing says "${listing.brand}", reference is "${reference.brand}"`
    );
  }

  // Category group
  const catMatch = listing.categoryGroup === reference.categoryGroup;
  const categoryGroupScore = catMatch ? weights.categoryGroup : 0;
  if (!catMatch && reference.categoryGroup) {
    hardMismatches.push(
      `Category mismatch: listing is "${listing.categoryGroup}", reference is "${reference.categoryGroup}"`
    );
  }

  // Model / title similarity
  const modelSim = Math.max(
    fuzzyMatch(listing.model, reference.model),
    fuzzyMatch(listing.title, reference.title) * 0.6
  );
  const modelTitleScore = Math.round(modelSim * weights.modelTitle);

  // Color
  const colorMatch = normalize(listing.color) === normalize(reference.color);
  const colorScore = colorMatch ? weights.color : 0;
  if (!colorMatch && listing.color && reference.color) {
    hardMismatches.push(
      `Color mismatch: listing says "${listing.color}", reference is "${reference.color}"`
    );
  }

  // Material
  const matMatch =
    normalize(listing.material) === normalize(reference.material) ||
    (listing.material && reference.material &&
      normalize(listing.material).includes(normalize(reference.material)));
  const materialScore = matMatch ? weights.material : 0;
  if (!matMatch && listing.material && reference.material) {
    hardMismatches.push(
      `Material mismatch: listing says "${listing.material}", reference is "${reference.material}"`
    );
  }

  // Identifier match (best of catalogue, style, serial, reference number)
  let identifierScore = 0;
  const idChecks: { name: string; listingVal: string; refVal: string }[] = [
    { name: "catalogue number", listingVal: listing.catalogueNumber, refVal: reference.catalogueNumber },
    { name: "style number", listingVal: listing.styleNumber, refVal: reference.styleNumber },
    { name: "reference number", listingVal: listing.referenceNumber, refVal: reference.referenceNumber },
  ];

  let anyIdExactMatch = false;
  for (const check of idChecks) {
    if (check.listingVal && check.refVal) {
      if (normalize(check.listingVal) === normalize(check.refVal)) {
        anyIdExactMatch = true;
      } else {
        hardMismatches.push(
          `${check.name} mismatch: listing "${check.listingVal}" vs reference "${check.refVal}"`
        );
      }
    }
  }
  if (anyIdExactMatch) {
    identifierScore = weights.identifierMatch;
  }

  // Serial format validation
  if (listing.serialNumber && reference.serialFormat) {
    try {
      const re = new RegExp(reference.serialFormat, "i");
      if (!re.test(listing.serialNumber)) {
        hardMismatches.push(
          `Serial number format invalid: "${listing.serialNumber}" does not match expected pattern`
        );
      }
    } catch { /* skip invalid regex */ }
  }

  // Image heuristic — placeholder for future vision AI integration
  const imageScore = Math.round(weights.imageHeuristic * 0.5);

  const totalScore = Math.min(
    brandScore + categoryGroupScore + modelTitleScore + colorScore +
    materialScore + identifierScore + imageScore,
    100
  );

  // Risk band
  let riskBand: RiskBand = "High Risk";
  if (totalScore >= 85) riskBand = "Low Risk";
  else if (totalScore >= 60) riskBand = "Medium Risk";

  // AI recommendation
  let aiRecommendation: AiRecommendation = "High Mismatch / Expert Review Recommended";
  if (totalScore >= 85 && hardMismatches.length === 0) {
    aiRecommendation = "Likely Authentic";
  } else if (totalScore >= 60) {
    aiRecommendation = "Review Carefully";
  }

  return {
    brandScore,
    categoryGroupScore,
    modelTitleScore,
    colorScore,
    materialScore,
    identifierScore,
    imageScore,
    totalScore,
    riskBand,
    aiRecommendation,
    hardMismatches,
  };
}
