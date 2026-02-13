import { describe, it, expect } from "vitest";
import {
  getActiveCombatants,
  getPlayerCombatants,
  getMonsterCombatants,
  getCurrentAp,
  getDeclaration,
  allDeclarationsLocked,
  anyoneCanAct,
  isDoneForRound,
} from "../selectors";
import {
  makeCombatant,
  makeCombatState,
  makeRound,
  makeDeclaration as makeDecl,
} from "../../__tests__/fixtures";

describe("getActiveCombatants", () => {
  it("returns only active combatants", () => {
    const state = makeCombatState({
      combatants: [
        makeCombatant({ id: "a", status: "active" }),
        makeCombatant({ id: "b", status: "killed" }),
        makeCombatant({ id: "c", status: "incapacitated" }),
      ],
    });
    const result = getActiveCombatants(state);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("a");
  });

  it("returns empty for no combatants", () => {
    expect(getActiveCombatants(makeCombatState())).toEqual([]);
  });
});

describe("getPlayerCombatants", () => {
  it("returns only players", () => {
    const state = makeCombatState({
      combatants: [
        makeCombatant({ id: "p1", side: "player" }),
        makeCombatant({ id: "m1", side: "monster" }),
        makeCombatant({ id: "p2", side: "player" }),
      ],
    });
    const result = getPlayerCombatants(state);
    expect(result).toHaveLength(2);
    expect(result.every((c) => c.side === "player")).toBe(true);
  });
});

describe("getMonsterCombatants", () => {
  it("returns only monsters", () => {
    const state = makeCombatState({
      combatants: [
        makeCombatant({ id: "p1", side: "player" }),
        makeCombatant({ id: "m1", side: "monster" }),
      ],
    });
    const result = getMonsterCombatants(state);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("m1");
  });
});

describe("getCurrentAp", () => {
  it("returns AP from round state", () => {
    const state = makeCombatState({
      round: makeRound({ apCurrent: { c1: 5 } }),
    });
    expect(getCurrentAp(state, "c1")).toBe(5);
  });

  it("returns 0 when no round", () => {
    expect(getCurrentAp(makeCombatState(), "c1")).toBe(0);
  });

  it("returns 0 for missing combatant", () => {
    const state = makeCombatState({
      round: makeRound({ apCurrent: { c1: 5 } }),
    });
    expect(getCurrentAp(state, "c2")).toBe(0);
  });
});

describe("getDeclaration", () => {
  it("returns matching declaration", () => {
    const state = makeCombatState({
      round: makeRound({
        currentCycle: {
          cycleNumber: 1,
          declarations: [makeDecl({ combatantId: "c1", actionId: "attack" })],
          resolutionOrder: [],
          currentResolutionIndex: 0,
          waitingCombatants: [],
        },
      }),
    });
    const decl = getDeclaration(state, "c1");
    expect(decl?.actionId).toBe("attack");
  });

  it("returns undefined when not found", () => {
    const state = makeCombatState({
      round: makeRound(),
    });
    expect(getDeclaration(state, "c1")).toBeUndefined();
  });

  it("returns undefined when no round", () => {
    expect(getDeclaration(makeCombatState(), "c1")).toBeUndefined();
  });
});

describe("isDoneForRound", () => {
  it("returns true if in doneForRound list", () => {
    const state = makeCombatState({
      round: makeRound({ doneForRound: ["c1", "c2"] }),
    });
    expect(isDoneForRound(state, "c1")).toBe(true);
  });

  it("returns false if not in list", () => {
    const state = makeCombatState({
      round: makeRound({ doneForRound: ["c2"] }),
    });
    expect(isDoneForRound(state, "c1")).toBe(false);
  });

  it("returns false when no round", () => {
    expect(isDoneForRound(makeCombatState(), "c1")).toBe(false);
  });
});

describe("allDeclarationsLocked", () => {
  it("returns true when all active combatants have locked declarations", () => {
    const state = makeCombatState({
      combatants: [makeCombatant({ id: "a" }), makeCombatant({ id: "b" })],
      round: makeRound({
        apCurrent: { a: 5, b: 5 },
        currentCycle: {
          cycleNumber: 1,
          declarations: [
            makeDecl({ combatantId: "a", locked: true }),
            makeDecl({ combatantId: "b", locked: true }),
          ],
          resolutionOrder: [],
          currentResolutionIndex: 0,
          waitingCombatants: [],
        },
      }),
    });
    expect(allDeclarationsLocked(state)).toBe(true);
  });

  it("returns false when a combatant has unlocked declaration", () => {
    const state = makeCombatState({
      combatants: [makeCombatant({ id: "a" }), makeCombatant({ id: "b" })],
      round: makeRound({
        apCurrent: { a: 5, b: 5 },
        currentCycle: {
          cycleNumber: 1,
          declarations: [
            makeDecl({ combatantId: "a", locked: true }),
            makeDecl({ combatantId: "b", locked: false }),
          ],
          resolutionOrder: [],
          currentResolutionIndex: 0,
          waitingCombatants: [],
        },
      }),
    });
    expect(allDeclarationsLocked(state)).toBe(false);
  });

  it("treats done-for-round combatants as locked", () => {
    const state = makeCombatState({
      combatants: [makeCombatant({ id: "a" }), makeCombatant({ id: "b" })],
      round: makeRound({
        apCurrent: { a: 5, b: 5 },
        doneForRound: ["b"],
        currentCycle: {
          cycleNumber: 1,
          declarations: [makeDecl({ combatantId: "a", locked: true })],
          resolutionOrder: [],
          currentResolutionIndex: 0,
          waitingCombatants: [],
        },
      }),
    });
    expect(allDeclarationsLocked(state)).toBe(true);
  });

  it("treats combatants with 0 AP as locked", () => {
    const state = makeCombatState({
      combatants: [makeCombatant({ id: "a" }), makeCombatant({ id: "b" })],
      round: makeRound({
        apCurrent: { a: 5, b: 0 },
        currentCycle: {
          cycleNumber: 1,
          declarations: [makeDecl({ combatantId: "a", locked: true })],
          resolutionOrder: [],
          currentResolutionIndex: 0,
          waitingCombatants: [],
        },
      }),
    });
    expect(allDeclarationsLocked(state)).toBe(true);
  });

  it("returns false when no round", () => {
    const state = makeCombatState({
      combatants: [makeCombatant({ id: "a" })],
    });
    expect(allDeclarationsLocked(state)).toBe(false);
  });
});

describe("anyoneCanAct", () => {
  it("returns true when someone has AP and is not done", () => {
    const state = makeCombatState({
      combatants: [makeCombatant({ id: "a" })],
      round: makeRound({ apCurrent: { a: 3 } }),
    });
    expect(anyoneCanAct(state)).toBe(true);
  });

  it("returns false when all are done for round", () => {
    const state = makeCombatState({
      combatants: [makeCombatant({ id: "a" })],
      round: makeRound({
        apCurrent: { a: 3 },
        doneForRound: ["a"],
      }),
    });
    expect(anyoneCanAct(state)).toBe(false);
  });

  it("returns false when all have 0 AP", () => {
    const state = makeCombatState({
      combatants: [makeCombatant({ id: "a" }), makeCombatant({ id: "b" })],
      round: makeRound({ apCurrent: { a: 0, b: 0 } }),
    });
    expect(anyoneCanAct(state)).toBe(false);
  });

  it("ignores killed combatants", () => {
    const state = makeCombatState({
      combatants: [makeCombatant({ id: "a", status: "killed" })],
      round: makeRound({ apCurrent: { a: 5 } }),
    });
    expect(anyoneCanAct(state)).toBe(false);
  });
});
