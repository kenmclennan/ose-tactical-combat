import { describe, it, expect } from "vitest";
import { canTransition, getValidTransitions } from "../transitions";
import type { CombatPhase } from "../../types";

const ALL_PHASES: CombatPhase[] = [
  "setup",
  "round-start",
  "declaration",
  "resolution",
  "cycle-end",
  "round-end",
  "combat-end",
];

describe("canTransition", () => {
  const validCases: [CombatPhase, CombatPhase][] = [
    ["setup", "round-start"],
    ["round-start", "declaration"],
    ["declaration", "resolution"],
    ["resolution", "cycle-end"],
    ["cycle-end", "declaration"],
    ["cycle-end", "round-end"],
    ["round-end", "round-start"],
    ["round-end", "combat-end"],
    ["combat-end", "setup"],
  ];

  for (const [from, to] of validCases) {
    it(`${from} → ${to} is valid`, () => {
      expect(canTransition(from, to)).toBe(true);
    });
  }

  it("rejects self-transitions", () => {
    for (const phase of ALL_PHASES) {
      expect(canTransition(phase, phase)).toBe(false);
    }
  });

  it("rejects invalid transitions", () => {
    expect(canTransition("setup", "resolution")).toBe(false);
    expect(canTransition("declaration", "round-end")).toBe(false);
    expect(canTransition("combat-end", "declaration")).toBe(false);
  });
});

describe("getValidTransitions", () => {
  it("setup → [round-start]", () => {
    expect(getValidTransitions("setup")).toEqual(["round-start"]);
  });

  it("round-start → [declaration]", () => {
    expect(getValidTransitions("round-start")).toEqual(["declaration"]);
  });

  it("declaration → [resolution]", () => {
    expect(getValidTransitions("declaration")).toEqual(["resolution"]);
  });

  it("resolution → [cycle-end]", () => {
    expect(getValidTransitions("resolution")).toEqual(["cycle-end"]);
  });

  it("cycle-end → [declaration, round-end]", () => {
    expect(getValidTransitions("cycle-end")).toEqual(["declaration", "round-end"]);
  });

  it("round-end → [round-start, combat-end]", () => {
    expect(getValidTransitions("round-end")).toEqual(["round-start", "combat-end"]);
  });

  it("combat-end → [setup]", () => {
    expect(getValidTransitions("combat-end")).toEqual(["setup"]);
  });
});
