import type { DexCategory } from "../types";
import { SURPRISE_DIVISOR } from "../util/constants";

/**
 * AP variance table from TACS v1.1.
 * Indexed by [dieRoll - 1][dexCategory].
 * Die roll is 1d6, result is final AP.
 */
const VARIANCE_TABLE: Record<DexCategory, number[]> = {
  // roll:  1  2  3  4  5  6
  penalty: [6, 6, 7, 7, 7, 8],
  standard: [6, 7, 7, 7, 7, 8],
  bonus: [6, 7, 7, 7, 8, 8],
};

export function rollVariance(roll: number, dexCategory: DexCategory): number {
  const clamped = Math.max(1, Math.min(6, Math.round(roll)));
  return VARIANCE_TABLE[dexCategory][clamped - 1];
}

export function getSurpriseAp(baseAp: number): number {
  return Math.floor(baseAp / SURPRISE_DIVISOR);
}

export function dexScoreToCat(score: number): DexCategory {
  if (score <= 8) return "penalty";
  if (score <= 12) return "standard";
  return "bonus";
}

export function computeStartingAp(
  baseAp: number,
  roll: number,
  dexCategory: DexCategory,
  hasVariance: boolean,
  surprised: boolean,
): number {
  if (surprised) {
    return getSurpriseAp(baseAp);
  }
  if (!hasVariance) {
    return baseAp;
  }
  return rollVariance(roll, dexCategory);
}
