import { describe, it, expect } from "vitest";
import { deductCycleMoveCosts } from "../resolution";
import { getRemainingMoves } from "../../state/selectors";
import { MOVE_ALLOWANCE } from "../../util/constants";
import { makeCombatState, makeRound, makeDeclaration } from "../../__tests__/fixtures";

describe("deductCycleMoveCosts", () => {
  it("tallies move costs from resolved declarations", () => {
    const declarations = [
      makeDeclaration({
        combatantId: "c1",
        actionId: "move-half",
        cost: 2,
        locked: true,
        resolved: true,
      }),
      makeDeclaration({
        combatantId: "c2",
        actionId: "move-full",
        cost: 3,
        locked: true,
        resolved: true,
      }),
    ];
    const result = deductCycleMoveCosts({}, declarations);
    expect(result.c1).toBe(1); // move-half costs 1 move point
    expect(result.c2).toBe(2); // move-full costs 2 move points
  });

  it("ignores unresolved declarations", () => {
    const declarations = [
      makeDeclaration({
        combatantId: "c1",
        actionId: "move-full",
        cost: 3,
        locked: true,
        resolved: false,
      }),
    ];
    const result = deductCycleMoveCosts({}, declarations);
    expect(result.c1).toBeUndefined();
  });

  it("does not track non-move actions", () => {
    const declarations = [
      makeDeclaration({
        combatantId: "c1",
        actionId: "attack",
        cost: 3,
        locked: true,
        resolved: true,
      }),
      makeDeclaration({
        combatantId: "c2",
        actionId: "wait",
        cost: 1,
        locked: true,
        resolved: true,
      }),
    ];
    const result = deductCycleMoveCosts({}, declarations);
    expect(result.c1).toBeUndefined();
    expect(result.c2).toBeUndefined();
  });

  it("accumulates across existing movesUsed", () => {
    const existing = { c1: 1 }; // already used 1 move point
    const declarations = [
      makeDeclaration({
        combatantId: "c1",
        actionId: "move-half",
        cost: 2,
        locked: true,
        resolved: true,
      }),
    ];
    const result = deductCycleMoveCosts(existing, declarations);
    expect(result.c1).toBe(2); // 1 existing + 1 new
  });

  it("move-half costs 1 move point", () => {
    const declarations = [
      makeDeclaration({
        combatantId: "c1",
        actionId: "move-half",
        cost: 2,
        locked: true,
        resolved: true,
      }),
    ];
    const result = deductCycleMoveCosts({}, declarations);
    expect(result.c1).toBe(1);
  });

  it("full move costs 2 move points", () => {
    const declarations = [
      makeDeclaration({
        combatantId: "c1",
        actionId: "move-full",
        cost: 3,
        locked: true,
        resolved: true,
      }),
    ];
    const result = deductCycleMoveCosts({}, declarations);
    expect(result.c1).toBe(2);
  });

  it("charge costs 2 move points", () => {
    const declarations = [
      makeDeclaration({
        combatantId: "c1",
        actionId: "charge",
        cost: 5,
        locked: true,
        resolved: true,
      }),
    ];
    const result = deductCycleMoveCosts({}, declarations);
    expect(result.c1).toBe(2);
  });

  it("retreat costs 2 move points", () => {
    const declarations = [
      makeDeclaration({
        combatantId: "c1",
        actionId: "retreat",
        cost: 4,
        locked: true,
        resolved: true,
      }),
    ];
    const result = deductCycleMoveCosts({}, declarations);
    expect(result.c1).toBe(2);
  });

  it("fighting-withdrawal costs 2 move points", () => {
    const declarations = [
      makeDeclaration({
        combatantId: "c1",
        actionId: "fighting-withdrawal",
        cost: 3,
        locked: true,
        resolved: true,
      }),
    ];
    const result = deductCycleMoveCosts({}, declarations);
    expect(result.c1).toBe(2);
  });
});

describe("getRemainingMoves", () => {
  it("returns full allowance when no moves used", () => {
    const state = makeCombatState({
      round: makeRound({ movesUsed: {} }),
    });
    expect(getRemainingMoves(state, "c1")).toBe(MOVE_ALLOWANCE);
  });

  it("returns reduced allowance after moves used", () => {
    const state = makeCombatState({
      round: makeRound({ movesUsed: { c1: 1 } }),
    });
    expect(getRemainingMoves(state, "c1")).toBe(MOVE_ALLOWANCE - 1);
  });

  it("returns 0 when all moves used", () => {
    const state = makeCombatState({
      round: makeRound({ movesUsed: { c1: MOVE_ALLOWANCE } }),
    });
    expect(getRemainingMoves(state, "c1")).toBe(0);
  });

  it("returns full allowance for combatants not in movesUsed", () => {
    const state = makeCombatState({
      round: makeRound({ movesUsed: { c1: 2 } }),
    });
    expect(getRemainingMoves(state, "c2")).toBe(MOVE_ALLOWANCE);
  });
});
