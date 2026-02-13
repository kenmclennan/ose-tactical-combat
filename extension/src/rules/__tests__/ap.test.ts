import { describe, it, expect } from "vitest";
import { rollVariance, getSurpriseAp, dexScoreToCat, computeStartingAp } from "../ap";
import type { DexCategory } from "../../types";

describe("rollVariance", () => {
  const expected: Record<DexCategory, number[]> = {
    //          roll: 1  2  3  4  5  6
    penalty: [6, 6, 7, 7, 7, 8],
    standard: [6, 7, 7, 7, 7, 8],
    bonus: [6, 7, 7, 7, 8, 8],
  };

  const categories: DexCategory[] = ["penalty", "standard", "bonus"];

  for (const cat of categories) {
    for (let roll = 1; roll <= 6; roll++) {
      it(`${cat} roll ${roll} → ${expected[cat][roll - 1]}`, () => {
        expect(rollVariance(roll, cat)).toBe(expected[cat][roll - 1]);
      });
    }
  }

  it("clamps roll below 1", () => {
    expect(rollVariance(0, "standard")).toBe(6);
  });

  it("clamps roll above 6", () => {
    expect(rollVariance(7, "standard")).toBe(8);
  });
});

describe("getSurpriseAp", () => {
  it("halves even base AP", () => {
    expect(getSurpriseAp(6)).toBe(3);
  });

  it("floors odd base AP", () => {
    expect(getSurpriseAp(7)).toBe(3);
  });

  it("returns 0 for base AP 0", () => {
    expect(getSurpriseAp(0)).toBe(0);
  });

  it("returns 0 for base AP 1", () => {
    expect(getSurpriseAp(1)).toBe(0);
  });
});

describe("dexScoreToCat", () => {
  it("8 → penalty", () => {
    expect(dexScoreToCat(8)).toBe("penalty");
  });

  it("9 → standard", () => {
    expect(dexScoreToCat(9)).toBe("standard");
  });

  it("12 → standard", () => {
    expect(dexScoreToCat(12)).toBe("standard");
  });

  it("13 → bonus", () => {
    expect(dexScoreToCat(13)).toBe("bonus");
  });

  it("3 → penalty", () => {
    expect(dexScoreToCat(3)).toBe("penalty");
  });

  it("18 → bonus", () => {
    expect(dexScoreToCat(18)).toBe("bonus");
  });
});

describe("computeStartingAp", () => {
  it("returns variance result when variance is on", () => {
    expect(computeStartingAp(7, 3, "standard", true, false)).toBe(7);
  });

  it("returns base AP when variance is off", () => {
    expect(computeStartingAp(7, 3, "standard", false, false)).toBe(7);
    expect(computeStartingAp(6, 1, "penalty", false, false)).toBe(6);
  });

  it("returns surprise AP when surprised (ignores variance)", () => {
    expect(computeStartingAp(7, 6, "bonus", true, true)).toBe(3);
    expect(computeStartingAp(7, 6, "bonus", false, true)).toBe(3);
  });

  it("surprise takes priority over variance", () => {
    expect(computeStartingAp(6, 6, "bonus", true, true)).toBe(3);
  });
});
