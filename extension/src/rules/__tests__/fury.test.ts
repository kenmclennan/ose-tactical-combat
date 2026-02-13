import { describe, it, expect } from "vitest";
import {
  calculateFuryBanked,
  canSpendFury,
  appendFuryLog,
} from "../fury";
import type { FuryLogEntry } from "../../types";
import {
  makeCombatant,
  makeCombatState,
  makeRound,
} from "../../__tests__/fixtures";
import { MAX_FURY_PER_PLAYER_PER_ROUND, FURY_LOG_MAX } from "../../util/constants";

describe("calculateFuryBanked", () => {
  it("caps fury per player at MAX_FURY_PER_PLAYER_PER_ROUND", () => {
    const state = makeCombatState({
      combatants: [makeCombatant({ id: "p1", side: "player" })],
      round: makeRound({ apCurrent: { p1: 5 } }),
    });
    expect(calculateFuryBanked(state)).toBe(MAX_FURY_PER_PLAYER_PER_ROUND);
  });

  it("sums across multiple players", () => {
    const state = makeCombatState({
      combatants: [
        makeCombatant({ id: "p1", side: "player" }),
        makeCombatant({ id: "p2", side: "player" }),
      ],
      round: makeRound({ apCurrent: { p1: 2, p2: 3 } }),
    });
    expect(calculateFuryBanked(state)).toBe(5);
  });

  it("excludes dead players", () => {
    const state = makeCombatState({
      combatants: [
        makeCombatant({ id: "p1", side: "player", status: "active" }),
        makeCombatant({ id: "p2", side: "player", status: "killed" }),
      ],
      round: makeRound({ apCurrent: { p1: 2, p2: 3 } }),
    });
    expect(calculateFuryBanked(state)).toBe(2);
  });

  it("excludes monsters", () => {
    const state = makeCombatState({
      combatants: [
        makeCombatant({ id: "p1", side: "player" }),
        makeCombatant({ id: "m1", side: "monster" }),
      ],
      round: makeRound({ apCurrent: { p1: 2, m1: 5 } }),
    });
    expect(calculateFuryBanked(state)).toBe(2);
  });

  it("returns 0 with no active players", () => {
    const state = makeCombatState({
      combatants: [
        makeCombatant({ id: "m1", side: "monster" }),
      ],
      round: makeRound({ apCurrent: { m1: 5 } }),
    });
    expect(calculateFuryBanked(state)).toBe(0);
  });
});

describe("canSpendFury", () => {
  it("damage-boost costs 1", () => {
    expect(canSpendFury(1, "damage-boost")).toBe(true);
    expect(canSpendFury(0, "damage-boost")).toBe(false);
  });

  it("damage-reduce costs 2", () => {
    expect(canSpendFury(2, "damage-reduce")).toBe(true);
    expect(canSpendFury(1, "damage-reduce")).toBe(false);
  });

  it("ap-boost costs 3", () => {
    expect(canSpendFury(3, "ap-boost")).toBe(true);
    expect(canSpendFury(2, "ap-boost")).toBe(false);
  });

  it("custom requires amount and sufficient fury", () => {
    expect(canSpendFury(5, "custom", 5)).toBe(true);
    expect(canSpendFury(5, "custom", 6)).toBe(false);
    expect(canSpendFury(5, "custom", 0)).toBe(false);
    expect(canSpendFury(5, "custom")).toBe(false);
  });

  it("exact cost match returns true", () => {
    expect(canSpendFury(1, "damage-boost")).toBe(true);
    expect(canSpendFury(2, "damage-reduce")).toBe(true);
    expect(canSpendFury(3, "ap-boost")).toBe(true);
  });
});

describe("appendFuryLog", () => {
  const entry: FuryLogEntry = {
    type: "bank",
    amount: 3,
    round: 1,
  };

  it("appends to empty log", () => {
    expect(appendFuryLog([], entry)).toEqual([entry]);
  });

  it("appends to existing log", () => {
    const existing: FuryLogEntry[] = [
      { type: "spend", amount: 1, spendType: "damage-boost", round: 1 },
    ];
    const result = appendFuryLog(existing, entry);
    expect(result).toHaveLength(2);
    expect(result[1]).toEqual(entry);
  });

  it("trims to FURY_LOG_MAX when exceeded", () => {
    const log: FuryLogEntry[] = Array.from({ length: FURY_LOG_MAX }, (_, i) => ({
      type: "bank" as const,
      amount: i,
      round: i,
    }));
    const result = appendFuryLog(log, entry);
    expect(result).toHaveLength(FURY_LOG_MAX);
    expect(result[result.length - 1]).toEqual(entry);
    // First entry should have been trimmed
    expect(result[0].amount).toBe(1);
  });

  it("does not mutate original log", () => {
    const log = [entry];
    appendFuryLog(log, { ...entry, amount: 99 });
    expect(log).toHaveLength(1);
  });
});
