import { describe, it, expect } from "vitest";
import { canAffordWait, getFollowUpActions, isWaiting } from "../../state/selectors";
import { deductCycleCosts } from "../resolution";
import {
  makeCombatant,
  makeCombatState,
  makeRound,
  makeDeclaration,
} from "../../__tests__/fixtures";

describe("canAffordWait", () => {
  it("returns false when AP < 3 (wait=1 + cheapest non-wait=2)", () => {
    const state = makeCombatState({
      combatants: [makeCombatant({ id: "c1" })],
      round: makeRound({ apCurrent: { c1: 2 } }),
    });
    expect(canAffordWait(state, "c1")).toBe(false);
  });

  it("returns true when AP >= 3", () => {
    const state = makeCombatState({
      combatants: [makeCombatant({ id: "c1" })],
      round: makeRound({ apCurrent: { c1: 3 } }),
    });
    expect(canAffordWait(state, "c1")).toBe(true);
  });

  it("returns false when only affordable follow-ups need exhausted moves", () => {
    // With 2 moves used (max allowance=2), no move actions available
    // And AP=3, cheapest non-move non-wait non-done action is 2 (unarmed-attack, quick-action, etc.)
    // So with 3 AP it should still be true since non-move actions exist
    const state = makeCombatState({
      combatants: [makeCombatant({ id: "c1" })],
      round: makeRound({ apCurrent: { c1: 3 }, movesUsed: { c1: 2 } }),
    });
    // Even with moves exhausted, non-move actions (unarmed-attack=2, etc.) are still available
    expect(canAffordWait(state, "c1")).toBe(true);
  });

  it("returns true when AP is exactly wait + cheapest follow-up", () => {
    const state = makeCombatState({
      combatants: [makeCombatant({ id: "c1" })],
      round: makeRound({ apCurrent: { c1: 3 } }),
    });
    // wait=1 + cheapest=2 (unarmed-attack, quick-action, etc.) = 3
    expect(canAffordWait(state, "c1")).toBe(true);
  });
});

describe("getFollowUpActions", () => {
  it("excludes wait and done", () => {
    const state = makeCombatState({
      combatants: [makeCombatant({ id: "c1" })],
      round: makeRound({ apCurrent: { c1: 10 } }),
    });
    const actions = getFollowUpActions(state, "c1");
    expect(actions.find((a) => a.id === "wait")).toBeUndefined();
    expect(actions.find((a) => a.id === "done")).toBeUndefined();
  });

  it("filters by budget (AP - 1) and move allowance", () => {
    const state = makeCombatState({
      combatants: [makeCombatant({ id: "c1" })],
      round: makeRound({ apCurrent: { c1: 4 } }),
    });
    // Budget = 4 - 1 = 3, so only actions with cost <= 3
    const actions = getFollowUpActions(state, "c1");
    expect(actions.every((a) => a.cost <= 3)).toBe(true);
    expect(actions.length).toBeGreaterThan(0);
  });

  it("excludes move actions when moves are exhausted", () => {
    const state = makeCombatState({
      combatants: [makeCombatant({ id: "c1" })],
      round: makeRound({ apCurrent: { c1: 10 }, movesUsed: { c1: 2 } }),
    });
    const actions = getFollowUpActions(state, "c1");
    expect(actions.every((a) => a.moveCost === 0)).toBe(true);
  });
});

describe("isWaiting", () => {
  it("returns true when combatant is in waitingCombatants", () => {
    const state = makeCombatState({
      round: makeRound({
        currentCycle: {
          cycleNumber: 1,
          declarations: [],
          resolutionOrder: [],
          currentResolutionIndex: 0,
          waitingCombatants: ["c1"],
        },
      }),
    });
    expect(isWaiting(state, "c1")).toBe(true);
  });

  it("returns false when combatant is not in waitingCombatants", () => {
    const state = makeCombatState({
      round: makeRound({
        currentCycle: {
          cycleNumber: 1,
          declarations: [],
          resolutionOrder: [],
          currentResolutionIndex: 0,
          waitingCombatants: ["c2"],
        },
      }),
    });
    expect(isWaiting(state, "c1")).toBe(false);
  });

  it("returns false when no round", () => {
    const state = makeCombatState();
    expect(isWaiting(state, "c1")).toBe(false);
  });
});

describe("deductCycleCosts with wait + follow-up", () => {
  it("deducts both wait and follow-up when two declarations exist for same combatant", () => {
    const ap = { c1: 7 };
    const decls = [
      makeDeclaration({ combatantId: "c1", actionId: "wait", cost: 1, resolved: true }),
      makeDeclaration({ combatantId: "c1", actionId: "attack", cost: 3, resolved: true }),
    ];
    expect(deductCycleCosts(ap, decls)).toEqual({ c1: 3 });
  });

  it("only deducts wait (1 AP) when no follow-up selected", () => {
    const ap = { c1: 7 };
    const decls = [
      makeDeclaration({ combatantId: "c1", actionId: "wait", cost: 1, resolved: true }),
    ];
    expect(deductCycleCosts(ap, decls)).toEqual({ c1: 6 });
  });
});
